"""Generate standalone Data Workshop documents and portable content data."""
import json
from pathlib import Path
from data_content import LESSONS,PATH
R=Path(__file__).resolve().parents[1]
def write(name,text):
 p=R/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text.rstrip()+'\n',encoding='utf-8')
write('content/data-lessons.json',json.dumps(LESSONS,indent=2,ensure_ascii=False))
write('content/data-path.json',json.dumps(PATH,indent=2,ensure_ascii=False))
checks=[]
for l in LESSONS:
 s='# '+l['title']+'\n\n'+l['summary']+'\n\n**Study time:** about 45 minutes, with pauses for prediction and practice.\n\n## You will learn to\n\n'+'\n'.join('- '+x for x in l['learningGoals'])
 s+='\n\n## Learn\n\n'+'\n\n'.join(l['explain'])+'\n\n## Worked example\n\n'+l['example']+'\n\n```sql\n'+l['workedCode']+'\n```\n\nThese snippets illustrate the lesson; complete executable statements are in the fixed queries folder.\n\n## Practice safely\n\n'+'\n'.join(f'{i}. {x}' for i,x in enumerate(l['lab'],1))
 s+='\n\nUse the [offline lab guide](../../labs/data-workshop/README.md) for commands and paper alternatives.\n\n## Three original checks\n'
 for n,c in enumerate([l]+l['additionalChecks'],1):
  s+=f'\n### Check {n}\n\n'+c['question']+'\n\n'+'\n'.join(f'{chr(65+i)}. {x}' for i,x in enumerate(c['options']))
  s+='\n\n<details><summary>Answer and reasoning</summary>\n\n'+chr(65+c['answer'])+'. '+c['options'][c['answer']]+'. '+c['why']+'\n\n</details>\n'
  checks.append(dict(id=l['id']+'-'+str(n),lessonId=l['id'],**{k:c[k] for k in ['question','options','answer','why']}))
 s+='\n## Evidence to keep\n\n'+'\n'.join('- '+x for x in l['evidence'])+'\n\n## Limits\n\n'+l['limitations']+'\n\n## Official references\n\n'+'\n'.join('- '+u for u in l['sources'])
 write('docs/shared/'+l['id']+'.md',s)
write('content/data-checks.json',json.dumps(checks,indent=2,ensure_ascii=False))
s='# '+PATH['title']+'\n\n'+PATH['summary']+'\n\n**Scope:** '+PATH['limits']+'\n\n## Before you begin\n\nBasic familiarity with files, programs and a terminal helps. Each lesson explains its terms. You can use a text editor and the paper worksheet if Python is unavailable. The optional executable lab needs Python 3.10+ with SQLite 3.37+; it uses no third-party packages. Tested here on Python 3.12.14, SQLite 3.53.1/Linux. Other platforms remain unverified.\n\nThere are no timers, accounts, administrator permissions or network targets. Predict first, run only the supplied fixed command, then explain the observation. A negative result is often the intended lesson. These commands execute actual local SQLite and CSV operations on synthetic fixtures. Power BI-specific work remains unexecuted; this is not full PL-300 coverage.\n\n## Eight lessons\n\n'
s+='\n'.join(f'{i}. [{l["title"]}](../shared/{l["id"]}.md)' for i,l in enumerate(LESSONS,1))
s+='\n\n## Practice and reflection\n\n- [Safe offline lab guide](../../labs/data-workshop/README.md)\n- [Evidence worksheet and capstone](../../labs/data-workshop/WORKSHEET.md)\n- [Answer key](../../labs/data-workshop/ANSWER-KEY.md)\n- [Coverage and gaps](../DATA-COVERAGE.md)\n\nThe existing Athena lesson schema supports the first check per lesson. All 24 checks are available in these documents and the content data; the 16 supplemental checks need explicit app support before being advertised as interactive. A standalone navigation route also needs integration.\n'
write('docs/paths/data-workshop.md',s)
print(f'Rendered {len(LESSONS)} lessons and {len(checks)} original checks.')
