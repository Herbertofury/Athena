"""Conflict-aware wiki synchronization. Does not authenticate or push."""
import argparse,hashlib,json,pathlib,shutil
START='<!-- ATHENA:GENERATED:START -->';END='<!-- ATHENA:GENERATED:END -->'
def digest(text):return hashlib.sha256(text.encode()).hexdigest()
def merged(current,generated):
    block=START+'\n'+generated.rstrip()+'\n'+END
    if START in current or END in current:
        if current.count(START)!=1 or current.count(END)!=1 or current.index(START)>current.index(END):raise ValueError('Malformed managed markers; refusing overwrite')
        return current[:current.index(START)]+block+current[current.index(END)+len(END):]
    return current.rstrip()+'\n\n'+block+'\n'
def sync(source,target):
    previous=json.loads((target/'.athena-managed.json').read_text()) if (target/'.athena-managed.json').exists() else {}
    updates={};manifest={}
    for p in sorted(source.glob('*.md')):
        dest=target/p.name;text=p.read_text()
        if p.name in ['Home.md','_Sidebar.md']:
            current=dest.read_text() if dest.exists() else ''
            if p.name=='Home.md':text=text.removeprefix('Welcome to the Athena wiki!\n\n')
            text=merged(current,text)
        elif dest.exists() and dest.read_text()!=text and previous.get(p.name)!=digest(dest.read_text()):
            raise ValueError(f'Unmanaged or user-edited page {p.name}; refusing overwrite')
        updates[dest]=text;manifest[p.name]=digest(text)
    # Preflight all conflicts before any page write. Never remove unknown pages.
    for path,text in updates.items():path.write_text(text)
    (target/'.athena-managed.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return len(updates)
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('source',type=pathlib.Path);ap.add_argument('target',type=pathlib.Path);a=ap.parse_args();print(f'Prepared {sync(a.source,a.target)} managed pages; unknown pages preserved.')
