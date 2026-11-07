"""Offline, sample-scoped Bluesky AppView normalization.

Raw records, prose and full delivery URLs stay in memory. Public receipts use an
explicit whitelist. No network, credentials, native follow or mutation methods.
"""
from __future__ import annotations

import argparse
import copy
import json
import re
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

from extractors import ExtractionError, json_loads, public_url, sha256

MAX_DEPTH = 5
MAX_INPUT_DEPTH = 64
MAX_INPUT_NODES = 200000


def validate_input(value):
    """Bound retained raw JSON too; reject cycles and excessively nested input."""
    count = 0
    active = set()
    def walk(item, depth):
        nonlocal count
        count += 1
        if count > MAX_INPUT_NODES or depth > MAX_INPUT_DEPTH:
            raise ExtractionError('Input JSON structural limit exceeded')
        if isinstance(item, (dict, list)):
            marker = id(item)
            if marker in active:
                raise ExtractionError('Cyclic input is not JSON')
            active.add(marker)
            if isinstance(item, dict):
                if any(not isinstance(k, str) for k in item):
                    raise ExtractionError('Non-string JSON object key')
                children = item.values()
            else:
                children = item
            for child in children:
                walk(child, depth + 1)
            active.remove(marker)
    walk(value, 0)
DID = re.compile(r'did:[a-z0-9]+:[A-Za-z0-9._:%-]+\Z')
POST_URI = re.compile(r'at://(did:[^/?#]+)/app\.bsky\.feed\.post/([A-Za-z0-9._~:-]+)\Z')


def did(value):
    if not isinstance(value, str) or not DID.fullmatch(value):
        raise ExtractionError('Missing or invalid DID')
    return value


def full_url(value):
    """Validate a delivery/reference URL without deleting its query or fragment."""
    if not isinstance(value, str) or value != value.strip():
        return None
    if any(ord(c) < 32 or ord(c) == 127 for c in value):
        return None
    try:
        p = urlsplit(value)
        p.port
        if p.scheme not in ('https', 'http') or not p.hostname or p.username or p.password:
            return None
    except ValueError:
        return None
    return value


def profile(value, role='post_author'):
    if not isinstance(value, dict):
        raise ExtractionError('Missing actor object')
    identifier = did(value.get('did'))
    return {'did': identifier, 'handle': value.get('handle'),
            'displayName': value.get('displayName'), 'role': role,
            'profileUrl': 'https://bsky.app/profile/' + identifier,
            'avatar': full_url(value.get('avatar')), 'banner': full_url(value.get('banner')),
            'description': value.get('description'), 'rawProfile': copy.deepcopy(value)}


def post_identity(uri, author_did):
    m = POST_URI.fullmatch(uri) if isinstance(uri, str) else None
    if not m or len(m[2]) > 512 or m[2] in ('.', '..') or did(m[1]) != author_did:
        raise ExtractionError('Post AT URI and author DID mismatch')
    return {'uri': uri, 'authorDid': author_did, 'rkey': m[2],
            'url': 'https://bsky.app/profile/' + author_did + '/post/' + m[2]}


def facets(text, values, warnings):
    """Ranges are UTF-8 bytes, not Python character or UTF-16 indices."""
    if not isinstance(values, list):
        raise ExtractionError('Invalid facets list')
    encoded = text.encode('utf-8')
    result = []
    ranges = []
    for facet in values:
        if not isinstance(facet, dict) or not isinstance(facet.get('index'), dict):
            raise ExtractionError('Invalid facet')
        start, end = (facet['index'].get(k) for k in ('byteStart', 'byteEnd'))
        if type(start) is not int or type(end) is not int or not 0 <= start < end <= len(encoded):
            raise ExtractionError('Invalid facet byte range')
        try:
            encoded[:start].decode('utf-8')
            selected = encoded[start:end].decode('utf-8')
        except UnicodeDecodeError as exc:
            raise ExtractionError('Facet splits UTF-8 codepoint') from exc
        if any(start < b and a < end for a, b in ranges):
            raise ExtractionError('Overlapping facet byte ranges')
        ranges.append((start, end))
        features = facet.get('features')
        if not isinstance(features, list) or not features:
            raise ExtractionError('Missing facet features')
        for feature in features:
            if not isinstance(feature, dict):
                raise ExtractionError('Invalid facet feature')
            kind = feature.get('$type')
            if kind == 'app.bsky.richtext.facet#link' and full_url(feature.get('uri')) is None:
                raise ExtractionError('Invalid facet link')
            elif kind == 'app.bsky.richtext.facet#mention':
                did(feature.get('did'))
            elif kind not in ('app.bsky.richtext.facet#link', 'app.bsky.richtext.facet#tag'):
                warnings.append('Unknown facet feature retained without projection.')
        result.append({'byteStart': start, 'byteEnd': end, 'text': selected,
                       'features': copy.deepcopy(features)})
    return result


