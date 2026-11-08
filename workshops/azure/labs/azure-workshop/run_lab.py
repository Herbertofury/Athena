#!/usr/bin/env python3
"""Ten fixed commands; exclusively reads bundled synthetic fixture files."""
import json
from pathlib import Path
import sys
sys.dont_write_bytecode=True
from lab import COMMANDS, run


def unique_object(pairs):
    result={}
    for key,value in pairs:
        if key in result: raise ValueError("Duplicate JSON object key")
        result[key]=value
    return result

def main(args):
    if len(args)!=1 or args[0] not in COMMANDS:
        print(json.dumps({'error':'Supply exactly one fixed command','commands':list(COMMANDS),'real_azure_executed':False}))
        return 2
    command=args[0]
    try:
        path=Path(__file__).resolve().parent/'fixtures'/(command+'.json')
        with path.open('rb') as source:
            raw=source.read(100001)
        if len(raw)>100000: raise ValueError('Fixture too large')
        data=json.loads(raw.decode('utf-8'),object_pairs_hook=unique_object,parse_constant=lambda value: (_ for _ in ()).throw(ValueError('Nonfinite JSON')))
        result=run(command,data)
    except (ValueError,OSError,RecursionError) as exc:
        print(json.dumps({'command':command,'error':str(exc),'real_azure_executed':False},allow_nan=False))
        return 2
    print(json.dumps(result,indent=2,sort_keys=True,allow_nan=False))
    return 0

if __name__=='__main__':
    sys.exit(main(sys.argv[1:]))
