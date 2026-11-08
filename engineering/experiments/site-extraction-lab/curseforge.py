"""Offline official-schema projection, not a CurseForge client or access grant.

Accepts bounded JSON captures only. Never accepts keys, builds authenticated
requests, fetches URLs, guesses CDN paths, renders HTML, or enables Media/Lab.
"""
import math
from urllib.parse import urlsplit

from extractors import ExtractionError, json_loads, public_url

MAX_BYTES = 4 * 1024 * 1024
MAX_NODES = 50000


def _payload(raw):
    if not isinstance(raw, (str, bytes)):
        raise ExtractionError('Expected JSON bytes or text, not a client/session object')
    try:
        size = len(raw.encode('utf-8') if isinstance(raw, str) else raw)
    except UnicodeError as exc:
        raise ExtractionError('Invalid JSON text encoding') from exc
    if size > MAX_BYTES:
        raise ExtractionError('JSON capture exceeds bounded input size')
    try:
        value = json_loads(raw)
    except (ValueError, TypeError, RecursionError) as exc:
        raise ExtractionError('Invalid JSON capture') from exc
    pending = [(value, 0)]
    count = 0
    while pending:
        item, depth = pending.pop()
        count += 1
        if count > MAX_NODES or depth > 64:
            raise ExtractionError('JSON structural limit exceeded')
        if isinstance(item, float) and not math.isfinite(item):
            raise ExtractionError('Non-finite JSON value')
        if isinstance(item, dict):
            pending.extend((v, depth + 1) for v in item.values())
        elif isinstance(item, list):
            pending.extend((v, depth + 1) for v in item)
    return _object(value)


def _object(value):
    if not isinstance(value, dict):
        raise ExtractionError('Expected schema object')
    return value


def _integer(value, label, minimum=1, maximum=2**31-1):
    if type(value) is not int or not minimum <= value <= maximum:
        raise ExtractionError('Invalid ' + label)
    return value


def _text(value, label):
    if not isinstance(value, str):
        raise ExtractionError('Invalid ' + label)
    return value


def _list(value, label):
    if not isinstance(value, list):
        raise ExtractionError('Invalid ' + label)
    return value


def _flag(obj, key, nullable=False):
    if key not in obj:
        return {'state': 'not_provided', 'value': None}
    value = obj[key]
    if value is None and nullable:
        return {'state': 'unknown', 'value': None}
    if type(value) is not bool:
        raise ExtractionError('Invalid ' + key)
    return {'state': 'provided', 'value': value}


def _reference(value):
    # These are sanitized provenance references, NEVER download instructions.
    if value is None:
        return {'state': 'not_provided', 'url': None, 'fetchAllowed': False}
    url = public_url(value)
    if url is None or urlsplit(url).scheme != 'https' or any(c.isspace() or c == '\\' for c in urlsplit(url).netloc):
        return {'state': 'invalid', 'url': None, 'fetchAllowed': False}
    return {'state': 'reference_only', 'url': url,
            'queryOrFragmentRemoved': value.strip() != url, 'fetchAllowed': False}


def access_state(*, key_configured=False, response_status=None):
    """Pure classification of caller-supplied facts; no key argument or lookup.

    Even configured/not-attempted is not proof of provider approval or key
    validity. Status may come from synthetic tests; it never proves live access.
    """
    if type(key_configured) is not bool:
        raise ExtractionError('Expected non-secret configuration boolean')
    if response_status is not None:
        _integer(response_status, 'HTTP status', 100, 599)
        if not key_configured:
            raise ExtractionError('Response status contradicts no-request missing-key state')
    if not key_configured:
        state = 'missing_key'
    elif response_status is None:
        state = 'not_attempted'
    elif 200 <= response_status < 300:
        state = 'response_available_unvalidated'
    else:
        state = {401: 'authentication_rejected', 403: 'forbidden',
                 404: 'not_found', 429: 'rate_limited'}.get(
                     response_status, 'upstream_error' if response_status >= 500 else 'request_failed')
    return {'state': state, 'responseStatus': response_status,
            'networkPerformedByMapper': False, 'keyValidityVerified': False,
            'automaticRetryAllowed': False, 'fullSupportAccepted': False}


def _unique(rows, label):
    ids = [row['id'] for row in rows]
    if len(ids) != len(set(ids)):
        raise ExtractionError('Duplicate ' + label + ' identity')
    return rows


