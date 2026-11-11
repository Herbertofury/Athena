"""Offline, bounded NASA media evidence. No fetching, deletion or rights inference.

normalize(selected_id, observations) accepts an exact list of exact dict envelopes:
role, request_url, final_url, status (integer), complete (bool), body (bytes),
optional failure (string). Unknown envelope extensions are ignored, never copied.
Only receipt() is publishable. Everything else, including source JSON, is private.
Caller allocation and full-body hashing time are outside retention budgets.
"""
from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
from urllib.parse import parse_qsl, unquote, urlsplit

_spec = importlib.util.spec_from_file_location('_nasa_strict_extractors', Path(__file__).resolve().parents[1] / 'site-extraction-lab' / 'extractors.py')
_decoder = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_decoder)

MAX_OBSERVATIONS = 32
MAX_BODY_BYTES = 131072
MAX_BATCH_BYTES = 524288
MAX_STRING_BYTES = 16384
MAX_NODES = 12000
MAX_DEPTH = 24
MAX_ARRAY = 1024
ROLES = ('search', 'asset', 'metadata-location', 'caption-location')
_PATHS = {'asset': 'asset', 'metadata-location': 'metadata', 'caption-location': 'captions'}


def _digest(data):
    return hashlib.sha256(data).hexdigest()


def _url(value):
    if type(value) is not str or not value or len(value) > 4096 or any(ord(c) <= 32 or ord(c) == 127 for c in value):
        return None
    try:
        u = urlsplit(value)
        if u.scheme not in ('https', 'http') or not u.hostname or u.username or u.password or u.port not in (None, 80, 443):
            return None
        return u
    except ValueError:
        return None


def _association(value, role, selected, declared=False):
    u = _url(value)
    if u is None or u.hostname != 'images-api.nasa.gov' or u.netloc not in ('images-api.nasa.gov',) or u.fragment or (not declared and u.scheme != 'https'):
        return False
    if role != 'search':
        return u.path == '/' + _PATHS[role] + '/' + selected and not u.query
    if u.path != '/search':
        return False
    pairs = parse_qsl(u.query, keep_blank_values=True)
    if len({k for k, _ in pairs}) != len(pairs):
        return False
    query = dict(pairs)
    if query.get('nasa_id') != selected or any(k not in ('nasa_id', 'media_type', 'page', 'page_size') for k in query):
        return False
    if 'media_type' in query and query['media_type'] not in ('image', 'audio', 'video'):
        return False
    return all(k not in query or re.fullmatch(r'[1-9][0-9]{0,5}', query[k]) for k in ('page', 'page_size'))


def _same_scope(a, b):
    x, y = _url(a), _url(b)
    return x is not None and y is not None and x.path == y.path and sorted(parse_qsl(x.query, keep_blank_values=True)) == sorted(parse_qsl(y.query, keep_blank_values=True))


def _asset_identity_mismatch(value, selected):
    u = _url(value)
    if u is None or u.hostname != 'images-assets.nasa.gov':
        return False
    parts = [unquote(p) for p in u.path.split('/') if p]
    return len(parts) >= 2 and parts[0] in ('image', 'video', 'audio') and parts[1] != selected


def _reference(value):
    u = _url(value)
    return {'value': value, 'state': 'unsafe' if u is None else ('nasa-reference' if u.hostname in ('images-assets.nasa.gov', 'images-api.nasa.gov') else 'external-reference'), 'fetched': False}


def _decode(body):
    text = body.decode('utf-8', errors='strict')
    # Bound nesting before the decoder allocates recursive structures.
    depth = 0
    quoted = escaped = False
    for c in text:
        if quoted:
            if escaped:
                escaped = False
            elif c == '\\':
                escaped = True
            elif c == '"':
                quoted = False
        elif c == '"':
            quoted = True
        elif c in '[{':
            depth += 1
            if depth > MAX_DEPTH:
                raise ValueError('depth')
        elif c in ']}':
            depth -= 1
    value = _decoder.json_loads(text)
    pending, nodes = [value], 0
    while pending:
        v = pending.pop()
        nodes += 1
        if nodes > MAX_NODES:
            raise ValueError('nodes')
        if type(v) is str:
            if len(v.encode('utf-8', errors='strict')) > MAX_STRING_BYTES:
                raise ValueError('string')
        elif type(v) is list:
            if len(v) > MAX_ARRAY:
                raise ValueError('array')
            pending.extend(v)
        elif type(v) is dict:
            if len(v) > MAX_ARRAY:
                raise ValueError('object')
            pending.extend(v.keys())
            pending.extend(v.values())
        elif type(v) is float and not math.isfinite(v):
            raise ValueError('number')
    return value


