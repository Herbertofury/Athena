"""Bounded offline Hangar evidence, never a collector or download executor."""
from __future__ import annotations

import copy
from dataclasses import dataclass
from datetime import datetime
import hashlib
import importlib.util
import ipaddress
import math
from pathlib import Path
import re
from urllib.parse import urlsplit

_SPEC = importlib.util.spec_from_file_location(
    "_hangar_extraction_helpers", Path(__file__).resolve().parents[1] / "site-extraction-lab" / "extractors.py")
_HELPERS = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(_HELPERS)
ORIGIN = "https://hangar.papermc.io"
MAX_BYTES = 1024 * 1024
MAX_DEPTH = 24
MAX_NODES = 20000
MAX_ITEMS = 4096
MAX_TEXT = 262144


@dataclass(frozen=True)
class Response:
    """Transport evidence supplied by caller; no network or header persistence."""
    request_url: str
    final_url: str
    captured_at: str
    status: int
    content_type: str
    body: bytes
    byte_count: int
    complete: bool


@dataclass(frozen=True)
class Evidence:
    """Immutable serialized evidence. Decoded accessors always return fresh copies.

    Private raw material is retained for bounded responses, even rejected ones.
    receipt() is the only publication-oriented projection and excludes prose.
    """
    _raw: bytes
    _serialized_record: str | None
    _serialized_receipt: str

    @property
    def raw_body(self):
        return self._raw

    @property
    def record(self):
        return _HELPERS.json_loads(self._serialized_record) if self._serialized_record is not None else None

    def receipt(self):
        return _HELPERS.json_loads(self._serialized_receipt)

    @property
    def accepted(self):
        return self.receipt()["outcome"] == "accepted"


class _Rejected(ValueError):
    pass


def _require(condition, reason):
    if not condition:
        raise _Rejected(reason)


def _integer(value):
    return type(value) is int and 0 < value <= 2**63 - 1


def _timestamp(value):
    if not isinstance(value, str) or len(value) > 64:
        return None
    try:
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return value if result.tzinfo is not None and result.utcoffset() is not None else None
    except ValueError:
        return None


def _reference(value):
    """A safe reference projection, not permission to request its destination."""
    _require(isinstance(value, str) and len(value) <= 8192, "unsafe_reference")
    if value == "":
        return ""  # Preserve explicitly empty optional references.
    _require(value == value.strip() and not re.search(r"[\\\s\x00-\x1f\x7f]", value), "unsafe_reference")
    _require(not re.search(r"%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)", value, re.I), "unsafe_reference")
    clean = _HELPERS.public_url(value)
    _require(clean is not None, "unsafe_reference")
    parsed = urlsplit(value)
    host = parsed.hostname
    _require(parsed.scheme in ("https", "http") and host and not parsed.username and not parsed.password,
             "unsafe_reference")
    _require(parsed.port in (None, 80, 443), "unsafe_reference")
    _require(host.lower() not in ("localhost", "localhost.localdomain") and
             not host.lower().endswith((".localhost", ".local", ".internal")), "unsafe_reference")
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        _require("." in host and not re.fullmatch(r"[0-9.]+", host), "unsafe_reference")
    else:
        _require(ip.is_global, "unsafe_reference")
    return clean


def _body(raw):
    body = _HELPERS.markdown_body(raw, ORIGIN)
    for event in body["events"]:
        for key in ("url", "src"):
            if event.get(key):
                try:
                    event[key] = _reference(event[key])
                except (ValueError, TypeError):
                    event[key] = None
                    event["referenceRejected"] = True
    return body


def _depth_before_decode(text):
    depth, quoted, escaped = 0, False, False
    for char in text:
        if quoted:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                quoted = False
        elif char == '"':
            quoted = True
        elif char in "[{":
            depth += 1
            _require(depth <= MAX_DEPTH, "depth_limit")
        elif char in "]}":
            depth -= 1


def _bounded_tree(tree):
    pending, count = [(tree, 0)], 0
    while pending:
        value, depth = pending.pop()
        count += 1
        _require(count <= MAX_NODES, "node_limit")
        _require(depth <= MAX_DEPTH, "depth_limit")
        if isinstance(value, (dict, list)):
            _require(len(value) <= MAX_ITEMS, "item_limit")
            if isinstance(value, dict):
                for key, item in value.items():
                    key.encode("utf-8")
                    _require(len(key) <= 512, "key_limit")
                    if key.lower().endswith("url") and item is not None:
                        _reference(item)
                values = value.values()
            else:
                values = value
            pending.extend((item, depth + 1) for item in values)
        elif isinstance(value, str):
            _require(len(value) <= MAX_TEXT, "text_limit")
            # UTF-8 roundtrip rejects lone surrogate escapes as well.
            value.encode("utf-8")
        elif isinstance(value, float):
            _require(math.isfinite(value), "nonfinite_number")