def cursor_page(value):
    # AppView omits this optional field on terminal captured responses.
    cursor = value.get('cursor')
    if cursor is not None and (not isinstance(cursor, str) or not cursor):
        raise ExtractionError('Invalid cursor')
    return {'cursor': cursor, 'cursorPresent': 'cursor' in value, 'hasNextCursor': cursor is not None,
            'terminalPageHint': cursor is None, 'completeImport': False}


def quote(value, depth, warnings):
    if depth > MAX_DEPTH:
        warnings.append('Quote nesting limit reached; nested record not projected.')
        return {'state': 'depth_limit', 'rawQuote': copy.deepcopy(value)}
    if not isinstance(value, dict):
        raise ExtractionError('Missing quote record')
    kind = value.get('$type')
    states = {'app.bsky.embed.record#viewNotFound': 'not_found',
              'app.bsky.embed.record#viewBlocked': 'blocked',
              'app.bsky.embed.record#viewDetached': 'detached'}
    if kind in states:
        return {'state': states[kind], 'uri': value.get('uri'),
                'author': profile(value['author'], 'blocked_quote_author') if isinstance(value.get('author'), dict) else None}
    if kind != 'app.bsky.embed.record#viewRecord':
        warnings.append('Unknown quote type retained without projection.')
        return {'state': 'unknown', 'rawQuote': copy.deepcopy(value)}
    raw = value.get('value')
    if not isinstance(raw, dict) or raw.get('$type') != 'app.bsky.feed.post':
        # Record embeds may point to feed generators, lists or other AT records.
        warnings.append('Quoted non-post record retained without post projection.')
        return {'state': 'non_post', 'uri': value.get('uri'), 'rawQuote': copy.deepcopy(value)}
    projected = _post(value, raw, value.get('embeds', []), depth, 'quoted_author')
    return {'state': 'available', 'post': projected}


