"""Offline WordPress REST page reconciliation, not an HTTP client or renderer.

Captures are caller-supplied {requestUrl, status, headers, body: bytes} mappings.
Raw posts stay in memory. Public receipts omit prose, headers and query values.
"""
from __future__ import annotations

import argparse
import copy
import json
import math
import re
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit, urlunsplit

from extractors import ExtractionError, extract, json_loads, public_url, receipt, sha256

MAX_CAPTURES = 256
MAX_BODY_BYTES = 8_000_000
MAX_TOTAL_BYTES = 32_000_000
MAX_NODES = 200_000
MAX_DEPTH = 64
MAX_TOTAL = 1_000_000_000
QUERY_KEYS = frozenset(('page', 'per_page', 'context', 'order', 'orderby',
                        '_embed', '_fields', 'include', 'exclude', 'author',
                        'author_exclude', 'after', 'before', 'modified_after',
                        'modified_before', 'search', 'slug', 'categories',
                        'categories_exclude', 'tags', 'tags_exclude', 'sticky'))


def bounded_json(raw):
    if not isinstance(raw, bytes) or len(raw) > MAX_BODY_BYTES:
        raise ExtractionError('Input byte limit or type')
    try:
        value = json_loads(raw)
    except (ValueError, UnicodeError, RecursionError) as exc:
        raise ExtractionError('Invalid JSON') from exc
    pending = [(value, 0)]
    nodes = 0
    while pending:
        item, depth = pending.pop()
        nodes += 1
        if nodes > MAX_NODES or depth > MAX_DEPTH:
            raise ExtractionError('Input structural limit')
        if isinstance(item, str):
            try:
                item.encode('utf-8')
            except UnicodeError as exc:
                raise ExtractionError('Unpaired Unicode surrogate') from exc
        if isinstance(item, float) and not math.isfinite(item):
            raise ExtractionError('Nonfinite number')
        if isinstance(item, (dict, list)):
            pending.extend((child, depth + 1) for child in
                           (list(item.keys()) + list(item.values()) if isinstance(item, dict) else item))
    return value


def integer(value, minimum=0, maximum=MAX_TOTAL):
    if type(value) is not int or not minimum <= value <= maximum:
        raise ExtractionError('Invalid integer')
    return value


def request_identity(url):
    if not isinstance(url, str) or len(url) > 8192 or url != url.strip():
        raise ExtractionError('Invalid request URL')
    if any(ord(c) < 33 or ord(c) == 127 for c in url) or '\\' in url:
        raise ExtractionError('Invalid request URL')
    try:
        parsed = urlsplit(url)
        if (parsed.scheme != 'https' or not parsed.hostname or parsed.username
                or parsed.password or parsed.fragment or parsed.port not in (None, 443)
                or not re.fullmatch(r'(?:/[A-Za-z0-9_-]+)*/wp-json/wp/v2/posts', parsed.path)):
            raise ExtractionError('Unsupported public posts endpoint')
        pairs = parse_qsl(parsed.query, keep_blank_values=True, strict_parsing=True,
                          max_num_fields=40)
    except ValueError as exc:
        raise ExtractionError('Invalid request URL') from exc
    args = dict(pairs)
    if len(args) != len(pairs) or set(args) - QUERY_KEYS:
        raise ExtractionError('Duplicate or unsupported query parameter')
    if args.get('context', 'view') != 'view':
        raise ExtractionError('Only view context is supported')
    for key, default, maximum in [('page', '1', MAX_TOTAL), ('per_page', '10', 100)]:
        text = args.get(key, default)
        if not re.fullmatch(r'[1-9][0-9]{0,9}', text):
            raise ExtractionError('Invalid pagination parameter')
        args[key] = str(integer(int(text), 1, maximum))
    endpoint = urlunsplit(('https', parsed.hostname.lower(), parsed.path, '', ''))
    page = int(args.pop('page'))
    scope = json.dumps([endpoint, sorted(args.items())], separators=(',', ':'))
    return endpoint, page, int(args['per_page']), sha256(scope)


