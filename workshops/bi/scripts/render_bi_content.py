"""Render app-compatible local workshop references. No archive or publication."""
from html import escape
import json
from pathlib import Path
from bi_content import LESSONS, PATH

ROOT = Path(__file__).resolve().parents[1]


def write(relative, text):
    target = ROOT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text.rstrip() + '\n', encoding='utf-8')


def lesson_markdown(lesson):
    blocks = ['# ' + lesson['title'], lesson['summary'],
              '**Study time:** about 45 minutes, including prediction, execution and reflection.',
              '## Learning goals', '\n'.join('- ' + x for x in lesson['learningGoals']),
              '## Learn', '\n\n'.join(lesson['explain']),
              '## Worked example', lesson['example'],
              '```' + lesson['codeLanguage'] + '\n' + lesson['workedCode'] + '\n```',
              'Only fixed Python wrapper commands are runnable instructions. Commented M/DAX snippets are illustrative and unexecuted. This pack does not run Power BI or implement its engines.',
              '## Practice safely', '\n'.join(f'{i}. {x}' for i, x in enumerate(lesson['lab'], 1)),
              '## Evidence to keep', '\n'.join('- ' + x for x in lesson['evidence'])]
    for index, check in enumerate([lesson] + lesson['additionalChecks'], 1):
        blocks += [f'## Original check {index}', check['question'],
                   '\n'.join(f'{chr(65+i)}. {choice}' for i, choice in enumerate(check['options'])),
                   '<details><summary>Answer and reasoning</summary>\n\n' +
                   chr(65 + check['answer']) + '. ' + check['options'][check['answer']] + '\n\n' + check['why'] + '\n\n</details>']
    blocks += ['Supplemental checks are practice, not additional XP or a separate spaced-review schedule.',
               '## Limits', lesson['limitations'], '## Official references',
               '\n'.join('- ' + url for url in lesson['sources'])]
    return '\n\n'.join(blocks)


def study_html():
    chunks = ['<!doctype html><html lang="en"><meta charset="utf-8">',
              '<meta name="viewport" content="width=device-width, initial-scale=1">',
              '<title>Power BI Concepts Workshop</title>',
              '<style>body{font:18px/1.6 system-ui,sans-serif;max-width:78ch;margin:2rem auto;padding:0 1rem;color:#17212b;background:#fff}a{color:#174a8b}h1,h2,h3{line-height:1.2}section{margin:3rem 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#edf2f6;padding:1rem}summary{cursor:pointer}li{margin:.5rem 0}:focus-visible{outline:3px solid #a44400;outline-offset:3px}</style>',
              '<main><h1>' + escape(PATH['title']) + '</h1><p>' + escape(PATH['summary']) + '</p>',
              '<p><strong>Local only.</strong> Every runnable exercise computes a fixed synthetic teaching model in memory. No Power BI, M, DAX, network, account, credentials, gateway or deployment is used. A row-filter function is not an authorization boundary. This is an additive study reference. Registration in Athena’s main catalog and built-in exercise downloads remains pending.</p>',
              '<p>The tested environment and exact checks are recorded in the lab guide. No Python output is Power BI execution evidence. If unavailable, use paper predictions and label them unexecuted.</p>',
              '<p><a href="labs/bi-workshop/README.md">Lab guide</a> · <a href="labs/bi-workshop/WORKSHEET.md">Worksheet</a> · <a href="labs/bi-workshop/ANSWER-KEY.md">Answer key</a> · <a href="docs/BI-COVERAGE.md">Coverage and limits</a></p>',
              '<nav aria-label="Workshop lessons"><ol>']
    chunks += ['<li><a href="#' + x['id'] + '">' + escape(x['title']) + '</a></li>' for x in LESSONS]
    chunks.append('</ol></nav>')
    for lesson in LESSONS:
        chunks += ['<section id="' + lesson['id'] + '"><h2>' + escape(lesson['title']) + '</h2>',
                   '<p>' + escape(lesson['summary']) + '</p><h3>Learning goals</h3><ul>']
        chunks += ['<li>' + escape(x) + '</li>' for x in lesson['learningGoals']]
        chunks.append('</ul>')
        chunks += ['<p>' + escape(x) + '</p>' for x in lesson['explain']]
        chunks += ['<h3>Worked example</h3><p>' + escape(lesson['example']) + '</p>',
                   '<pre><code>' + escape(lesson['workedCode']) + '</code></pre>', '<h3>Practice safely</h3><ol>']
        chunks += ['<li>' + escape(x) + '</li>' for x in lesson['lab']]
        chunks.append('</ol><h3>Evidence to keep</h3><ul>')
        chunks += ['<li>' + escape(x) + '</li>' for x in lesson['evidence']]
        chunks.append('</ul><h3>Three original checks</h3>')
        for check in [lesson] + lesson['additionalChecks']:
            chunks += ['<p><strong>' + escape(check['question']) + '</strong></p><ol type="A">']
            chunks += ['<li>' + escape(x) + '</li>' for x in check['options']]
            chunks += ['</ol><details><summary>Answer and reasoning</summary><p>' +
                       escape(chr(65 + check['answer']) + '. ' + check['options'][check['answer']] + ' ' + check['why']) + '</p></details>']
        chunks += ['<h3>Limits</h3><p>' + escape(lesson['limitations']) + '</p><h3>Official references</h3><ul>']
        chunks += ['<li><a href="' + escape(url, quote=True) + '">' + escape(url) + '</a></li>' for url in lesson['sources']]
        chunks.append('</ul></section>')
    chunks.append('</main></html>')
    return '\n'.join(chunks)


def build():
    write('content/bi-lessons.json', json.dumps(LESSONS, indent=2, ensure_ascii=False))
    write('content/bi-path.json', json.dumps(PATH, indent=2, ensure_ascii=False))
    checks = []
    for lesson in LESSONS:
        write('docs/shared/' + lesson['id'] + '.md', lesson_markdown(lesson))
        for number, check in enumerate([lesson] + lesson['additionalChecks'], 1):
            checks.append(dict(id=lesson['id'] + '-' + str(number), lessonId=lesson['id'],
                               **{key: check[key] for key in ('question', 'options', 'answer', 'why')}))
    write('content/bi-checks.json', json.dumps(checks, indent=2, ensure_ascii=False))
    write('docs/paths/bi-workshop.md', '# ' + PATH['title'] + '\n\n' + PATH['summary'] +
          '\n\n## Start safely\n\nRead the [lab guide](../../labs/bi-workshop/README.md), then predict before executing. Use only the supplied fixed wrapper commands. The commands compute synthetic cases in memory. No vendor platform, network or user data is used.\n\n## Lessons\n\n' +
          '\n'.join(f'{i}. [{lesson["title"]}](../shared/{lesson["id"]}.md)' for i, lesson in enumerate(LESSONS, 1)) +
          '\n\n## Evidence\n\nComplete the [worksheet](../../labs/bi-workshop/WORKSHEET.md), compare the [answer key](../../labs/bi-workshop/ANSWER-KEY.md), and retain the exact local run outcomes. Paper predictions are a supported alternative, but are not executed evidence.\n\n## Limits\n\n' + PATH['limits'])
    write('START-HERE.html', study_html())
    print(f'Rendered {len(LESSONS)} lessons and {len(checks)} original checks; no archive or publication.')


if __name__ == '__main__':
    build()
