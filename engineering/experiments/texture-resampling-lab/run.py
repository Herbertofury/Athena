#!/usr/bin/env python3
"""Pinned CPU resampling over original arrays, not GPU/game acceptance."""
from __future__ import annotations
import argparse,datetime as dt,hashlib,json,math,os,platform,re,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent
SCOPE='Measured pinned CPU resampling of original two-pixel arrays. No image decoding, ICC color management, GPU filtering, mip chain, game importer, target performance or native acceptance.'
INPUTS=['run.py','driver.c','fixtures.json','dependency.json']
FLAGS=['-std=c99','-O0','-Wall','-Wextra','-pedantic','-I.','driver.c','-lm','-o','probe']
IDS=['color_bw_uint8','color_bw_uint8_srgb','color_mid_uint8','color_mid_uint8_srgb','color_constant_uint8','color_constant_uint8_srgb','edge_red_straight','edge_green_straight','edge_generic_linear','edge_generic_srgb','edge_wrong_premultiplied','scalar_linear','scalar_srgb','float_straight','float_premultiplied','float_double_weighted']

def digest(b):return hashlib.sha256(b).hexdigest()
def read_bytes(p,limit=1048576):
 with Path(p).open('rb') as f:b=f.read(limit+1)
 if len(b)>limit:raise ValueError('Byte budget exceeded')
 return b
def parse_json(s):
 def pairs(rows):
  d={}
  for k,v in rows:
   if k in d:raise ValueError('Duplicate JSON key')
   d[k]=v
  return d
 def bad(_):raise ValueError('Non-finite JSON')
 return json.loads(s,object_pairs_hook=pairs,parse_constant=bad)
def read_json(p):return parse_json(read_bytes(p).decode())
def same(a,b):
 if type(a) is not type(b):return False
 if isinstance(a,dict):return a.keys()==b.keys() and all(same(a[k],b[k]) for k in a)
 if isinstance(a,list):return len(a)==len(b) and all(same(x,y) for x,y in zip(a,b))
 return a==b
def exact(a,b,label):
 if not same(a,b):raise ValueError(label)
def fields(d,keys):
 if type(d) is not dict or set(d)!=set(keys.split()):raise ValueError('Invalid fields')
def number(x):return type(x) in [int,float] and math.isfinite(x)
def identity():return {n:digest(read_bytes(ROOT/n)) for n in INPUTS}
def dependency():
 d=read_json(ROOT/'dependency.json');fields(d,'url bytes sha256 git_blob_sha1 version commit repository name license')
 exact(d['bytes'],634235,'Header size');exact(d['sha256'],'7420ce124ccd746e47f66d85235eb22838b339ae0689a72d6eb2e3d32dc657d1','Header digest')
 exact(d['git_blob_sha1'],'e591165661d572349689f805d025e74fffb5cb20','Git blob');exact(d['version'],'2.50','Header version');exact(d['commit'],'703100c5f8a0b75b4861e401db567f1d82d545b8','Revision')
 exact(d['repository'],'nothings/stb_image_resize','Repository');exact(d['name'],'stb_image_resize2.h','Filename')
 exact(d['url'],'https://raw.githubusercontent.com/nothings/stb_image_resize/'+d['commit']+'/'+d['name'],'Source URL')
 return d

def fixtures():
 d=read_json(ROOT/'fixtures.json');fields(d,'schema_version scope cases');exact(d['schema_version'],1,'Fixture schema')
 exact(d['scope'],'Original two-pixel rows reduced to one pixel with BOX/CLAMP.','Fixture scope')
 if type(d['cases']) is not list or [x.get('id') for x in d['cases']]!=IDS:raise ValueError('Case identity/order')
 for c in d['cases']:
  fields(c,'id data_type layout pixels intent expected_intent_match')
  if c['data_type'] not in ['UINT8','UINT8_SRGB','FLOAT'] or c['layout'] not in ['1CHANNEL','RGB','RGBA','RGBA_PM','4CHANNEL']:raise ValueError('Library controls')
  channels={'1CHANNEL':1,'RGB':3,'RGBA':4,'RGBA_PM':4,'4CHANNEL':4}[c['layout']]
  if type(c['pixels']) is not list or len(c['pixels'])!=2:raise ValueError('Row count')
  for p in c['pixels']:
   if type(p) is not list or len(p)!=channels:raise ValueError('Channel count')
   for v in p:
    if not number(v) or not 0<=v<=(1 if c['data_type']=='FLOAT' else 255):raise ValueError('Sample range')
    if c['data_type']!='FLOAT' and type(v) is not int:raise ValueError('Byte type')
  fields(c['intent'],'input_association output_association transfer')
  for k in ['input_association','output_association']:
   if c['intent'][k] not in ['none','straight','premultiplied']:raise ValueError('Association')
  if c['intent']['transfer'] not in ['linear','srgb'] or type(c['expected_intent_match']) is not bool:raise ValueError('Intent fields')
 return d['cases']

