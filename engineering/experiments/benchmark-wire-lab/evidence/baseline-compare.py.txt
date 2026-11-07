#!/usr/bin/env python3
"""Compare equivalent paired complete workloads. Does not certify input truth."""
import argparse,json,math,re,statistics
from pathlib import Path
HASH=re.compile(r'^[0-9a-f]{64}$')

def validate(record):
    if not isinstance(record,dict): raise ValueError('benchmark must be an object')
    if type(record.get('schema')) is not int or record['schema'] != 1: raise ValueError('schema must be integer 1')
    for key in ('label','source_revision','condition','environment_id'):
        if not isinstance(record.get(key),str) or not record[key].strip(): raise ValueError(f'missing {key}')
    if record.get('kind') not in ('synthetic','measured'): raise ValueError('kind must be explicit')
    if not HASH.fullmatch(str(record.get('workload_sha256',''))): raise ValueError('invalid workload hash')
    norm=record.get('normalization')
    if not isinstance(norm,dict): raise ValueError('normalization contract required')
    if any(not isinstance(norm.get(k),str) or not norm[k].strip() for k in ('name','version')): raise ValueError('normalization name/version must be nonempty strings')
    excluded=norm.get('excluded_fields')
    if not isinstance(excluded,list) or not all(isinstance(x,str) and x.strip() for x in excluded) or len(set(excluded))!=len(excluded): raise ValueError('excluded_fields must contain unique nonempty field names')
    samples=record.get('samples')
    if not isinstance(samples,list) or len(samples)<5: raise ValueError('at least five paired samples required')
    indexed={}
    for s in samples:
        if not isinstance(s,dict): raise ValueError('sample must be an object')
        pair=s.get('pair_id')
        if not isinstance(pair,str) or not pair or pair in indexed: raise ValueError('pair IDs must be unique strings')
        elapsed=s.get('elapsed_ms')
        if isinstance(elapsed,bool) or not isinstance(elapsed,(int,float)) or not math.isfinite(elapsed) or elapsed<=0: raise ValueError('elapsed_ms must be finite and positive')
        if s.get('status')!='complete': raise ValueError('partial/cached-only/error sample cannot establish complete speedup')
        if not HASH.fullmatch(str(s.get('result_sha256',''))): raise ValueError('invalid result hash')
        units=s.get('result_count')
        if isinstance(units,bool) or not isinstance(units,int) or units<0: raise ValueError('result_count must be a nonnegative integer')
        if not isinstance(s.get('warnings'),list) or not all(isinstance(x,str) for x in s['warnings']): raise ValueError('warnings must be retained')
        indexed[pair]=s
    return indexed

def percentile(values,p):
    return sorted(values)[max(0,math.ceil(len(values)*p)-1)]

def compare(baseline,candidate):
    a,b=validate(baseline),validate(candidate)
    for key in ('kind','condition','environment_id','workload_sha256','normalization'):
        if baseline[key]!=candidate[key]: raise ValueError(f'incomparable {key}')
    if set(a)!=set(b): raise ValueError('paired sample IDs differ')
    for key in a:
        for field in ('result_sha256','result_count','warnings'):
            if a[key][field]!=b[key][field]: raise ValueError(f'output mismatch in pair {key}: {field}')
    old=[a[k]['elapsed_ms'] for k in a];new=[b[k]['elapsed_ms'] for k in a]
    om,nm=statistics.median(old),statistics.median(new)
    return {'kind':baseline['kind'],'condition':baseline['condition'],'pairs':len(a),'complete_output_equivalence':True,
            'baseline_median_ms':om,'candidate_median_ms':nm,'median_ms_saved':om-nm,
            'median_elapsed_reduction_percent':100*(om-nm)/om,'ratio_of_medians':om/nm,
            'median_paired_speedup':statistics.median(a[k]['elapsed_ms']/b[k]['elapsed_ms'] for k in a),
            'baseline_sample_p95_ms':percentile(old,.95),'candidate_sample_p95_ms':percentile(new,.95),
            'qualification':'Synthetic demonstration only; not a real performance result.' if baseline['kind']=='synthetic' else 'Input-contract comparison only. Review raw traces, normalization, resource/UX budgets and trial protocol before acceptance.'}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('baseline',type=Path);p.add_argument('candidate',type=Path);args=p.parse_args()
    try: result=compare(json.loads(args.baseline.read_text()),json.loads(args.candidate.read_text()))
    except (ValueError,KeyError,TypeError) as exc:p.exit(2,f'Not comparable: {exc}\n')
    print(json.dumps(result,indent=2,allow_nan=False))
if __name__=='__main__':main()
