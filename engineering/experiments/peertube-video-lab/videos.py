"""Bounded, offline PeerTube selected-video evidence. All but receipt() is private.

No I/O or fetching: callers supply inert response bytes and explicit request evidence.
Contract labels are caller assertions, not server authentication. Metadata is never
proof of retrieval, decoding, playback, transcript completeness or licensing.
"""
from __future__ import annotations

import copy
import hashlib
import importlib.util
import math
from pathlib import Path
import re
from urllib.parse import urlsplit

_SPEC = importlib.util.spec_from_file_location(
    '_peertube_extractors', Path(__file__).resolve().parents[1] / 'site-extraction-lab/extractors.py')
_HELPER = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(_HELPER)
MAX_BYTES = 1_000_000
MAX_OBSERVATIONS = 32
MAX_RETAINED_BYTES = MAX_BYTES
MAX_TOTAL_RETAINED_BYTES = 2_000_000
MAX_FAILURE_PREFIX = 4096
MAX_ENVELOPE_STRING = 4096
MAX_NODES = 20000
MAX_DEPTH = 32
MAX_MEDIA = 256
MAX_CAPTIONS = 256
MAX_INTEGER = 2**53 - 1
UUID = re.compile(r'[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\Z')
CONTRACT = 'peertube-8.3.0'


class Invalid(ValueError):
    pass


def integer(value):
    return type(value) is int and 0 <= value <= MAX_INTEGER


def origin(value):
    if type(value) is not str or len(value) > MAX_ENVELOPE_STRING or any(ord(c) < 33 for c in value):
        raise Invalid('association_invalid')
    try:
        p = urlsplit(value)
        if p.scheme not in ('https', 'http') or not p.hostname or p.username or p.password or p.path or p.query or p.fragment:
            raise Invalid('association_invalid')
        p.port
    except ValueError:
        raise Invalid('association_invalid') from None
    return value


def walk(value):
    """Check the entire JSON tree, including unknown private fields."""
    stack, count = [(value, 0)], 0
    while stack:
        node, depth = stack.pop()
        count += 1
        if count > MAX_NODES or depth > MAX_DEPTH:
            raise Invalid('tree_limit')
        if isinstance(node, str):
            try:
                node.encode('utf-8', 'strict')
            except UnicodeError:
                raise Invalid('invalid_unicode') from None
        elif type(node) is float and not math.isfinite(node):
            raise Invalid('invalid_number')
        elif isinstance(node, dict):
            stack.extend((x, depth + 1) for pair in node.items() for x in pair)
        elif isinstance(node, list):
            stack.extend((x, depth + 1) for x in node)


def field(obj, key):
    if key not in obj:
        return {'state': 'missing'}
    value = obj[key]
    state = 'null' if value is None else 'empty' if value == '' or value == [] or value == {} else 'present'
    return {'state': state, 'value': copy.deepcopy(value)}


def check(obj, key, typ, nullable=False):
    if key not in obj or (nullable and obj[key] is None):
        return
    v = obj[key]
    if type(v) is not typ or (typ is int and not integer(v)):
        raise Invalid('invalid_type')


def array(obj, key, limit):
    check(obj, key, list)
    values = obj.get(key, [])
    if len(values) > limit:
        raise Invalid('collection_limit')
    if any(type(v) is not dict for v in values):
        raise Invalid('invalid_type')
    return values


def actor(obj):
    check(obj, 'id', int)
    for key in ('name', 'displayName', 'url', 'host', 'description'):
        check(obj, key, str, nullable=True)


def media_file(obj):
    for key in ('id', 'size'):
        check(obj, key, int)
    for key in ('hasAudio', 'hasVideo'):
        check(obj, key, bool)
    for key in ('fileUrl', 'fileDownloadUrl', 'playlistUrl', 'torrentUrl', 'torrentDownloadUrl', 'magnetUri', 'metadataUrl'):
        check(obj, key, str)
    for key in ('fps', 'width', 'height'):
        if key in obj and (type(obj[key]) not in (int, float) or obj[key] < 0):
            raise Invalid('invalid_type')
    if 'resolution' in obj:
        check(obj, 'resolution', dict)
        check(obj['resolution'], 'id', int)


