"""Offline, sanitized srcset token-boundary reproduction; no URLs in results."""
import argparse
import hashlib
import json
from pathlib import Path
import platform
import subprocess
import types
from lxml import etree, html

ROOT = Path(__file__).resolve().parents[2]
SOURCE = 'experiments/site-extraction-lab/extractors.py'
ORIGIN = 'https://fixture.example/'
MARKER = 'SYNTHETIC_TAIL'
CASES = [
    ('comma in path', '/one,two.webp 1x, /safe.webp 2x', ['one,two.webp', 'safe.webp']),
    ('comma in query', '/a.webp?token=SYNTHETIC_HEAD,SYNTHETIC_TAIL 1x, /safe.webp 2x', ['a.webp', 'safe.webp']),
    ('comma in fragment', '/a.webp#SYNTHETIC_HEAD,SYNTHETIC_TAIL 1x', ['a.webp']),
    ('comma in rejected userinfo', 'https://synthetic_user:SYNTHETIC_HEAD,SYNTHETIC_TAIL@outside.example/a.webp 1x, /safe.webp 2x', ['safe.webp']),
    ('no-whitespace comma is URL data', '/a.webp,/b.webp', ['a.webp,/b.webp']),
    ('whitespace-separated URLs', '/a.webp, /b.webp', ['a.webp', 'b.webp']),
    ('trailing delimiter run after URL comma', '/one,two.webp,,, /safe.webp 1x', ['one,two.webp', 'safe.webp']),
    ('comma inside opaque descriptor parentheses', '/a.webp (SYNTHETIC_HEAD,SYNTHETIC_TAIL), /safe.webp 1x', ['a.webp', 'safe.webp']),
    ('parenthesis state is not nesting depth', '/a.webp ((x,SYNTHETIC_TAIL) , /safe.webp', ['a.webp', 'safe.webp']),
    ('unterminated descriptor parentheses', '/a.webp (SYNTHETIC_HEAD,SYNTHETIC_TAIL', ['a.webp']),
    ('non-ASCII whitespace remains URL data', '/a.webp?token=SYNTHETIC_HEAD,\u00a0SYNTHETIC_TAIL 1x, /safe.webp', ['a.webp', 'safe.webp']),
    ('descriptor comma without whitespace', '/a.webp 1x,/b.webp 2x', ['a.webp', 'b.webp']),
]


def digest(value):
    if not isinstance(value, (str, bytes)):
        value = json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
    return hashlib.sha256(value.encode() if isinstance(value, str) else value).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ref')
    parser.add_argument('--wordpress', type=Path)
    parser.add_argument('--wpt', type=Path, help='External upstream HTML input; scripts are never executed')
    parser.add_argument('--output', type=Path, help='New sanitized receipt path')
    args = parser.parse_args()
    source = subprocess.check_output(['git', 'show', args.ref + ':' + SOURCE], cwd=ROOT) if args.ref else (ROOT / SOURCE).read_bytes()
    module = types.ModuleType('srcset_tokenization_replay')
    exec(compile(source, SOURCE, 'exec'), module.__dict__)
    rows = []
    for label, value, names in CASES:
        node = html.fromstring('<div>SYNTHETIC before<img>after</div>')
        node.find('img').set('srcset', value)
        original = html.tostring(node, encoding='unicode', with_tail=False)
        body = module.ordered_body(node, ORIGIN)
        urls = [u for event in body['events'] for u in event.get('srcset', [])]
        receipt = module.body_receipt(body)
        rows.append({'case': label, 'input_sha256': digest(original),
                     'projected_url_count': len(urls), 'projection_sha256': digest(urls),
                     'projection_matches_expected': urls == [ORIGIN + name for name in names],
                     'synthetic_marker_in_public_receipt': MARKER in json.dumps(receipt),
                     'selected_html_unchanged': body['raw'] == original,
                     'literal_text_unchanged': body['text'] == 'SYNTHETIC beforeafter'})
    real = None
    if args.wordpress:
        raw = args.wordpress.read_bytes()
        data = json.loads(raw)
        record = module.extract('wordpress', {'post': raw}, data['link'])
        real = {'input_sha256': digest(raw), 'input_bytes': len(raw), 'post_id': data['id'],
                'complete_record_sha256': digest(record), 'body_text_sha256': digest(record['body']['text']),
                'srcset_url_count': sum(len(e.get('srcset', [])) for e in record['body']['events']),
                'full_support_accepted': record['fullSupportAccepted'], 'raw_content_published': False}
        assert args.wordpress.read_bytes() == raw
    wpt = None
    if args.wpt:
        raw = args.wpt.read_bytes()
        root = html.fromstring(raw)
        selected, total, section = [], 0, ''
        for element in root.iter():
            if isinstance(element, etree._Comment):
                section = (element.text or '').strip()
            elif element.tag == 'img' and 'srcset' in element.attrib and 'data-expect' in element.attrib:
                total += 1
                if section == 'splitting loop':
                    selected.append(element)
        wpt = {'input_sha256': digest(raw), 'input_bytes': len(raw), 'upstream_cases_total': total,
               'scope': 'Raw token identity for splitting-loop subset only; not browser currentSrc, URL resolution or descriptor validity',
               'selected_count': len(selected), 'unexamined_cases': total - len(selected)}
        if not hasattr(module, 'srcset_url_tokens'):
            wpt['status'] = 'not_run_baseline_has_no_raw_tokenizer'
        else:
            outcomes = []
            for index, element in enumerate(selected):
                expected = [element.get('data-expect')] if element.get('data-expect') else []
                actual = list(module.srcset_url_tokens(element.get('srcset')))
                outcomes.append({'index': index, 'input_sha256': digest(element.get('srcset')),
                                 'raw_tokens_match': actual == expected})
            wpt.update(status='checked_raw_tokens_only', cases=outcomes,
                       passed=sum(row['raw_tokens_match'] for row in outcomes))
    result = {'kind': 'synthetic-srcset-boundary-and-receipt-regression',
              'source_revision': args.ref or 'working-tree', 'extractor_sha256': digest(source),
              'python': platform.python_version(), 'lxml': '.'.join(map(str, etree.LXML_VERSION)),
              'network_used_by_replay': False, 'native_browser': False,
              'sensitive_urls_published': False, 'cases': rows, 'real_response': real, 'wpt_subset': wpt}
    text = json.dumps(result, indent=2) + '\n'
    if args.output:
        with args.output.open('x') as output:
            output.write(text)
    print(text)


if __name__ == '__main__':
    main()