def _project(source, role, selected, request):
    out = {'issues': [], 'references': [], 'records': [], 'matched_records': 0, 'mismatched_records': 0, 'duplicate_records': 0}
    issues = out['issues']
    if type(source) is not dict:
        issues.append('root-type')
        return out
    if 'nasa_id' in source and (type(source['nasa_id']) is not str or source['nasa_id'] != selected):
        issues.append('response-identity')
    if role in ('metadata-location', 'caption-location'):
        out['pointer_kind'] = role
        out['contents_observed'] = False
        if 'location' not in source:
            issues.append('location-missing')
        elif type(source['location']) is not str or not source['location']:
            issues.append('location-type-or-empty')
        else:
            out['references'].append(_reference(source['location']))
            if _asset_identity_mismatch(source['location'], selected):
                issues.append('location-identity-mismatch')
        return out
    if 'collection' not in source:
        issues.append('collection-missing')
        return out
    c = source['collection']
    if type(c) is not dict:
        issues.append('collection-type')
        return out
    if 'nasa_id' in c and (type(c['nasa_id']) is not str or c['nasa_id'] != selected):
        issues.append('collection-identity-mismatch')
    if 'href' in c and (not _association(c['href'], role, selected, declared=True) or not _same_scope(c['href'], request)):
        issues.append('collection-href-mismatch')
    if 'version' in c and type(c['version']) is not str:
        issues.append('version-type')
    if 'items' not in c:
        issues.append('items-missing')
        return out
    if type(c['items']) is not list:
        issues.append('items-type')
        return out
    out['items_count'] = len(c['items'])
    if role == 'search':
        out['scope'] = 'selected-query-page'
        requested_media_type = dict(parse_qsl(_url(request).query, keep_blank_values=True)).get('media_type')
        if 'metadata' in c:
            m = c['metadata']
            if type(m) is not dict:
                issues.append('metadata-type')
            elif 'total_hits' in m:
                total = m['total_hits']
                if type(total) is not int or total < 0:
                    issues.append('total-hits-type')
                else:
                    out['query_total_hits'] = total
                    if total < len(c['items']):
                        issues.append('total-hits-below-page-items')
        if 'links' in c:
            if type(c['links']) is not list:
                issues.append('pagination-type')
            else:
                out['pagination'] = c['links']
                for link in c['links']:
                    if type(link) is not dict or type(link.get('href')) is not str or type(link.get('rel')) is not str:
                        issues.append('pagination-link-type')
                    elif link['rel'] == 'next':
                        next_url = _url(link['href'])
                        request_url = _url(request)
                        filters = lambda u: sorted((k, v) for k, v in parse_qsl(u.query, keep_blank_values=True) if k != 'page')
                        if not _association(link['href'], role, selected, declared=True) or filters(next_url) != filters(request_url):
                            issues.append('pagination-scope-mismatch')
    seen = set()
    for item in c['items']:
        if type(item) is not dict:
            issues.append('item-type')
            continue
        if role == 'asset':
            if type(item.get('href')) is not str or not item['href']:
                issues.append('manifest-href-missing-or-type')
            else:
                out['references'].append(dict(_reference(item['href']), role='manifest-entry'))
                if _asset_identity_mismatch(item['href'], selected):
                    issues.append('manifest-identity-mismatch')
            continue
        if 'href' in item:
            ref = _reference(item['href'])
            out['references'].append(dict(ref, role='search-item'))
            u = _url(item['href'])
            if _asset_identity_mismatch(item['href'], selected):
                issues.append('item-href-identity-mismatch')
        data = item.get('data')
        if type(data) is not list:
            issues.append('data-missing-or-type')
        else:
            if not data:
                issues.append('data-empty')
            for record in data:
                if type(record) is not dict:
                    issues.append('record-type')
                    continue
                out['records'].append(record)
                ident = record.get('nasa_id')
                if requested_media_type is not None and 'media_type' in record and record['media_type'] != requested_media_type:
                    issues.append('media-filter-mismatch')
                if type(ident) is str and ident == selected:
                    out['matched_records'] += 1
                else:
                    out['mismatched_records'] += 1
                if type(ident) is str:
                    if ident in seen:
                        out['duplicate_records'] += 1
                    seen.add(ident)
                for key in ('nasa_id', 'title', 'description', 'description_508', 'center', 'photographer', 'secondary_creator', 'media_type', 'date_created'):
                    if key in record and type(record[key]) is not str:
                        issues.append('record-field-type')
                if 'keywords' in record and (type(record['keywords']) is not list or any(type(k) is not str for k in record['keywords'])):
                    issues.append('keywords-type')
        if 'links' in item:
            if type(item['links']) is not list:
                issues.append('links-type')
            else:
                for link in item['links']:
                    if type(link) is not dict or type(link.get('href')) is not str:
                        issues.append('link-type')
                        continue
                    out['references'].append(dict(_reference(link['href']), role='search-link', declared_rel=link.get('rel'), declared_render=link.get('render')))
                    if _asset_identity_mismatch(link['href'], selected):
                        issues.append('link-identity-mismatch')
                    if any(k in link and type(link[k]) is not str for k in ('rel', 'render')):
                        issues.append('link-role-type')
    return out