def embed(value, depth, warnings):
    if depth > MAX_DEPTH:
        warnings.append('Embed nesting limit reached; embed not projected.')
        return {'kind': 'depth_limit', 'rawEmbed': copy.deepcopy(value)}
    if not isinstance(value, dict):
        raise ExtractionError('Invalid AppView embed')
    kind = value.get('$type')
    result = {'kind': kind, 'rawEmbed': copy.deepcopy(value)}
    if kind == 'app.bsky.embed.images#view':
        images = value.get('images')
        if not isinstance(images, list):
            raise ExtractionError('Missing image array')
        result['images'] = []
        for image in images:
            if not isinstance(image, dict):
                raise ExtractionError('Invalid image')
            result['images'].append({'role': 'post_image', 'thumbnail': full_url(image.get('thumb')),
                                     'fullsize': full_url(image.get('fullsize')),
                                     'alt': image.get('alt'), 'aspectRatio': copy.deepcopy(image.get('aspectRatio'))})
            projected = result['images'][-1]
            projected['mediaComplete'] = bool(projected['thumbnail'] and projected['fullsize'])
            if not projected['mediaComplete']:
                warnings.append('Image media reference missing or rejected; media incomplete.')
        result['mediaComplete'] = bool(result['images']) and all(i['mediaComplete'] for i in result['images'])
        if not result['images']:
            warnings.append('Image array empty; media incomplete.')
    elif kind == 'app.bsky.embed.external#view':
        card = value.get('external')
        if not isinstance(card, dict):
            raise ExtractionError('Missing external card')
        result['external'] = {'uri': full_url(card.get('uri')), 'title': card.get('title'),
                              'description': card.get('description'),
                              'thumbnail': full_url(card.get('thumb')), 'imageRole': 'external_card_image'}
        result['mediaComplete'] = bool(result['external']['uri']) and (not card.get('thumb') or bool(result['external']['thumbnail']))
        if not result['mediaComplete']:
            warnings.append('External card reference missing or rejected; media incomplete.')
    elif kind == 'app.bsky.embed.video#view':
        result['video'] = {'playlist': full_url(value.get('playlist')),
                           'thumbnail': full_url(value.get('thumbnail')), 'alt': value.get('alt'),
                           'cid': value.get('cid'), 'aspectRatio': copy.deepcopy(value.get('aspectRatio')),
                           'playbackVerified': False}
        result['mediaComplete'] = bool(result['video']['playlist']) and (not value.get('thumbnail') or bool(result['video']['thumbnail']))
        if not result['mediaComplete']:
            warnings.append('Video playlist or supplied thumbnail missing or rejected; media incomplete.')
    elif kind == 'app.bsky.embed.record#view':
        result['quote'] = quote(value.get('record'), depth + 1, warnings)
    elif kind == 'app.bsky.embed.recordWithMedia#view':
        record = value.get('record')
        if not isinstance(record, dict):
            raise ExtractionError('Missing recordWithMedia record')
        result['quote'] = quote(record.get('record'), depth + 1, warnings)
        result['media'] = embed(value.get('media'), depth + 1, warnings)
    else:
        warnings.append('Unknown AppView embed retained without projection.')
        result['kind'] = 'unknown'
        result['mediaComplete'] = False
    return result


def _post(value, raw, embeds, depth=0, role='post_author'):
    author = profile(value.get('author'), role)
    identity = post_identity(value.get('uri'), author['did'])
    if raw.get('$type') != 'app.bsky.feed.post' or not isinstance(raw.get('text'), str):
        raise ExtractionError('Missing original post text record')
    if not isinstance(embeds, list):
        raise ExtractionError('Invalid AppView embeds list')
    text = raw['text']
    warnings = []
    body = {'format': 'bluesky_plaintext', 'raw': text, 'text': text,
            'completeness': 'source_record_text_preserved',
            'facets': facets(text, raw.get('facets', []), warnings)}
    views = [embed(item, depth, warnings) for item in embeds]
    if raw.get('embed') and not embeds:
        warnings.append('Raw record embed exists but AppView media projection is absent.')
    return {'family': 'bluesky', 'identity': identity, 'cid': value.get('cid'),
            'author': author, 'body': body, 'embeds': views, 'rawRecord': copy.deepcopy(raw),
            'createdAt': raw.get('createdAt'), 'indexedAt': value.get('indexedAt'),
            'reply': copy.deepcopy(raw.get('reply')), 'labels': copy.deepcopy(value.get('labels', [])),
            'repost': None, 'warnings': warnings, 'fullSupportAccepted': False}


def normalize_post(value):
    validate_input(value)
    if not isinstance(value, dict) or not isinstance(value.get('record'), dict):
        raise ExtractionError('Missing AppView post')
    return _post(value, value['record'], [value['embed']] if value.get('embed') is not None else [])


