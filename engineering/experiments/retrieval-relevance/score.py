"""Score a frozen, synthetic Athena retrieval slice without loading a model."""
from collections import Counter, defaultdict
from pathlib import Path
import argparse
import hashlib
import json
import math
import re
import unicodedata

ROOT=Path(__file__).resolve().parent
BUDGET=256*1024
ID=re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
SCHEMA='athena-retrieval-ranking-v1'

def read_bounded(path):
    with path.open('rb') as f:
        data=f.read(BUDGET+1)
    if len(data)>BUDGET:
        raise ValueError('Input exceeds byte budget')
    return data

def exact(value,keys,optional=()):
    if not isinstance(value,dict) or not set(keys)<=set(value) or set(value)-set(keys)-set(optional):
        raise ValueError('Unsupported input fields')

def parse(data):
    def unique(pairs):
        result={}
        for key,value in pairs:
            if key in result:
                raise ValueError('Duplicate JSON field')
            result[key]=value
        return result
    return json.loads(data.decode('utf-8'),object_pairs_hook=unique)

def token_id(value):
    if not isinstance(value,str) or not ID.fullmatch(value) or len(value)>80:
        raise ValueError('Invalid document or query id')

def plain(value,limit):
    if not isinstance(value,str) or not 0<len(value)<=limit:
        raise ValueError('Invalid text field')

def fixture(raw):
    data=parse(raw)
    exact(data,('schema','documents','queries'))
    if data['schema']!='athena-retrieval-judgments-v1':
        raise ValueError('Unsupported judgment schema')
    if any(not isinstance(data[k],list) or not 0<len(data[k])<=512 for k in ('documents','queries')):
        raise ValueError('Unsupported number of fixtures')
    docs={}
    for d in data['documents']:
        exact(d,('id','text'));token_id(d['id']);plain(d['text'],1024)
        if d['id'] in docs:
            raise ValueError('Duplicate document id')
        docs[d['id']]=d['text']
    seen=set()
    for q in data['queries']:
        exact(q,('id','group','text','relevance'),('required_top1',))
        token_id(q['id']);token_id(q['group']);plain(q['text'],1024)
        if q['id'] in seen:
            raise ValueError('Duplicate query id')
        seen.add(q['id'])
        rel=q['relevance']
        if not isinstance(rel,dict) or not rel or set(rel)-set(docs) or any(type(v) is not int or v not in (1,2,3) for v in rel.values()):
            raise ValueError('Unsupported relevance assignments')
        if 'required_top1' in q and rel.get(q['required_top1'])!=3:
            raise ValueError('Required top hit must be highly relevant')
    return docs,data['queries'],hashlib.sha256(raw.replace(b'\r\n',b'\n')).hexdigest()

def tokens(text):
    return re.findall(r'[^\W_]+',unicodedata.normalize('NFKC',text).casefold())

def lexical(docs,queries,sha):
    # BM25 baseline reads text and exact ids, never the relevance assignments.
    frequency={ident:Counter(tokens(text)) for ident,text in docs.items()}
    count=len(docs);avg=sum(sum(row.values()) for row in frequency.values())/count or 1
    occurrences=Counter(token for row in frequency.values() for token in row)
    rankings={}
    for q in queries:
        ts=set(tokens(q['text']))
        user=unicodedata.normalize('NFKC',q['text']).strip().casefold()
        ranked=[]
        for ident,row in frequency.items():
            length=sum(row.values())
            score=0.0
            for term in sorted(ts):
                matched=row.get(term,0)
                if matched:
                    nf=occurrences[term]
                    idf=math.log1p((count-nf+.5)/(nf+.5))
                    score+=idf*matched*2.2/(matched+1.2*(.25+.75*length/avg))
            if user==ident:
                score+=10000
            if score:
                ranked.append((-score,ident))
        rankings[q['id']]=[ident for _,ident in sorted(ranked)]
    return {'schema':SCHEMA,'fixture_sha256':sha,'candidate':'lexical-bm25-with-exact-id','rankings':rankings}

def evaluate(candidate,docs,queries,sha,k):
    exact(candidate,('schema','fixture_sha256','candidate','rankings'))
    if candidate['schema']!=SCHEMA or candidate['fixture_sha256']!=sha:
        raise ValueError('Unmatched ranking fixture and schema')
    if type(k) is not int or not 1<=k<=min(20,len(docs)):
        raise ValueError('Invalid top-k')
    plain(candidate['candidate'],160)
    rankings=candidate['rankings']
    exact(rankings,[q['id'] for q in queries])
    def dcg(grades):
        return sum((2**grade-1)/math.log2(rank+2) for rank,grade in enumerate(grades))
    measures=[];groups=defaultdict(list);misses=[]
    for q in queries:
        ranked=rankings[q['id']]
        if not isinstance(ranked,list) or len(ranked)>len(docs) or any(not isinstance(i,str) or i not in docs for i in ranked) or len(set(ranked))!=len(ranked):
            raise ValueError('Ranking has duplicate or unknown document ids')
        rel=q['relevance'];hits=[rel.get(ident,0) for ident in ranked[:k]]
        if q.get('required_top1') and ranked[:1]!=[q['required_top1']]:
            misses.append(q['id'])
        row={'query':q['id'],'group':q['group'],'recall':sum(bool(v) for v in hits)/len(rel),
             'mrr':next((1/(rank+1) for rank,v in enumerate(hits) if v),0.0),
             'ndcg':dcg(hits)/dcg(sorted(rel.values(),reverse=True)[:k])}
        measures.append(row);groups[q['group']].append(row)
    def mean(rows):
        return {m:round(sum(r[m] for r in rows)/len(rows),6) for m in ('recall','mrr','ndcg')}
    return {'candidate':candidate['candidate'],'fixture_sha256':sha,'k':k,'query_count':len(queries),
            'required_top1_misses':misses,'macro':mean(measures),'groups':{g:mean(r) for g,r in sorted(groups.items())},
            'queries':[{**r,**{k:round(r[k],6) for k in ('recall','mrr','ndcg')}} for r in measures],
            'scope':'synthetic relevance only; no runtime, model, latency or user-corpus measurements'}

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--candidate',type=Path)
    p.add_argument('--emit-baseline',action='store_true')
    p.add_argument('--k',type=int,default=3)
    args=p.parse_args()
    if args.candidate and args.emit_baseline:
        p.error('Choose one candidate or emit the lexical baseline')
    docs,queries,sha=fixture(read_bounded(ROOT/'judgments.json'))
    result=lexical(docs,queries,sha) if not args.candidate else parse(read_bounded(args.candidate))
    out=result if args.emit_baseline else evaluate(result,docs,queries,sha,args.k)
    print(json.dumps(out,indent=2,ensure_ascii=False))

if __name__=='__main__':
    main()