def _optional(obj, key, kind):
    if key in obj and obj[key] is not None:
        _require(isinstance(obj[key], kind), "invalid_field_type")


def _state(obj, key):
    if key not in obj:
        return "unknown"
    if obj[key] is None:
        return "null"
    return "empty" if obj[key] in ("", [], {}) else "present"


def _platforms(obj, key, element_kind):
    _optional(obj, key, dict)
    for values in (obj.get(key) or {}).values():
        _require(isinstance(values, list), "invalid_platform_mapping")
        _require(all(isinstance(value, element_kind) for value in values), "invalid_platform_mapping")


def _object_record(obj, kind, project_id, version_id):
    _require(isinstance(obj, dict), "non_object")
    _require(obj.get("visibility") == "public", "non_public_or_unknown_visibility")
    _require(_integer(obj.get("id")) and obj["id"] == (version_id if kind == "version" else project_id),
             "identity_mismatch")
    _require(isinstance(obj.get("name"), str) and bool(obj["name"]), "missing_display_name")
    _optional(obj, "description", str)
    record = {"kind": kind, "projectId": project_id, "source": obj,
              "visibility": "public", "scope": "selected_object_only"}
    if kind == "project":
        namespace = obj.get("namespace")
        _require(isinstance(namespace, dict), "missing_namespace")
        for key in ("owner", "slug"):
            _require(isinstance(namespace.get(key), str) and bool(namespace[key]), "missing_namespace")
        _optional(obj, "mainPageContent", str)
        _platforms(obj, "supportedPlatforms", str)
        record.update(namespace=copy.deepcopy(namespace), ownerIdentityKind="namespace_not_person",
                      projectIcon={"state": _state(obj, "avatarUrl"),
                                   "reference": _reference(obj["avatarUrl"]) if obj.get("avatarUrl") else None},
                      mainPageContentState=_state(obj, "mainPageContent"))
        if isinstance(obj.get("mainPageContent"), str):
            record["mainPageBody"] = _body(obj["mainPageContent"])
    else:
        _require(_integer(obj.get("projectId")) and obj["projectId"] == project_id, "project_identity_mismatch")
        for key in ("downloads", "channel", "pluginDependencies"):
            _optional(obj, key, dict)
        _optional(obj, "reviewState", str)
        channel = obj.get("channel")
        if channel is not None:
            for key in ("name", "description", "color", "createdAt"):
                _optional(channel, key, str)
            _optional(channel, "flags", list)
            if channel.get("flags") is not None:
                _require(all(isinstance(flag, str) for flag in channel["flags"]), "invalid_channel_flags")
        _platforms(obj, "platformDependencies", str)
        _platforms(obj, "platformDependenciesFormatted", str)
        _platforms(obj, "pluginDependencies", dict)
        for dependencies in (obj.get("pluginDependencies") or {}).values():
            for dependency in dependencies:
                for key in ("name", "platform"):
                    _optional(dependency, key, str)
                if dependency.get("required") is not None:
                    _require(type(dependency["required"]) is bool, "invalid_dependency_required")
                if dependency.get("projectId") is not None:
                    _require(_integer(dependency["projectId"]), "invalid_dependency_project")
        downloads = {}
        for platform, download in (obj.get("downloads") or {}).items():
            _require(isinstance(download, dict), "invalid_download")
            _optional(download, "fileInfo", dict)
            info = download.get("fileInfo")
            if info is not None:
                _optional(info, "name", str)
                _optional(info, "sha256Hash", str)
                if info.get("sizeBytes") is not None:
                    _require(type(info["sizeBytes"]) is int and 0 <= info["sizeBytes"] <= 2**63 - 1,
                             "invalid_file_size")
            downloads[platform] = {"externalUrlState": _state(download, "externalUrl"),
                                   "downloadUrlState": _state(download, "downloadUrl"),
                                   "fileInfoState": _state(download, "fileInfo"),
                                   "externalReference": _reference(download["externalUrl"]) if download.get("externalUrl") else None,
                                   "storedFileReference": _reference(download["downloadUrl"]) if download.get("downloadUrl") else None,
                                   "externalResolution": "not_resolved" if download.get("externalUrl") else "not_applicable"}
        record.update(versionId=version_id, versionIdentityKind="provider_display_identity",
                      downloads=downloads, downloadState=_state(obj, "downloads"),
                      reviewStateState=_state(obj, "reviewState"), channelState=_state(obj, "channel"),
                      immutableExternalReleaseEstablished=False, fileBytesVerified=False,
                      securityOrCompatibilityEstablished=False)
        if isinstance(obj.get("description"), str):
            record["descriptionBody"] = _body(obj["description"])
    return record


