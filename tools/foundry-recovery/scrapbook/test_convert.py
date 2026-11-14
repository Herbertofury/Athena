import unittest,tempfile,json,hashlib,copy,subprocess,os
from pathlib import Path
import convert
ROOT=Path(__file__).parent
def configured(name):
 value=os.environ.get(name)
 if not value:raise RuntimeError(name+" is required; see recovery-tools README")
 return Path(value).resolve()
BIN=str(configured("ATHENA_NATIVE_BIN"))
CATALOG=configured("ATHENA_CATALOG")
MODEL=configured("ATHENA_LAYOUT_MODEL")
CAT=json.loads(CATALOG.read_text());T=CAT['themes'][0];ASSET=T['objects'][0]['id']
def fixture():
 row={'assetId':'reviewed-source-asset','scope':'ui','gravity':False,'gravityAfterPeel':False,'x':200,'y':150,'rotation':0,'scaleX':1,'scaleY':1,'opacity':.6,'blendMode':'normal','locked':False,'zIndex':3,'skewX':0,'skewY':0,'brightness':1,'contrast':1,'saturation':1,'hue':0,'blur':0,'visible':True,'anchor':'mc','pinTargetId':None,'pinTargetKey':None,'pinX':.5,'pinY':.5}
 sticker={**row,'scope':'sticker','x':350,'y':200,'pinTargetKey':'#reviewed-pane','pinTargetId':'fixture-pane','zIndex':4}
 rows=[row,sticker];raw=json.dumps(rows,indent=2).encode()
 frame={'left':0,'top':0,'width':1000,'height':800};geo={'index':0,'sourceFrame':frame,'targetFrame':{**frame,'left':50,'top':100},'sourceSize':{'width':100,'height':100},'targetSize':{'width':50,'height':50},'anchor':None}
 second={**geo,'index':1,'sourceFrame':{'left':100,'top':50,'width':600,'height':400},'anchor':{'sourceKey':'#reviewed-pane','sourceId':'fixture-pane','nativeKey':'inspector'}}
 mapping={'sourceSha256':hashlib.sha256(raw).hexdigest(),'coordinatePolicy':'proportional-centers','assetReview':'manual-equivalence-confirmed','stackingReview':'independent-surfaces-reviewed','themeId':T['id'],'roomId':T['rooms'][0]['id'],'assets':{'reviewed-source-asset':ASSET},'rows':[geo,second]}
 return rows,raw,mapping