class Evidence:
    """Private normalized evidence; only the immutable-by-copy receipt is public."""
    def __init__(self, observations, snapshot):
        self.observations = observations
        self._snapshot = copy.deepcopy(snapshot)

    def receipt(self):
        return copy.deepcopy(self._snapshot)


def normalize(nasa_id, observations):
    if type(nasa_id) is not str or not re.fullmatch(r'[A-Za-z0-9_-]{1,256}', nasa_id):
        raise ValueError('Selected NASA ID must be a bounded literal identifier')
    if type(observations) is not list:
        raise ValueError('Observations must be a list')
    retained, public, remaining, signatures = [], [], MAX_BATCH_BYTES, {}
    for envelope in observations[:MAX_OBSERVATIONS]:
        row = {'role': 'unsupported', 'state': 'invalid-envelope'}
        safe = {'role': 'unsupported', 'state': 'invalid-envelope', 'bytes': 0, 'retained_bytes': 0, 'sha256': None, 'contradictory': False}
        if type(envelope) is dict:
            role = envelope.get('role')
            if type(role) is str and role in ROLES:
                row['role'] = safe['role'] = role
            # Only bounded allowlisted scalars; never traverse caller extensions.
            for key in ('request_url', 'final_url', 'status', 'complete', 'failure'):
                v = envelope.get(key)
                if type(v) in (str, int, bool, type(None)) and (type(v) is not str or len(v) <= 4096) and (type(v) is not int or abs(v) <= 1000000):
                    row[key] = v
            body = envelope.get('body')
            if type(body) is bytes:
                size = min(len(body), MAX_BODY_BYTES, remaining)
                row['body_prefix'] = body[:size]
                remaining -= size
                safe.update(bytes=len(body), retained_bytes=size, sha256=_digest(body))
            if row['role'] == 'unsupported':
                row['state'] = 'unsupported-role'
            elif not _association(row.get('request_url'), role, nasa_id):
                row['state'] = 'request-mismatch'
            elif envelope.get('failure') is not None:
                row['state'] = 'transport-failure'
            elif type(envelope.get('status')) is not int or not 100 <= envelope['status'] <= 599 or type(envelope.get('complete')) is not bool:
                row['state'] = 'invalid-transport'
            elif 300 <= envelope['status'] < 400 or row.get('final_url') != row.get('request_url'):
                row['state'] = 'redirect-or-final-mismatch'
            elif envelope['status'] == 206 or not envelope['complete']:
                row['state'] = 'partial-response'
            elif envelope['status'] != 200:
                row['state'] = 'http-failure'
            elif type(body) is not bytes:
                row['state'] = 'body-type'
            elif safe['retained_bytes'] != safe['bytes']:
                row['state'] = 'body-limit'
            else:
                try:
                    source = _decode(body)
                except (ValueError, TypeError, RecursionError, OverflowError):
                    row['state'] = 'invalid-json-or-limit'
                else:
                    row['source'] = source
                    row['normalized'] = _project(source, role, nasa_id, row['request_url'])
                    n = row['normalized']
                    row['state'] = ('schema-or-identity-failure' if n['issues'] else 'observed')
                    if role == 'search' and not n['issues']:
                        row['state'] = ('mixed-or-mismatched-selection' if n['mismatched_records'] else 'duplicate-selection' if n['duplicate_records'] or n['matched_records'] > 1 else 'exact-selection' if n['matched_records'] == 1 else 'empty-selection')
                    for key in ('matched_records', 'mismatched_records', 'duplicate_records', 'items_count', 'query_total_hits'):
                        if key in n:
                            safe[key] = n[key]
                    safe['references_count'] = len(n['references'])
                    safe['issues_count'] = len(n['issues'])
            # JSON encoding preserves bool/int/float distinctions in comparisons.
            signature = json.dumps([row.get(k) for k in ('request_url', 'final_url', 'status', 'complete', 'failure')] + [safe['sha256'], row['state']], ensure_ascii=True, separators=(',', ':'))
            if row['role'] in ROLES:
                previous = signatures.setdefault(row['role'], [])
                if previous and any(s != signature for s, _ in previous):
                    safe['contradictory'] = True
                    for _, old in previous:
                        old['contradictory'] = True
                previous.append((signature, safe))
        safe['state'] = row['state']
        retained.append(row)
        public.append(safe)
    snapshot = {'schema': 1, 'attempts': public, 'omitted_attempts': max(0, len(observations) - MAX_OBSERVATIONS), 'retained_body_bytes': MAX_BATCH_BYTES - remaining,
                'acceptance': {k: False for k in ('full_provider', 'playback', 'download', 'metadata_contents', 'complete_transcript', 'license', 'endorsement', 'deletion', 'catalog_complete', 'target_recommendation')}}
    return Evidence(retained, snapshot)
