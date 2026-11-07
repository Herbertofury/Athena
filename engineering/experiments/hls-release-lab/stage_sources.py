"""Extract only pinned official HLS source files; never run package scripts."""
import argparse,base64,hashlib,json,pathlib,tarfile
p=argparse.ArgumentParser();p.add_argument('stage',type=pathlib.Path);a=p.parse_args();pins=json.loads(pathlib.Path(__file__).with_name('provenance.json').read_text())['packages']
for pin in pins:
 archive=a.stage/'packages'/pin['tarball']
 if not archive.is_file() or archive.stat().st_size>12*1024*1024:raise ValueError('Unexpected package size')
 with archive.open('rb') as f:actual='sha512-'+base64.b64encode(hashlib.file_digest(f,'sha512').digest()).decode()
 if actual!=pin['integrity']:raise ValueError('Package integrity mismatch')
 destination=a.stage/'packages'/('source-'+pin['version']);destination.mkdir(exist_ok=False);total=0
 with tarfile.open(archive) as package:
  for member in package.getmembers():
   if not(member.name.startswith('package/src/') or member.name in ['package/package.json','package/LICENSE']):continue
   if not member.isfile():continue
   relative=pathlib.PurePosixPath(member.name).relative_to('package')
   if '..' in relative.parts or relative.is_absolute():raise ValueError('Unexpected archive path')
   total+=member.size
   if total>16*1024*1024:raise ValueError('Extracted source budget exceeded')
   target=destination.joinpath(*relative.parts);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(package.extractfile(member).read())
 if json.loads((destination/'package.json').read_text())['version']!=pin['version']:raise ValueError('Package version mismatch')
 if hashlib.sha256((destination/'src/loader/m3u8-parser.ts').read_bytes()).hexdigest()!=pin['parser_source_sha256']:raise ValueError('Parser source identity mismatch')
print('Pinned source extraction verified; package scripts were not run')
