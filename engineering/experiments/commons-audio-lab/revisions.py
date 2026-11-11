"""Offline Commons Imageinfo revision-chain reconciliation.

No HTTP, media fetching, rendering, authorization or license inference. The raw
captures and uploader names stay in memory; public_receipt is an explicit small
projection, not a download manifest. Its hashes/IDs still need publication review.
"""
from __future__ import annotations

import copy
import datetime
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import stat
from urllib.parse import parse_qsl, unquote, urlsplit, urlunsplit

_spec = importlib.util.spec_from_file_location('commons_revision_wire', Path(__file__).resolve().parents[1] / 'upstream-validation-lab/receipt_gate.py')
_wire = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_wire)
MAX_BODY = 1_048_576
MAX_TOTAL = 8_388_608
MAX_CAPTURES = 64
PROPS = frozenset(('timestamp', 'user', 'url', 'size', 'sha1', 'mime', 'mediatype'))
BASE_KEYS = frozenset(('action', 'format', 'formatversion', 'prop', 'titles', 'iiprop', 'iilimit', 'maxlag', 'iiend', 'iistart'))
TOKEN_KEYS = frozenset(('continue', 'iistart', 'iicontinue'))


class RevisionError(ValueError):
    """Short static error code, never an input URL, prose or credential."""


def require(condition, code):
    if not condition:
        raise RevisionError(code)


def digest(value):
    if not isinstance(value, bytes):
        value = json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    return hashlib.sha256(value).hexdigest()


def text(value, limit=1024):
    require(isinstance(value, str) and 0 < len(value) <= limit and not any(ord(c) < 32 or ord(c) == 127 for c in value), 'invalid_text')
    try:
        value.encode('utf-8')
    except UnicodeError as exc:
        raise RevisionError('invalid_unicode') from exc
    return value


