"""Bounded offline Crossref singleton observations. Not transport or rendering."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
import math
from pathlib import Path
import re
import sys
from types import MappingProxyType
from urllib.parse import unquote, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'site-extraction-lab'))
from extractors import ExtractionError, json_loads, sha256
from lxml import etree

MAX_BODY_BYTES = 2_000_000
MAX_TOTAL_BYTES = 8_000_000
MAX_CAPTURES = 32
MAX_NODES = 100_000
MAX_DEPTH = 48
MAX_METADATA_BYTES = 100_000
DATE_KEYS = ('published', 'issued', 'published-online', 'published-print',
             'created', 'deposited', 'indexed')
GATES = ('authorIdentityVerified', 'fullTextRetrieved', 'licenseRightsVerified',
         'publicationRecencyVerified', 'safeRenderingAccepted',
         'completeMediaAccepted', 'targetAccepted')


def validate(value, byte_limit=MAX_BODY_BYTES):
    """Exact builtins only, before snapshotting; no user-defined copy hooks."""
    nodes = size = 0
    active = set()
    def visit(item, depth):
        nonlocal nodes, size
        nodes += 1
        if nodes > MAX_NODES or depth > MAX_DEPTH:
            raise ExtractionError('structure_limit')
        kind = type(item)
        if kind is str:
            try:
                size += len(item.encode('utf-8'))
            except UnicodeError:
                raise ExtractionError('unicode_invalid') from None
        elif kind is float:
            if not math.isfinite(item):
                raise ExtractionError('nonfinite')
        elif kind is int:
            if item.bit_length() > 4096:
                raise ExtractionError('integer_limit')
        elif kind in (dict, list):
            if id(item) in active:
                raise ExtractionError('cycle')
            active.add(id(item))
            if kind is dict:
                for key, val in item.items():
                    if type(key) is not str:
                        raise ExtractionError('key_type')
                    visit(key, depth + 1)
                    visit(val, depth + 1)
            else:
                for val in item:
                    visit(val, depth + 1)
            active.remove(id(item))
        elif item is not None and kind is not bool:
            raise ExtractionError('builtin_type')
        if size > byte_limit:
            raise ExtractionError('string_limit')
    visit(value, 0)


def freeze(value):
    if type(value) is dict:
        return MappingProxyType({k: freeze(v) for k, v in value.items()})
    if type(value) is list:
        return tuple(freeze(v) for v in value)
    return value


def bounded_json(raw):
    if type(raw) is not bytes or len(raw) > MAX_BODY_BYTES:
        raise ExtractionError('body_limit_or_type')
    try:
        # json.loads(bytes) would silently accept UTF-16/32; explicitly UTF-8.
        value = json_loads(raw.decode('utf-8'))
        validate(value)
        return value
    except (ValueError, UnicodeError, RecursionError):
        raise ExtractionError('invalid_json') from None


def doi(value):
    # Conservative ASCII DOI subset. No punctuation stripping or URI decoding.
    if type(value) is not str or len(value) > 2048 or not re.fullmatch(
            r'10\.[0-9]{4,9}/[\x21-\x7e]+', value) or '\\' in value:
        raise ExtractionError('invalid_doi')
    return value.lower()


def request_identity(value):
    if type(value) is not str or len(value) > 8192 or any(
            ord(c) < 33 or ord(c) > 126 for c in value) or '\\' in value:
        raise ExtractionError('invalid_route')
    p = urlsplit(value)
    if (p.scheme != 'https' or p.netloc != 'api.crossref.org'
            or p.query or p.fragment or '?' in value or '#' in value
            or not p.path.startswith('/works/')):
        raise ExtractionError('invalid_route')
    tail = p.path[len('/works/'):]
    if re.search(r'%(?![0-9A-Fa-f]{2})', tail):
        raise ExtractionError('invalid_route')
    try:
        decoded = unquote(tail, encoding='utf-8', errors='strict')
    except UnicodeError:
        raise ExtractionError('invalid_route') from None
    # One decoding pass only; a literal percent in a DOI must be percent-encoded.
    return doi(decoded)


@dataclass(frozen=True)
class Field:
    state: str
    value: object = None


def field(obj, key, predicate=lambda v: True, transform=freeze):
    if key not in obj:
        return Field('missing')
    value = obj[key]
    if value is None:
        return Field('null')
    if not predicate(value):
        return Field('invalid', freeze(value))
    if value == '' or value == [] or value == {}:
        return Field('empty', freeze(value))
    return Field('present', transform(value))


def string(obj, key):
    return field(obj, key, lambda v: type(v) is str)


@dataclass(frozen=True)
class DateEvidence:
    parts: Field
    precisions: tuple[str, ...]
    date_time: Field
    timestamp: Field  # Literal source number. No unit conversion or inference.
    raw: object


def date_evidence(obj):
    def parts_ok(v):
        if type(v) is not list:
            return False
        for row in v:
            if type(row) is not list or not 1 <= len(row) <= 3 or any(type(n) is not int for n in row):
                return False
            try:
                date(row[0], row[1] if len(row) > 1 else 1, row[2] if len(row) > 2 else 1)
            except (ValueError, OverflowError):
                return False
        return True
    parts = field(obj, 'date-parts', parts_ok)
    return DateEvidence(parts, tuple(('year', 'month', 'day')[len(x)-1]
                        for x in parts.value) if parts.state == 'present' else (),
                        string(obj, 'date-time'), field(obj, 'timestamp',
                        lambda v: type(v) in (int, float)), freeze(obj))


def date_field(obj, key):
    return field(obj, key, lambda v: type(v) is dict, date_evidence)


@dataclass(frozen=True)
class Update:
    direction: str
    doi: Field
    type: Field
    source: Field
    label: Field
    updated: Field
    raw: object


@dataclass(frozen=True)
class Relation:
    kind: str
    id_type: Field
    id: Field
    asserted_by: Field
    raw: object


@dataclass(frozen=True)
class License:
    url: Field
    content_version: Field
    start: Field
    delay_in_days: Field
    raw: object


@dataclass(frozen=True)
class Link:
    url: Field
    mime: Field
    content_version: Field
    intended_application: Field
    raw: object


def typed_list(obj, key, convert):
    return field(obj, key, lambda v: type(v) is list and all(type(x) is dict for x in v),
                 lambda v: tuple(convert(x) for x in v))


def updates(obj, key):
    return typed_list(obj, key, lambda x: Update(key, string(x, 'DOI'),
        string(x, 'type'), string(x, 'source'), string(x, 'label'),
        date_field(x, 'updated'), freeze(x)))


def relations(obj):
    return field(obj, 'relation', lambda v: type(v) is dict and all(
        type(a) is list and all(type(x) is dict for x in a) for a in v.values()),
        lambda v: tuple(Relation(kind, string(x, 'id-type'), string(x, 'id'),
            string(x, 'asserted-by'), freeze(x)) for kind, rows in v.items() for x in rows))


@dataclass(frozen=True)
class Projection:
    state: str
    interpretation: str
    events: tuple
    complete: bool = False
    safe_render: bool = False


def project_abstract(raw):
    """Diagnostic ordered XML events only, never HTML/render-safe output."""
    if '<' not in raw:
        return Projection('plaintext', 'literal', (('text', raw),))
    if '<!DOCTYPE' in raw.upper() or '<!ENTITY' in raw.upper():
        return Projection('rejected_declaration', 'none', ())
    try:
        parser = etree.XMLParser(resolve_entities=False, load_dtd=False,
            no_network=True, recover=False, huge_tree=False, remove_comments=False)
        # A local wrapper interprets unbound jats prefixes; original is untouched.
        root = etree.fromstring(('<crossref-fragment xmlns:jats="http://jats.nlm.nih.gov">'
                                 + raw + '</crossref-fragment>').encode('utf-8'), parser)
        events = []
        if root.text:
            events.append(('text', root.text))
        count = 0
        def walk(node, depth):
            nonlocal count
            count += 1
            if count > MAX_NODES or depth > MAX_DEPTH:
                raise ValueError('projection limit')
            if type(node.tag) is str:
                events.append(('start', node.tag, tuple(node.attrib.items())))
                if node.text:
                    events.append(('text', node.text))
                for child in node:
                    walk(child, depth + 1)
                events.append(('end', node.tag))
            else:
                events.append(('opaque', etree.tostring(node, encoding='unicode', with_tail=False)))
            if node.tail:
                events.append(('text', node.tail))
        for node in root:
            walk(node, 1)
        return Projection('xml_diagnostic', 'local_jats_wrapper', tuple(events))
    except Exception:
        # Projection is optional: even unexpected helper failures must not lose raw evidence.
        return Projection('projection_error', 'local_jats_wrapper', ())


@dataclass(frozen=True)
class Card:
    selected_doi: str
    source_doi: str
    envelope: object
    titles: object
    authors: Field
    abstract: Field
    abstract_projection: Projection | None
    dates: object
    update_to: Field
    updated_by: Field
    relations: Field
    licenses: Field
    links: Field


def card_from(envelope, selected):
    if (type(envelope) is not dict or envelope.get('status') != 'ok'
            or envelope.get('message-type') != 'work'
            or envelope.get('message-version') != '1.0.0'
            or type(envelope.get('message')) is not dict):
        raise ExtractionError('invalid_envelope')
    m = envelope['message']
    if doi(m.get('DOI')) != doi(selected):
        raise ExtractionError('doi_mismatch')
    abstract = string(m, 'abstract')
    return Card(selected, m['DOI'], freeze(envelope), MappingProxyType({k:
        field(m, k, lambda v: type(v) is list and all(type(x) is str for x in v))
        for k in ('title', 'subtitle', 'original-title', 'short-title', 'container-title', 'short-container-title')}),
        typed_list(m, 'author', freeze), abstract,
        project_abstract(abstract.value) if abstract.state in ('present', 'empty') else None,
        MappingProxyType({k: date_field(m, k) for k in DATE_KEYS}),
        updates(m, 'update-to'), updates(m, 'updated-by'), relations(m),
        typed_list(m, 'license', lambda x: License(string(x, 'URL'), string(x, 'content-version'),
            date_field(x, 'start'), field(x, 'delay-in-days', lambda v: type(v) is int and v >= 0), freeze(x))),
        typed_list(m, 'link', lambda x: Link(string(x, 'URL'), string(x, 'content-type'),
            string(x, 'content-version'), string(x, 'intended-application'), freeze(x))))


@dataclass(frozen=True)
class Observation:
    index: int
    capture: object
    body_sha256: str
    body_bytes: int
    error: str | None
    card: Card | None


@dataclass(frozen=True)
class Batch:
    selected_doi: str
    observations: tuple[Observation, ...]
    conflicting: bool


def reconcile(selected_doi, captures):
    doi(selected_doi)
    if type(captures) is not list or len(captures) > MAX_CAPTURES:
        raise ExtractionError('capture_limit_or_type')
    total = 0
    # Preflight every record before copying any. Caller type/cap failures abort;
    # source failures below remain observations rather than being overwritten.
    for capture in captures:
        if type(capture) is not dict or any(type(k) is not str for k in capture):
            raise ExtractionError('capture_type')
        raw = capture.get('body')
        if type(raw) is not bytes or len(raw) > MAX_BODY_BYTES:
            raise ExtractionError('body_limit_or_type')
        total += len(raw)
        if total > MAX_TOTAL_BYTES:
            raise ExtractionError('total_byte_limit')
        validate({k: v for k, v in capture.items() if k != 'body'}, MAX_METADATA_BYTES)
    observations = []
    for index, capture in enumerate(captures):
        raw = capture['body']
        card = None
        error = None
        try:
            for key in ('requestUrl', 'finalUrl'):
                if request_identity(capture.get(key)) != doi(selected_doi):
                    raise ExtractionError('route_doi_mismatch')
            if capture['requestUrl'] != capture['finalUrl']:
                raise ExtractionError('redirect_unsupported')
            if 'error' in capture and capture['error'] is not None:
                if type(capture['error']) is not str:
                    raise ExtractionError('invalid_transport_error')
                if capture['error']:
                    raise ExtractionError('transport_error')
            if type(capture.get('status')) is not int or capture['status'] != 200:
                raise ExtractionError('http_status')
            if capture.get('complete') is not True:
                raise ExtractionError('incomplete_capture')
            headers = capture.get('headers')
            if type(headers) is not dict or any(type(v) is not str for v in headers.values()):
                raise ExtractionError('invalid_headers')
            normalized = {}
            for key, value in headers.items():
                lower = key.lower()
                if lower in normalized:
                    raise ExtractionError('duplicate_header')
                normalized[lower] = value
            ct = normalized.get('content-type', '')
            if not re.fullmatch(r'application/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?', ct, re.I):
                raise ExtractionError('unsupported_content_type')
            card = card_from(bounded_json(raw), selected_doi)
        except (ExtractionError, ValueError):
            # Only our static codes leave the private observation.
            error = str(sys.exc_info()[1])
            if error not in ERROR_CODES:
                error = 'invalid_source'
        observations.append(Observation(index, freeze(capture), sha256(raw), len(raw), error, card))
    successful = {x.body_sha256 for x in observations if x.card is not None}
    return Batch(selected_doi, tuple(observations), len(successful) > 1)


ERROR_CODES = frozenset(('invalid_route', 'invalid_doi', 'route_doi_mismatch',
    'redirect_unsupported', 'http_status', 'incomplete_capture', 'invalid_headers',
    'duplicate_header', 'unsupported_content_type', 'invalid_json',
    'invalid_envelope', 'doi_mismatch', 'invalid_source',
    'transport_error', 'invalid_transport_error'))


def field_receipt(value):
    result = {'state': value.state}
    if value.state in ('present', 'empty') and type(value.value) is tuple:
        result['count'] = len(value.value)
    return result


def date_receipt(value):
    result = field_receipt(value)
    if value.state == 'present':
        result['dateParts'] = field_receipt(value.value.parts)
        result['precisions'] = list(value.value.precisions)
        result['dateTimeState'] = value.value.date_time.state
        result['timestampState'] = value.value.timestamp.state
    return result


def public_receipt(batch):
    """Construct, never redact, a strict whitelist: no source text/URLs/headers."""
    rows = []
    for observation in batch.observations:
        row = {'index': observation.index, 'bodySha256': observation.body_sha256,
               'bodyBytes': observation.body_bytes, 'error': observation.error,
               'acceptedSingleton': observation.card is not None}
        status = observation.capture.get('status')
        row['httpStatus'] = status if type(status) is int and 100 <= status <= 599 else None
        complete = observation.capture.get('complete')
        row['captureComplete'] = complete if type(complete) is bool else None
        for key in ('requestUrl', 'finalUrl'):
            value = observation.capture.get(key)
            row[key + 'Sha256'] = sha256(value) if type(value) is str else None
        c = observation.card
        if c is not None:
            row.update({'titles': {k: field_receipt(v) for k, v in c.titles.items()},
                'authors': field_receipt(c.authors), 'abstract': field_receipt(c.abstract),
                'dates': {k: date_receipt(v) for k, v in c.dates.items()},
                'updateTo': field_receipt(c.update_to), 'updatedBy': field_receipt(c.updated_by),
                'relations': field_receipt(c.relations), 'licenses': field_receipt(c.licenses),
                'links': field_receipt(c.links)})
            if c.abstract.state in ('present', 'empty'):
                row['abstract'].update({'sha256': sha256(c.abstract.value),
                    'bytes': len(c.abstract.value.encode('utf-8')),
                    'projectionState': c.abstract_projection.state,
                    'projectionComplete': False, 'safeRender': False})
        rows.append(row)
    return {'schema': 'crossref-work-receipt-v1', 'selectedDoiSha256': sha256(doi(batch.selected_doi)),
            'observations': rows, 'conflictingObservations': batch.conflicting,
            'gates': {key: False for key in GATES}}
