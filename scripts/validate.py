import json,pathlib,re
R=pathlib.Path(__file__).resolve().parents[1];d=json.loads((R/'src/catalog.json').read_text());ids={l['id'] for l in d['lessons']}
assert len(d['certifications'])==13 and len(ids)==len(d['lessons'])==40
assert sum(len(c['domains']) for c in d['certifications'])==74
for c in d['certifications']:
 assert c['lessonIds'] and set(c['lessonIds'])<=ids
 assert c['sources'] and all(s['url'].startswith('https://') for s in c['sources'])
 assert len(c['domainCoverage'])==len(c['domains'])
 assert all(x['status']=='roadmap' for x in c['domainCoverage'])
 assert (R/f'docs/certificates/{c["id"]}.md').exists()
for l in d['lessons']:
 assert len(l['explain'])>=3 and len(l['lab'])>=4
 assert len(l['options'])==4 and 0<=l['answer']<4
 assert l['why'] and l['example'] and l['sources']
 assert (R/f'wiki/shared-{l["id"]}.md').exists()
for p in (R/'docs').rglob('*.md'):
 for link in re.findall(r'\]\(([^)]+)\)',p.read_text()):
  if not link.startswith(('http','#')): assert (p.parent/link).exists(),(p,link)
html=(R/'dist/index.html').read_text()
for src in re.findall(r'(?:src|href)="([^"]+)"',html):
 if src.endswith(('.js','.css')):assert (R/'dist'/src).exists(),src
assert 'SKILLQUEST' not in html and '<title>Athena' in html
assert '34 original' not in (R/'src/catalog.json').read_text()
from collections import Counter
assert set(Counter(l['answer'] for l in d['lessons']).values())=={10}
for l in d['lessons']:
 assert (R/f'docs/shared/{l["id"]}.md').read_bytes()==(R/f'wiki/shared-{l["id"]}.md').read_bytes()
assert len({tuple(c['lab']['steps']) for c in d['certifications']})==13
print('Catalog, 13 paths, 74 roadmaps, 40 lessons, shared-lesson wiki parity and documentation links validated. Engineering links require combined-deployment verification.')
