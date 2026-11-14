"""Offline empty-srcset reproduction. Optional real WordPress JSON stays local."""
import argparse
import copy
import hashlib
import html as std_html
import json
from pathlib import Path
import platform
import subprocess
import types
from lxml import etree, html

ROOT = Path(__file__).resolve().parents[2]
EXTRACTOR = 'experiments/site-extraction-lab/extractors.py'


def digest(value):
    if not isinstance(value, (str, bytes)):
        value = json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
    return hashlib.sha256(value.encode() if isinstance(value, str) else value).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ref', help='Existing Git revision; omit for working tree')
    parser.add_argument('--wordpress', type=Path, help='Caller-owned public post JSON; never copied to output')
    parser.add_argument('--output', type=Path, help='New sanitized receipt path; existing files are not overwritten')
    args = parser.parse_args()
    source = subprocess.check_output(['git', 'show', args.ref + ':' + EXTRACTOR], cwd=ROOT) if args.ref else (ROOT / EXTRACTOR).read_bytes()
    module = types.ModuleType('srcset_replay_extractor')
    exec(compile(source, EXTRACTOR, 'exec'), module.__dict__)
    cases = []

    def run(label, payload, expected_text, expected_urls, scope, origin="https://fixture.example/"):
        row = {'case': label, 'scope': scope, 'input_bytes': len(payload), 'input_sha256': digest(payload)}
        try:
            record = module.extract('wordpress', {'post': payload}, origin)
            body = record['body']
            urls = [url for event in body['events'] for url in event.get('srcset', [])]
            row.update(status='extracted', text_preserved=body['text'] == expected_text,
                       projected_urls_match_expected=urls == expected_urls, projected_url_count=len(urls),
                       body_raw_sha256=digest(body['raw']), body_text_sha256=digest(body['text']),
                       events_sha256=digest(body['events']), complete_record_sha256=digest(record),
                       full_support_accepted=record['fullSupportAccepted'])
        except Exception as error:
            row.update(status='failed', error_type=type(error).__name__)
        cases.append(row)

    source_cases = [
        ('trailing comma', '/a.webp 1x, ', ['a.webp']),
        ('leading comma', ', /a.webp 1x', ['a.webp']),
        ('repeated commas', '/a.webp 1x,, /b.webp 2x', ['a.webp', 'b.webp']),
        ('delimiter only', ',', []),
        ('whitespace only', ' \t\n ', []),
        ('whitespace and delimiters', ' , \t,\n, ', []),
        ('healthy control', '/a.webp 1x, /b.webp 2x', ['a.webp', 'b.webp']),
    ]
    for label, attr, names in source_cases:
        body = '<div>SYNTHETIC before<img srcset="' + std_html.escape(attr, quote=True) + '">after</div>'
        payload = json.dumps({'id': 1, 'author': 7, 'content': {'rendered': body, 'protected': False}}).encode()
        run(label, payload, 'SYNTHETIC beforeafter', ['https://fixture.example/' + name for name in names], 'synthetic')

    input_receipt = None
    if args.wordpress:
        raw = args.wordpress.read_bytes()
        data = json.loads(raw)
        body = data['content']['rendered']
        root = html.fragment_fromstring(body, create_parent=True)
        nodes = root.xpath('.//*[@srcset]')
        if not nodes:
            raise ValueError('Real replay input has no srcset attributes')
        origin = data['link']
        # Establish expected references from an unchanged baseline that already succeeds.
        control = module.extract('wordpress', {'post': raw}, origin)
        expected_text = control['body']['text']
        expected_urls = [u for event in control['body']['events'] for u in event.get('srcset', [])]
        input_receipt = {'bytes': len(raw), 'sha256': digest(raw), 'post_id': data['id'],
                         'source_url': origin, 'published_gmt': data.get('date_gmt'),
                         'modified_gmt': data.get('modified_gmt'), 'srcset_attributes': len(nodes),
                         'raw_body_published': False}
        run('unchanged public WordPress post', raw, expected_text, expected_urls, 'actual_public_response_offline_replay', origin)
        for label, mutate in [('trailing separators', lambda s: s + ', '),
                              ('leading separators', lambda s: ', ' + s),
                              ('repeated separators', lambda s: s.replace(',', ',, '))]:
            edited = copy.deepcopy(root)
            for node in edited.xpath('.//*[@srcset]'):
                node.set('srcset', mutate(node.get('srcset')))
            altered = copy.deepcopy(data)
            altered['content']['rendered'] = std_html.escape(edited.text or '', quote=False) + ''.join(html.tostring(child, encoding='unicode') for child in edited)
            payload = json.dumps(altered, ensure_ascii=False).encode()
            run('public body with synthetic ' + label, payload, expected_text, expected_urls,
                'synthetically_mutated_public_response_not_observed_live', origin)
        if args.wordpress.read_bytes() != raw:
            raise AssertionError('Source fixture changed')
    receipt = {'kind': 'offline-srcset-empty-candidate-reproduction',
               'source_revision': args.ref or 'working-tree', 'extractor_sha256': digest(source),
               'python': platform.python_version(), 'lxml': '.'.join(map(str, etree.LXML_VERSION)),
               'network_used_by_replay': False, 'native_browser': False,
               'real_input': input_receipt, 'cases': cases}
    text = json.dumps(receipt, indent=2, ensure_ascii=False) + '\n'
    if args.output:
        with args.output.open('x') as output:
            output.write(text)
    print(text)


if __name__ == '__main__':
    main()
