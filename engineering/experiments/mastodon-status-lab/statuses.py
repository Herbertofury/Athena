"""Offline Mastodon capture evidence, not a client, sanitizer or renderer.

normalize(origin, status_id, observations, profile_join=None) accepts only locally
captured bytes. An observation has exactly role ('status'/'profile'), body (bytes),
http (int 100..599), complete (bool), redirected (bool). profile_join, if supplied,
is an exact {'status_id': opaque str, 'account_id': opaque str} declaration.
Everything returned except receipt(result) is PRIVATE, including failed captures.
No feeds, transfer/playback, deletion, native follow or moderation are established.
"""
from __future__ import annotations
import copy
import hashlib
import importlib.util
import json
import math
from pathlib import Path
from urllib.parse import urlsplit

_spec = importlib.util.spec_from_file_location('_mastodon_extraction_helpers', Path(__file__).resolve().parents[1] / 'site-extraction-lab' / 'extractors.py')
_helpers = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_helpers)
MAX_BYTES = 1_048_576
MAX_OBSERVATIONS = 16
MAX_NODES = 20000
MAX_DEPTH = 32
MAX_STATUSES = 8
MAX_MEDIA = 32

class Invalid(ValueError):
    """Malformed caller arguments (never a provider-supplied error)."""

def digest(value):
    return hashlib.sha256(value).hexdigest()

def string(value, nonempty=False):
    if type(value) is not str or (nonempty and not value) or len(value) > 262144:
        raise Invalid('string')
    value.encode('utf-8', errors='strict')
    return value

def ident(value):
    return string(value, True)  # Never parse, trim, split or coerce opaque IDs.

def origin_check(value):
    string(value, True)
    p = urlsplit(value)
    if p.scheme != 'https' or not p.hostname or p.username or p.password or p.query or p.fragment or p.path or any(ord(c) <= 32 or ord(c) == 127 for c in value):
        raise Invalid('origin')
    p.port
    if p.netloc != p.netloc.lower():
        raise Invalid('origin')
    return value

def bounded_tree(root):
    stack = [(root, 0)]; count = 0
    while stack:
        obj, depth = stack.pop(); count += 1
        if depth > MAX_DEPTH or count > MAX_NODES:
            raise Invalid('structure_budget')
        if type(obj) is dict:
            for key, val in obj.items():
                string(key); stack.append((val, depth + 1))
        elif type(obj) is list:
            stack.extend((v, depth + 1) for v in obj)
        elif type(obj) is str:
            string(obj)
        elif type(obj) is float and not math.isfinite(obj):
            raise Invalid('number')
        elif obj is not None and type(obj) not in (int, float, bool):
            raise Invalid('type')

def field(obj, key, kind, nullable=False):
    if key in obj and not (nullable and obj[key] is None) and type(obj[key]) is not kind:
        raise Invalid('field_type')

def state(obj, key):
    if key not in obj: return 'missing'
    if obj[key] is None: return 'null'
    if obj[key] == '' or obj[key] == []: return 'empty'
    return 'declared'

def profile_reference(value):
    # A join needs an actual absolute profile reference, not two empty strings.
    if type(value) is not str or not value or any(ord(c) <= 32 or ord(c) == 127 for c in value):
        return False
    try:
        parsed = urlsplit(value); parsed.port
        return parsed.scheme in ('https', 'http') and bool(parsed.hostname) and not parsed.username and not parsed.password
    except ValueError:
        return False

def account(raw, origin):
    if type(raw) is not dict: raise Invalid('account')
    aid = ident(raw.get('id'))
    for key in ('url', 'username', 'acct', 'display_name', 'avatar', 'avatar_static', 'note'):
        field(raw, key, str)
    for key in ('locked', 'bot', 'discoverable', 'indexable', 'suspended', 'limited'):
        field(raw, key, bool, True)
    for key in ('followers_count', 'following_count', 'statuses_count'):
        field(raw, key, int)
        if key in raw and raw[key] < 0: raise Invalid('count')
    return {'instance': origin, 'local_id': aid, 'canonical_profile_url': raw.get('url'), 'raw': raw}