def timestamp(value):
    require(isinstance(value, str) and re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z', value), 'invalid_timestamp')
    try:
        datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError as exc:
        raise RevisionError('invalid_timestamp') from exc
    return value


def uint(value, maximum=2**63-1):
    require(type(value) is int and 0 <= value <= maximum, 'invalid_integer')
    return value


def request_args(url):
    text(url, 8192)
    require(not any(ord(c) < 33 for c in url) and '\\' not in url, 'invalid_request_url')
    try:
        p = urlsplit(url)
        require(p.scheme == 'https' and p.netloc == 'commons.wikimedia.org' and p.path == '/w/api.php' and not p.fragment, 'unsupported_endpoint')
        pairs = parse_qsl(p.query, keep_blank_values=True, strict_parsing=True, max_num_fields=20, errors='strict')
    except (ValueError, UnicodeError) as exc:
        raise RevisionError('invalid_request_url') from exc
    args = dict(pairs)
    require(len(args) == len(pairs) and not set(args) - (BASE_KEYS | TOKEN_KEYS), 'unsupported_request_parameter')
    for value in args.values():
        text(value, 2048)
    return args


def validate_base(args):
    require(not set(args) - BASE_KEYS, 'initial_continuation_not_supported')
    require(all(args.get(k) == v for k, v in {'action':'query', 'format':'json', 'formatversion':'2', 'prop':'imageinfo'}.items()), 'unsupported_query')
    title = text(args.get('titles'), 255)
    require(title.startswith('File:') and len(title) > 5 and not any(c in title for c in '|#[]{}<>_'), 'canonical_file_title_required')
    require(title[5:] not in ('.', '..') and '/' not in title and '\\' not in title and title[5:] == title[5:].strip(), 'canonical_file_title_required')
    require(args.get('iiprop') is not None and set(args['iiprop'].split('|')) == PROPS and len(args['iiprop'].split('|')) == len(PROPS), 'unsupported_properties')
    require(re.fullmatch(r'[1-9][0-9]?', args.get('iilimit', '')) is not None and int(args['iilimit']) <= 50, 'invalid_page_limit')
    require(re.fullmatch(r'[1-9]|10', args.get('maxlag', '')) is not None, 'invalid_maxlag')
    for key in ('iistart', 'iiend'):
        if key in args:
            timestamp(args[key])
    require(not ('iistart' in args and 'iiend' in args) or args['iistart'] >= args['iiend'], 'reversed_window')


def bounded_json(raw):
    require(isinstance(raw, bytes) and len(raw) <= MAX_BODY, 'body_limit')
    try:
        result = _wire.decode_receipt(raw.decode('utf-8'))
        pending, nodes = [(result, 0)], 0
        while pending:
            value, depth = pending.pop(); nodes += 1
            require(depth <= 64 and nodes <= 50_000, 'structure_limit')
            if isinstance(value, str):
                value.encode('utf-8')
            if isinstance(value, (dict, list)):
                pending.extend((x, depth+1) for x in (list(value.keys()) + list(value.values()) if isinstance(value, dict) else value))
        return result
    except RevisionError:
        raise
    except (ValueError, UnicodeError, RecursionError) as exc:
        raise RevisionError('invalid_json') from exc


def media_url(value, title, description=False):
    text(value, 8192)
    require(not any(ord(c) < 33 for c in value) and '\\' not in value, 'invalid_media_url')
    try:
        p = urlsplit(value)
        require(p.scheme == 'https' and not p.fragment and p.netloc == ('commons.wikimedia.org' if description else 'upload.wikimedia.org'), 'invalid_media_origin')
        path = unquote(p.path, errors='strict')
        require(not any(ord(c) < 32 or ord(c) == 127 for c in path) and '\\' not in path, 'invalid_media_path')
        if description:
            require(not p.query and path.replace('_', ' ') == '/wiki/' + title, 'description_identity_mismatch')
        else:
            match = re.fullmatch(r'/wikipedia/commons/(?:archive/)?[0-9a-f]/[0-9a-f]{2}/([^/]+)', path)
            require(match is not None, 'invalid_media_path')
            name = match[1]
            if '/archive/' in path:
                require(re.match(r'^[0-9]{14}!', name) is not None, 'invalid_archive_name')
                name = name[15:]
            require(name.replace('_', ' ') == title[5:], 'file_identity_mismatch')
            pairs = parse_qsl(p.query, keep_blank_values=True, strict_parsing=True, max_num_fields=5, errors='strict')
            require(len(dict(pairs)) == len(pairs) and all(k in ('utm_source', 'utm_campaign', 'utm_content') for k, _ in pairs), 'unsupported_media_query')
        return urlunsplit(p._replace(query=''))
    except (ValueError, UnicodeError) as exc:
        if isinstance(exc, RevisionError):
            raise
        raise RevisionError('invalid_media_url') from exc


def revision(info, pageid, title):
    require(isinstance(info, dict), 'invalid_revision')
    uploaded = timestamp(info.get('timestamp'))
    for key in ('filehidden', 'userhidden', 'commenthidden'):
        if key in info:
            require(info[key] is True, 'invalid_hidden_flag')
    hidden = info.get('filehidden') is True
    if 'user' in info and info.get('userhidden') is not True:
        require(isinstance(info['user'], str), 'invalid_uploader')
    actor = 'hidden' if info.get('userhidden') is True else 'present' if isinstance(info.get('user'), str) and info['user'] else 'missing'
    row = {'pageId':str(pageid), 'uploadedAt':uploaded, 'revisionKey':digest([str(pageid), uploaded]),
           'uploaderState':actor, 'uploader':text(info['user']) if actor == 'present' else None,
           'fileState':'hidden' if hidden else 'present', 'url':None, 'descriptionUrl':None,
           'bytes':None, 'sha1':None, 'mime':None, 'mediaType':None,
           'creator':'unknown', 'license':'unknown', 'raw':copy.deepcopy(info), 'sourceSha256':digest(info)}
    if not hidden:
        for key, dest in [('size','bytes'), ('sha1','sha1'), ('mime','mime'), ('mediatype','mediaType')]:
            if key not in info:
                continue
            value = info[key]
            if key == 'size': value = uint(value)
            elif key == 'sha1': require(isinstance(value, str) and re.fullmatch('[0-9a-f]{40}', value), 'invalid_sha1')
            elif key == 'mime': require(isinstance(value, str) and re.fullmatch('[a-z0-9.+-]+/[a-z0-9.+-]+', value), 'invalid_mime')
            else: require(value in ('UNKNOWN', 'BITMAP', 'DRAWING', 'AUDIO', 'VIDEO', 'MULTIMEDIA', 'OFFICE', 'TEXT', 'EXECUTABLE', 'ARCHIVE', '3D'), 'invalid_media_type')
            row[dest] = value
        for key, dest, desc in [('url','url',False), ('descriptionurl','descriptionUrl',True)]:
            if key in info:
                row[dest] = media_url(info[key], title, desc)
        if any(row[k] is None for k in ('url', 'descriptionUrl', 'bytes', 'sha1', 'mime', 'mediaType')):
            row['fileState'] = 'partial'
    row['metadataComplete'] = actor == 'present' and row['fileState'] == 'present'
    return row


def next_request(payload, base):
    if 'continue' not in payload:
        require(payload.get('batchcomplete') is True, 'missing_terminal_marker')
        return None
    token = payload['continue']
    require(isinstance(token, dict) and 'continue' in token and bool(set(token) & {'iistart', 'iicontinue'}) and not set(token) - TOKEN_KEYS, 'invalid_continuation')
    for value in token.values():
        text(value)
    if 'iistart' in token:
        timestamp(token['iistart'])
    return {**base, **token}


def reconcile(initial_url, captures, access='unknown'):
    """Follow an exact supplied request chain; never send its continuation token.

    All attempts and source bodies survive, including malformed/denied attempts.
    Arbitrary caller metadata/headers are excluded from the returned raw capture
    projection; preserve the external capture files for that evidence.
    Contradictory successful variants are retained and block scope exhaustion.
    Initial/scope misuse rejects the call; per-response failures stay in results.
    """
    require(access in ('unknown', 'public', 'authorized'), 'invalid_access_label')
    base = request_args(initial_url); validate_base(base)
    require(isinstance(captures, list) and 0 < len(captures) <= MAX_CAPTURES, 'capture_limit')
    require(all(isinstance(c, dict) and isinstance(c.get('body'), bytes) for c in captures), 'invalid_capture')
    require(sum(len(c['body']) for c in captures) <= MAX_TOTAL, 'aggregate_limit')
    attempts, rows, variants, row_variants = [], [], {}, set()
    warnings, page_ids = set(), set()
    for capture in captures:
        raw = capture['body']
        require(len(raw) <= MAX_BODY, 'body_limit')
        status = uint(capture.get('status'), 599); require(status >= 100, 'invalid_status')
        attempt = {'status':status, 'inputBytes':len(raw), 'inputSha256':digest(raw), 'outcome':'invalid', 'errors':[], 'revisionKeys':[]}
        attempts.append(attempt)
        try:
            args = request_args(capture.get('requestUrl'))
            require(all(args.get(k) == v for k, v in base.items() if k != 'iistart') and not set(args) - (set(base) | TOKEN_KEYS), 'mixed_scope')
            if 'finalUrl' in capture:
                require(request_args(capture['finalUrl']) == args, 'redirected_scope')
            request_key = digest(args); attempt['requestSha256'] = request_key
            if status != 200:
                attempt['outcome'] = {401:'access_denied',403:'access_denied',429:'rate_limited',404:'not_found',304:'not_modified_without_representation'}.get(status, 'http_failure')
                continue
            payload = bounded_json(raw)
            require(isinstance(payload, dict), 'invalid_envelope')
            if 'error' in payload:
                error = payload['error']; code = error.get('code') if isinstance(error, dict) else None
                attempt['outcome'] = 'rate_limited' if code in ('maxlag', 'ratelimited') else 'access_denied' if code in ('readapidenied', 'permissiondenied') else 'api_error'
                continue
            require('query-continue' not in payload, 'legacy_continuation')
            query = payload.get('query')
            require(isinstance(query, dict) and not any(k in query for k in ('normalized', 'redirects', 'interwiki')), 'unsupported_title_mapping')
            pages = query.get('pages')
            require(isinstance(pages, list) and len(pages) == 1 and isinstance(pages[0], dict), 'invalid_pages')
            page = pages[0]
            require(type(page.get('ns')) is int and page['ns'] == 6 and page.get('title') == base['titles'], 'page_identity_mismatch')
            if 'missing' in page or 'invalid' in page or page.get('imagerepository') != 'local':
                attempt['outcome'] = 'file_unavailable'; continue
            pageid = uint(page.get('pageid')); require(pageid > 0, 'invalid_page_id')
            infos = page.get('imageinfo')
            require(isinstance(infos, list) and len(infos) <= int(base['iilimit']), 'invalid_revision_list')
            batch = [revision(info, pageid, base['titles']) for info in infos]
            dates = [row['uploadedAt'] for row in batch]
            require(dates == sorted(dates, reverse=True) and len(set(dates)) == len(dates), 'revision_order_or_duplicate')
            require(not dates or ('iistart' not in args or dates[0] <= timestamp(args['iistart'])), 'outside_start')
            require(not dates or ('iistart' not in base or dates[0] <= base['iistart']), 'outside_initial_start')
            require(not dates or ('iiend' not in base or dates[-1] >= base['iiend']), 'outside_end')
            following = next_request(payload, base)
            # Store valid rows even when the API reports a warning or chain later
            # proves incomplete. A conflicting raw revision never overwrites one.
            page_ids.add(pageid)
            for row in batch:
                attempt['revisionKeys'].append(row['revisionKey'])
                identity = (row['revisionKey'], row['sourceSha256'])
                if identity not in row_variants:
                    rows.append(row); row_variants.add(identity)
            attempt['outcome'] = 'warning_partial' if 'warnings' in payload else 'success'
            attempt['continuationPresent'] = following is not None
            variant = {'bodySha256':digest(raw), 'next':digest(following) if following is not None else None,
                       'warning':'warnings' in payload, 'dates':dates, 'keys':attempt['revisionKeys']}
            variants.setdefault(request_key, {})[digest(payload)] = variant
        except RevisionError as exc:
            attempt['errors'].append(str(exc))
    if len(page_ids) > 1:
        warnings.add('page_identity_changed')
    by_revision = {}
    for row in rows:
        by_revision.setdefault(row['revisionKey'], set()).add(row['sourceSha256'])
    if any(len(v) > 1 for v in by_revision.values()):
        warnings.add('revision_variant_conflict')
    key, seen, ordered, previous_date, exhausted = digest(base), set(), [], None, False
    while key is not None:
        if key in seen:
            warnings.add('continuation_cycle'); break
        seen.add(key)
        choices = variants.get(key, {})
        if not choices:
            warnings.add('missing_chain_response'); break
        if len(choices) != 1:
            warnings.add('response_variant_conflict'); break
        variant = next(iter(choices.values()))
        if variant['warning']:
            warnings.add('api_warning')
        dates = variant['dates']
        if dates and previous_date is not None and dates[0] >= previous_date:
            warnings.add('overlapping_or_reordered_revisions')
        if dates:
            previous_date = dates[-1]
        ordered.extend(variant['keys'])
        key = variant['next']
        if key is None:
            exhausted = True
    if set(variants) - seen:
        warnings.add('unreachable_response')
    if any(a['outcome'] == 'invalid' for a in attempts):
        warnings.add('invalid_attempt_retained')
    return {'provider':'Wikimedia Commons', 'scopeSha256':digest(base), 'accessLabel':access,
            'attempts':attempts, 'records':rows, 'orderedRevisionKeys':ordered, 'warnings':sorted(warnings),
            'scopeExhausted':exhausted and not warnings, 'snapshotConsistency':'unproven',
            'completeHistory':False, 'fullSupportAccepted':False, 'transfer':'not_attempted',
            'decode':'not_attempted', 'playback':'not_attempted',
            'rawCaptures':[{k:v for k,v in c.items() if k in ('requestUrl','finalUrl','status','body')
                            and isinstance(v, (str, int, bytes))} for c in captures]}


def public_receipt(result):
    """No source URLs/titles, uploader names, tokens, headers or arbitrary prose."""
    keys = ('provider','scopeSha256','accessLabel','attempts','orderedRevisionKeys','warnings',
            'scopeExhausted','snapshotConsistency','completeHistory','fullSupportAccepted',
            'transfer','decode','playback')
    out = {k:copy.deepcopy(result[k]) for k in keys}
    row_keys = ('pageId','uploadedAt','revisionKey','uploaderState','fileState','bytes','sha1',
                'metadataComplete','sourceSha256')
    out['records'] = [{k:row[k] for k in row_keys} for row in result['records']]
    return out


def read_regular(root_fd, name, limit):
    """One sibling regular file. Descriptor checks follow the file-scan lab pattern."""
    text(name, 255)
    require(name not in ('.','..') and '/' not in name and '\\' not in name, 'sibling_file_required')
    expected = os.stat(name, dir_fd=root_fd, follow_symlinks=False)
    require(stat.S_ISREG(expected.st_mode) and expected.st_nlink == 1, 'regular_file_required')
    require(expected.st_size <= limit, 'local_file_limit')
    fd = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_CLOEXEC, dir_fd=root_fd)
    try:
        before = os.fstat(fd)
        require(stat.S_ISREG(before.st_mode) and before.st_nlink == 1 and (before.st_dev,before.st_ino)==(expected.st_dev,expected.st_ino), 'local_file_changed')
        chunks, size = [], 0
        while True:
            chunk = os.read(fd, min(65536, limit + 1 - size))
            if not chunk:
                break
            chunks.append(chunk); size += len(chunk)
            require(size <= limit, 'local_file_limit')
        after = os.fstat(fd)
        stamp = lambda s:(s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns,s.st_ctime_ns,s.st_nlink)
        require(stamp(before)==stamp(after) and size==before.st_size, 'local_file_changed')
        return b''.join(chunks)
    finally:
        os.close(fd)


