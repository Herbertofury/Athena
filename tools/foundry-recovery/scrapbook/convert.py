"""Explicit offline partial converter. No browser, user-store, provider or network access."""
import argparse,hashlib,json,math,os,uuid
from pathlib import Path
LIMIT=1_000_000
BLENDS=frozenset(['normal','multiply','screen','overlay','soft-light','hard-light','difference','color-dodge','luminosity'])
ORIGINS={key:(x,y) for key,x,y in [('tl',0,0),('tc',.5,0),('tr',1,0),('ml',0,.5),('mc',.5,.5),('mr',1,.5),('bl',0,1),('bc',.5,1),('br',1,1)]}
def pairs(items):
 out={}
 for k,v in items:
  if k in out:raise ValueError('Duplicate JSON key')
  out[k]=v
 return out
def parse(raw):
 if len(raw)>LIMIT:raise ValueError('Input exceeds limit')
 return json.loads(raw.decode('utf-8'),object_pairs_hook=pairs,parse_constant=lambda _:(_ for _ in ()).throw(ValueError('Nonfinite JSON')))
def exact(v,keys,label):
 if not isinstance(v,dict) or set(v)!=set(keys):raise ValueError(label+' fields missing or unsupported')
def number(v,lo=-1e7,hi=1e7):
 if isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) or not lo<=v<=hi:raise ValueError('Invalid bounded number')
 return v
def rect(v):
 exact(v,['left','top','width','height'],'frame');return tuple(number(v[k],.01 if k in ('width','height') else -1e7,1e7) for k in ('left','top','width','height'))
def size(v):
 exact(v,['width','height'],'object size');return number(v['width'],.01,10000),number(v['height'],.01,10000)
def affine_corners(width,height,sx,sy,rotation,skew_x,skew_y):
 # CSS source order R*K*S: operations apply right-to-left to centered corners.
 a,b=math.tan(math.radians(skew_x)),math.tan(math.radians(skew_y));c,d=math.cos(math.radians(rotation)),math.sin(math.radians(rotation));out=[]
 for x,y in [(-width/2,-height/2),(width/2,-height/2),(width/2,height/2),(-width/2,height/2)]:
  x,y=x*sx,y*sy;u,v=x+a*y,b*x+y;out.append((c*u-d*v,d*u+c*v))
 return out