def status(raw, origin, seen, depth=0):
    if type(raw) is not dict or depth >= MAX_STATUSES: raise Invalid('status_budget')
    sid = ident(raw.get('id'))
    if sid in seen: raise Invalid('duplicate_status')
    seen.add(sid)
    author = account(raw.get('account'), origin)
    for key in ('uri', 'url', 'content', 'spoiler_text', 'created_at', 'text', 'language', 'edited_at', 'in_reply_to_id', 'in_reply_to_account_id'):
        field(raw, key, str, key not in ('uri', 'content', 'spoiler_text', 'created_at'))
    for key in ('in_reply_to_id', 'in_reply_to_account_id'):
        if raw.get(key) is not None: ident(raw[key])
    for key in ('sensitive', 'favourited', 'reblogged', 'muted', 'bookmarked', 'pinned'):
        field(raw, key, bool)
    for key in ('reblogs_count', 'favourites_count', 'replies_count'):
        field(raw, key, int)
        if key in raw and raw[key] < 0: raise Invalid('count')
    if 'visibility' in raw and raw['visibility'] not in ('public', 'unlisted', 'private', 'direct'): raise Invalid('visibility')
    media = raw.get('media_attachments', [])
    if type(media) is not list or len(media) > MAX_MEDIA: raise Invalid('media_budget')
    attachments = []; media_seen = set()
    for pos, item in enumerate(media):
        if type(item) is not dict: raise Invalid('media')
        mid = ident(item.get('id'))
        if mid in media_seen: raise Invalid('duplicate_media')
        media_seen.add(mid)
        field(item, 'type', str)
        for key in ('url', 'preview_url', 'remote_url', 'description', 'blurhash'):
            field(item, key, str, True)
        attachments.append({'order': pos, 'local_id': mid, 'kind': item.get('type') if item.get('type') in ('image', 'video', 'gifv', 'audio', 'unknown') else 'unsupported', 'roles': {k: {'state': state(item, k), 'value': item.get(k)} for k in ('url', 'preview_url', 'remote_url')}, 'raw': item})
    content = raw.get('content')
    projection = None; projection_state = 'missing' if content is None else 'empty'
    if content:
        try:
            helper_projection = _helpers.ordered_body(_helpers.document(content.encode('utf-8')), origin)
            # Never expose the helper's reserialized raw HTML or text_content.
            # These events are a lossy private projection, not renderer-safe HTML.
            projection = {'format': 'ordered_events', 'completeness': 'partial_projection', 'events': helper_projection['events']}
            projection_state = 'inert_projection'
        except (ValueError, RecursionError, IndexError, _helpers.etree.LxmlError):
            projection_state = 'projection_failed'
    # This helper removes URL queries in its projection. Exact source is independent.
    result = {'instance': origin, 'local_id': sid, 'federation_uri': raw.get('uri'), 'author': author, 'html_source': content, 'projection': projection, 'projection_state': projection_state, 'field_states': {k: state(raw, k) for k in ('content', 'media_attachments', 'reblog', 'spoiler_text', 'sensitive', 'visibility', 'edited_at', 'in_reply_to_id', 'in_reply_to_account_id')}, 'attachments': attachments, 'content_warning': raw.get('spoiler_text'), 'sensitive': raw.get('sensitive'), 'visibility': raw.get('visibility'), 'reply_status_id': raw.get('in_reply_to_id'), 'reply_account_id': raw.get('in_reply_to_account_id'), 'edited_at': raw.get('edited_at'), 'raw': raw, 'extensions': {k: state(raw, k) if raw.get(k) is None else 'preserved_unsupported' for k in ('quote', 'poll', 'card', 'emojis')}, 'reblog': None}
    if raw.get('reblog') is not None:
        result['reblog'] = status(raw['reblog'], origin, seen, depth + 1)
    return result