def replay_manifest(path):
    """POSIX-only CLI file gate. Body files must be regular manifest siblings."""
    require(all(hasattr(os,k) for k in ('O_DIRECTORY','O_NOFOLLOW','O_NONBLOCK','O_CLOEXEC')) and os.open in os.supports_dir_fd and os.stat in os.supports_dir_fd, 'unsupported_local_file_gate')
    path = Path(path)
    root_fd = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC)
    try:
        manifest = bounded_json(read_regular(root_fd, path.name, 262144))
        require(isinstance(manifest, dict) and set(manifest) <= {'initialUrl','access','captures'}, 'invalid_manifest')
        base = request_args(manifest.get('initialUrl')); validate_base(base)
        items = manifest.get('captures')
        require(isinstance(items, list) and 0 < len(items) <= MAX_CAPTURES, 'capture_limit')
        captures, total = [], 0
        for item in items:
            require(isinstance(item, dict) and set(item) <= {'requestUrl','finalUrl','status','bodyFile'}, 'invalid_manifest_capture')
            body = read_regular(root_fd, item.get('bodyFile'), MAX_BODY)
            total += len(body); require(total <= MAX_TOTAL, 'aggregate_limit')
            captures.append({k:v for k,v in item.items() if k != 'bodyFile'} | {'body':body})
        return public_receipt(reconcile(manifest['initialUrl'], captures, manifest.get('access','unknown')))
    finally:
        os.close(root_fd)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    try:
        result = replay_manifest(args.manifest)
        Path(args.output).write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    except (RevisionError, OSError) as error:
        print(json.dumps({'outcome':'rejected','error':str(error) if isinstance(error, RevisionError) else 'local_io_error'}))
        raise SystemExit(2)
