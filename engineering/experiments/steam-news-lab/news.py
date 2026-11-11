"""Bounded offline ISteamNews observations. Private evidence is never a render surface.

No HTTP client, article fetching, authentication, playback or readiness inference.
Capture envelopes: requestUrl, finalUrl, status, complete, body (UTF-8 str/bytes).
Other bounded envelope fields are retained privately, never trusted as identity.
"""
from __future__ import annotations

from copy import deepcopy
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
from urllib.parse import parse_qsl, urlsplit

_SPEC = importlib.util.spec_from_file_location(
    "_steam_news_extractors", Path(__file__).resolve().parents[1] / "site-extraction-lab" / "extractors.py")
_HELPERS = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(_HELPERS)

MAX_CAPTURES = 32
MAX_BODY_BYTES = 262144
MAX_TOTAL_BODY_BYTES = 1048576
MAX_STRING_BYTES = 262144
MAX_NODES = 20000
MAX_ARRAY = 2048
MAX_DEPTH = 24
MAX_ENVELOPE_BYTES = 524288
PREFIX_BYTES = 1024
ENDPOINT = "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/"
_FIELDS = ("appid", "gid", "title", "author", "feedlabel", "feedname", "date",
           "contents", "url", "is_external_url", "feed_type", "tags")
_FLAGS = {key: False for key in ("wholeHistoryAccepted", "deletionAccepted",
    "paginationComplete", "externalArticleComplete", "mediaDecoded", "mediaPlayed",
    "publisherIdentityAccepted", "recommendationAccepted", "runtimeReady", "fullSupportAccepted")}


class NewsError(ValueError):
    """A bounded, fixed diagnostic; never includes source data."""


def _sha(raw):
    return hashlib.sha256(raw).hexdigest()


def _bounded(value, byte_limit=MAX_ENVELOPE_BYTES):
    """Validate exact builtin containers before copy; stop before large traversal."""
    stack = [(value, 0)]
    nodes = size = 0
    while stack:
        item, depth = stack.pop()
        nodes += 1
        if depth > MAX_DEPTH or nodes > MAX_NODES:
            raise NewsError("structure_limit")
        kind = type(item)
        if kind in (str, bytes):
            if len(item) > MAX_STRING_BYTES:
                raise NewsError("string_limit")
            try:
                raw = item.encode("utf-8") if kind is str else item
            except UnicodeError:
                raise NewsError("invalid_unicode") from None
            if len(raw) > MAX_STRING_BYTES:
                raise NewsError("string_limit")
            size += len(raw)
        elif kind is dict:
            if len(item) > MAX_ARRAY:
                raise NewsError("container_limit")
            if any(type(k) is not str for k in item):
                raise NewsError("invalid_key")
            stack.extend((v, depth + 1) for pair in item.items() for v in pair)
        elif kind is list:
            if len(item) > MAX_ARRAY:
                raise NewsError("container_limit")
            stack.extend((v, depth + 1) for v in item)
        elif kind is int:
            if item.bit_length() > 128:
                raise NewsError("integer_limit")
            size += 16
        elif kind is float:
            if not math.isfinite(item):
                raise NewsError("nonfinite")
            size += 8
        elif item is None or kind is bool:
            size += 1
        else:
            raise NewsError("invalid_type")
        if size > byte_limit:
            raise NewsError("envelope_limit")


def _uint(value, maximum=4294967295, positive=False):
    return type(value) is int and (1 if positive else 0) <= value <= maximum


