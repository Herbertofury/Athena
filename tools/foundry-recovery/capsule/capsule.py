"""Local, lossless recovery capsule for explicitly supplied Foundry localStorage values.
No browser access, uploads, rendering, active imports or value logging.
"""
import argparse, hashlib, json, os
from pathlib import Path
LIMIT = 16 * 1024 * 1024
KEYS = frozenset(('ff-floating-vault','ff-living-ui-prefs','ff-mascot-prefs','ff-room-semantic-state','ff-scrapbook-layout','ff-visual-quality','ff-world-layout','ff-world-mascots','ff.browser-snapshot.v1','ff.premium-theme.v1','ff.music-hub.v2'))

def digest(raw):
    # JS strings may contain lone surrogates. Preserve their exact UTF-16 code units.
    return hashlib.sha256(raw.encode('utf-16-le', errors='surrogatepass')).hexdigest()

def pairs(items):
    out = {}
    for key, value in items:
        if key in out:
            raise ValueError('Duplicate JSON key refused')
        out[key] = value
    return out

def parse(raw):
    if len(raw) > LIMIT:
        raise ValueError('Input exceeds bounded limit')
    return json.loads(raw, object_pairs_hook=pairs, parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Non-JSON number')))

def values(data):
    if not isinstance(data, dict) or not set(data) <= KEYS:
        raise ValueError('Expected only explicitly supported Foundry keys; unknown data is not collected')
    if any(not isinstance(v, str) for v in data.values()):
        raise ValueError('Supply exact raw localStorage strings, not parsed objects or null placeholders')
    if sum(len(v.encode('utf-16-le', errors='surrogatepass')) for v in data.values()) > LIMIT:
        raise ValueError('Values exceed bounded limit')
    return data

def pack(data):
    values(data)
    return {'format':'athena-foundry-original-values','version':1,'native_import':False,
            'entries':[{'key':k,'value':v,'utf16_sha256':digest(v)} for k,v in sorted(data.items())]}

def unpack(data):
    if not isinstance(data,dict) or set(data) != {'format','version','native_import','entries'} or data['format']!='athena-foundry-original-values' or type(data['version']) is not int or data['version']!=1 or data['native_import'] is not False or not isinstance(data['entries'],list) or len(data['entries'])>len(KEYS):
        raise ValueError('Unsupported recovery capsule')
    out={}
    for e in data['entries']:
        if not isinstance(e,dict) or set(e)!={'key','value','utf16_sha256'} or not isinstance(e['key'],str) or e['key'] not in KEYS or e['key'] in out or not isinstance(e['value'],str) or e['utf16_sha256']!=digest(e['value']):
            raise ValueError('Invalid, duplicated or corrupt recovery entry')
        out[e['key']]=e['value']
    return values(out)

def write_new(path, data):
    raw=json.dumps(data,ensure_ascii=True,allow_nan=False,sort_keys=True,separators=(',',':')).encode('ascii')
    if len(raw)>LIMIT:
        raise ValueError('Encoded result exceeds limit')
    fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    try:
        with os.fdopen(fd,'wb') as f:
            f.write(raw);f.flush();os.fsync(f.fileno())
    except BaseException:
        # Only this exclusively created output belongs to the failed operation.
        # Never leave a partial capsule masquerading as a durable recovery copy.
        Path(path).unlink()
        raise

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('operation',choices=['pack','unpack']);p.add_argument('source',type=Path);p.add_argument('destination',type=Path);a=p.parse_args()
    if a.source.is_symlink() or not a.source.is_file():
        raise ValueError('Source must be an explicitly prepared regular file')
    with a.source.open('rb') as f: raw=f.read(LIMIT+1)
    data=parse(raw)
    result=pack(data) if a.operation=='pack' else unpack(data)
    write_new(a.destination,result)
    print(json.dumps({'verified_entries':len(result['entries']) if a.operation=='pack' else len(result),'native_import':False,'source_modified':False}))
if __name__=='__main__':
    try: main()
    except (ValueError,OSError) as e:
        # Do not print paths, original values or decoder excerpts.
        raise SystemExit('Recovery operation refused; input validation or exclusive output failed.') from None