def convert(raw,mapping,catalog):
 rows=parse(raw);digest=hashlib.sha256(raw).hexdigest()
 blend_review=isinstance(mapping,dict) and 'blendReview' in mapping
 exact(mapping,(['blendReview'] if blend_review else [])+['sourceSha256','coordinatePolicy','assetReview','stackingReview','themeId','roomId','assets','rows'],'mapping')
 if mapping['sourceSha256']!=digest:raise ValueError('Mapping belongs to different source bytes')
 if mapping['coordinatePolicy']!='proportional-centers' or mapping['assetReview']!='manual-equivalence-confirmed' or mapping['stackingReview']!='independent-surfaces-reviewed':raise ValueError('Explicit mapping/review declarations required')
 if not isinstance(rows,list) or not 1<=len(rows)<=100 or not isinstance(mapping['rows'],list) or len(mapping['rows'])!=len(rows):raise ValueError('Require one geometry record per source row, at most100')
 theme=next((t for t in catalog['themes'] if t['id']==mapping['themeId']),None)
 if theme is None or not any(r['id']==mapping['roomId'] for r in theme['rooms']):raise ValueError('Unknown native theme/room')
 assets={o['id'] for o in theme['objects']}
 if not isinstance(mapping['assets'],dict):raise ValueError('Explicit asset map required')
 for key,value in mapping['assets'].items():
  if not isinstance(key,str) or not key or not isinstance(value,str) or value not in assets:raise ValueError('Unreviewed asset mapping')
 expected={'assetId','scope','gravity','gravityAfterPeel','x','y','rotation','scaleX','scaleY','opacity','blendMode','locked','zIndex','skewX','skewY','brightness','contrast','saturation','hue','blur','visible','anchor','pinTargetId','pinTargetKey','pinX','pinY'}
 if blend_review and mapping['blendReview']!='same-isolated-backdrop-reviewed':raise ValueError('Explicit isolated blending backdrop review required')
 placements={};used=set();surface_orders=set();has_blends=False
 for i,(row,geo) in enumerate(zip(rows,mapping['rows'])):
  exact(row,expected,'source row');exact(geo,['index','sourceFrame','targetFrame','sourceSize','targetSize','anchor'],'geometry')
  if type(geo['index']) is not int or geo['index']!=i:raise ValueError('Geometry row index mismatch')
  if not isinstance(row['assetId'],str) or row['assetId'] not in mapping['assets']:raise ValueError('Unknown source asset')
  used.add(row['assetId']);asset=mapping['assets'][row['assetId']]
  if not isinstance(row['blendMode'],str) or row['blendMode'] not in BLENDS:raise ValueError('Unsupported blend mode')
  if row['blendMode']!='normal' and not blend_review:raise ValueError('Non-normal blend requires explicit isolated backdrop review')
  has_blends=has_blends or row['blendMode']!='normal'
  neutral={'gravity':False,'gravityAfterPeel':False}
  for key,want in neutral.items():
   if row[key]!=want or isinstance(want,bool) and type(row[key]) is not bool or type(want) is int and (type(row[key]) not in (int,float) or not math.isfinite(row[key])):raise ValueError('Unsupported nonneutral source field: '+key)
  if row['anchor'] not in ORIGINS:raise ValueError('Unknown transform origin')
  if type(row['locked']) is not bool or type(row['visible']) is not bool:raise ValueError('Invalid source boolean')
  skew_x=number(row['skewX'],-85,85);skew_y=number(row['skewY'],-85,85);filters={k:number(row[k],0,2.5) for k in ('brightness','contrast','saturation')};filters['hue']=number(row['hue'],-180,180)
  if number(row['blur'],0,20)!=0:raise ValueError('Nonzero source blur requires Gaussian-kernel and clipping mapping; unsupported, no blur scaling guessed')
  rotation=number(row['rotation'],-360,360);opacity=number(row['opacity'],0,1);z=number(row['zIndex'],0,100000)
  if type(row['zIndex']) is not int:raise ValueError('Noninteger source order')
  sx=number(row['scaleX'],-8,8);sy=number(row['scaleY'],-8,8)
  if min(abs(sx),abs(sy))<.05:raise ValueError('Unsupported signed scale')
  sw,sh=size(geo['sourceSize']);tw,th=size(geo['targetSize']);sl,st,fw,fh=rect(geo['sourceFrame']);tl,tt,gw,gh=rect(geo['targetFrame'])
  cx=number(row['x'])+sw/2;cy=number(row['y'])+sh/2;px=number(row['pinX'],0,1);py=number(row['pinY'],0,1)
  if row['scope']=='ui':
   if row['pinTargetId'] is not None or row['pinTargetKey'] is not None or geo['anchor'] is not None:raise ValueError('UI pin metadata would be discarded')
   x=(cx-sl)/fw;y=(cy-st)/fh;anchor=None
  elif row['scope']=='sticker':
   a=geo['anchor'];exact(a,['sourceKey','sourceId','nativeKey'],'anchor map')
   if not isinstance(row['pinTargetKey'],str) or not row['pinTargetKey'] or a['sourceKey']!=row['pinTargetKey'] or a['sourceId']!=row['pinTargetId'] or a['nativeKey'] not in ('scene','inspector'):raise ValueError('Unresolved or mismatched anchor')
   if abs(cx-(sl+fw*px))>.01 or abs(cy-(st+fh*py))>.01:raise ValueError('Sticker measured size/pin geometry inconsistent with serialized position')
   x,y,anchor=px,py,a['nativeKey']
  else:raise ValueError('Only scrapbook UI/sticker scope supported')
  order_key=(row['scope'],anchor,z)
  if order_key in surface_orders:raise ValueError('Equal source stacking order on mapped surface requires explicit reconciliation')
  surface_orders.add(order_key)
  number(x,0,1);number(y,0,1)
  # A=R*K*S. Same fractional origin f, d=(f-.5)*intrinsic size.
  # With size-compensated scales, As*ds == At*dt. Thus the target center
  # must shift by ds-dt; blindly preserving pin/center coordinates is wrong.
  nx=sx*sw/tw;ny=sy*sh/th
  if not all(.05<=abs(v)<=8 for v in (nx,ny)):raise ValueError('Mapped scale outside native range')
  fx,fy=ORIGINS[row['anchor']];ds=((fx-.5)*sw,(fy-.5)*sh);dt=((fx-.5)*tw,(fy-.5)*th)
  def corners(w,h,sx,sy,d):
   centered=affine_corners(w,h,sx,sy,rotation,skew_x,skew_y)
   # A*d from independent transformed basis columns.
   r=math.radians(rotation);c,s=math.cos(r),math.sin(r);kx,ky=math.tan(math.radians(skew_x)),math.tan(math.radians(skew_y))
   ad=((c-s*ky)*sx*d[0]+(c*kx-s)*sy*d[1],(s+c*ky)*sx*d[0]+(s*kx+c)*sy*d[1])
   return [(qx+d[0]-ad[0],qy+d[1]-ad[1]) for qx,qy in centered]
  source_corners=corners(sw,sh,sx,sy,ds);target_corners=corners(tw,th,nx,ny,dt)
  mapped_cx,mapped_cy=tl+x*gw,tt+y*gh
  target_cx,target_cy=mapped_cx+ds[0]-dt[0],mapped_cy+ds[1]-dt[1]
  x,y=(target_cx-tl)/gw,(target_cy-tt)/gh
  number(x,0,1);number(y,0,1)
  for sp,tp in zip(source_corners,target_corners):
   expected_corner=(mapped_cx+sp[0],mapped_cy+sp[1]);actual=(target_cx+tp[0],target_cy+tp[1])
   if any(not math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-8) for a,b in zip(expected_corner,actual)):raise ValueError('Absolute mapped affine corner mismatch')
   if not(sl-.01<=cx+sp[0]<=sl+fw+.01 and st-.01<=cy+sp[1]<=st+fh+.01 and tl-.01<=actual[0]<=tl+gw+.01 and tt-.01<=actual[1]<=tt+gh+.01):raise ValueError('Source/target frame would clip transformed object; explicit mapping cannot preserve it')
  ident='instance-'+str(uuid.uuid5(uuid.NAMESPACE_URL,'athena-ff-scrapbook:'+digest+':'+str(i)))
  placements[ident]={'blendMode':row['blendMode'],'transformOrigin':row['anchor'],'objectId':asset,'x':x,'y':y,'pinned':row['locked'],'rotation':rotation,'scaleX':nx,'scaleY':ny,'scope':row['scope'],'anchor':anchor,'opacity':opacity,'visible':row['visible'],'zIndex':z,'skewX':skew_x,'skewY':skew_y,**filters,'blur':0}
 if set(mapping['assets'])!=used:raise ValueError('Asset map contains unused entries; narrow review scope')
 version=11 if has_blends else 9
 if not has_blends:
  for placement in placements.values():del placement['blendMode']
 active={'version':version,'themeId':theme['id'],'roomId':mapping['roomId'],'time':'day','placements':placements,'environment':{'preset':'off','opacity':.82,'horizon':.48,'target':'room','targetId':None}}
 return {'version':version,'active':active,'layouts':{active['roomId']:active},'view':{'inspectorDock':'right','inspectorWidth':240},'savedLayouts':[]}