def markdown(obj, key, instance):
    check(obj, key, str, nullable=True)
    result = field(obj, key)
    if type(obj.get(key)) is str:
        # The shared helper is deliberately incomplete. Bad references must not
        # discard the exact source, or abort the observation at its boundary.
        try:
            result['projection'] = _HELPER.markdown_body(obj[key], instance)
            result['projectionState'] = 'partial_projection'
        except (ValueError, UnicodeError, TypeError):
            result['projectionState'] = 'projection_unavailable'
    return result


def video(obj, instance, contract):
    check(obj, 'id', int)
    for key in ('shortUUID', 'url', 'thumbnailPath', 'previewPath'):
        check(obj, key, str, nullable=True)
    for key in ('downloadEnabled', 'isLive', 'isLocal', 'nsfw'):
        check(obj, key, bool)
    for key in ('waitTranscoding', 'blacklisted'):
        check(obj, key, bool, nullable=True)
    array(obj, 'liveSchedules', MAX_MEDIA)
    for key in ('duration', 'views', 'likes', 'dislikes', 'comments', 'viewers'):
        check(obj, key, int)
    for key in ('privacy', 'state', 'licence'):
        if key in obj:
            check(obj, key, dict)
            check(obj[key], 'id', int)
    for key in ('account', 'channel'):
        if key in obj:
            check(obj, key, dict)
            actor(obj[key])
    channel = obj.get('channel', {})
    if 'ownerAccount' in channel:
        check(channel, 'ownerAccount', dict)
        actor(channel['ownerAccount'])
    direct = array(obj, 'files', MAX_MEDIA)
    playlists = array(obj, 'streamingPlaylists', MAX_MEDIA)
    thumbnails = array(obj, 'thumbnails', MAX_MEDIA)
    count = len(direct) + len(playlists) + len(thumbnails)
    for f in direct:
        media_file(f)
    for p in playlists:
        check(p, 'id', int)
        check(p, 'type', int)
        for key in ('playlistUrl', 'segmentsSha256Url'):
            check(p, key, str)
        nested = array(p, 'files', MAX_MEDIA)
        count += len(nested)
        for f in nested:
            media_file(f)
    if count > MAX_MEDIA:
        raise Invalid('collection_limit')
    for t in thumbnails:
        check(t, 'fileUrl', str)
        check(t, 'width', int)
        check(t, 'height', int)
    return {
        'identity': {'instance': instance, 'localId': field(obj, 'id'), 'uuid': obj['uuid'],
                     'shortUUID': field(obj, 'shortUUID'), 'canonicalUrl': field(obj, 'url')},
        'description': markdown(obj, 'description', instance),
        'truncatedDescription': markdown(obj, 'truncatedDescription', instance),
        'support': markdown(obj, 'support', instance),
        'descriptionContract': 'full_field_contract' if contract == CONTRACT else 'ambiguous_contract',
        'attribution': {'uploaderAccount': field(obj, 'account'), 'publisherChannel': field(obj, 'channel'),
                        'channelOwnerAccount': field(channel, 'ownerAccount'), 'originalCreativeAuthor': 'not_established'},
        'media': {k: field(obj, k) for k in ('files', 'streamingPlaylists', 'thumbnails', 'thumbnailPath', 'previewPath')},
        'availability': {k: field(obj, k) for k in ('downloadEnabled', 'privacy', 'state', 'isLive', 'liveSchedules', 'waitTranscoding', 'blacklisted')},
        'licence': field(obj, 'licence'),
        'counts': {'directFiles': len(direct), 'playlists': len(playlists),
                   'representations': sum(len(p.get('files', [])) for p in playlists), 'thumbnails': len(thumbnails)},
    }


def captions(obj):
    check(obj, 'total', int)
    values = array(obj, 'data', MAX_CAPTIONS)
    for row in values:
        check(row, 'language', dict)
        if 'language' in row:
            check(row['language'], 'id', str)
            check(row['language'], 'label', str)
        check(row, 'automaticallyGenerated', bool)
        for key in ('captionPath', 'fileUrl', 'm3u8Url', 'updatedAt'):
            check(row, key, str, nullable=key == 'captionPath')
    state = 'missing_data' if 'data' not in obj else 'missing_total' if 'total' not in obj else 'count_matches' if obj['total'] == len(values) else 'count_mismatch'
    return {'total': field(obj, 'total'), 'rows': field(obj, 'data'), 'observed': len(values), 'countState': state}


def fingerprint(value):
    """Type-sensitive, recursive representation (True is never equal to 1)."""
    if type(value) is dict:
        return ('dict', tuple(sorted((k, fingerprint(v)) for k, v in value.items())))
    if type(value) is list:
        return ('list', tuple(map(fingerprint, value)))
    return (type(value).__name__, value)


