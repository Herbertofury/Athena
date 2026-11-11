"""Offline npm metadata evidence. No fetching, installation or acceptance."""
from __future__ import annotations

import hashlib
import math
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from types import MappingProxyType
from urllib.parse import unquote, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'site-extraction-lab'))
from extractors import ExtractionError, json_loads, markdown_body

MAX_BODY_BYTES = 16 * 1024 * 1024
MAX_TOTAL_BYTES = 32 * 1024 * 1024
MAX_NODES = 300_000
MAX_DEPTH = 48
MAX_CAPTURES = 8
MAX_PROJECTION_CHARS = 65_536
FULL = 'application/json'
ABBREVIATED = 'application/vnd.npm.install-v1+json'
FIELDS = ('description', 'license', 'deprecated', 'dependencies', 'devDependencies',
          'peerDependencies', 'optionalDependencies', 'author', 'maintainers', '_npmUser', 'readme')


def digest(value):
    return hashlib.sha256(value).hexdigest()


def bounded(value, *, allow_bytes=False):
    """Check exact builtins before traversal/copy; reject cycles and shared giants."""
    nodes = 0
    size = 0
    stack = [(value, 0)]
    while stack:
        item, depth = stack.pop()
        nodes += 1
        if nodes > MAX_NODES or depth > MAX_DEPTH:
            raise ExtractionError('structural_limit')
        kind = type(item)
        if kind is str:
            if len(item) > MAX_TOTAL_BYTES:
                raise ExtractionError('byte_limit')
            try:
                size += len(item.encode('utf-8'))
            except UnicodeError:
                raise ExtractionError('invalid_unicode') from None
        elif kind is bytes and allow_bytes:
            size += len(item)
        elif kind is float:
            if not math.isfinite(item):
                raise ExtractionError('nonfinite')
        elif kind in (dict, list, tuple):
            count = len(item) * (2 if kind is dict else 1)
            if count + nodes + len(stack) > MAX_NODES:
                raise ExtractionError('structural_limit')
            if kind is dict:
                for key, child in item.items():
                    if type(key) is not str:
                        raise ExtractionError('invalid_key')
                    stack.append((key, depth + 1))
                    stack.append((child, depth + 1))
            else:
                stack.extend((child, depth + 1) for child in item)
        elif kind not in (int, bool, type(None)):
            raise ExtractionError('invalid_type')
        if size > MAX_TOTAL_BYTES:
            raise ExtractionError('byte_limit')


def freeze(value):
    if type(value) is dict:
        return MappingProxyType({key: freeze(child) for key, child in value.items()})
    if type(value) in (list, tuple):
        return tuple(freeze(child) for child in value)
    return value


def bounded_json(raw):
    if type(raw) is not bytes or len(raw) > MAX_BODY_BYTES:
        raise ExtractionError('body_limit_or_type')
    try:
        value = json_loads(raw.decode("utf-8", errors="strict"))
        bounded(value)
    except (ValueError, UnicodeError, RecursionError):
        raise ExtractionError('invalid_json') from None
    if type(value) is not dict:
        raise ExtractionError('invalid_document')
    return value


def package_name(value):
    if type(value) is not str or len(value) > 214 or not re.fullmatch(
            r'(?:@[a-z0-9._~-]+/)?[a-z0-9._~-]+', value):
        raise ExtractionError('invalid_package')
    return value


def endpoint(url, package):
    if type(url) is not str or len(url) > 1024 or any(ord(c) <= 32 for c in url):
        return False
    try:
        parts = urlsplit(url)
        return (parts.scheme == 'https' and parts.netloc == 'registry.npmjs.org'
                and not parts.query and not parts.fragment
                and unquote(parts.path, errors='strict') == '/' + package
                and not re.search(r'%(?![0-9a-fA-F]{2})', parts.path))
    except (ValueError, UnicodeError):
        return False


def field_state(source, key):
    if key not in source:
        return 'missing'
    value = source[key]
    if value is None:
        return 'null'
    expected = ((dict,) if key.endswith('Dependencies') or key == 'dependencies' else
                (list,) if key == 'maintainers' else (dict,) if key == '_npmUser' else
                (str, dict) if key in ('author', 'license') else (str,))
    if type(value) not in expected:
        return 'invalid'
    if type(value) is dict and key.endswith('ependencies') and any(type(v) is not str for v in value.values()):
        return 'invalid'
    if key == 'maintainers' and any(type(v) is not dict for v in value):
        return 'invalid'
    return 'empty' if len(value) == 0 else 'present'


def readme_receipt(source):
    result = {'state': 'unobserved' if source is None else field_state(source, 'readme'),
              'bytes': 0, 'sha256': None, 'projectionState': 'not_projected', 'mediaCount': 0}
    if source is not None and type(source.get('readme')) is str:
        raw = source['readme'].encode('utf-8')
        result.update(bytes=len(raw), sha256=digest(raw))
    return result


@dataclass(frozen=True)
class Report:
    """Private immutable data; serialize only receipt(), never this object."""
    observations: tuple
    package_sha256: str
    selector_sha256: str
    conflicts: int

    def receipt(self):
        return {'schema': 'npm-metadata-evidence-v1',
                'packageSha256': self.package_sha256, 'selectorSha256': self.selector_sha256,
                'captureCount': len(self.observations), 'conflictCount': self.conflicts,
                'observations': [
                    {'state': o['state'], 'bodySha256': o['body_sha256'],
                     'bodyBytes': o['body_bytes'], 'representation': o['representation'],
                     'rootFields': dict(o['root_states']), 'selectedFields': dict(o['selected_states']),
                     'versionCount': o['version_count'], 'selectedVersionSha256': o['selected_version_sha256'],
                     'rootReadme': dict(o['root_readme_receipt']),
                     'selectedReadme': dict(o['selected_readme_receipt'])}
                    for o in self.observations],
                'archiveVerified': False, 'authenticityVerified': False,
                'installAccepted': False, 'compatibilityAccepted': False,
                'playbackAccepted': False, 'targetAccepted': False}


