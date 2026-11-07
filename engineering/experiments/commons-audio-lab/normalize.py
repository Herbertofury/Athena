"""Isolated single-file projection; reuse Atlas's strict JSON decoder.
No request, playback, authentication, creator attribution or license grant occurs.
"""
import datetime
import importlib.util
import math
from pathlib import Path
import re
from urllib.parse import urlsplit, urlunsplit, unquote, parse_qsl

_spec = importlib.util.spec_from_file_location('atlas_audio_wire', Path(__file__).resolve().parents[1] / 'upstream-validation-lab/receipt_gate.py')
_wire = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_wire)

def require(ok, message):
    if not ok:
        raise ValueError(message)

def clean_url(value, host):
    require(isinstance(value, str) and not any(ord(c) < 33 for c in value), 'Invalid URL text')
    url = urlsplit(value)
    require(url.scheme == 'https' and url.hostname == host and url.port is None and url.username is None and url.password is None and not url.fragment, 'Unexpected URL origin')
    return url

def normalize_audio_metadata(raw, expected_title):
    require(isinstance(raw, str) and len(raw.encode('utf-8')) <= 1024 * 1024, 'Metadata size/type rejected')
    require(isinstance(expected_title, str) and expected_title.startswith('File:'), 'Expected a file title')
    data = _wire.decode_receipt(raw)
    require(isinstance(data, dict) and not any(k in data for k in ('error', 'warnings', 'continue')) and data.get('batchcomplete') is True, 'Incomplete API envelope')
    query = data.get('query')
    pages = query.get('pages') if isinstance(query, dict) else None
    require(isinstance(pages, list) and len(pages) == 1, 'Expected one file page')
    page = pages[0]
    require(isinstance(page, dict) and type(page.get('ns')) is int and page['ns'] == 6 and page.get('title') == expected_title and type(page.get('pageid')) is int and 0 < page['pageid'] <= 9223372036854775807 and 'missing' not in page and page.get('imagerepository') == 'local', 'Unexpected page identity')
    entries = page.get('imageinfo')
    require(isinstance(entries, list) and len(entries) == 1 and isinstance(entries[0], dict), 'Expected current file information')
    info = entries[0]
    require(not any(k in info for k in ('filehidden', 'userhidden')) and isinstance(info.get('user'), str) and bool(info['user']), 'Hidden or missing uploader')
    require(type(info.get('size')) is int and 0 < info['size'] <= 1024 * 1024 and isinstance(info.get('sha1'), str) and re.fullmatch('[a-f0-9]{40}', info['sha1']) is not None and info.get('mime') in ('application/ogg', 'audio/ogg'), 'Unreviewed file metadata')
    duration = info.get('duration')
    require(type(duration) in (int, float) and 0 < duration <= 300 and math.isfinite(duration), 'Invalid duration')
    timestamp = info.get('timestamp')
    require(isinstance(timestamp, str) and timestamp.endswith('Z'), 'Invalid upload timestamp')
    datetime.datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    source = clean_url(info.get('descriptionurl'), 'commons.wikimedia.org')
    require(not source.query and unquote(source.path).replace('_', ' ') == '/wiki/' + expected_title, 'Source title mismatch')
    original = clean_url(info.get('url'), 'upload.wikimedia.org')
    require(re.fullmatch(r'/wikipedia/commons/[0-9a-f]/[0-9a-f]{2}/[^/]+', original.path) is not None and unquote(original.path.rsplit('/', 1)[-1]).replace('_', ' ') == expected_title[5:], 'Original filename mismatch')
    require(all(key in ('utm_source', 'utm_campaign', 'utm_content') for key, _ in parse_qsl(original.query, keep_blank_values=True)), 'Unreviewed original-file query')
    return {'provider': 'Wikimedia Commons', 'id': str(page['pageid']), 'title': page['title'], 'source': urlunsplit(source), 'original': urlunsplit(original._replace(query='')), 'uploaded_by': info['user'], 'uploaded_at': timestamp, 'bytes': info['size'], 'sha1': info['sha1'], 'mime': info['mime'], 'duration_seconds': duration, 'media_kind': 'audio_candidate', 'access': 'unknown', 'creator': 'unknown', 'license': 'unknown', 'history': 'unknown', 'playback': 'unverified', 'raw_json': raw}
