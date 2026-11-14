"""Retain generated ZIP bytes, full inspection receipts and negative controls."""
import base64
from datetime import datetime,timezone
import hashlib
import io
import json
from pathlib import Path
import platform
import sys
import traceback
import unicodedata
import zipfile
import zlib

import fixtures as f
import inspect_zip as lab


def run(output):
    output=Path(output);output.mkdir(parents=True,exist_ok=False)
    report={'schema_version':1,'evidence':'measured_generated_zip_bytes_only',
            'checked_at':datetime.now(timezone.utc).isoformat(),
            'environment':{'python':platform.python_version(),'os':platform.system(),
                           'machine':platform.machine(),'zlib_build':zlib.ZLIB_VERSION,
                           'zlib_runtime':zlib.ZLIB_RUNTIME_VERSION,'unicode_data':unicodedata.unidata_version},
            'source_sha256':{name:hashlib.sha256(Path(__file__).with_name(name).read_bytes()).hexdigest()
                             for name in ('inspect_zip.py','fixtures.py','run_demo.py')},
            'cases':[],'passed':False,
            'not_established':['general ZIP compatibility','safe extraction','signature or publisher trust',
                               'whole-process RSS or CPU limit','real mod package acceptance','performance improvement']}
    def case(name,data,expected,*,limits=lab.Limits(),cancel=lambda:False,library_control=False):
        (output/(name+'.zip')).write_bytes(data)
        row={'name':name,'archive_base64':base64.b64encode(data).decode(),'expected_error':expected}
        report['cases'].append(row)
        if library_control:
            # These controls contain at most 100 generated decoded bytes.
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                selected=archive.namelist()[0];body=archive.read(selected)
                row['library_name_read_control']={'name':selected,'body_hex':body.hex(),'length':len(body)}
        row['result']=lab.inspect(data,limits,cancel=cancel)
        row['passed']=row['result']['error']==expected and row['result']['complete']==(expected is None)
        if not row['passed']:raise RuntimeError('unexpected outcome in '+name)
    try:
        case('valid_mixed',f.archive([('mods/',b'',0),('mods/a.json',b'{"enabled":true}',8),('mods/readme.txt',b'generated only',0)]),None)
        case('duplicate_name_control',f.archive([('same',b'first',0),('same',b'second',0)]),'duplicate_or_portable_name_collision',library_control=True)
        case('forged_size_control',f.single_raw(body=b'A'*100,declared=1,crc=zlib.crc32(b'A')),'actual_declared_size_disagreement',library_control=True)
        case('actual_budget',f.single_raw(body=b'A'*1000000,declared=1,crc=zlib.crc32(b'A')),'actual_member_budget',limits=lab.Limits(member_bytes=32,total_bytes=100,chunk_bytes=7))
        data=f.archive([('first',b'ok',0),('second',b'broken',0),('third',b'later',0)])
        second=lab.inventory(data,lab.Limits())[1]
        case('partial_crc_failure',f.mutate(data,second['start'],'B',ord('X')),'crc_mismatch')
        case('traversal_refusal',f.single_raw(name=b'../outside'),'relative_nonempty_components_required')
        case('portable_collision',f.archive([('caf\u00e9',b'a',0),('cafe\u0301',b'b',0)]),'duplicate_or_portable_name_collision')
        compressor=zlib.compressobj(wbits=-15);compressed=compressor.compress(b'abc')+compressor.flush()
        case('trailing_stream_accounting',f.single_raw(body=b'abc',compressed=compressed+b'!'),'trailing_compressed_bytes')
        calls=0
        def cancel():
            nonlocal calls
            calls+=1;return calls==4
        case('cooperative_cancellation',f.single_raw(body=b'A'*20000),'cancelled',cancel=cancel)
        report['passed']=True
    except BaseException:
        report['traceback']=traceback.format_exc();raise
    finally:(output/'result.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('usage: python3 run_demo.py NEW_OUTPUT_DIRECTORY')
    report=run(sys.argv[1]);print(json.dumps({'passed':report['passed'],'cases':len(report['cases'])}))