def totals(headers):
    if not isinstance(headers, dict):
        raise ExtractionError('Invalid headers')
    normalized = {}
    for key, value in headers.items():
        if not isinstance(key, str) or not isinstance(value, str):
            raise ExtractionError('Invalid header type')
        key = key.lower()
        if key in normalized:
            raise ExtractionError('Ambiguous header')
        normalized[key] = value
    result = []
    for key in ('x-wp-total', 'x-wp-totalpages'):
        text = normalized.get(key)
        if text is None:
            result.append(None)
        elif not re.fullmatch(r'(?:0|[1-9][0-9]{0,9})', text.strip()):
            raise ExtractionError('Invalid total header')
        else:
            result.append(integer(int(text.strip())))
    return tuple(result)


def body_state(post):
    content = post.get('content')
    if not isinstance(content, dict):
        return 'missing' if 'content' not in post else 'null' if content is None else 'invalid'
    if content.get('protected') is True:
        return 'protected'
    if 'rendered' not in content:
        return 'missing'
    value = content['rendered']
    return 'null' if value is None else 'empty' if value == '' else 'rendered' if isinstance(value, str) else 'invalid'


def normalize_post(post, endpoint):
    if not isinstance(post, dict):
        raise ExtractionError('Post must be an object')
    identifier = integer(post.get('id'), 1)
    if post.get('author') is not None:
        integer(post['author'], 1)
    if post.get('featured_media') is not None:
        integer(post['featured_media'])
    content = post.get('content')
    if isinstance(content, dict) and 'protected' in content and type(content['protected']) is not bool:
        raise ExtractionError('Invalid protected flag')
    state = body_state(post)
    if state == 'invalid':
        raise ExtractionError('Invalid content field')
    cleaned = copy.deepcopy(post)
    # The older one-post parser conflates null with empty. Preserve the exact
    # source separately and do not feed null through its empty-string fallback.
    if state in ('null', 'missing'):
        cleaned['content'] = {}
    embedded = cleaned.get('_embedded', {})
    if not isinstance(embedded, dict):
        raise ExtractionError('Invalid embedded relations')
    for relation in ('author', 'wp:featuredmedia'):
        values = embedded.get(relation, [])
        if not isinstance(values, list) or any(not isinstance(v, dict) for v in values):
            raise ExtractionError('Invalid embedded relation')
    media = embedded.get('wp:featuredmedia', [])
    if media and (len(media) != 1 or type(media[0].get('id')) is not int
                  or media[0]['id'] != post.get('featured_media')):
        raise ExtractionError('Featured media identity mismatch')
    # Relative body references use the document URL, never the REST route.
    # Without a usable link they remain unresolved instead of being guessed.
    document_url = public_url(post.get('link')) or ''
    value = extract('wordpress', {'post': json.dumps(cleaned).encode()}, document_url)
    return {'id': identifier, 'bodyState': state, 'sourcePost': copy.deepcopy(post),
            'sourcePostSha256': sha256(json.dumps(post, sort_keys=True, separators=(',', ':'), ensure_ascii=False)),
            'normalized': value}


