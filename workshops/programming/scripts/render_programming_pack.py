"""Render the original Programming Workshop into portable Markdown and JSON."""
import json
from pathlib import Path
from programming_content import LESSONS, PATH, S
R = Path(__file__).resolve().parents[1]
def write(name, text):
    p = R / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text.rstrip() + '\n', encoding='utf-8')
write('content/programming-lessons.json', json.dumps(LESSONS, indent=2, ensure_ascii=False))
write('content/programming-path.json', json.dumps(PATH, indent=2, ensure_ascii=False))
checks = []
for lesson in LESSONS:
    s = '# ' + lesson['title'] + '\n\n' + lesson['summary']
    s += '\n\n**Study time:** about 45 minutes, plus additional project practice at your own pace.\n\n## You will learn to\n\n'
    s += '\n'.join('- ' + x for x in lesson['learningGoals'])
    s += '\n\n## Learn\n\n' + '\n\n'.join(lesson['explain'])
    s += '\n\n## Worked example\n\n' + lesson['example']
    s += '\n\n```python\n' + lesson['workedCode'] + '\n```\n\nThe snippets illustrate the surrounding explanation; the complete runnable programs are in the projects and examples folders.\n\n## Practice safely\n\n'
    s += '\n'.join(f'{i}. {x}' for i, x in enumerate(lesson['lab'], 1))
    s += '\n\nUse the [project guide](../../projects/README.md) for commands and paper alternatives.\n\n## Three original checks\n'
    for i, check in enumerate([lesson] + lesson['additionalChecks'], 1):
        s += f'\n### Check {i}\n\n' + check['question'] + '\n\n' + '\n'.join(f'{chr(65+n)}. {x}' for n, x in enumerate(check['options']))
        s += '\n\n<details><summary>Answer and reasoning</summary>\n\n' + chr(65+check['answer']) + '. ' + check['options'][check['answer']] + ' ' + check['why'] + '\n\n</details>\n'
        checks.append(dict(id=lesson['id']+'-'+str(i), lessonId=lesson['id'], **{k:check[k] for k in ['question','options','answer','why']}))
    s += '\n## Evidence to keep\n\n' + '\n'.join('- '+x for x in lesson['evidence'])
    s += '\n\n## Limits\n\n' + lesson['limitations']
    s += '\n\n## Official references\n\n' + '\n'.join('- '+u for u in lesson['sources'])
    write('docs/shared/'+lesson['id']+'.md', s)
write('content/programming-checks.json', json.dumps(checks, indent=2, ensure_ascii=False))
s = '# '+PATH['title']+'\n\n'+PATH['summary']+'\n\n**Scope:** '+PATH['limits']
s += '\n\n## Start here\n\nUse a text editor and Python 3.10 or later. Only the standard library is needed. Tested on Python 3.12.14/Linux; Windows and macOS are not verified. No account, administrator access or network target is required. If Python is unavailable, use the paper exercises; do not claim their execution. Plan roughly six hours for the lessons and additional time to implement both projects.\n\n## Eight lessons\n\n'
s += '\n'.join(f'{i}. [{l["title"]}](../shared/{l["id"]}.md)' for i,l in enumerate(LESSONS,1))
s += '\n\n## Practice and reflection\n\n- [Project guide](../../projects/README.md)\n- [Repair Quotes contract](../../projects/repair_quotes/CONTRACT.md)\n- [Event Summary contract](../../projects/event_summary/CONTRACT.md)\n- [Worksheet and capstone](../../projects/WORKSHEET.md)\n- [Answer key](../../projects/ANSWER-KEY.md)\n- [Coverage and gaps](../PROGRAMMING-COVERAGE.md)\n\nThe standalone pack includes all 24 checks and code snippets. The existing Athena lesson modal supports only the first check per lesson and does not render the optional workedCode field; integration must add that support before advertising it.\n'
write('docs/paths/programming-workshop.md', s)
scopes = {
'intro':'Values, operators, integers and strings; original cents examples.',
'flow':'Conditions, loops, functions and control flow; original trace/invariant.',
'data':'Lists, dictionaries, sets, sorting; original grouping and identity rules.',
'errors':'Exceptions and targeted error handling, separate from unfinished code.',
'tests':'unittest cases, assertions and suites; original visible acceptance tests.',
'csv':'CSV reader, quoting, newline handling and strict parsing option.',
'json':'JSON decode/encode, object_pairs_hook, parse_constant, allow_nan.',
'cli':'argparse constrained choices and usage/error handling.',
'modules':'Module boundaries and explicit script entry points.',
'io':'Text files, explicit encoding and context managers.',
'float':'Floating-point approximation; exact integer cents are a scoped design choice.',
'copy':'Assignment, shallow copies and nested aliasing.'}
write('research/programming-sources.json', json.dumps(dict(checked='2026-11-07',method='Opened official Python documentation pages through web research; no copied tutorial exercises.',version_note='Documentation currently identifies Python 3.12.16; execution used Python 3.12.14 and stable APIs shared across that series.',sources=[dict(id=k,url=v,publisher='Python Software Foundation',status='opened',supports=scopes[k]) for k,v in S.items()]), indent=2))
print(f'Rendered {len(LESSONS)} lessons and {len(checks)} original checks.')