class Tests(unittest.TestCase):
 def test_duplicates_centers_sticker_width_and_deterministic_ids(self):
  rows,raw,m=fixture();out=convert.convert(raw,m,CAT);values=list(out['active']['placements'].values());self.assertEqual(len(values),2);self.assertEqual([p['objectId'] for p in values],[ASSET,ASSET]);self.assertEqual((values[0]['x'],values[0]['y']),(.25,.25));self.assertEqual((values[1]['x'],values[1]['y']),(.5,.5));self.assertEqual((values[1]['scaleX'],values[1]['scaleY']),(2,2));self.assertEqual(values[1]['anchor'],'inspector');self.assertEqual(out,convert.convert(raw,m,CAT));bad=copy.deepcopy(m);bad['rows'][1]['sourceSize']['width']=80
  with self.assertRaisesRegex(ValueError,'geometry inconsistent'):convert.convert(raw,bad,CAT)
 def test_non_neutral_unknown_missing_asset_and_mapping_refused(self):
  rows,raw,m=fixture()
  for field,value in [('gravity',True),('gravityAfterPeel',True),('blendMode','multiply'),('skewX',90),('brightness',3),('blur',2),('anchor','unknown'),('futureSecret','private-fixture'),('assetId','unknown')]:
   changed=copy.deepcopy(rows);changed[0][field]=value;b=json.dumps(changed).encode();mm=copy.deepcopy(m);mm['sourceSha256']=hashlib.sha256(b).hexdigest()
   with self.assertRaises(ValueError,msg=field):convert.convert(b,mm,CAT)
  for edit in [lambda v:v.pop('assetReview'),lambda v:v['rows'][0].pop('targetSize'),lambda v:v.update(sourceSha256='wrong'),lambda v:v['rows'][1]['anchor'].update(nativeKey='arbitrary-selector')]:
   bad=copy.deepcopy(m);edit(bad)
   with self.assertRaises(ValueError):convert.convert(raw,bad,CAT)
 def test_bounds_clipping_and_duplicate_json_refused(self):
  _,raw,m=fixture();bad=copy.deepcopy(m);bad['rows'][0]['targetFrame']['width']=20
  with self.assertRaisesRegex(ValueError,'clip'):convert.convert(raw,bad,CAT)
  with self.assertRaises(ValueError):convert.parse(b'{"x":1,"x":2}')
 def test_equal_order_on_same_surface_refused_not_reordered_by_uuid(self):
  rows,raw,m=fixture();rows[1]=copy.deepcopy(rows[0]);m['rows'][1]=copy.deepcopy(m['rows'][0]);m['rows'][1]['index']=1
  raw=json.dumps(rows).encode();m['sourceSha256']=hashlib.sha256(raw).hexdigest()
  with self.assertRaisesRegex(ValueError,'Equal source stacking'):convert.convert(raw,m,CAT)
  rows[1]['zIndex']+=1;raw=json.dumps(rows).encode();m['sourceSha256']=hashlib.sha256(raw).hexdigest();self.assertEqual(len(convert.convert(raw,m,CAT)['active']['placements']),2)
 def test_new_private_bundle_preserves_exact_source_and_refuses_overwrite(self):
  _,raw,m=fixture()
  with tempfile.TemporaryDirectory() as d:
   p=Path(d);src=p/'source.txt';mp=p/'map.json';src.write_bytes(raw);mp.write_text(json.dumps(m));before=src.read_bytes();out=p/'bundle';self.assertEqual(convert.write_bundle(src,mp,out,CATALOG),2);self.assertEqual(src.read_bytes(),before);self.assertEqual((out/'source-original.utf8').read_bytes(),before);self.assertEqual(os.stat(out).st_mode&0o777,0o700)
   for f in out.iterdir():self.assertEqual(os.stat(f).st_mode&0o777,0o600)
   with self.assertRaises(FileExistsError):convert.write_bundle(src,mp,out,CATALOG)
 def test_bundle_recompute_and_tamper_refusal(self):
  _,raw,m=fixture()
  with tempfile.TemporaryDirectory() as d:
   p=Path(d);src=p/'source';mp=p/'map';src.write_bytes(raw);mp.write_text(json.dumps(m));out=p/'bundle';convert.write_bundle(src,mp,out,CATALOG)
   self.assertEqual(convert.verify_bundle(out,CATALOG)['verifiedRows'],2)
   file=out/'athena-workspace.json';original=file.read_bytes();data=json.loads(original);data['active']['time']='night';file.write_text(json.dumps(data))
   with self.assertRaisesRegex(ValueError,'integrity'):convert.verify_bundle(out,CATALOG)
   manifest=out/'manifest.json';meta=json.loads(manifest.read_bytes());meta['workspaceSha256']=hashlib.sha256(file.read_bytes()).hexdigest();manifest.write_text(json.dumps(meta))
   with self.assertRaisesRegex(ValueError,'deterministic'):convert.verify_bundle(out,CATALOG)
   file.write_bytes(original);manifest.unlink()
   with self.assertRaisesRegex(ValueError,'Incomplete'):convert.verify_bundle(out,CATALOG)
 def test_actual_js_schema_and_native_sqlite_roundtrip(self):
  rows,raw,m=fixture();rows[0].update(anchor='tr',skewX=20,skewY=-15,brightness=1.2,contrast=.7,saturation=2,hue=35);raw=json.dumps(rows).encode();m['sourceSha256']=hashlib.sha256(raw).hexdigest();out=convert.convert(raw,m,CAT)
  with tempfile.TemporaryDirectory() as d:
   p=Path(d);file=p/'workspace.json';file.write_text(json.dumps(out));db=p/'store.db'
   for cmd in ['init','upgrade-history','upgrade-soundtracks','upgrade-transforms','upgrade-scopes','upgrade-environment','upgrade-targets','upgrade-instances','upgrade-appearance','upgrade-filters','upgrade-origins']:subprocess.run([BIN,cmd,str(db)],check=True,capture_output=True)
   subprocess.run([BIN,'save-backup',str(db)],input=json.dumps(out),text=True,check=True,capture_output=True);saved=json.loads(subprocess.check_output([BIN,'load-backup',str(db)]));self.assertEqual(saved,out)
   script="import fs from 'node:fs';const {createLayoutModel}=await import(process.argv[3]);const c=JSON.parse(fs.readFileSync(process.argv[1]));const m=createLayoutModel(c.themes);m.parseWorkspace(fs.readFileSync(process.argv[2],'utf8'));"
   subprocess.run(['node','--input-type=module','-e',script,str(CATALOG),str(file),MODEL.as_uri()],check=True,capture_output=True)
 def test_affine_corners_signed_nonuniform_intrinsics_and_explicit_filters(self):
  rows,raw,m=fixture();rows[0].update(scaleX=-1.4,scaleY=.7,rotation=25,skewX=20,skewY=-15,brightness=1.2,contrast=.7,saturation=2,hue=35);m['rows'][0]['targetSize']={'width':50,'height':80};raw=json.dumps(rows).encode();m['sourceSha256']=hashlib.sha256(raw).hexdigest();out=convert.convert(raw,m,CAT);p=next(iter(out['active']['placements'].values()));self.assertEqual(out['version'],9);self.assertEqual((p['scaleX'],p['scaleY']),(-2.8,.875));self.assertEqual((p['brightness'],p['contrast'],p['saturation'],p['hue']),(1.2,.7,2,35))
  # Independently form R*K*S coefficients, not the converter helper.
  import math
  c,d=math.cos(math.radians(25)),math.sin(math.radians(25));a,b=math.tan(math.radians(20)),math.tan(math.radians(-15));expected=[]
  for u,v in [(-50,-50),(50,-50),(50,50),(-50,50)]:expected.append(((c-d*b)*-1.4*u+(c*a-d)*.7*v,(d+c*b)*-1.4*u+(d*a+c)*.7*v))
  actual=convert.affine_corners(50,80,p['scaleX'],p['scaleY'],p['rotation'],p['skewX'],p['skewY'])
  for x,y in zip(expected,actual):
   self.assertAlmostEqual(x[0],y[0],places=10);self.assertAlmostEqual(x[1],y[1],places=10)
 def test_skew_bounds_detect_clipping_naive_unskewed_bounds_miss(self):
  rows,raw,m=fixture();rows[0].update(skewX=80);raw=json.dumps(rows).encode();m['sourceSha256']=hashlib.sha256(raw).hexdigest()
  with self.assertRaisesRegex(ValueError,'clip'):convert.convert(raw,m,CAT)
 def test_nonzero_blur_refused_even_uniform_or_equal_size(self):
  for target in [{'width':100,'height':100},{'width':50,'height':50},{'width':50,'height':80}]:
   rows,raw,m=fixture();rows[0]['blur']=1;m['rows'][0]['targetSize']=target;raw=json.dumps(rows).encode();m['sourceSha256']=hashlib.sha256(raw).hexdigest()
   with self.assertRaisesRegex(ValueError,'no blur scaling guessed'):convert.convert(raw,m,CAT)