def _asset(value, mod_id, role):
    value = _object(value)
    if _integer(value.get('modId'), 'asset modId') != mod_id:
        raise ExtractionError('Asset belongs to another project')
    return {'id': _integer(value.get('id'), 'asset ID'), 'modId': mod_id, 'role': role,
            'title': _text(value.get('title', ''), 'asset title'),
            'description': _text(value.get('description', ''), 'asset description'),
            'thumbnail': _reference(value.get('thumbnailUrl')),
            'original': _reference(value.get('url')), 'retrieved': False}


def _file(value, mod_id, game_id):
    value = _object(value)
    if _integer(value.get('modId'), 'file modId') != mod_id:
        raise ExtractionError('File belongs to another project')
    if _integer(value.get('gameId'), 'file gameId') != game_id:
        raise ExtractionError('File belongs to another game')
    dependencies = []
    for dep in _list(value.get('dependencies', []), 'dependencies'):
        dep = _object(dep)
        dependencies.append({'modId': _integer(dep.get('modId'), 'dependency modId'),
                             'relationType': _integer(dep.get('relationType'), 'relationType')})
    hashes = []
    for entry in _list(value.get('hashes', []), 'hashes'):
        entry = _object(entry)
        hashes.append({'algo': _integer(entry.get('algo'), 'hash algorithm'),
                       'value': _text(entry.get('value'), 'hash value')})
    end_date = value.get('earlyAccessEndDate')
    if end_date is not None:
        _text(end_date, 'earlyAccessEndDate')
    length = _integer(value.get('fileLength'), 'fileLength', 0, 2**63-1)
    return {'id': _integer(value.get('id'), 'file ID'), 'modId': mod_id, 'gameId': game_id,
            'fileName': _text(value.get('fileName'), 'fileName'),
            'fileLength': length, 'fileLengthDecimal': str(length),
            'providedFields': [k for k in ('isAvailable', 'isEarlyAccessContent', 'earlyAccessEndDate', 'downloadUrl', 'dependencies', 'hashes', 'gameVersions') if k in value],
            'availability': _flag(value, 'isAvailable'),
            'earlyAccess': _flag(value, 'isEarlyAccessContent', nullable=True), 'earlyAccessEndDate': end_date,
            'downloadReference': _reference(value.get('downloadUrl')),
            'dependencies': dependencies, 'hashes': hashes,
            'gameVersions': [_text(v, 'gameVersion') for v in _list(value.get('gameVersions', []), 'gameVersions')],
            'downloadVerified': False, 'downloadAuthorizedByMapper': False}


def _pagination(value, count):
    if value is None:
        return {'state': 'not_provided', 'completeForQuery': False, 'completeImport': False}
    value = _object(value)
    index = _integer(value.get('index'), 'pagination index', 0)
    size = _integer(value.get('pageSize'), 'pageSize', 1, 50)
    actual = _integer(value.get('resultCount'), 'resultCount', 0, size)
    total = _integer(value.get('totalCount'), 'totalCount', 0, 2**63-1)
    if index + size > 10000 or actual != count or (actual and index + actual > total):
        raise ExtractionError('Inconsistent or outside-window pagination')
    complete = index == 0 and actual == total
    if complete:
        state = 'complete_for_captured_query'
    elif index + actual >= 10000 and total > 10000:
        state = 'window_exhausted'
    elif index + actual >= total:
        state = 'terminal_page_only'
    elif actual == 0:
        state = 'incomplete_empty_page'
    else:
        state = 'more_records_not_captured'
    return {'state': state, 'index': index, 'pageSize': size, 'resultCount': actual,
            'totalCount': total, 'completeForQuery': complete, 'completeImport': False}


def normalize_files_response(raw, *, expected_mod_id, expected_game_id):
    mod_id = _integer(expected_mod_id, 'expected mod ID')
    game_id = _integer(expected_game_id, 'expected game ID')
    envelope = _payload(raw)
    files = _unique([_file(f, mod_id, game_id) for f in _list(envelope.get('data'), 'data files')], 'file')
    return {'kind': 'curseforge_files_page', 'modId': mod_id, 'gameId': game_id,
            'files': files, 'pagination': _pagination(envelope.get('pagination'), len(files)),
            'scope': 'offline_schema_projection', 'fullSupportAccepted': False}