def normalize_feed_page(value):
    validate_input(value)
    if not isinstance(value, dict) or not isinstance(value.get('feed'), list):
        raise ExtractionError('Missing feed page')
    page = cursor_page(value)
    posts = []
    for item in value['feed']:
        if not isinstance(item, dict):
            raise ExtractionError('Invalid feed item')
        post = normalize_post(item.get('post'))
        reason = item.get('reason')
        if reason is not None:
            if not isinstance(reason, dict):
                raise ExtractionError('Invalid feed reason')
            if reason.get('$type') == 'app.bsky.feed.defs#reasonRepost':
                repost_actor = profile(reason.get('by'), 'repost_actor')
                if reason.get('uri') is not None:
                    uri = reason['uri']
                    match = re.fullmatch(r'at://(did:[^/?#]+)/app\.bsky\.feed\.repost/([A-Za-z0-9._~:-]+)', uri) if isinstance(uri, str) else None
                    if (not match or did(match[1]) != repost_actor['did'] or
                            match[2] in ('.', '..') or len(match[2]) > 512):
                        raise ExtractionError('Repost URI and actor DID or collection mismatch')
                post['repost'] = {'actor': repost_actor,
                                  'uri': reason.get('uri'), 'cid': reason.get('cid'),
                                  'indexedAt': reason.get('indexedAt')}
            else:
                post['warnings'].append('Unknown feed reason retained without attribution projection.')
                post['rawReason'] = copy.deepcopy(reason)
        post['feedContext'] = {k: copy.deepcopy(item[k]) for k in ('reply', 'feedContext') if k in item}
        posts.append(post)
    return {'kind': 'feed_page', 'posts': posts, 'pagination': page,
            'nativeMutationTested': False, 'fullSupportAccepted': False}


def normalize_posts(value):
    validate_input(value)
    if not isinstance(value, dict) or not isinstance(value.get('posts'), list):
        raise ExtractionError('Missing posts response')
    return {'kind': 'posts_response', 'posts': [normalize_post(p) for p in value['posts']],
            'fullSupportAccepted': False}


def normalize_follows_page(value, subject_did):
    validate_input(value)
    expected = did(subject_did)
    if not isinstance(value, dict) or not isinstance(value.get('follows'), list):
        raise ExtractionError('Missing follows page')
    subject = profile(value.get('subject'), 'follow_subject')
    if subject['did'] != expected:
        raise ExtractionError('Follow subject DID mismatch')
    pagination = cursor_page(value)
    follows = [profile(p, 'followed_actor') for p in value['follows']]
    if len({p['did'] for p in follows}) != len(follows):
        raise ExtractionError('Duplicate followed actor DID on page')
    return {'kind': 'follows_page', 'subject': subject, 'follows': follows,
            'pagination': pagination, 'nativeMutationTested': False,
            'completeImport': False, 'fullSupportAccepted': False}


def normalize_profile(value):
    validate_input(value)
    return {'kind': 'profile', 'actor': profile(value, 'profile_subject'),
            'fullSupportAccepted': False}


def receipt_url(value):
    """Publish origins for arbitrary URLs; only known content-addressed CDN paths.

    Removing queries alone cannot redact webhook/bot/shared-secret path tokens.
    Runtime retains the complete validated URL. Receipts keep precise CDN paths
    only when they match the observed DID/CID content-addressed representations.
    """
    url = public_url(value)
    if url is None:
        return None
    p = urlsplit(url)
    content = r'b[a-z2-7]+'
    actor_id = r'did:plc:[a-z2-7]+'
    image_path = r'/img/(?:avatar|avatar_thumbnail|banner|feed_fullsize|feed_thumbnail)/plain/' + actor_id + '/' + content + r'(?:@(?:jpeg|png|webp))?'
    video_path = r'/watch/did%3[Aa]plc%3[Aa][a-z2-7]+/' + content + r'/(?:playlist\.m3u8|thumbnail\.jpg)'
    if p.scheme == 'https' and p.netloc == 'cdn.bsky.app' and re.fullmatch(image_path, p.path):
        return url
    if p.scheme == 'https' and p.netloc == 'video.bsky.app' and re.fullmatch(video_path, p.path):
        return url
    return urlunsplit((p.scheme, p.netloc, '/', '', ''))


def actor_receipt(actor):
    return {'did': actor['did'], 'role': actor['role'],
            'avatar': receipt_url(actor.get('avatar')), 'avatarPresent': actor.get('avatar') is not None}