def bounded_read(path):
 with path.open('rb') as f:data=f.read(LIMIT+1)
 if len(data)>LIMIT:raise ValueError('Input exceeds limit')
 return data
def write_bundle(source,mapping_path,destination,catalog_path):
 raw=bounded_read(source);mapraw=bounded_read(mapping_path);mapping=parse(mapraw);catalograw=bounded_read(catalog_path);catalog=parse(catalograw);output=convert(raw,mapping,catalog);workspace=json.dumps(output,ensure_ascii=True,indent=2).encode()
 # Only create after full validation. Reserve a NEW private directory, never overwrite.
 destination.mkdir(mode=0o700)
 def write(name,data):
  fd=os.open(destination/name,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
  with os.fdopen(fd,'wb') as f:f.write(data);f.flush();os.fsync(f.fileno())
 write('source-original.utf8',raw);write('mapping-private.json',mapraw);write('athena-workspace.json',workspace)
 write('manifest.json',json.dumps({'workspaceSha256':hashlib.sha256(workspace).hexdigest(),'catalogSha256':hashlib.sha256(catalograw).hexdigest(),'sourceSha256':hashlib.sha256(raw).hexdigest(),'mappingSha256':hashlib.sha256(mapraw).hexdigest(),'rows':len(output['active']['placements']),'partialCompatibility':True,'originalVisualFidelityVerified':False,'sourceRetained':True,'nativeFormat':output['version']}).encode())
 if hasattr(os,'O_DIRECTORY'):
  fd=os.open(destination,os.O_RDONLY|os.O_DIRECTORY)
  try:os.fsync(fd)
  finally:os.close(fd)
 return len(output['active']['placements'])
def verify_bundle(directory,catalog_path):
 names={'source-original.utf8','mapping-private.json','athena-workspace.json','manifest.json'}
 if directory.is_symlink() or not directory.is_dir() or {p.name for p in directory.iterdir()}!=names:raise ValueError('Incomplete or unexpected bundle')
 if any((directory/n).is_symlink() or not (directory/n).is_file() for n in names):raise ValueError('Bundle must contain regular files only')
 raw=bounded_read(directory/'source-original.utf8');mapraw=bounded_read(directory/'mapping-private.json');workspace=bounded_read(directory/'athena-workspace.json');manifest=parse(bounded_read(directory/'manifest.json'));catalograw=bounded_read(catalog_path)
 for field,value in [('sourceSha256',raw),('mappingSha256',mapraw),('workspaceSha256',workspace),('catalogSha256',catalograw)]:
  if manifest.get(field)!=hashlib.sha256(value).hexdigest():raise ValueError('Bundle integrity mismatch')
 expected=convert(raw,parse(mapraw),parse(catalograw))
 if parse(workspace)!=expected:raise ValueError('Workspace differs from deterministic conversion')
 if manifest.get('rows')!=len(expected['active']['placements']) or manifest.get('nativeFormat')!=expected['version'] or manifest.get('partialCompatibility') is not True or manifest.get('originalVisualFidelityVerified') is not False or manifest.get('sourceRetained') is not True:raise ValueError('Manifest claims inconsistent')
 return {'verifiedRows':len(expected['active']['placements']),'recomputed':True,'partialCompatibility':True,'originalVisualFidelityVerified':False}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--catalog',type=Path,required=True);p.add_argument('--source',type=Path,required=True);p.add_argument('--mapping',type=Path,required=True);p.add_argument('--new-bundle',type=Path,required=True);a=p.parse_args()
 try:count=write_bundle(a.source,a.mapping,a.new_bundle,a.catalog)
 except Exception as e:raise SystemExit('Conversion refused/failed: '+str(e))
 print(json.dumps({'convertedRows':count,'partialCompatibility':True,'originalVisualFidelityVerified':False}))