def _query(url, selected):
    if type(url) is not str or len(url) > 4096 or any(ord(c) <= 32 or ord(c) == 127 for c in url):
        raise NewsError("request_identity_invalid")
    try:
        p = urlsplit(url)
        if p.scheme != "https" or p.netloc != "api.steampowered.com" or p.path != "/ISteamNews/GetNewsForApp/v2/" or p.fragment:
            raise NewsError("request_identity_invalid")
        pairs = parse_qsl(p.query, keep_blank_values=True, strict_parsing=True, max_num_fields=7)
    except ValueError:
        raise NewsError("request_identity_invalid") from None
    query = {}
    for key, val in pairs:
        if key in query or key not in {"appid", "maxlength", "count", "enddate", "feeds", "format"}:
            raise NewsError("query_invalid")
        query[key] = val
    if "appid" not in query:
        raise NewsError("query_invalid")
    for key in ("appid", "maxlength", "count", "enddate"):
        if key in query:
            raw = query[key]
            if not re.fullmatch(r"0|[1-9][0-9]{0,9}", raw):
                raise NewsError("query_invalid")
            query[key] = int(raw)
            if not _uint(query[key], positive=key in ("appid", "count")):
                raise NewsError("query_invalid")
    if query["appid"] != selected:
        raise NewsError("request_appid_mismatch")
    if "format" in query and query["format"] != "json":
        raise NewsError("query_invalid")
    if "feeds" in query and not re.fullmatch(r"[A-Za-z0-9_-]+(?:,[A-Za-z0-9_-]+)*", query["feeds"]):
        raise NewsError("query_invalid")
    return query


def _json(raw):
    # Bound lexical nesting before invoking the strict shared decoder.
    depth = 0
    quoted = escaped = False
    for c in raw:
        if quoted:
            if escaped:
                escaped = False
            elif c == "\\":
                escaped = True
            elif c == '"':
                quoted = False
        elif c == '"':
            quoted = True
        elif c in "[{":
            depth += 1
            if depth > MAX_DEPTH:
                raise NewsError("structure_limit")
        elif c in "]}":
            depth -= 1
    try:
        value = _HELPERS.json_loads(raw)
    except (ValueError, TypeError, RecursionError):
        raise NewsError("json_invalid") from None
    _bounded(value)
    return value


def _state(row, key):
    if key not in row:
        return "missing"
    v = row[key]
    if v is None:
        return "null"
    if key in ("appid", "date", "feed_type"):
        return "present" if _uint(v, positive=key == "appid") else "malformed"
    if key == "is_external_url":
        return "present" if type(v) is bool else "malformed"
    if key == "tags":
        return ("empty" if not v else "present") if type(v) is list and all(type(t) is str for t in v) else "malformed"
    if type(v) is not str:
        return "malformed"
    if not v:
        return "empty"
    if key == "url" and _HELPERS.public_url(v) is None:
        return "malformed"
    return "present"


def _projection(raw):
    result = {"format": "empty" if raw == "" else "plain", "state": "plain_preserved",
              "projectionComplete": False, "mediaCount": 0, "eventCount": 0,
              "unresolvedReferenceCount": 0, "body": None}
    if raw == "":
        result["state"] = "empty_preserved"
    elif re.search(r"\[(?:/?[A-Za-z][A-Za-z0-9_]*(?:=[^\]]*)?|\*)\]", raw):
        result.update(format="bbcode", state="unsupported_bbcode")
    elif re.search(r"<\s*(?:/?[A-Za-z]|!|\?)", raw):
        result.update(format="html", state="partial_html")
        try:
            node = _HELPERS.document("<div>" + raw + "</div>")
            # No redirect-article URL used as a speculative publisher base.
            body = _HELPERS.ordered_body(node, origin="", completeness="partial_projection")
            body["projectionComplete"] = False
            result.update(body=body, eventCount=len(body["events"]),
                          mediaCount=sum(e["type"] == "media" for e in body["events"]))
            unresolved = 0
            for element in node.iter():
                for key in ("src", "data-src", "data-full", "poster", "href", "data-href"):
                    value = element.get(key)
                    if value and not _HELPERS.public_url(value):
                        unresolved += 1
                if element.get("srcset"):
                    for part in element.get("srcset").split(","):
                        if not part.strip() or not _HELPERS.public_url(part.strip().split()[0]):
                            unresolved += 1
            result["unresolvedReferenceCount"] = unresolved
        except Exception:
            # A broken projection must not discard the exact source field.
            result.update(state="projection_failed", body=None, mediaCount=0, eventCount=0)
    return result


