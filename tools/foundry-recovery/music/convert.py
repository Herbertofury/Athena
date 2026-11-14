"""Offline original MusicHub v2 conversion. Explicit context mapping; never guesses a room."""
import argparse,datetime,hashlib,json,re,os
from pathlib import Path
MAX_INPUT_BYTES=1_000_000
PROVIDERS={'spotify','apple','deezer','soundcloud','tidal','youtube'}
def pairs(items):
 out={}
 for k,v in items:
  if k in out:raise ValueError('Duplicate JSON key')
  out[k]=v
 return out
def read_bounded(path):
 # Bound allocation before JSON parsing; never trust file size metadata.
 with path.open('rb') as stream:raw=stream.read(MAX_INPUT_BYTES+1)
 if len(raw)>MAX_INPUT_BYTES:raise ValueError('Input exceeds limit')
 return raw
def parse(raw):
 if len(raw)>MAX_INPUT_BYTES:raise ValueError('Input exceeds limit')
 return json.loads(raw.decode('utf-8'),object_pairs_hook=pairs,parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Nonfinite JSON')))
def exact(v,keys):
 if not isinstance(v,dict) or set(v)!=set(keys):raise ValueError('Unsupported or missing fields')
def convert(raw,mapping,catalog):
 source=parse(raw);exact(source,{'version','route','mappings'})
 if type(source['version']) is not int or source['version']!=2 or source['route'] not in PROVIDERS|{'home','settings'}:raise ValueError('Unsupported MusicHub state')
 exact(mapping,{'sourceSha256','contexts'})
 if mapping['sourceSha256']!=hashlib.sha256(raw).hexdigest():raise ValueError('Source digest mismatch')
 if not isinstance(source['mappings'],dict) or len(source['mappings'])>1000 or not isinstance(mapping['contexts'],dict) or set(mapping['contexts'])!=set(source['mappings']):raise ValueError('Exact explicit context mapping required')
 targets={(t['id'],r['id'])for t in catalog['themes']for r in t['rooms']};seen=set();rows=[]
 for key,value in source['mappings'].items():
  if not isinstance(value,dict):raise ValueError('Invalid source mapping')
  allowed={'provider','url','label','status','updatedAt'}
  if set(value) not in (allowed,allowed|{'sourceId'}):raise ValueError('Unsupported source fields')
  context=mapping['contexts'][key];exact(context,{'themeId','roomId'})
  pair=(context['themeId'],context['roomId'])
  if pair not in targets or pair in seen:raise ValueError('Unknown or duplicate destination room')
  seen.add(pair)
  if not isinstance(key,str) or len(key.split('::'))!=2 or key.split('::')[0]!=pair[0]:raise ValueError('Source theme/context mismatch')
  stamp=value['updatedAt']
  if not isinstance(stamp,str) or not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z',stamp):raise ValueError('Expected an exact UTC millisecond timestamp')
  instant=datetime.datetime.fromisoformat(stamp.replace('Z','+00:00'))
  delta=instant-datetime.datetime(1970,1,1,tzinfo=datetime.timezone.utc)
  millis=(delta.days*86400+delta.seconds)*1000+delta.microseconds//1000
  timestamp=millis//1000
  if timestamp<0 or instant>datetime.datetime.now(datetime.timezone.utc):raise ValueError('Invalid source timestamp')
  # Native importer validates provider-host, bounds, catalog foreign keys and provenance fields.
  rows.append({'assignment':{'theme_id':pair[0],'room_id':pair[1],'provider':value['provider'],'url':value['url'],'label':value['label'],'status':value['status'],'source_id':value.get('sourceId')},'updated_at':timestamp,'updated_at_ms':millis})
 return {'version':2,'rows':rows}
def main():
 p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('mapping',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
 catalog=json.loads((Path(__file__).resolve().parents[3]/'dist/workspaces/foundry/catalog.json').read_text())
 result=convert(read_bounded(a.source),parse(read_bounded(a.mapping)),catalog)
 with os.fdopen(os.open(a.output,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'w',encoding='utf-8')as f:json.dump(result,f,ensure_ascii=False,indent=2);f.write('\n')
if __name__=='__main__':main()
