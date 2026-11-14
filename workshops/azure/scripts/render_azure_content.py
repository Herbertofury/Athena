"""Deterministic offline renderer for original Azure foundation teaching content."""
from html import escape
import json
from pathlib import Path
from azure_content import LESSONS, PATH
ROOT = Path(__file__).resolve().parents[1]

def write(name, text):
    path = ROOT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + '\n', encoding='utf-8')

def markdown(x):
    parts = ['# '+x['title'], x['summary'], '## Learning goals', '\n'.join('- '+v for v in x['learningGoals']),
             '## Learn', '\n\n'.join(x['explain']), '## Worked example', x['example'],
             '```sh\n'+x['workedCode']+'\n```', 'Run from the workshop directory. Local Python only; no Azure credentials, calls, network or real configuration.',
             '## Practice safely', '\n'.join(f'{i}. {v}' for i,v in enumerate(x['lab'],1)),
             '## Evidence to keep', '\n'.join('- '+v for v in x['evidence'])]
    for i,q in enumerate([x]+x['additionalChecks'],1):
        parts += [f'## Original check {i}',q['question'],'\n'.join(f'{chr(65+j)}. {o}' for j,o in enumerate(q['options'])),
                  '<details><summary>Answer and reasoning</summary>\n\n'+chr(65+q['answer'])+'. '+q['options'][q['answer']]+'\n\n'+q['why']+'\n\n</details>']
    parts += ['## Limits',x['limitations'],'## Official references','\n'.join('- '+u for u in x['sources'])]
    return '\n\n'.join(parts)

def html():
    out = ['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
           '<title>Azure Foundations Workbook</title><style>body{font:18px/1.65 system-ui,sans-serif;max-width:80ch;margin:2rem auto;padding:0 1rem;color:#17212b;background:#fff}a{color:#164c88}h1,h2,h3{line-height:1.25}section{margin:3rem 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#edf2f6;padding:1rem}summary{cursor:pointer}:focus-visible{outline:3px solid #a44400;outline-offset:3px}li{margin:.4rem 0}</style></head><body>',
           '<a href="#main">Skip to workbook</a><main id="main"><h1>'+escape(PATH['title'])+'</h1>',
           '<p>'+escape(PATH['summary'])+'</p><p><strong>Local-only learning.</strong> '+escape(PATH['limits'])+'</p>',
           '<p>Predict first, run only the fixed Python commands, then compare observed receipts. Without Python, complete the paper work and label execution unperformed. Supplemental checks do not award additional XP or prove certification readiness.</p>',
           '<p><a href="docs/WORKBOOK.md">Workbook instructions</a> · <a href="labs/azure-workshop/README.md">Lab guide</a> · <a href="labs/azure-workshop/WORKSHEET.md">Worksheet</a> · <a href="labs/azure-workshop/ANSWER-KEY.md">Answer key</a> · <a href="docs/AZURE-COVERAGE.md">Coverage and gaps</a></p>',
           '<nav aria-label="Workshop lessons"><ol>']
    out += ['<li><a href="#'+x['id']+'">'+escape(x['title'])+'</a></li>' for x in LESSONS]
    out += ['</ol></nav>']
    for x in LESSONS:
        out += ['<section id="'+x['id']+'"><h2>'+escape(x['title'])+'</h2><p>'+escape(x['summary'])+'</p><h3>Learning goals</h3><ul>']
        out += ['<li>'+escape(v)+'</li>' for v in x['learningGoals']]
        out += ['</ul>']+['<p>'+escape(v)+'</p>' for v in x['explain']]
        out += ['<h3>Worked example</h3><p>'+escape(x['example'])+'</p><pre><code>'+escape(x['workedCode'])+'</code></pre><h3>Practice safely</h3><ol>']
        out += ['<li>'+escape(v)+'</li>' for v in x['lab']]
        out += ['</ol><h3>Evidence to keep</h3><ul>']+['<li>'+escape(v)+'</li>' for v in x['evidence']]+['</ul><h3>Original practice checks</h3>']
        for q in [x]+x['additionalChecks']:
            out += ['<p><strong>'+escape(q['question'])+'</strong></p><ol type="A">']
            out += ['<li>'+escape(v)+'</li>' for v in q['options']]
            out += ['</ol><details><summary>Answer and reasoning</summary><p>'+escape(chr(65+q['answer'])+'. '+q['options'][q['answer']]+' '+q['why'])+'</p></details>']
        out += ['<h3>Limits</h3><p>'+escape(x['limitations'])+'</p><h3>Official references</h3><ul>']
        out += ['<li><a href="'+escape(u,quote=True)+'">'+escape(u)+'</a></li>' for u in x['sources']]
        out += ['</ul><p><a href="#main">Back to workbook contents</a></p></section>']
    out += ['</main></body></html>']
    return '\n'.join(out)

def build():
    write('content/azure-lessons.json',json.dumps(LESSONS,indent=2,ensure_ascii=False))
    write('content/azure-path.json',json.dumps(PATH,indent=2,ensure_ascii=False))
    checks=[]
    for x in LESSONS:
        write('docs/shared/'+x['id']+'.md',markdown(x))
        for i,q in enumerate([x]+x['additionalChecks'],1):
            checks.append(dict(id=x['id']+'-'+str(i),lessonId=x['id'],**{k:q[k] for k in ['question','options','answer','why']}))
    write('content/azure-checks.json',json.dumps(checks,indent=2,ensure_ascii=False))
    write('docs/paths/azure-workshop.md','# '+PATH['title']+'\n\n'+PATH['summary']+'\n\n## Prerequisites\n\n'+', '.join(PATH['prerequisites'])+'\n\n## Lessons\n\n'+'\n'.join(f'{i}. [{x["title"]}](../shared/{x["id"]}.md)' for i,x in enumerate(LESSONS,1))+'\n\n## Work safely\n\nUse the [workbook](../WORKBOOK.md) and [lab guide](../../labs/azure-workshop/README.md). Complete [coverage and gaps](../AZURE-COVERAGE.md) before interpreting completion.\n\n'+PATH['limits'])
    write('START-HERE.html',html())
    print('Rendered 10 lessons, 30 checks, path and accessible static workbook; no publication.')
if __name__ == '__main__': build()