class OriginTests(unittest.TestCase):
 def test_nine_origins_absolute_affine_corners_reflections_skew_stickers(self):
  import math
  # Independent direct homogeneous mapping, using local top-left coordinates.
  def point(q,w,h,sx,sy,rotation,kx,ky,f,center):
   ox,oy=f[0]*w,f[1]*h
   a,b=(q[0]-ox)*sx,(q[1]-oy)*sy
   u,v=a+math.tan(math.radians(kx))*b,math.tan(math.radians(ky))*a+b
   c,s=math.cos(math.radians(rotation)),math.sin(math.radians(rotation))
   return center[0]-w/2+ox+c*u-s*v,center[1]-h/2+oy+s*u+c*v
  for origin,f in convert.ORIGINS.items():
   for sx,sy,kx,ky in [(-1.4,.7,20,-15),(.4,-.6,65,-40),(1,1,0,0)]:
    rows,raw,m=fixture()
    for row in rows:row.update(anchor=origin,scaleX=sx,scaleY=sy,skewX=kx,skewY=ky,rotation=25)
    for g in m['rows']:g['targetSize']={'width':50,'height':80}
    raw=json.dumps(rows).encode();m['sourceSha256']=hashlib.sha256(raw).hexdigest();out=convert.convert(raw,m,CAT)
    for row,g,p in zip(rows,m['rows'],out['active']['placements'].values()):
     sf,tf=g['sourceFrame'],g['targetFrame'];sc=(row['x']+50,row['y']+50);base=(tf['left']+(sc[0]-sf['left'])/sf['width']*tf['width'],tf['top']+(sc[1]-sf['top'])/sf['height']*tf['height']);tc=(tf['left']+p['x']*tf['width'],tf['top']+p['y']*tf['height'])
     self.assertEqual(p['transformOrigin'],origin)
     for x,y in [(0,0),(1,0),(1,1),(0,1)]:
      source=point((100*x,100*y),100,100,sx,sy,25,kx,ky,f,sc);target=point((50*x,80*y),50,80,p['scaleX'],p['scaleY'],25,kx,ky,f,tc)
      for expected,actual in zip((base[0]+source[0]-sc[0],base[1]+source[1]-sc[1]),target):self.assertAlmostEqual(expected,actual,places=8)
 def test_origin_offset_clipping_refused(self):
  rows,_,m=fixture();rows[0].update(anchor='br',x=0,y=0,scaleX=3,scaleY=3)
  raw=json.dumps(rows).encode();m['sourceSha256']=hashlib.sha256(raw).hexdigest()
  with self.assertRaisesRegex(ValueError,'clip'):convert.convert(raw,m,CAT)

if __name__=='__main__':unittest.main()