def reconcile(captures, access='unknown'):
    """Reconcile a bounded set of captured attempts without performing requests.

    Coverage means consistent supplied page/count evidence, never a snapshot,
    complete history, permission, complete media, or successful playback.
    """
    if access not in ('unknown', 'public', 'authorized'):
        raise ExtractionError('Invalid caller access label')
    if not isinstance(captures, list) or not 1 <= len(captures) <= MAX_CAPTURES:
        raise ExtractionError('Capture count limit')
    if any(not isinstance(c, dict) or not isinstance(c.get('body'), bytes) for c in captures):
        raise ExtractionError('Invalid capture')
    if sum(len(c['body']) for c in captures) > MAX_TOTAL_BYTES:
        raise ExtractionError('Aggregate input byte limit')
    attempts, records, successful, seen_posts, declared = [], [], {}, {}, set()
    warnings = set()
    scope_id = endpoint = page_size = None
    for capture in captures:
        origin, page, per_page, scope = request_identity(capture.get('requestUrl'))
        if scope_id is None:
            scope_id, endpoint, page_size = scope, origin, per_page
        elif scope != scope_id:
            raise ExtractionError('Mixed collection scopes')
        if 'finalUrl' in capture and request_identity(capture['finalUrl']) != (origin, page, per_page, scope):
            raise ExtractionError('Redirected capture scope')
        status = integer(capture.get('status'), 100, 599)
        raw = capture['body']
        if len(raw) > MAX_BODY_BYTES:
            raise ExtractionError('Input byte limit')
        attempt = {'page': page, 'status': status, 'inputBytes': len(raw),
                   'inputSha256': sha256(raw), 'recordIds': [], 'errors': []}
        attempts.append(attempt)
        if status != 200:
            attempt['outcome'] = ('access_denied' if status in (401, 403) else
                                  'rate_limited' if status == 429 else
                                  'not_found' if status == 404 else
                                  'not_modified_without_representation' if status == 304 else 'http_failure')
            # Error prose, response headers and retry tokens never enter receipts.
            continue
        try:
            total, total_pages = totals(capture.get('headers', {}))
            attempt['declaredTotal'], attempt['declaredPages'] = total, total_pages
            payload = bounded_json(raw)
            if not isinstance(payload, list) or len(payload) > per_page:
                raise ExtractionError('Invalid posts collection')
            attempt['recordIds'] = [integer(p.get('id'), 1) if isinstance(p, dict)
                                    else integer(None) for p in payload]
            if len(set(attempt['recordIds'])) != len(payload):
                raise ExtractionError('Duplicate post in page')
        except ExtractionError:
            attempt['outcome'] = 'invalid_page'
            attempt['errors'].append('page_validation_failed')
            continue
        attempt['outcome'] = 'parsed'
        if total is None or total_pages is None:
            warnings.add('missing_total_headers')
        else:
            declared.add((total, total_pages))
            expected_pages = (total + per_page - 1) // per_page
            expected_items = max(0, min(per_page, total - (page - 1) * per_page))
            if total_pages != expected_pages or page > max(1, total_pages) or len(payload) != expected_items:
                warnings.add('page_count_contradiction')
        fingerprint = sha256(json.dumps(payload, sort_keys=True, separators=(',', ':'), ensure_ascii=False))
        if page in successful:
            if fingerprint in successful[page]:
                attempt['outcome'] = 'identical_page_replay'
                continue
            warnings.add('conflicting_page_snapshots')
            successful[page].add(fingerprint)
        else:
            successful[page] = {fingerprint}
        for post in payload:
            identifier = post['id']
            source_hash = sha256(json.dumps(post, sort_keys=True, separators=(',', ':'), ensure_ascii=False))
            if identifier in seen_posts:
                previous_page, previous_hash = seen_posts[identifier]
                if previous_page != page:
                    warnings.add('post_repeated_across_pages')
                if previous_hash != source_hash:
                    warnings.add('conflicting_post_snapshots')
            else:
                seen_posts[identifier] = (page, source_hash)
            try:
                record = normalize_post(post, endpoint)
            except (ExtractionError, TypeError, AttributeError, KeyError, ValueError, IndexError, UnicodeError):
                record = {'id': identifier, 'sourcePost': copy.deepcopy(post),
                          'sourcePostSha256': source_hash, 'bodyState': body_state(post),
                          'normalized': None}
                attempt['errors'].append('post_normalization_failed')
                warnings.add('post_normalization_failed')
            record['page'] = page
            records.append(record)
    if len(declared) > 1:
        warnings.add('collection_totals_changed')
    total, total_pages = next(iter(declared)) if len(declared) == 1 else (None, None)
    expected_count = max(1, total_pages) if total_pages is not None else None
    captured_pages = sorted(successful)
    missing_count = (expected_count - sum(1 for p in successful if p <= expected_count)
                     if expected_count is not None else None)
    missing_sample = []
    if expected_count is not None:
        # At most 256 captured pages + 20 missing examples, not a billion-page loop.
        for p in range(1, min(expected_count, len(successful) + 20) + 1):
            if p not in successful:
                missing_sample.append(p)
                if len(missing_sample) == 20:
                    break
    covered = bool(expected_count is not None and missing_count == 0
                   and len(seen_posts) == total and not warnings)
    return {'family': 'wordpress_collection', 'endpoint': endpoint, 'scopeSha256': scope_id,
            'perPage': page_size, 'access': {'callerCaptureContext': access,
                'grantVerifiedByParser': False, 'privateDataApprovedForPublication': False},
            'attempts': attempts, 'records': records, 'coverage': {
                'declaredTotal': total, 'declaredPages': total_pages,
                'capturedPages': captured_pages, 'uniquePostCount': len(seen_posts),
                'missingPageCount': missing_count, 'missingPageSample': missing_sample,
                'missingPageSampleTruncated': missing_count is not None and missing_count > len(missing_sample),
                'capturedScopeCovered': covered, 'snapshotConsistency': 'unproven',
                'completeHistory': False}, 'warnings': sorted(warnings),
            'media': {'discovery': 'source_projection_only', 'completeMediaAccepted': False,
                      'delivery': 'not_attempted', 'decode': 'not_attempted', 'playback': 'not_attempted'},
            'networkRequestsPerformed': 0, 'fullSupportAccepted': False}


