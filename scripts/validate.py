import json,pathlib,re
R=pathlib.Path(__file__).resolve().parents[1];d=json.loads((R/'src/catalog.json').read_text());ids={l['id'] for l in d['lessons']}
assert len(d['certifications'])==13 and len(ids)==len(d['lessons'])==90
assert sum(len(c['domains']) for c in d['certifications'])==74
track_ids={c['id'] for c in d['certifications']}
for cluster in d['sharedKnowledge']:
 assert cluster['tracks'] and set(cluster['tracks'])<=track_ids
 assert len(cluster['tracks'])==len(cluster['sourceTrackIds'])
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
assert Counter(l['answer'] for l in d['lessons'])=={0:23,1:23,2:22,3:22}
for l in d['lessons']:
 assert (R/f'docs/shared/{l["id"]}.md').read_bytes()==(R/f'wiki/shared-{l["id"]}.md').read_bytes()
assert len({tuple(c['lab']['steps']) for c in d['certifications']})==13
print('Catalog, 13 paths, 74 roadmaps, 90 lessons, shared-lesson wiki parity and documentation links validated. Engineering links require combined-deployment verification.')

for path in d['learningPaths']:
 assert set(path['lessonIds']+path['prerequisites']) <= ids
 if path['id']=='packet-trail':
  assert len(path['lessonIds'])==8
  assert set(path['caseIds'])=={c['id'] for c in d['diagnosisCases']}
 else:
  assert path['kind']=='workshop' and path['caseIds']==[]
  assert len(path['lessonIds']) in (8,10)
for case in d['diagnosisCases']:
 assert case['lessonId'] in ids and len(case['options'])==4
 assert 0<=case['answer']<4 and len(case['evidence'])>=4
 assert case['verify'] and case['why']