def retain_envelope(observation, remaining):
    """Never traverse arbitrary caller metadata or call its copy/repr hooks.

    Raw-body retention is bounded per observation and across the batch. Envelope
    storage has its own finite bound: eight scalar fields, each <=4096 UTF-8 bytes,
    per observation. Unknown envelope fields are counted, not retained. Unknown
    JSON response fields are retained only after the body/tree limits pass.
    """
    original, states = {}, {}
    a = {'original': original, 'envelopeFieldStates': states}
    if type(observation) is not dict:
        return a, remaining
    keys = ('kind', 'instance', 'request_uuid', 'request_path', 'status',
            'complete', 'redirected', 'contract')
    a['ignoredEnvelopeFieldCount'] = len(observation) - sum(k in observation for k in keys + ('body',))
    for key in keys:
        if key not in observation:
            states[key] = 'missing'
            continue
        value = observation[key]
        if type(value) is str:
            if len(value) > MAX_ENVELOPE_STRING:
                states[key] = 'oversized'
                continue
            try:
                encoded = value.encode('utf-8', 'strict')
            except UnicodeError:
                states[key] = 'invalid_unicode'
                continue
            if len(encoded) > MAX_ENVELOPE_STRING:
                states[key] = 'oversized'
                continue
        elif value is not None and type(value) is not bool and not (
                (type(value) is int and abs(value) <= MAX_INTEGER) or
                (type(value) is float and math.isfinite(value) and abs(value) <= MAX_INTEGER)):
            states[key] = 'invalid_type'
            continue
        original[key] = value
        states[key] = 'retained'
    body = observation.get('body')
    if type(body) is bytes:
        length = len(body)
        cap = MAX_FAILURE_PREFIX if length > MAX_BYTES else MAX_RETAINED_BYTES
        retained = min(length, cap, remaining)
        original['body'] = body[:retained]
        a['receivedBytes'] = length
        a['receivedSha256'] = hashlib.sha256(body).hexdigest()
        a['retainedBytes'] = retained
        a['bodyRetention'] = 'complete' if retained == length else 'prefix_only'
        remaining -= retained
    return a, remaining


class Evidence:
    def __init__(self, attempts, records, public):
        self.attempts = copy.deepcopy(attempts)
        self.records = copy.deepcopy(records)
        self.__public = copy.deepcopy(public)

    def receipt(self):
        """Only publication-safe output. Independent snapshot on every read."""
        return copy.deepcopy(self.__public)


