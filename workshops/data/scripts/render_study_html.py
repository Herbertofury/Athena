"""Create one self-contained, script-free study guide from original pack content."""
from html import escape
from pathlib import Path
import re
from data_content import LESSONS, PATH
R=Path(__file__).resolve().parents[1]
def e(text):return escape(str(text),quote=True)
def inline(text):
    out=[];start=0
    pattern=r'`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)'
    for m in re.finditer(pattern,text):
        out.append(e(text[start:m.start()]))
        if m.group(1) is not None:out.append('<code>'+e(m.group(1))+'</code>')
        elif m.group(2) is not None:out.append('<strong>'+e(m.group(2))+'</strong>')
        else:
            out.append(e(m.group(3)))
            # Relative documents are already included as complete sections below.
            if m.group(4).startswith('https://'):out.append(' ('+e(m.group(4))+')')
        start=m.end()
    out.append(e(text[start:]));return ''.join(out)
def markdown_section(path,section_id,title):
    # Deliberately small block renderer: source documents use headings, lists, paragraphs and fences only.
    lines=path.read_text(encoding='utf-8').splitlines();out=[f'<section id="{section_id}" aria-labelledby="{section_id}-title"><h2 id="{section_id}-title">{e(title)}</h2>'];para=[];code=None;list_tag=None
    def flush():
        if para:out.append('<p>'+inline(' '.join(para))+'</p>');para.clear()
    def close_list():
        nonlocal list_tag
        if list_tag:out.append('</'+list_tag+'>');list_tag=None
    for line in lines:
        if line.startswith('```'):
            if code is None:flush();close_list();code=[]
            else:out.append('<pre><code>'+e('\n'.join(code))+'</code></pre>');code=None
            continue
        if code is not None:code.append(line);continue
        if line.startswith('# '):continue
        if line.startswith('## '):flush();close_list();out.append('<h3>'+e(line[3:])+'</h3>');continue
        m=re.match(r'^(?:- |(\d+)\. )(.*)',line)
        if m:
            flush();tag='ol' if m.group(1) else 'ul'
            if list_tag!=tag:close_list();list_tag=tag;out.append('<'+tag+'>')
            out.append('<li>'+inline(m.group(2))+'</li>');continue
        if not line.strip():flush();close_list()
        else:close_list();para.append(line)
    flush();close_list();out.append('</section>');return '\n'.join(out)
css='''html{font-family:system-ui,sans-serif;line-height:1.65;color:#172439;background:#f6f8fc}body{margin:0}main,header,footer{max-width:76ch;margin:auto;padding:1.5rem}h1,h2,h3{line-height:1.2}h2{margin-top:2.5rem}a{color:#124ba0;text-underline-offset:.2em}a:focus,summary:focus{outline:3px solid #9d4b00;outline-offset:4px}section{scroll-margin-top:1rem}pre{background:#e8edf5;padding:1rem;overflow:auto;border-radius:.4rem;white-space:pre-wrap;overflow-wrap:anywhere}code{font-family:ui-monospace,monospace;font-size:.95em}details{padding:.7rem 1rem;margin:1rem 0;border:1px solid #9baac0;border-radius:.4rem;background:white}summary{font-weight:650;cursor:pointer}.scope{border-left:4px solid #325681;padding:1rem;background:#e8edf5}.skip{position:absolute;left:-999rem}.skip:focus{left:1rem;top:1rem;background:white;padding:.5rem}li{margin:.4rem 0}.top{font-size:.9rem}@media print{html{background:white}main,header,footer{padding:0}pre,details{break-inside:avoid}a{color:inherit}summary{display:none}details>*{display:block!important}.skip,.top{display:none}}'''
parts=['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Athena Data & SQL Workshop</title><style>'+css+'</style></head><body><a class="skip" href="#main">Skip to lessons and labs</a><header id="top"><p>Athena · Offline learner pack</p><h1>From Rows to Reliable Answers</h1><p>Eight lessons, 24 original checks and eight actual local SQLite/CSV exercises.</p><p class="scope">Only synthetic data and fresh in-memory databases are used. Transaction rollback and temporary CSV export are actually executed locally. Power BI workflows are unexecuted; this is not full PL-300 coverage or readiness.</p><nav aria-label="Study guide contents"><h2>Contents</h2><ol>']
for l in LESSONS:parts.append(f'<li><a href="#{l["id"]}">{e(l["title"])}</a></li>')
for ident,title in [('lab-guide','Run the local labs'),('contracts','Data dictionary and contracts'),('worksheet','Evidence worksheet'),('answers','Prediction key'),('coverage','Coverage and limits')]:parts.append(f'<li><a href="#{ident}">{e(title)}</a></li>')
parts.append('</ol></nav><p>Read this file directly in a browser, without a server or internet connection. Source reference links require internet only if you choose to open them. Code lives alongside this guide in the extracted pack. Python 3.12.14, SQLite 3.53.1/Linux was tested; other systems remain unverified.</p></header><main id="main">')
for l in LESSONS:
    parts.append(f'<section id="{l["id"]}" aria-labelledby="{l["id"]}-title"><h2 id="{l["id"]}-title">{e(l["title"])}</h2><p>{e(l["summary"])}</p><h3>You will learn to</h3><ul>')
    parts.extend('<li>'+e(x)+'</li>' for x in l['learningGoals']);parts.append('</ul><h3>Learn</h3>')
    parts.extend('<p>'+e(x)+'</p>' for x in l['explain'])
    parts.extend(['<h3>Worked example</h3><p>'+e(l['example'])+'</p>','<pre><code>'+e(l['workedCode'])+'</code></pre>','<p>SQL snippets illustrate the lesson; complete executable statements are in the queries folder.</p><h3>Practice safely</h3><ol>'])
    parts.extend('<li>'+e(x)+'</li>' for x in l['lab']);parts.append('</ol><h3>Three original checks</h3>')
    for i,c in enumerate([l]+l['additionalChecks'],1):
        parts.append('<p><strong>Check '+str(i)+': '+e(c['question'])+'</strong></p><ol type="A">')
        parts.extend('<li>'+e(x)+'</li>' for x in c['options']);parts.append('</ol><details><summary>Show answer and reasoning</summary><p>'+chr(65+c['answer'])+'. '+e(c['options'][c['answer']])+' '+e(c['why'])+'</p></details>')
    parts.append('<h3>Evidence to keep</h3><ul>');parts.extend('<li>'+e(x)+'</li>' for x in l['evidence']);parts.append('</ul><h3>Limits</h3><p>'+e(l['limitations'])+'</p><h3>Official references</h3><ul>')
    parts.extend('<li><a href="'+e(u)+'">'+e(u)+'</a></li>' for u in l['sources']);parts.append('</ul><p class="top"><a href="#top">Back to contents</a></p></section>')
for name,ident,title in [('labs/data-workshop/README.md','lab-guide','Local lab guide'),('labs/data-workshop/CONTRACTS.md','contracts','Data dictionary and contracts'),('labs/data-workshop/WORKSHEET.md','worksheet','Evidence worksheet'),('labs/data-workshop/ANSWER-KEY.md','answers','Prediction key'),('docs/DATA-COVERAGE.md','coverage','Coverage and limits')]:parts.append(markdown_section(R/name,ident,title))
parts.append('</main><footer><p>Original instructional material · 2026-11-07. No external fonts, scripts, analytics or network dependencies.</p><p><a href="#top">Back to contents</a></p></footer></body></html>')
(R/'START-HERE.html').write_text('\n'.join(parts),encoding='utf-8')
print('Rendered self-contained, script-free START-HERE.html.')