def public_receipt(result):
    """Omit raw JSON/prose, headers, query values and local filesystem paths.

    Reference URL hosts/paths remain and require independent publication review."""
    output = {k: copy.deepcopy(result[k]) for k in (
        'family', 'endpoint', 'scopeSha256', 'perPage', 'access', 'attempts',
        'coverage', 'warnings', 'media', 'networkRequestsPerformed', 'fullSupportAccepted')}
    output['records'] = []
    for row in result['records']:
        item = {k: row[k] for k in ('id', 'page', 'bodyState', 'sourcePostSha256')}
        if row['normalized'] is None:
            item['normalization'] = 'failed'
        else:
            scoped = receipt(row['normalized'])
            if scoped['body'] is not None:
                # Attribute text is not necessarily a MIME type or safe prose.
                for media in scoped['body']['media']:
                    media.pop('mimeHint', None)
            item.update({'normalization': 'parsed', 'body': scoped['body'],
                         'authorIds': [p.get('id') for p in scoped['people']],
                         'authorResolved': all(p.get('role') != 'unresolved_post_writer' for p in scoped['people']),
                         'featuredMedia': scoped['gallery'], 'gates': scoped['gates']})
        output['records'].append(item)
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--access', choices=('unknown', 'public', 'authorized'), default='unknown')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    try:
        with args.manifest.open('rb') as handle:
            manifest = bounded_json(handle.read(MAX_BODY_BYTES + 1))
        if not isinstance(manifest, list) or not 1 <= len(manifest) <= MAX_CAPTURES:
            raise ExtractionError('Invalid manifest')
        captures = []
        used_bytes = 0
        for value in manifest:
            if not isinstance(value, dict) or not isinstance(value.get('bodyFile'), str):
                raise ExtractionError('Invalid manifest entry')
            capture = dict(value)
            with (args.manifest.parent / value['bodyFile']).open('rb') as handle:
                capture['body'] = handle.read(min(MAX_BODY_BYTES, MAX_TOTAL_BYTES - used_bytes) + 1)
            used_bytes += len(capture['body'])
            if used_bytes > MAX_TOTAL_BYTES:
                raise ExtractionError('Aggregate input byte limit')
            captures.append(capture)
        result = public_receipt(reconcile(captures, args.access))
    except (OSError, ValueError, TypeError, RecursionError) as exc:
        print(json.dumps({'ok': False, 'errorType': type(exc).__name__}))
        return 1
    encoded = json.dumps(result, indent=2, ensure_ascii=False) + '\n'
    if args.output:
        args.output.write_text(encoded, encoding='utf-8')
    else:
        print(encoded, end='')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