def decode(v):return v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4
def encode(v):return 12.92*v if v<=0.0031308 else 1.055*v**(1/2.4)-0.055
def reference(c,*,intended=False):
 floating=c['data_type']=='FLOAT';scale=1 if floating else 255
 p=[[v/scale for v in x] for x in c['pixels']]
 if intended:
  transfer=c['intent']['transfer'];ia=c['intent']['input_association'];oa=c['intent']['output_association'];has_alpha=ia!='none'
 else:
  transfer='srgb' if c['data_type']=='UINT8_SRGB' else 'linear';has_alpha=c['layout'] in ['RGBA','RGBA_PM'];ia='premultiplied' if c['layout']=='RGBA_PM' else ('straight' if has_alpha else 'none');oa=ia
 color_count=len(p[0])-(1 if has_alpha else 0)
 linear=[[decode(v) if transfer=='srgb' and j<color_count else v for j,v in enumerate(x)] for x in p]
 if not has_alpha:out=[sum(x[j] for x in linear)/2 for j in range(color_count)]
 else:
  alpha=sum(x[-1] for x in linear)/2
  premult=[sum(x[j]*(x[-1] if ia=='straight' else 1) for x in linear)/2 for j in range(color_count)]
  out=[v/alpha if oa=='straight' and alpha else v for v in premult]+[alpha]
 out=[encode(v) if transfer=='srgb' and j<color_count else v for j,v in enumerate(out)]
 return out if floating else [int(math.floor(min(1,max(0,v))*255+0.5)) for v in out]

def generate_cases():
 lines=['typedef struct { const char *id; stbir_datatype type; stbir_pixel_layout layout; int channels; double values[8]; } Case;','static Case cases[] = {']
 for c in fixtures():
  values=','.join(format(v,'.17g') for x in c['pixels'] for v in x)
  lines.append('{"'+c['id']+'",STBIR_TYPE_'+c['data_type']+',STBIR_'+c['layout']+','+str(len(c['pixels'][0]))+',{'+values+'}},')
 return '\n'.join(lines+['};',''])

def observe(raw):
 if type(raw) is not str or len(raw)>16384:raise ValueError('Output budget')
 rows=[parse_json(x) for x in raw.splitlines()];cs=fixtures()
 if len(rows)!=len(cs):raise ValueError('Output row count')
 observations=[]
 for c,r in zip(cs,rows):
  fields(r,'id output');exact(r['id'],c['id'],'Output identity')
  out=r['output'];floats=c['data_type']=='FLOAT'
  if type(out) is not list or len(out)!=len(c['pixels'][0]):raise ValueError('Output shape')
  for v in out:
   if not number(v) or not 0<=v<=(1 if floats else 255) or (not floats and type(v) is not int):raise ValueError('Output value/type')
  api=reference(c);intent=reference(c,intended=True);tolerance=1e-6 if floats else 1
  api_error=max(abs(a-b) for a,b in zip(out,api));intent_error=max(abs(a-b) for a,b in zip(out,intent));intent_match=intent_error<=tolerance
  observations.append(dict(id=c['id'],output=out,api_reference=api,intended_reference=intent,tolerance=tolerance,api_max_abs_error=api_error,intended_max_abs_error=intent_error,matches_api_reference=api_error<=tolerance,matches_intended_contract=intent_match,matches_declared_outcome=api_error<=tolerance and intent_match==c['expected_intent_match']))
 return observations

def findings(obs):
 by={x['id']:x for x in obs};cs={x['id']:x for x in fixtures()}
 red=by['edge_red_straight']['output'];green=by['edge_green_straight']['output'];cutoff=0.5
 original_coverage=sum(x[-1]/255>=cutoff for x in cs['edge_red_straight']['pixels'])/2
 composites={}
 for id in ['float_straight','float_premultiplied','float_double_weighted']:
  values=by[id]['output'];associated=cs[id]['intent']['output_association']=='premultiplied'
  composites[id]=[v if associated else v*values[-1] for v in values[:3]]
 return dict(hidden_rgb_outputs_equal=red==green,black_white_encoded_average=by['color_bw_uint8']['output'],black_white_linear_light_average=by['color_bw_uint8_srgb']['output'],linear_scalar=by['scalar_linear']['output'],srgb_scalar_control=by['scalar_srgb']['output'],linear_float_source_over_black=composites,mask_cutoff=cutoff,original_two_pixel_mask_coverage=original_coverage,filtered_one_pixel_mask_coverage=1.0 if red[-1]/255>=cutoff else 0.0,warning='Compositing and mask coverage are bounded numeric observations, not renderer or mip-chain results.')