class NewsEvidence:
    """All access is a fresh copy; public receipts never derive from mutable exports."""
    def __init__(self, attempts, records, receipt):
        self.__attempts = deepcopy(attempts)
        self.__records = deepcopy(records)
        self.__receipt = deepcopy(receipt)

    @property
    def attempts(self):
        return deepcopy(self.__attempts)

    @property
    def records(self):
        return deepcopy(self.__records)

    def receipt(self):
        return deepcopy(self.__receipt)


def collect_news(selected_appid, captures):
    """Retain ordered bounded observations; no failure establishes absence/deletion.

    Invalid top-level selection/container raises NewsError. Per-capture failures
    remain ordered attempts. An over-budget capture is rejected before copying:
    its body is not retained; only a fixed limit state remains in that attempt.
    """
    if not _uint(selected_appid, positive=True):
        raise NewsError("selected_appid_invalid")
    if type(captures) is not list or len(captures) > MAX_CAPTURES:
        raise NewsError("captures_invalid")
    attempts, records, receipts = [], [], []
    identities = {}
    total_bytes = 0
    for index, envelope in enumerate(captures):
        attempt = {"index": index, "state": "envelope_invalid", "source": None, "rows": []}
        public = {"state": "envelope_invalid", "bodyBytes": 0, "bodySha256": None,
                  "returnedCount": 0, "rows": []}
        try:
            if type(envelope) is not dict:
                raise NewsError("envelope_invalid")
            _bounded(envelope)
            body = envelope.get("body")
            if type(body) not in (str, bytes):
                raise NewsError("body_invalid")
            raw = body.encode("utf-8") if type(body) is str else body
            if len(raw) > MAX_BODY_BYTES:
                raise NewsError("body_limit")
            if total_bytes + len(raw) > MAX_TOTAL_BODY_BYTES:
                raise NewsError("total_body_limit")
            total_bytes += len(raw)
            attempt["source"] = deepcopy(envelope)
            attempt["bodyPrefix"] = raw[:PREFIX_BYTES]
            public.update(bodyBytes=len(raw), bodySha256=_sha(raw))
            query = _query(envelope.get("requestUrl"), selected_appid)
            if envelope.get("finalUrl") != envelope.get("requestUrl"):
                raise NewsError("redirect_or_final_identity_mismatch")
            if "redirected" in envelope and envelope["redirected"] is not False:
                raise NewsError("redirect_or_final_identity_mismatch")
            if "redirects" in envelope and envelope["redirects"] != []:
                raise NewsError("redirect_or_final_identity_mismatch")
            attempt["query"] = query
            if type(envelope.get("status")) is not int or envelope["status"] != 200:
                raise NewsError("http_status_failed")
            if envelope.get("complete") is not True:
                raise NewsError("capture_incomplete")
            for key in ("error", "transportError", "transportFailure", "failure"):
                if key in envelope:
                    failure = envelope[key]
                    if not (failure is None or failure is False or
                            (type(failure) is str and failure == "")):
                        raise NewsError("transport_failed")
            if "transportState" in envelope and envelope["transportState"] != "complete":
                raise NewsError("transport_failed")
            try:
                text = raw.decode("utf-8")
            except UnicodeError:
                raise NewsError("invalid_unicode") from None
            data = _json(text)
            attempt["decoded"] = data
            appnews_state = "malformed" if type(data) is not dict else "missing" if "appnews" not in data else "null" if data["appnews"] is None else "present" if type(data["appnews"]) is dict else "malformed"
            attempt["appnewsState"] = public["appnewsState"] = appnews_state
            if appnews_state != "present":
                raise NewsError("appnews_invalid")
            news = data["appnews"]
            attempt["responseFieldStates"] = {"appid": _state(news, "appid"),
                "count": "missing" if "count" not in news else "null" if news["count"] is None else "present" if _uint(news["count"]) else "malformed",
                "newsitems": "missing" if "newsitems" not in news else "null" if news["newsitems"] is None else "malformed" if type(news["newsitems"]) is not list else "empty" if not news["newsitems"] else "present"}
            public["responseFieldStates"] = deepcopy(attempt["responseFieldStates"])
            if not _uint(news.get("appid"), positive=True) or news["appid"] != selected_appid:
                raise NewsError("response_appid_mismatch")
            rows = news.get("newsitems")
            if type(rows) is not list:
                raise NewsError("newsitems_invalid")
            if len(rows) > query.get("count", 20):
                raise NewsError("returned_count_exceeds_request")
            attempt["responseCount"] = news.get("count")
            public["responseCount"] = news["count"] if _uint(news.get("count")) else None
            public["returnedCount"] = len(rows)
            if not _uint(news.get("count")):
                raise NewsError("response_count_invalid")
            if news["count"] < len(rows):
                raise NewsError("response_count_inconsistent")
            for row in rows:
                private = {"raw": deepcopy(row), "state": "row_invalid"}
                rpub = {"state": "row_invalid"}
                if type(row) is dict:
                    states = {k: _state(row, k) for k in _FIELDS}
                    private["fieldStates"] = states
                    rpub["fieldStates"] = deepcopy(states)
                    errors = []
                    if states["appid"] != "present" or row["appid"] != selected_appid:
                        errors.append("row_appid_mismatch")
                    if states["gid"] != "present" or not row.get("gid", "").strip():
                        errors.append("gid_invalid")
                    if states["date"] != "present":
                        errors.append("date_invalid")
                    elif "enddate" in query and row["date"] >= query["enddate"]:
                        errors.append("date_outside_scope")
                    if states["feedname"] != "present":
                        errors.append("feed_invalid")
                    elif "feeds" in query and row["feedname"] not in query["feeds"].split(","):
                        errors.append("feed_outside_scope")
                    provenance = "full_api_field" if query.get("maxlength") == 0 else "generated_blurb" if query.get("maxlength", 0) > 0 else "unspecified_length"
                    private.update(errors=errors, provenance=provenance)
                    rpub["provenance"] = provenance
                    if states["contents"] in ("present", "empty"):
                        content = row["contents"].encode("utf-8")
                        projection = _projection(row["contents"])
                        private.update(contents=row["contents"], contentsBytes=len(content), contentsSha256=_sha(content), projection=projection)
                        rpub.update(contentsBytes=len(content), contentsSha256=_sha(content),
                            projection={k: projection[k] for k in ("format", "state", "projectionComplete", "mediaCount", "eventCount", "unresolvedReferenceCount")})
                    private["state"] = rpub["state"] = "row_invalid" if errors else "observed"
                    if not errors:
                        key = (selected_appid, row["gid"])
                        scope = tuple(sorted(query.items()))
                        if key not in identities:
                            identities[key] = len(records)
                            records.append({"selectedAppID": selected_appid, "gid": row["gid"], "observations": [], "preferredObservation": None, "sameScopeConflict": False})
                        record = records[identities[key]]
                        digest = _sha(json.dumps(row, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode())
                        if any(o["scope"] == scope and o["rowSha256"] != digest for o in record["observations"]):
                            record["sameScopeConflict"] = True
                        observation = {"attemptIndex": index, "scope": scope, "rowSha256": digest, **deepcopy(private)}
                        record["observations"].append(observation)
                        old = record["preferredObservation"]
                        rank = {"full_api_field": 2, "generated_blurb": 1, "unspecified_length": 0}
                        if "contents" in private and (old is None or rank[provenance] > rank[record["observations"][old]["provenance"]]):
                            record["preferredObservation"] = len(record["observations"]) - 1
                attempt["rows"].append(private)
                public["rows"].append(rpub)
            attempt["state"] = public["state"] = "observed"
        except NewsError as exc:
            attempt["state"] = public["state"] = str(exc)
        attempts.append(attempt)
        receipts.append(public)
    receipt = {"schemaVersion": 1, "attemptCount": len(attempts), "recordCount": len(records),
               "sameScopeConflictCount": sum(r["sameScopeConflict"] for r in records),
               "attempts": receipts, "acceptance": deepcopy(_FLAGS)}
    return NewsEvidence(attempts, records, receipt)