def normalize_project_response(raw, *, expected_mod_id, description_raw=None, files_raw=None):
    mod_id = _integer(expected_mod_id, 'expected mod ID')
    value = _object(_payload(raw).get('data'))
    if _integer(value.get('id'), 'mod ID') != mod_id:
        raise ExtractionError('Project response identity mismatch')
    game_id = _integer(value.get('gameId'), 'game ID')
    authors = []
    for author in _list(value.get('authors', []), 'authors'):
        author = _object(author)
        authors.append({'id': _integer(author.get('id'), 'author ID'),
                        'name': _text(author.get('name'), 'author name'),
                        'profile': _reference(author.get('url')), 'role': 'project_author',
                        'avatar': None, 'avatarState': 'not_in_documented_schema'})
    gallery = _unique([_asset(a, mod_id, 'project_screenshot') for a in _list(value.get('screenshots', []), 'screenshots')], 'gallery asset')
    latest = _unique([_file(f, mod_id, game_id) for f in _list(value.get('latestFiles', []), 'latestFiles')], 'latest file')
    description = None
    if description_raw is not None:
        description = {'format': 'html', 'raw': _text(_payload(description_raw).get('data'), 'description'),
                       'renderable': False, 'completeness': 'supplied_description_field_only',
                       'ownershipVerified': False, 'ownershipBasis': 'caller_supplied_pairing'}
    fields = ('authors', 'screenshots', 'logo', 'latestFiles', 'allowModDistribution', 'isAvailable')
    return {'kind': 'curseforge_project', 'identity': {'modId': mod_id, 'gameId': game_id},
            'name': _text(value.get('name'), 'project name'),
            'summary': _text(value.get('summary', ''), 'summary'),
            'source': _reference(_object(value.get('links', {})).get('websiteUrl')),
            'authors': _unique(authors, 'author'),
            'logo': _asset(value['logo'], mod_id, 'project_logo') if value.get('logo') is not None else None,
            'gallery': gallery, 'latestFiles': latest,
            'latestFilesAreCompleteHistory': False,
            'distributionPermission': _flag(value, 'allowModDistribution', nullable=True),
            'projectSearchAvailability': _flag(value, 'isAvailable'),
            'providedFields': [f for f in fields if f in value],
            'description': description,
            'filePage': normalize_files_response(files_raw, expected_mod_id=mod_id, expected_game_id=game_id) if files_raw is not None else None,
            'scope': 'offline_schema_projection', 'liveAcceptance': False,
            'fullSupportAccepted': False}


def _flag_receipt(flag):
    state, value = flag['state'], flag['value']
    if state not in ('provided', 'unknown', 'not_provided') or (type(value) is not bool if state == 'provided' else value is not None):
        raise ExtractionError('Invalid normalized flag')
    return {'state': state, 'value': value}


def _reference_state(value):
    state = value['state']
    if state not in ('not_provided', 'invalid', 'reference_only'):
        raise ExtractionError('Invalid normalized reference state')
    return state


def receipt(project):
    """Whitelisted counts/IDs/states only: no prose, arbitrary keys or URLs."""
    if project.get('kind') != 'curseforge_project':
        raise ExtractionError('Expected normalized project')
    page = project['filePage']
    files = page['files'] if page else project['latestFiles']
    pagination = None
    if page:
        p = page['pagination']
        pagination = _pagination(None if p['state'] == 'not_provided' else p, len(files))
    fields = ('authors', 'screenshots', 'logo', 'latestFiles', 'allowModDistribution', 'isAvailable')
    return {'kind': 'curseforge_project',
            'identity': {k: _integer(project['identity'][k], k) for k in ('modId', 'gameId')},
            'authorIds': [_integer(a['id'], 'author ID') for a in project['authors']],
            'galleryIds': [_integer(a['id'], 'asset ID') for a in project['gallery']],
            'logoId': _integer(project['logo']['id'], 'logo ID') if project['logo'] else None,
            'distributionPermission': _flag_receipt(project['distributionPermission']),
            'projectSearchAvailability': _flag_receipt(project['projectSearchAvailability']),
            'providedFields': [f for f in fields if f in project['providedFields']],
            'descriptionPresent': project['description'] is not None,
            'descriptionOwnershipVerified': False,
            'files': [{'id': _integer(f['id'], 'file ID'),
                       'fileLengthDecimal': str(_integer(f['fileLength'], 'fileLength', 0, 2**63-1)),
                       'availability': _flag_receipt(f['availability']), 'earlyAccess': _flag_receipt(f['earlyAccess']),
                       'downloadReferenceState': _reference_state(f['downloadReference']),
                       'downloadVerified': False} for f in files],
            'pagination': pagination,
            'latestFilesAreCompleteHistory': False, 'liveAcceptance': False,
            'fullSupportAccepted': False}