def normalize(observations, *, expected_uuid, instance):
    """Normalize up to 32 attempts for one explicit instance/UUID selection.

    Observation keys: kind, instance, request_uuid, request_path, body (bytes),
    status (HTTP integer), complete (bool), redirected (bool), contract (optional).
    Request paths must use the selected UUID, never a guessed numeric identity.
    Only allowlisted bounded envelope scalars are retained; extra envelope fields
    are counted and ignored without traversal. Original typed transport scalars
    survive privately, even for failed attempts. Invalid scalar types are recorded
    as fixed states, never copied. Body retention is at most MAX_RETAINED_BYTES per
    attempt and MAX_TOTAL_RETAINED_BYTES per batch; oversized bodies retain only
    MAX_FAILURE_PREFIX bytes. Full received length/hash survive privately/publicly.
    Supplied bytes are already caller-owned: hashing does NOT limit their prior
    allocation or hashing time. Budget-exhausted attempts do not parse the body.
    Invalid batch/selection raises ValueError; bad observations become fixed states.
    """
    origin(instance)
    if type(expected_uuid) is not str or not UUID.fullmatch(expected_uuid):
        raise ValueError('invalid selection')
    if type(observations) is not list or len(observations) > MAX_OBSERVATIONS:
        raise ValueError('observation limit or type')
    attempts, records, summaries, seen = [], [], [], {}
    remaining = MAX_TOTAL_RETAINED_BYTES
    for observation in observations:
        a, remaining = retain_envelope(observation, remaining)
        s = {'state': 'invalid_envelope'}
        try:
            if type(observation) is not dict:
                raise Invalid('invalid_envelope')
            o = a['original']
            body = observation.get('body')
            if type(body) is not bytes:
                raise Invalid('invalid_body_type')
            s.update(bytes=a['receivedBytes'], sha256=a['receivedSha256'])
            if len(body) > MAX_BYTES:
                raise Invalid('byte_limit')
            if a['bodyRetention'] != 'complete':
                raise Invalid('retained_byte_budget')
            kind = o.get('kind')
            if type(kind) is not str or kind not in ('video', 'captions'):
                raise Invalid('invalid_kind')
            s['kind'] = kind
            path = '/api/v1/videos/' + expected_uuid + ('/captions' if kind == 'captions' else '')
            if o.get('instance') != instance or o.get('request_uuid') != expected_uuid or o.get('request_path') != path:
                raise Invalid('association_mismatch')
            if type(o.get('status')) is not int or not 100 <= o['status'] <= 599 or type(o.get('complete')) is not bool or type(o.get('redirected')) is not bool:
                raise Invalid('invalid_transport')
            if o['redirected'] or 300 <= o['status'] < 400:
                raise Invalid('redirect')
            status = o['status']
            if status != 200:
                raise Invalid({401: 'unauthorized', 403: 'forbidden', 404: 'not_found_not_deletion', 429: 'rate_limited', 206: 'partial'}.get(status, 'http_unavailable'))
            if not o['complete']:
                raise Invalid('partial')
            try:
                obj = _HELPER.json_loads(body.decode('utf-8', 'strict'))
            except (ValueError, UnicodeError, RecursionError):
                raise Invalid('invalid_json') from None
            walk(obj)
            if type(obj) is not dict:
                raise Invalid('invalid_type')
            a['parsed'] = obj
            # Captions need explicit request evidence even if no body UUID exists.
            if (kind == 'video' and obj.get('uuid') != expected_uuid) or ('uuid' in obj and obj['uuid'] != expected_uuid):
                raise Invalid('identity_mismatch')
            fp = fingerprint(obj)
            contradiction = kind in seen and seen[kind] != fp
            # Retain competing responses, including later invalid typed values.
            s['contradiction'] = contradiction
            if kind not in seen:
                seen[kind] = fp
            if a['envelopeFieldStates']['contract'] not in ('missing', 'retained'):
                raise Invalid('invalid_contract')
            contract = o.get('contract', 'unknown')
            if type(contract) is not str or contract not in (CONTRACT, 'unknown'):
                raise Invalid('invalid_contract')
            record = video(obj, instance, contract) if kind == 'video' else captions(obj)
            a['recordIndex'] = len(records)
            records.append(record)
            s['state'] = 'contradiction' if contradiction else 'metadata_observed'
            if kind == 'video':
                s['counts'] = record['counts']
                s['descriptionContract'] = record['descriptionContract']
                s['mediaPresence'] = {k: record['media'][k]['state'] for k in ('files', 'streamingPlaylists', 'thumbnails', 'thumbnailPath', 'previewPath')}
                s['mediaPresence']['nestedFiles'] = [field(p, 'files')['state'] for p in obj.get('streamingPlaylists', [])]
                s['playlistTypes'] = ['missing' if 'type' not in p else 'hls' if p['type'] == 1 else 'unsupported' for p in obj.get('streamingPlaylists', [])]
                s['textFields'] = {k: {'state': record[k]['state'], **({'bytes': len(obj[k].encode('utf-8')), 'sha256': hashlib.sha256(obj[k].encode('utf-8')).hexdigest()} if type(obj.get(k)) is str else {})} for k in ('description', 'truncatedDescription', 'support')}
            else:
                s['observed'] = record['observed']
                s['countState'] = record['countState']
        except Invalid as error:
            s['state'] = str(error)
        a['outcome'] = copy.deepcopy(s)
        attempts.append(a)
        summaries.append(s)
    public = {'schema': 'peertube-video-evidence-v1', 'observations': summaries,
              'roles': ['uploader_account', 'publisher_channel', 'channel_owner_account', 'original_author_not_established'],
              'mediaRoles': ['direct_file_metadata', 'download_link_metadata', 'hls_manifest_metadata', 'nested_representation_metadata', 'torrent_metadata', 'magnet_metadata', 'thumbnail_metadata', 'caption_metadata'],
              'acceptance': {k: False for k in ('mediaTransferred', 'playlistFetched', 'captionFileFetched', 'decoded', 'playbackVerified', 'transcriptComplete', 'captionPlaybackVerified', 'licenceVerified', 'retrievalGuaranteed', 'productionAccepted')}}
    return Evidence(attempts, records, public)