def embed_receipt(value):
    result = {'kind': value['kind']}
    if 'mediaComplete' in value:
        result['mediaComplete'] = value['mediaComplete']
    if 'images' in value:
        result['images'] = [{'role': i['role'], 'fullsize': receipt_url(i['fullsize']),
                             'thumbnail': receipt_url(i['thumbnail'])} for i in value['images']]
    if 'video' in value:
        video = value['video']
        result['video'] = {'playlist': receipt_url(video['playlist']), 'thumbnail': receipt_url(video['thumbnail']),
                            'playbackVerified': False}
    if 'external' in value:
        result['external'] = {'uri': receipt_url(value['external']['uri']),
                              'thumbnail': receipt_url(value['external']['thumbnail']),
                              'imageRole': value['external']['imageRole'],
                              'uriSha256': sha256(value['external']['uri']) if value['external']['uri'] else None}
    if 'quote' in value:
        q = value['quote']
        result['quote'] = {'state': q['state']}
        if 'post' in q:
            result['quote']['post'] = post_receipt(q['post'])
    if 'media' in value:
        result['media'] = embed_receipt(value['media'])
    return result


def post_receipt(post):
    body = post['body']
    return {'identity': post['identity'], 'author': actor_receipt(post['author']),
            'body': {'characters': len(body['text']), 'utf8Bytes': len(body['raw'].encode('utf-8')),
                     'sha256': sha256(body['raw']), 'facetCount': len(body['facets']),
                     'facetByteRanges': [[f['byteStart'], f['byteEnd']] for f in body['facets']]},
            'embeds': [embed_receipt(e) for e in post['embeds']],
            'repostActor': actor_receipt(post['repost']['actor']) if post['repost'] else None,
            'warnings': post['warnings'], 'fullSupportAccepted': False}


def receipt(value):
    """Never emits post prose, card title/description, alt text, raw blobs or cursors."""
    kind = value.get('kind')
    if kind in ('feed_page', 'posts_response'):
        result = {'kind': kind, 'posts': [post_receipt(p) for p in value['posts']]}
    elif kind == 'follows_page':
        result = {'kind': kind, 'subject': actor_receipt(value['subject']),
                  'follows': [actor_receipt(p) for p in value['follows']], 'completeImport': False}
    elif kind == 'profile':
        result = {'kind': kind, 'actor': actor_receipt(value['actor'])}
    else:
        return post_receipt(value)
    if 'pagination' in value:
        p = value['pagination']
        result['pagination'] = {k: p[k] for k in ('cursorPresent', 'hasNextCursor', 'terminalPageHint', 'completeImport')}
        result['pagination']['cursorSha256'] = sha256(p['cursor']) if p['cursor'] is not None else None
    result['nativeMutationTested'] = False
    result['fullSupportAccepted'] = False
    return result


def replay_directory(directory):
    """Replay only known capture names; publish hashes/counts and sanitized output."""
    cases = []
    for name in ('eight-feed-1.json', 'eight-feed-2.json', 'aether-feed-1.json', 'aether-feed-2.json',
                 'eight-profile.json', 'aether-profile.json', 'eight-follows-1.json',
                 'eight-follows-2.json', 'bluesky-contentcontent.json'):
        raw = (Path(directory) / name).read_bytes()
        value = json_loads(raw)
        if 'feed' in value:
            normalized = normalize_feed_page(value)
        elif 'follows' in value:
            normalized = normalize_follows_page(value, value['subject']['did'])
        elif 'posts' in value:
            normalized = normalize_posts(value)
        else:
            normalized = normalize_profile(value)
        cases.append({'fixture': name, 'bytes': len(raw), 'sha256': sha256(raw),
                      'status': 'actual_api_capture_replay_passed', 'result': receipt(normalized)})
    return {'schemaVersion': 1, 'checkedAt': '2026-10-31', 'networkUsed': False,
            'fullSupportAccepted': False, 'rawCapturesPublished': False,
            'implementationReceipts': {name: {'sha256': sha256((Path(__file__).parent / name).read_bytes())}
                                       for name in ('bluesky.py', 'extractors.py')}, 'cases': cases}


extract_bluesky_post = normalize_post
extract_bluesky_feed = normalize_feed_page
extract_bluesky_follows = normalize_follows_page

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture_directory', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.write_text(json.dumps(replay_directory(args.capture_directory), indent=2) + '\n')
