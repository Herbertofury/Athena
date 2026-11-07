"""Render additive content only inside this staging pack. No app-tree mutation."""
import json
from pathlib import Path
from security_content import LESSONS,PATH
R=Path(__file__).resolve().parents[1]
def write(path,text):
 p=R/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text.rstrip()+'\n',encoding='utf-8')
write('content/security-lessons.json',json.dumps(LESSONS,indent=2,ensure_ascii=False))
write('content/security-path.json',json.dumps(PATH,indent=2,ensure_ascii=False))
checks=[]
for lesson in LESSONS:
 s='# '+lesson['title']+'\n\n'+lesson['summary']+'\n\n**Estimated study:** about 40 minutes, with pauses and practice.\n\n## You will learn to\n\n'+'\n'.join('- '+x for x in lesson['learningGoals'])
 s+='\n\n## Learn\n\n'+'\n\n'.join(lesson['explain'])+'\n\n## Worked example\n\n'+lesson['example']
 s+='\n\n## Practice safely\n\n'+'\n'.join(f'{i}. {x}' for i,x in enumerate(lesson['lab'],1))
 s+='\n\nExecutable exercises and paper alternatives are in the [offline lab guide](../../labs/security-foundations/README.md).\n\n## Three original checks\n'
 for n,c in enumerate([lesson]+lesson['additionalChecks'],1):
  s+=f'\n### Check {n}\n\n'+c['question']+'\n\n'+'\n'.join(f'{chr(65+i)}. {x}' for i,x in enumerate(c['options']))
  s+='\n\n<details><summary>Reveal the answer and reasoning</summary>\n\n'+chr(65+c['answer'])+'. '+c['options'][c['answer']]+'. '+c['why']+'\n\n</details>\n'
  checks.append(dict(id=lesson['id']+'-'+str(n),lessonId=lesson['id'],**{k:c[k] for k in ('question','options','answer','why')}))
 s+='\n## Evidence to keep\n\n'+'\n'.join('- '+x for x in lesson['evidence'])+'\n\n## Limits\n\n'+lesson['limitations']
 s+='\n\n## Primary sources and further study\n\n'+'\n'.join('- '+x for x in lesson['sources'])
 write(f'docs/shared/{lesson["id"]}.md',s)
write('content/security-checks.json',json.dumps(checks,indent=2,ensure_ascii=False))
s='# '+PATH['title']+'\n\n'+PATH['summary']+'\n\n**Scope:** '+PATH['limits']+'\n\n## Start here\n\nNo security experience or paid service is required. Basic file and browser familiarity helps. Each lesson explains its terms. You can complete the paper exercises without Python; the optional actual local checks require Python 3.10 or newer. No dependency installation is needed.\n\nStudy one lesson at a time. Predict an outcome, perform the safe exercise, then explain the result in your own words. Take breaks; the estimates are not a deadline.\n\n## Ten applied lessons\n\n'
s+='\n'.join(f'{i}. [{x["title"]}](../shared/{x["id"]}.md)' for i,x in enumerate(LESSONS,1))
s+='\n\n## Practice and review\n\n- [Offline lab guide](../../labs/security-foundations/README.md)\n- [Evidence worksheet and cumulative tabletop](../../labs/security-foundations/WORKSHEET.md)\n- [Answer key and reasoning](../../labs/security-foundations/ANSWER-KEY.md)\n- [Coverage and next learning gaps](../SECURITY-COVERAGE.md)\n\nThe existing Athena UI can display the first check per lesson. All 30 checks are present in these lesson pages and the data pack; the current UI does not automatically display the 20 supplemental checks. The app path/navigation must be integrated separately.\n'
write('docs/paths/security-foundations.md',s)
print(f'Rendered {len(LESSONS)} lessons, {len(checks)} checks and one path')