def _capture(response, kind, project_id, version_id=None):
    import json
    receipt = {"provider": "hangar", "kind": kind, "outcome": "rejected", "reason": "invalid_envelope",
               "scope": "selected_object_only", "rawRetained": False}
    raw, record = b"", None
    try:
        _require(isinstance(response, Response), "invalid_envelope")
        # Bound raw retention before any decoding. Oversized input is not copied.
        if type(response.body) is bytes and len(response.body) <= MAX_BYTES:
            raw = response.body
            receipt.update(rawRetained=True, observedBytes=len(raw),
                           bodySha256=hashlib.sha256(raw).hexdigest())
        _require(_integer(project_id) and (kind != "version" or _integer(version_id)), "invalid_requested_identity")
        path = f"/api/v1/projects/{project_id}"
        if kind == "version":
            path += f"/versions/{version_id}"
        elif kind == "main_page":
            path = f"/api/v1/pages/main/{project_id}"
        expected = ORIGIN + path
        receipt.update(projectId=project_id)
        if kind == "version":
            receipt["versionId"] = version_id
        _require(response.request_url == expected, "request_scope_mismatch")
        receipt["requestUrl"] = expected
        _require(response.final_url == expected, "redirect_or_final_scope_mismatch")
        receipt["finalUrl"] = expected
        capture = _timestamp(response.captured_at)
        _require(capture is not None, "invalid_capture_time")
        receipt["capturedAt"] = capture
        _require(type(response.status) is int and 100 <= response.status <= 599, "invalid_status")
        receipt["status"] = response.status
        _require(type(response.complete) is bool, "invalid_completeness")
        receipt["complete"] = response.complete
        _require(type(response.body) is bytes, "invalid_body_type")
        _require(len(response.body) <= MAX_BYTES, "byte_limit")
        _require(type(response.byte_count) is int and response.byte_count == len(raw), "byte_count_mismatch")
        _require(response.complete, "incomplete_response")
        _require(response.status == 200, "http_error")
        _require(isinstance(response.content_type, str) and len(response.content_type) <= 128, "invalid_content_type")
        parts = response.content_type.split(";")
        media_type = parts[0].strip().lower()
        for parameter in parts[1:]:
            _require(parameter.strip().lower() in ('charset=utf-8', 'charset="utf-8"'),
                     "unsupported_content_type_parameter")
        _require(media_type == ("text/plain" if kind == "main_page" else "application/json"), "unexpected_content_type")
        receipt["contentType"] = media_type
        text = raw.decode("utf-8")
        if kind == "main_page":
            _require(len(text) <= MAX_TEXT, "text_limit")
            record = {"kind": kind, "projectId": project_id, "source": text,
                      "body": _body(text),
                      "scope": "independent_page_response", "projectVisibilityEstablished": False}
        else:
            _depth_before_decode(text)
            obj = _HELPERS.json_loads(text)
            _bounded_tree(obj)
            record = _object_record(obj, kind, project_id, version_id)
        receipt.update(outcome="accepted", reason=None)
        record["provenance"] = copy.deepcopy(receipt)
    except _Rejected as error:
        receipt["reason"] = str(error)
    except (ValueError, TypeError, UnicodeError, RecursionError, OverflowError):
        receipt["reason"] = "malformed_payload"
    return Evidence(raw, json.dumps(record, ensure_ascii=True, allow_nan=False) if record is not None else None,
                    json.dumps(receipt, ensure_ascii=True, allow_nan=False))


def capture_project(response, project_id):
    return _capture(response, "project", project_id)


def capture_version(response, project_id, version_id):
    return _capture(response, "version", project_id, version_id)


def capture_main_page(response, project_id):
    """Independent body evidence, never proof of project visibility or a null fill."""
    return _capture(response, "main_page", project_id)
