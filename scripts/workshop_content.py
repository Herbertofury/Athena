"""Compose preserved workshop sources without modifying the original packs."""
from copy import deepcopy
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KEYS = ('security', 'systems', 'programming', 'cloud', 'data')
LESSONS, PATHS, SOURCES = [], [], {}
for key in KEYS:
    folder = ROOT / 'workshops' / key
    spec = importlib.util.spec_from_file_location(
        'athena_workshop_' + key, folder / 'scripts' / (key + '_content.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    path = deepcopy(module.PATH)
    path.update(kind='workshop', packKey=key,
                downloadUrl='workshops/' + key + '/learner-pack.zip')
    source_file = next((folder / 'research').glob('*sources.json'))
    register = json.loads(source_file.read_text())
    path['sourceReview'] = register.get('reviewedAt', '2026-11-07')
    path['sourceRegister'] = register['sources']
    path['estimatedMinutes'] = sum(x['estimatedMinutes'] for x in module.LESSONS)
    PATHS.append(path)
    for original in module.LESSONS:
        item = deepcopy(original)
        item['workshopId'] = path['id']
        if item.get('workedCode') and not item.get('codeLanguage'):
            item['codeLanguage'] = 'python'
        LESSONS.append(item)
    for source in register['sources']:
        SOURCES.setdefault(source['url'], deepcopy(source))


def lesson_markdown(item):
    """Use the same complete fields in docs, wiki and the app."""
    blocks = ['# ' + item['title'], item['summary'], '## Learning goals',
              '\n'.join('- ' + x for x in item['learningGoals']), '## Learn',
              '\n\n'.join(item['explain']), '## Worked example', item['example']]
    if item.get('workedCode'):
        blocks += ['```' + item['codeLanguage'] + '\n' + item['workedCode'] + '\n```']
    blocks += ['## Practice safely', '\n'.join(f'{i}. {x}' for i, x in enumerate(item['lab'], 1)),
               '## Evidence to keep', '\n'.join('- ' + x for x in item['evidence'])]
    checks = [item] + item['additionalChecks']
    for i, check in enumerate(checks, 1):
        blocks += [f'## Original check {i}', check['question'],
                   '\n'.join('- ' + x for x in check['options']),
                   '<details><summary>Answer and explanation</summary>\n\n' +
                   check['options'][check['answer']] + '. ' + check['why'] + '\n\n</details>']
    blocks += ['Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.',
               '## Scope and limits', item['limitations'], '## Official references']
    for url in item['sources']:
        source = SOURCES.get(url, {})
        blocks.append('- [' + source.get('title', url) + '](' + url + ')')
    return '\n\n'.join(blocks) + '\n'