def normalize(origin, status_id, observations, profile_join=None):
    """Retain observations and parsed evidence privately; do not render raw HTML.

    Explicit profile joins identify a status in the selected boost chain and its
    instance-local account. A failed or absent optional profile is never hidden.
    HTTP 404 is only not-found-or-inaccessible, never evidence of deletion.
    Field states distinguish missing/null/empty/declared source values; these
    declarations do not establish complete body/media capture. A null
    media_attachments field is invalid (the supported value must be a list).
    """
    origin_check(origin); ident(status_id)
    if type(observations) is not list or len(observations) > MAX_OBSERVATIONS: raise Invalid('observations')
    if profile_join is not None:
        if type(profile_join) is not dict or set(profile_join) != {'status_id', 'account_id'}: raise Invalid('join')
        for val in profile_join.values(): ident(val)
    # Validate envelopes before processing; no silent coercion or extra metadata.
    for obs in observations:
        if type(obs) is not dict or set(obs) != {'role', 'body', 'http', 'complete', 'redirected'}: raise Invalid('envelope')
        if obs['role'] not in ('status', 'profile') or type(obs['role']) is not str or type(obs['body']) is not bytes or type(obs['http']) is not int or not 100 <= obs['http'] <= 599 or type(obs['complete']) is not bool or type(obs['redirected']) is not bool: raise Invalid('envelope')
    result = {'origin': origin, 'selected_id': status_id, 'observations': [], 'statuses': [], 'profiles': [], 'profile_join': profile_join, 'join_state': 'not_requested'}
    budget = MAX_BYTES
    for obs in observations:
        body = obs['body']; kept = body[:budget]; budget -= len(kept)
        item = {'role': obs['role'], 'raw_capture': kept, 'sha256': digest(body), 'length': len(body), 'retained_length': len(kept), 'state': 'unprocessed', 'http': obs['http'], 'complete': obs['complete'], 'redirected': obs['redirected']}
        result['observations'].append(item)
        if len(kept) != len(body): item['state'] = 'byte_budget'; continue
        if obs['redirected'] or 300 <= obs['http'] < 400: item['state'] = 'redirect'; continue
        if not obs['complete'] or obs['http'] == 206: item['state'] = 'partial'; continue
        if obs['http'] != 200:
            item['state'] = {401: 'authentication_required', 403: 'forbidden', 404: 'not_found_or_inaccessible', 429: 'rate_limited'}.get(obs['http'], 'http_other'); continue
        try:
            raw = _helpers.json_loads(body.decode('utf-8', errors='strict')); bounded_tree(raw)
            item['parsed'] = raw
            if obs['role'] == 'status':
                obj = status(raw, origin, set())
                if obj['local_id'] != status_id: raise Invalid('selection')
                result['statuses'].append(obj)
            else:
                obj = account(raw, origin); result['profiles'].append(obj)
            item['state'] = 'normalized'
        except (ValueError, TypeError, OverflowError, RecursionError):
            item['state'] = 'invalid_capture'
    # Multiple successful observations cannot silently overwrite contradictions.
    for key in ('statuses', 'profiles'):
        vals = result[key]
        if len(vals) > 1 and any(json.dumps(v['raw'], sort_keys=True, separators=(',', ':'), allow_nan=False) != json.dumps(vals[0]['raw'], sort_keys=True, separators=(',', ':'), allow_nan=False) for v in vals[1:]):
            result[key + '_state'] = 'contradictory'
        else: result[key + '_state'] = 'consistent' if vals else 'unavailable'
    if profile_join is not None:
        result['join_state'] = 'unavailable'
        if result['statuses_state'] == 'contradictory' or result['profiles_state'] == 'contradictory': result['join_state'] = 'contradictory'
        elif result['statuses'] and result['profiles']:
            obj = result['statuses'][0]; target = None
            while obj:
                if obj['local_id'] == profile_join['status_id']: target = obj['author']
                obj = obj['reblog']
            profile = result['profiles'][0]
            result['join_state'] = 'matched' if target and target['local_id'] == profile_join['account_id'] == profile['local_id'] and profile_reference(target['canonical_profile_url']) and target['canonical_profile_url'] == profile['canonical_profile_url'] else 'mismatch'
    result['_receipt'] = copy.deepcopy(_make_receipt(result))
    return result

def _make_receipt(result):
    def project(obj):
        return {'identity_sha256': digest((obj['instance'] + '\0' + obj['local_id']).encode()), 'html_sha256': digest(obj['html_source'].encode()) if obj['html_source'] is not None else None, 'html_length': len(obj['html_source'].encode()) if obj['html_source'] is not None else 0, 'projection_state': obj['projection_state'], 'field_states': obj['field_states'], 'actor_role': 'boost_actor' if obj['reblog'] else 'status_author', 'attachments': [{'order': a['order'], 'kind': a['kind'], 'roles': {k: v['state'] for k, v in a['roles'].items()}} for a in obj['attachments']], 'extensions': obj['extensions'], 'reblog': project(obj['reblog']) if obj['reblog'] else None}
    return {'scope': 'local_capture_only', 'join_state': result['join_state'], 'statuses_state': result['statuses_state'], 'profiles_state': result['profiles_state'], 'observations': [{k: o[k] for k in ('role', 'sha256', 'length', 'retained_length', 'state')} for o in result['observations']], 'statuses': [project(s) for s in result['statuses']]}

def receipt(result):
    """Return only the normalization-time whitelist, never provider prose or URLs."""
    return copy.deepcopy(result['_receipt'])
