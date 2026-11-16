#!/usr/bin/env python3
"""Bounded explicitly selected Skill archive, never an installer or rights grant."""
import argparse,hashlib,io,json,os,re,zipfile
from pathlib import Path
from skill_sync import safe,portable,tree

def package(source,output,source_url,revision):
 source=safe(source);output=safe(output)
 if not portable(source.name):raise ValueError('nonportable root name')
 if output==source or output.is_relative_to(source) or source.is_relative_to(output):raise ValueError('separate output required')
 if os.path.lexists(output):raise ValueError('output must not exist')
 if not output.parent.is_dir():raise ValueError('existing output parent required')
 if not re.fullmatch(r'https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+',source_url):raise ValueError('explicit public source URL required')
 if not re.fullmatch(r'[0-9a-f]{40}',revision):raise ValueError('pinned source revision required')
 files,hashes=tree(source)
 # Stored members avoid platform zlib variability; normalized metadata ignores filesystem modes.
 stream=io.BytesIO()
 with zipfile.ZipFile(stream,'w',compression=zipfile.ZIP_STORED) as z:
  for name,data in sorted(files.items()):
   info=zipfile.ZipInfo(source.name+'/'+name,(2026,1,1,0,0,0));info.create_system=3;info.external_attr=0o100644<<16;info.compress_type=zipfile.ZIP_STORED
   z.writestr(info,data)
 blob=stream.getvalue()
 if len(blob)>40*1024*1024:raise ValueError('archive budget')
 again,again_hashes=tree(source)
 if again!=files or again_hashes!=hashes:raise ValueError('source changed before publication')
 receipt={'schemaVersion':1,'artifact':'skill.zip','skill':source.name,'source':source_url,'sourceRevision':revision,'sha256':hashlib.sha256(blob).hexdigest(),'sizeBytes':len(blob),'files':hashes,'rights':'Caller must review rights/privacy before sharing; metadata is attribution, not license clearance.','scope':'Source archive only; no installation, execution, signature, attestation or client acceptance.','retirementReady':False}
 safe(output);output.mkdir() # Exclusive; never overwrite or delete existing data.
 # Completion marker last. On failure preserve partial output for inspection.
 with (output/'skill.zip').open('xb') as f:f.write(blob)
 with (output/'release-receipt.json').open('x',encoding='utf-8',newline='\n') as f:json.dump(receipt,f,sort_keys=True,indent=2);f.write('\n')
 return receipt

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--source-url',required=True);p.add_argument('--revision',required=True);a=p.parse_args()
 try:print(json.dumps(package(a.source,a.output,a.source_url,a.revision),indent=2));return 0
 except (OSError,ValueError,TypeError,KeyError):print('Packaging failed; preserve any partial output. No completed archive is claimed.');return 2
if __name__=='__main__':raise SystemExit(main())