def validate_receipt(d):
 fields(d,'schema_version scope recorded_at inputs dependency generated_cases_sha256 environment compile execution observations findings all_expected')
 exact(d['schema_version'],1,'Schema');exact(d['scope'],SCOPE,'Scope');exact(d['inputs'],identity(),'Input identity');exact(d['dependency'],dependency(),'Dependency identity');exact(d['generated_cases_sha256'],digest(generate_cases().encode()),'Generated cases')
 if type(d['recorded_at']) is not str:raise ValueError('Recording time')
 dt.datetime.strptime(d['recorded_at'],'%Y-%m-%dT%H:%M:%SZ')
 fields(d['environment'],'python system machine compiler_version');
 for value in d['environment'].values():
  if type(value) is not str or not 1<=len(value)<=16384:raise ValueError('Environment label')
 for name in ['compile','execution']:
  r=d[name];fields(r,'command returncode stdout stderr binary_sha256')
  exact(r['command'],['cc',*FLAGS] if name=='compile' else ['./probe'],'Command')
  exact(r['returncode'],0,'Run failure')
  for k in ['stdout','stderr']:
   if type(r[k]) is not str or len(r[k])>131072:raise ValueError('Log budget')
  if not isinstance(r['binary_sha256'],str) or not re.fullmatch('[0-9a-f]{64}',r['binary_sha256']):raise ValueError('Binary hash')
 exact(d['compile']['binary_sha256'],d['execution']['binary_sha256'],'Compiled/executed binary identity')
 obs=observe(d['execution']['stdout']);exact(d['observations'],obs,'Derived observations');exact(d['findings'],findings(obs),'Derived findings');exact(d['all_expected'],all(x['matches_declared_outcome'] for x in obs),'Summary')
 return d['all_expected']

def execute(header,output,cc):
 if output.exists() or output.with_name(output.name+'.partial.json').exists():raise ValueError('Output already exists')
 before=identity();dep=dependency();data=read_bytes(header,dep['bytes'])
 if len(data)!=dep['bytes'] or digest(data)!=dep['sha256']:raise ValueError('Header identity mismatch')
 with tempfile.TemporaryDirectory(prefix='atlas-texture-') as tmp:
  root=Path(tmp);(root/'stb_image_resize2.h').write_bytes(data);(root/'driver.c').write_bytes(read_bytes(ROOT/'driver.c'));(root/'cases.h').write_text(generate_cases())
  def run(cmd):
   p=subprocess.run(cmd,cwd=root,capture_output=True,text=True,timeout=120)
   return dict(command=['cc',*cmd[1:]] if cmd[0]==cc else cmd,returncode=p.returncode,stdout=p.stdout.replace(str(root),'<run>'),stderr=p.stderr.replace(str(root),'<run>'))
  version=run([cc,'--version']);comp=run([cc,*FLAGS]);partial=dict(scope='Incomplete compile/run evidence, not accepted receipt.',compiler=version,compile=comp)
  output.with_name(output.name+'.partial.json').write_text(json.dumps(partial,indent=2)+'\n')
  if comp['returncode']!=0:raise ValueError('Compiler failed; partial retained')
  binary=digest(read_bytes(root/'probe',4194304));comp['binary_sha256']=binary
  execution=run(['./probe']);execution['binary_sha256']=digest(read_bytes(root/'probe',4194304));partial['execution']=execution
  output.with_name(output.name+'.partial.json').write_text(json.dumps(partial,indent=2)+'\n')
  if execution['returncode']!=0:raise ValueError('Probe failed; partial retained')
  exact(before,identity(),'Inputs changed during execution');obs=observe(execution['stdout'])
  d=dict(schema_version=1,scope=SCOPE,recorded_at=dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),inputs=before,dependency=dep,generated_cases_sha256=digest(generate_cases().encode()),environment=dict(python=platform.python_version(),system=platform.system(),machine=platform.machine(),compiler_version=version['stdout']+version['stderr']),compile=comp,execution=execution,observations=obs,findings=findings(obs),all_expected=all(x['matches_declared_outcome'] for x in obs))
  validate_receipt(d)
  with output.open('x') as f:f.write(json.dumps(d,indent=2)+'\n')
  return d['all_expected']

def main():
 p=argparse.ArgumentParser();p.add_argument('--header',type=Path);p.add_argument('--output',type=Path);p.add_argument('--cc',default='cc');p.add_argument('--verify-receipt',type=Path);a=p.parse_args()
 if a.verify_receipt and not a.header and not a.output:ok=validate_receipt(read_json(a.verify_receipt))
 elif a.header and a.output and not a.verify_receipt:ok=execute(a.header,a.output,a.cc)
 else:p.error('Use --verify-receipt or --header and --output')
 print('All declared outcomes match:',ok);return 0 if ok else 1
if __name__=='__main__':
 try:sys.exit(main())
 except (ValueError,KeyError,TypeError,OSError,subprocess.SubprocessError) as e:print('Evidence rejected:',e,file=sys.stderr);sys.exit(2)
