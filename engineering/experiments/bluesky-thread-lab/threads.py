"""Bounded offline getPostThread evidence, not a client or archive.

Only bytes from explicitly scoped captures are accepted. Raw bytes, unknown
fields, identities and full normalize_post output are private. Use receipt()
for publication. DID/URI/CID checks are structural, never cryptographic proof.
Anonymous/authenticated AppViews can filter differently. A not_found view does
not establish deletion. Missing replies and matching counts establish neither
complete history nor moderation, account, media decode or playback acceptance.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

# Reuse the existing adapter and its duplicate-key/non-finite JSON decoder.
_ADAPTER = Path(__file__).resolve().parents[1] / 'site-extraction-lab'
if str(_ADAPTER) not in sys.path:
    sys.path.insert(0, str(_ADAPTER))
from bluesky import normalize_post, post_identity, POST_URI, did  # noqa: E402
from extractors import ExtractionError, json_loads, sha256  # noqa: E402

MAX_BYTES = 1024 * 1024
MAX_CAPTURES = 8
MAX_JSON_DEPTH = 64
MAX_JSON_NODES = 50000
MAX_THREAD_DEPTH = 24
MAX_THREAD_NODES = 256
VIEW = 'app.bsky.feed.defs#threadViewPost'
NOT_FOUND = 'app.bsky.feed.defs#notFoundPost'
BLOCKED = 'app.bsky.feed.defs#blockedPost'


def _integer(value, low, high):
    if type(value) is not int or not low <= value <= high:
        raise ExtractionError('Invalid bounded integer')
    return value


def _uri(value):
    match = POST_URI.fullmatch(value) if isinstance(value, str) else None
    if not match:
        raise ExtractionError('Expected DID post URI')
    post_identity(value, did(match[1]))
    return value


def _cid(value):
    # Deliberately opaque: no multibase, digest or repository proof is claimed.
    if (not isinstance(value, str) or not 1 <= len(value) <= 512 or
            any(ord(c) < 33 or ord(c) > 126 for c in value)):
        raise ExtractionError('Invalid CID token')
    return value


def _bounded_json(value):
    stack = [(value, 0)]
    count = 0
    while stack:
        item, depth = stack.pop()
        count += 1
        if count > MAX_JSON_NODES or depth > MAX_JSON_DEPTH:
            raise ExtractionError('JSON structural limit')
        if isinstance(item, str):
            item.encode('utf-8', errors='strict')
        elif isinstance(item, float) and not math.isfinite(item):
            raise ExtractionError('Non-finite number')
        elif isinstance(item, dict):
            stack.extend((v, depth + 1) for v in item.values())
            stack.extend((k, depth + 1) for k in item)
        elif isinstance(item, list):
            stack.extend((v, depth + 1) for v in item)


def _reference(value):
    if not isinstance(value, dict):
        raise ExtractionError('Missing strong reference')
    return {'uri': _uri(value.get('uri')), 'cid': _cid(value.get('cid'))}


def _normalize(value, request):
    if not isinstance(value, dict) or not isinstance(value.get('thread'), dict):
        raise ExtractionError('Missing thread response')
    posts, seen, edges, count = {}, {}, [], 0

    def walk(node, level, active, reply_depth, parent_height):
        nonlocal count
        count += 1
        if count > MAX_THREAD_NODES or level > MAX_THREAD_DEPTH:
            raise ExtractionError('Thread structural limit')
        if not isinstance(node, dict) or not isinstance(node.get('$type'), str):
            raise ExtractionError('Missing thread union tag')
        kind = node['$type']
        result = {'state': 'unknown', 'rawNode': node,
                  'parentPresent': 'parent' in node, 'repliesPresent': 'replies' in node}
        if kind == VIEW:
            raw_post = node.get('post')
            post = normalize_post(raw_post)
            identity = post['identity']['uri']
            _cid(post['cid'])
            if not isinstance(raw_post.get('indexedAt'), str) or not raw_post['indexedAt']:
                raise ExtractionError('Missing indexedAt')
            for field in ('replyCount', 'repostCount', 'likeCount', 'quoteCount', 'bookmarkCount'):
                if field in raw_post:
                    _integer(raw_post[field], 0, 2**63 - 1)
            ref = post['reply']
            if ref is not None:
                if not isinstance(ref, dict):
                    raise ExtractionError('Invalid reply record')
                refs = {key: _reference(ref.get(key)) for key in ('root', 'parent')}
                if identity in (refs['root']['uri'], refs['parent']['uri']):
                    raise ExtractionError('Self reference')
                result['references'] = refs
            result.update(state='available', post=post, uri=identity)
            if 'replyCount' in raw_post:
                result['replyCount'] = raw_post['replyCount']
            # Compare full postView evidence, not only prose or a mutable CID.
            fingerprint = json.dumps(raw_post, sort_keys=True, ensure_ascii=False)
            posts[identity] = result
        elif kind in (NOT_FOUND, BLOCKED):
            identity = _uri(node.get('uri'))
            flag = 'notFound' if kind == NOT_FOUND else 'blocked'
            if node.get(flag) is not True:
                raise ExtractionError('Invalid unavailable variant flag')
            if kind == BLOCKED:
                author = node.get('author')
                if not isinstance(author, dict):
                    raise ExtractionError('Missing blocked author')
                post_identity(identity, did(author.get('did')))
            result.update(state='not_found' if kind == NOT_FOUND else 'blocked', uri=identity)
            fingerprint = json.dumps(node, sort_keys=True, ensure_ascii=False)
            if 'parent' in node or 'replies' in node:
                raise ExtractionError('Unavailable variant with thread edges')
        else:
            # Future variants remain opaque, never interpreted as available.
            identity = _uri(node['uri']) if 'uri' in node else None
            if identity is not None:
                result['uri'] = identity
            fingerprint = json.dumps(node, sort_keys=True, ensure_ascii=False)
        if identity is not None:
            if identity in active:
                raise ExtractionError('Ancestor identity cycle')
            signature = (result['state'], fingerprint)
            if identity in seen and seen[identity] != signature:
                raise ExtractionError('Conflicting duplicate identity')
            seen[identity] = signature
            active = active | {identity}
        if kind != VIEW:
            return result
        if 'parent' in node:
            if parent_height >= request['parentHeight']:
                raise ExtractionError('Response exceeds requested parent height')
            parent = walk(node['parent'], level + 1, active, reply_depth, parent_height + 1)
            result['parent'] = parent
            if parent.get('uri'):
                edges.append((identity, parent['uri']))
        if 'replies' in node:
            if not isinstance(node['replies'], list):
                raise ExtractionError('Invalid replies array')
            if node['replies'] and reply_depth >= request['depth']:
                raise ExtractionError('Response exceeds requested reply depth')
            children = [walk(child, level + 1, active, reply_depth + 1, parent_height)
                        for child in node['replies']]
            child_uris = [child['uri'] for child in children if child.get('uri')]
            if len(set(child_uris)) != len(child_uris):
                raise ExtractionError('Duplicate reply sibling')
            result['replies'] = children
            result['observedDirectReplyCount'] = len(children)
            edges.extend((child['uri'], identity) for child in children if child.get('uri'))
        return result

    thread = walk(value['thread'], 0, set(), 0, 0)
    if thread.get('uri') is not None and thread['uri'] != request['uri']:
        raise ExtractionError('Requested root identity mismatch')
    # Edges constrain all visible nodes, including unavailable parent identities.
    parents = {}
    for child_uri, parent_uri in edges:
        if child_uri in parents and parents[child_uri] != parent_uri:
            raise ExtractionError('Conflicting parent relationships')
        parents[child_uri] = parent_uri
        child, parent = posts.get(child_uri), posts.get(parent_uri)
        if child:
            refs = child.get('references')
            if not refs or refs['parent']['uri'] != parent_uri:
                raise ExtractionError('Visible parent and strong reference mismatch')
            if parent:
                parent_root = parent.get('references', {}).get('root')
                expected_root = parent_root or {'uri': parent_uri, 'cid': parent['post']['cid']}
                if refs['root'] != expected_root:
                    raise ExtractionError('Conflicting thread root reference')
    # Include reference-only edges so cycles cannot hide outside projected edges.
    for uri, node in posts.items():
        for ref in node.get('references', {}).values():
            visible = posts.get(ref['uri'])
            if visible and visible['post']['cid'] != ref['cid']:
                raise ExtractionError('Visible CID and strong reference mismatch')
        if node.get('references'):
            parents[uri] = node['references']['parent']['uri']
    for origin in parents:
        visited, current = set(), origin
        while current in parents:
            if current in visited:
                raise ExtractionError('Parent reference cycle')
            visited.add(current)
            current = parents[current]
    return {'thread': thread, 'identityBound': thread.get('uri') == request['uri'],
            'nodeCount': count, 'threadgatePresent': 'threadgate' in value}


def normalize_capture(raw, *, uri, depth, parent_height, http_status=200):
    """Return a private attempt, including exact bytes even on bounded failures.

    Caller supplies the actual request parameters and HTTP status. This function
    cannot attest to transport provenance or authenticate those caller claims.
    Invalid caller arguments/oversize inputs raise before capture retention.
    HTTP failures and malformed successful bodies remain failed attempts, without
    exposing raw provider errors in receipt(). No retries or fallback occur.
    """
    request = {'uri': _uri(uri), 'depth': _integer(depth, 0, 1000),
               'parentHeight': _integer(parent_height, 0, 1000)}
    _integer(http_status, 100, 599)
    if type(raw) is not bytes or len(raw) > MAX_BYTES:
        raise ExtractionError('Expected bounded bytes capture')
    result = {'status': 'failed_attempt', 'request': request, 'rawBytes': raw,
              'httpStatus': http_status, 'failure': None}
    if not 200 <= http_status < 300:
        result['failure'] = 'http_status'
        return result
    try:
        value = json_loads(raw.decode('utf-8', errors='strict'))
        _bounded_json(value)
        result['rawResponse'] = value
        result.update(_normalize(value, request))
        result['status'] = 'normalized_capture' if result['identityBound'] else 'unbound_unknown_variant'
    except (ValueError, TypeError, KeyError, RecursionError, OverflowError):
        result['failure'] = 'invalid_or_out_of_bounds_response'
    return result


def normalize_captures(captures):
    """Bounded batch of {'raw', 'uri', 'depth', 'parent_height', ...} mappings."""
    if type(captures) is not list or len(captures) > MAX_CAPTURES:
        raise ExtractionError('Capture count limit')
    return [normalize_capture(**capture) for capture in captures]


def _media(embeds):
    counts = {'images': 0, 'videos': 0, 'externalCards': 0, 'quotes': 0,
              'unknownOrLimited': 0, 'incompleteReferences': 0,
              'quoteStates': {state: 0 for state in ('available', 'not_found', 'blocked',
                             'detached', 'unknown', 'non_post', 'depth_limit')}}
    def visit(embed):
        if 'images' in embed:
            counts['images'] += len(embed['images'])
        if 'video' in embed:
            counts['videos'] += 1
        if 'external' in embed:
            counts['externalCards'] += 1
        if embed.get('kind') in ('unknown', 'depth_limit'):
            counts['unknownOrLimited'] += 1
        if embed.get('mediaComplete') is False:
            counts['incompleteReferences'] += 1
        if 'media' in embed:
            visit(embed['media'])
        if 'quote' in embed:
            counts['quotes'] += 1
            state = embed['quote']['state']
            counts['quoteStates'][state if state in counts['quoteStates'] else 'unknown'] += 1
            for child in embed['quote'].get('post', {}).get('embeds', []):
                visit(child)
    for embed in embeds:
        visit(embed)
    return counts


def receipt(attempt):
    """Explicit safe projection; do not publish the private attempt itself.

    Hashes are correlation evidence, not anonymization or authenticity proof.
    No prose, handles, URIs, URLs, raw errors, threadgate or viewer data escapes.
    """
    def node_receipt(node):
        out = {'state': node['state'], 'parentPresent': node['parentPresent'],
               'repliesPresent': node['repliesPresent']}
        for field in ('replyCount', 'observedDirectReplyCount'):
            if field in node:
                out[field] = node[field]
        if node.get('uri'):
            out['uriSha256'] = sha256(node['uri'])
        if 'post' in node:
            post = node['post']
            body = post['body']['raw']
            out['body'] = {'sha256': sha256(body), 'characters': len(body),
                           'utf8Bytes': len(body.encode('utf-8')),
                           'facetCount': len(post['body']['facets'])}
            out['media'] = _media(post['embeds'])
            out['warningCount'] = len(post['warnings'])
        if 'parent' in node:
            out['parent'] = node_receipt(node['parent'])
        if 'replies' in node:
            out['replies'] = [node_receipt(n) for n in node['replies']]
        return out
    request = attempt['request']
    out = {'schemaVersion': 1, 'status': attempt['status'],
           'bytes': len(attempt['rawBytes']), 'sha256': sha256(attempt['rawBytes']),
           'httpStatus': attempt['httpStatus'], 'failure': attempt['failure'],
           'request': {'uriSha256': sha256(request['uri']), 'depth': request['depth'],
                       'parentHeight': request['parentHeight']},
           'networkUsed': False, 'completeHistory': False, 'fullSupportAccepted': False,
           'cryptographicIdentityVerified': False, 'playbackVerified': False,
           'decodeVerified': False, 'moderationVerified': False, 'accountComplete': False}
    if 'thread' in attempt:
        out.update(thread=node_receipt(attempt['thread']), nodeCount=attempt['nodeCount'],
                   identityBound=attempt['identityBound'],
                   threadgatePresent=attempt['threadgatePresent'])
    return out