def reconcile(captures, *, package, version=None, tag=None):
    """Retain every bounded observation; no success overwrites an earlier failure."""
    package_name(package)
    if (version is None) == (tag is None):
        raise ExtractionError('exactly_one_selector_required')
    selector = version if version is not None else tag
    if type(selector) is not str or not 0 < len(selector) <= 256 or any(ord(c) < 33 for c in selector):
        raise ExtractionError('invalid_selector')
    try:
        selector.encode('utf-8')
    except UnicodeError:
        raise ExtractionError('invalid_selector') from None
    if type(captures) not in (list, tuple) or not 1 <= len(captures) <= MAX_CAPTURES:
        raise ExtractionError('capture_limit_or_type')
    bounded(captures, allow_bytes=True)
    observations = []
    seen = {}
    selected_versions = set()
    conflicts = 0
    for capture in captures:
        if type(capture) is not dict:
            raise ExtractionError('invalid_capture')
        raw = capture.get('body')
        raw_ok = type(raw) is bytes and len(raw) <= MAX_BODY_BYTES
        obs = {'source_capture': freeze(capture), 'state': 'invalid_envelope',
               'body_sha256': digest(raw) if raw_ok else None,
               'body_bytes': len(raw) if type(raw) is bytes else 0,
               'representation': 'unknown', 'root_states': {}, 'selected_states': {},
               'version_count': 0, 'selected_version_sha256': None,
               'root_readme_receipt': readme_receipt(None), 'selected_readme_receipt': readme_receipt(None)}
        observations.append(obs)
        required = {'request_url', 'final_url', 'accept', 'status', 'content_type', 'body', 'complete'}
        if not required <= capture.keys() or capture.keys() - required - {'error'}:
            continue
        if (not raw_ok or type(capture['status']) is not int or not 100 <= capture['status'] <= 599
                or type(capture['complete']) is not bool or type(capture['content_type']) is not str
                or type(capture['accept']) is not str
                or ('error' in capture and type(capture['error']) is not str)):
            continue
        if not endpoint(capture['request_url'], package) or not endpoint(capture['final_url'], package):
            obs['state'] = 'provenance_mismatch'
            continue
        if capture.get('error'):
            obs['state'] = 'transport_error'
            continue
        if capture['status'] != 200:
            obs['state'] = 'access_denied' if capture['status'] in (401, 403) else 'http_failure'
            continue
        if not capture['complete']:
            obs['state'] = 'incomplete'
            continue
        content_type = capture['content_type'].split(';', 1)[0].strip().lower()
        if capture['accept'] not in (FULL, ABBREVIATED) or content_type != capture['accept']:
            obs['state'] = 'representation_mismatch'
            continue
        obs['representation'] = 'full' if content_type == FULL else 'abbreviated'
        try:
            root = bounded_json(raw)
        except ExtractionError:
            obs['state'] = 'invalid_json'
            continue
        obs['source_document'] = freeze(root)
        if root.get('name') != package or type(root.get('versions')) is not dict:
            obs['state'] = 'identity_mismatch'
            continue
        obs['version_count'] = len(root['versions'])
        obs['root_readme_receipt'] = readme_receipt(root)
        obs['root_states'] = {key: field_state(root, key) for key in FIELDS}
        chosen = version
        if tag is not None:
            tags = root.get('dist-tags')
            if type(tags) is not dict or type(tags.get(tag)) is not str or not tags[tag]:
                obs['state'] = 'tag_unresolved'
                continue
            chosen = tags[tag]
        if chosen not in root['versions']:
            obs['state'] = 'version_missing'
            continue
        selected = root['versions'][chosen]
        if type(selected) is not dict or selected.get('name') != package or selected.get('version') != chosen:
            obs['state'] = 'identity_mismatch'
            continue
        obs['selected_version'] = chosen
        obs['selected_version_sha256'] = digest(chosen.encode('utf-8'))
        obs['selected_readme_receipt'] = readme_receipt(selected)
        obs['selected_states'] = {key: field_state(selected, key) for key in FIELDS}
        obs['selected_source'] = freeze(selected)
        for label, source in (('root', root), ('selected', selected)):
            if type(source.get('readme')) is str:
                obs[label + '_readme_projection_state'] = 'omitted_budget'
                if len(source['readme']) <= MAX_PROJECTION_CHARS:
                    try:
                        projection = markdown_body(source['readme'])
                        bounded(projection)
                        obs[label + '_readme_projection'] = freeze(projection)
                        obs[label + '_readme_projection_state'] = 'incomplete_projection'
                        obs[label + '_readme_receipt']['mediaCount'] = sum(
                            event['type'] == 'media' for event in projection['events'])
                    except Exception:
                        # The exact source survives helper defects; never leak an exception.
                        obs[label + '_readme_projection_state'] = 'projection_failed'
                obs[label + '_readme_receipt']['projectionState'] = obs[label + '_readme_projection_state']
        obs['state'] = 'metadata_observed'
        # Compare only like representations. Different bytes are a retained
        # conflict/variation, never proof that a particular capture is newer.
        key = obs['representation']
        signature = (chosen, obs['body_sha256'])
        if ((key in seen and signature != seen[key])
                or (selected_versions and chosen not in selected_versions)):
            conflicts += 1
        selected_versions.add(chosen)
        seen.setdefault(key, signature)
    return Report(tuple(freeze(obs) for obs in observations), digest(package.encode()),
                  digest(('version:' if version is not None else 'tag:').encode() + selector.encode()), conflicts)
