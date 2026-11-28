#!/usr/bin/env python3
"""Bounded, conditional RSS/Atom/JSON collection for trusted publisher policies.

Framework-independent and standard-library-only. Product catalogs supply Source
policies; this module never installs software, logs in, or fetches arbitrary URLs.
"""
from __future__ import annotations
import argparse
import concurrent.futures
import datetime as dt
from email.utils import parsedate_to_datetime
from hashlib import sha256
from html import unescape
from html.parser import HTMLParser
import json
import ipaddress
import os
from pathlib import Path
import re
import sys
import tempfile
import time
from typing import NamedTuple
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, parse_qsl, urlencode, urljoin, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener
import xml.etree.ElementTree as ET

FEED_BYTES = 1024 * 1024
PAGE_BYTES = 384 * 1024
OUTPUT_BYTES = 512 * 1024
SOCKET_TIMEOUT = 7
SOURCE_SECONDS = 16
MAX_ITEMS = 16
MAX_SCANNED = 96
MAX_MEDIA = 3
PAGE_LIMIT = 2
WORKERS = 4

class Source(NamedTuple):
    id: str
    feed: str
    hosts: frozenset[str]
    article_prefix: tuple[str, ...] = ()
    media_hosts: frozenset[str] = frozenset()
    byte_limit: int = FEED_BYTES
    discovery_url: str = ""
    alternate_feeds: tuple[str, ...] = ()
    min_interval: int = 1800
    max_interval: int = 21600
    excluded_categories: tuple[str, ...] = ()
    excluded_paths: tuple[str, ...] = ()
    excluded_title_patterns: tuple[str, ...] = ()
    media_path_rules: tuple[tuple[str, str], ...] = ()

MAX_DIGEST_ITEMS = 600
MAX_SOURCES = 100
STATE_BYTES = 384 * 1024
REPRESENTATION_VERSION = 2  # Source timestamps became part of normalized articles.

MEDIA_TYPES = {
    "image": frozenset({"image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"}),
    "audio": frozenset({"audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav", "audio/x-wav", "audio/aac"}),
    "video": frozenset({"video/mp4", "video/webm", "video/ogg"}),
}
MEDIA_EXT = {
    "image": (".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"),
    "audio": (".mp3", ".m4a", ".wav", ".ogg", ".oga", ".aac"),
    "video": (".mp4", ".webm", ".ogv"),
}
ATOM = "{http://www.w3.org/2005/Atom}"
MEDIA = "{http://search.yahoo.com/mrss/}"
TRACKERS = {"fbclid", "gclid", "mc_cid", "mc_eid", "ref", "ref_src"}
EMBED_HOSTS = frozenset({"www.youtube.com", "youtube.com", "youtu.be", "www.youtube-nocookie.com"})

class Unsafe(ValueError):
    pass

def safe_url(raw, base, hosts, *, canonical=False):
    if (not isinstance(raw, str) or not raw or len(raw) > 2048
            or any(ord(c) <= 32 or ord(c) == 127 or c == "\\" for c in raw)):
        return None
    try:
        split = urlsplit(urljoin(base, raw))
        if (split.scheme != "https" or split.hostname not in hosts
                or split.netloc.lower() != split.hostname or split.username or split.password):
            return None
        if split.hostname == "localhost" or split.hostname.endswith((".localhost", ".local", ".internal")):
            return None
        try:
            if not ipaddress.ip_address(split.hostname).is_global:
                return None
        except ValueError:
            pass  # Exact, catalog-owned DNS names are permitted.
        path = split.path or "/"
        if re.search(r"%(?:00|0a|0d|2e|2f|5c)", path, re.I) or set(path.split("/")) & {".", ".."}:
            return None
        query = split.query
        if canonical:
            query = urlencode([(k, v) for k, v in parse_qsl(query, keep_blank_values=True, max_num_fields=32)
                               if not k.lower().startswith("utm_") and k.lower() not in TRACKERS])
        return urlunsplit((split.scheme, split.hostname, path, query, ""))
    except (ValueError, UnicodeError):
        return None

class GuardRedirect(HTTPRedirectHandler):
    max_redirections = 3
    max_repeats = 1

    def __init__(self, hosts):
        self.hosts = hosts

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not safe_url(newurl, req.full_url, self.hosts):
            raise Unsafe("redirect outside the approved HTTPS hosts")
        return super().redirect_request(req, fp, code, msg, headers, newurl)

class HttpReply(NamedTuple):
    data: bytes
    url: str
    status: int = 200
    etag: str = ""
    last_modified: str = ""


def header_value(value):
    return value if isinstance(value, str) and len(value) <= 512 and not any(ord(c) < 32 or ord(c) == 127 for c in value) else ""


def fetch_response(url, hosts, limit, deadline, *, page=False, conditional=None):
    """Only fixed source-owned HTTPS hosts, no session cookies, tight size/time budgets."""
    if safe_url(url, url, hosts) != url:
        raise Unsafe("unapproved request URL")
    headers = {
        "User-Agent": "feed-core/1.0 (public metadata reader)",
        "Accept": "text/html" if page else "application/atom+xml, application/rss+xml, application/feed+json, application/json, application/xml, text/xml",
        "Accept-Encoding": "identity",
    }
    if conditional and not page:
        for key in ("If-None-Match", "If-Modified-Since"):
            value = header_value(conditional.get(key))
            if value:
                headers[key] = value
    request = Request(url, headers=headers)
    # Ambient system proxy configuration is retained for normal managed networks.
    # No cookie/auth handlers are installed and no credential header is submitted.
    opener = build_opener(ProxyHandler(), GuardRedirect(hosts))
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise Unsafe("source time budget exhausted")
    try:
        response = opener.open(request, timeout=min(SOCKET_TIMEOUT, remaining))
    except HTTPError as exc:
        if exc.code == 304 and conditional:
            exc.close()
            return HttpReply(b"", url, 304)
        raise
    with response:
        end_url = response.geturl()
        if not safe_url(end_url, url, hosts) or response.status != 200:
            raise Unsafe("unexpected final response")
        mime = response.headers.get_content_type()
        allowed = ({"text/html", "application/xhtml+xml"} if page
                   else {"application/atom+xml", "application/rss+xml", "application/xml", "text/xml", "application/rdf+xml", "application/feed+json", "application/json"})
        if mime not in allowed or response.headers.get("Content-Encoding", "identity").lower() != "identity":
            raise Unsafe("unexpected response type or encoding")
        length = response.headers.get("Content-Length")
        if length is not None and (not length.isdecimal() or int(length) > limit):
            raise Unsafe("declared response too large")
        data = bytearray()
        while len(data) <= limit:
            if time.monotonic() >= deadline:
                raise Unsafe("source time budget exhausted")
            chunk = response.read1(min(16 * 1024, limit + 1 - len(data)))
            if not chunk:
                break
            data.extend(chunk)
        if len(data) > limit:
            raise Unsafe("response too large")
        return HttpReply(bytes(data), end_url, 200, header_value(response.headers.get("ETag")),
                         header_value(response.headers.get("Last-Modified")))


def fetch(url, hosts, limit, deadline, *, page=False):
    """Compatibility API returning a body and final URL, without conditional state."""
    response = fetch_response(url, hosts, limit, deadline, page=page)
    return response.data, response.url

class HeadMetadata(HTMLParser):
    keys = {
        "og:image": "image", "og:image:url": "image", "og:image:secure_url": "image", "twitter:image": "image",
        "og:video": "video", "og:video:url": "video", "og:video:secure_url": "video", "twitter:player": "embed",
        "og:audio": "audio", "og:audio:url": "audio", "og:audio:secure_url": "audio",
    }

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.values = []
        self.closed_head = False

    def handle_starttag(self, tag, attrs):
        if tag == "body":
            self.closed_head = True
        if self.closed_head or tag != "meta" or len(self.values) >= 24:
            return
        values = dict(attrs)
        key = (values.get("property") or values.get("name") or "").lower()
        if key in self.keys:
            self.values.append((self.keys[key], values.get("content"), ""))

    def handle_endtag(self, tag):
        if tag == "head":
            self.closed_head = True

class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.ignored = 0

    def handle_starttag(self, tag, attrs):
        self.ignored += tag in {"script", "style"}

    def handle_endtag(self, tag):
        if tag in {"script", "style"} and self.ignored:
            self.ignored -= 1

    def handle_data(self, data):
        if not self.ignored:
            self.parts.append(data)


class FeedLinks(HTMLParser):
    """Discover declared feed links only, never speculative paths or scripts."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if (tag == "link" and "alternate" in (values.get("rel") or "").lower().split()
                and (values.get("type") or "").split(";", 1)[0].lower() in {
                    "application/rss+xml", "application/atom+xml", "application/feed+json"}
                and len(self.links) < 8):
            self.links.append(values.get("href", ""))


def discover_feeds(source, data, page_url):
    """Return only publisher-declared feed URLs inside the exact approved hosts."""
    if len(data) > PAGE_BYTES:
        raise Unsafe("discovery page exceeds budget")
    parser = FeedLinks()
    parser.feed(data.decode("utf-8", errors="replace"))
    urls = [safe_url(link, page_url, source.hosts) for link in parser.links]
    return list(dict.fromkeys(url for url in urls if url))

def plain_title(raw):
    if not raw:
        return ""
    parser = PlainText()
    parser.feed(unescape(raw[:4096]))
    value = " ".join(" ".join(parser.parts).split())
    value = "".join(c for c in value if c >= " " and c != chr(127))
    return value[:220].strip()

def item_date(raw):
    if not raw or len(raw) > 100:
        return None
    try:
        value = dt.datetime.fromisoformat(raw.strip().replace("Z", "+00:00"))
    except ValueError:
        try:
            value = parsedate_to_datetime(raw.strip())
        except (ValueError, TypeError, OverflowError):
            return None
    if value.tzinfo:
        value = value.astimezone(dt.timezone.utc)
    if value.year < 1990:
        return None
    return value.date().isoformat()

def item_timestamp(raw):
    """Preserve an explicit timezone-aware source instant; never invent midnight."""
    if not isinstance(raw, str) or not raw or len(raw) > 100:
        return None
    raw = raw.strip()
    try:
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:[Zz]|[+-]\d{2}:\d{2})", raw):
            value = dt.datetime.fromisoformat(raw.upper().replace("Z", "+00:00"))
        else:
            value = parsedate_to_datetime(raw)
        if value.tzinfo is None or value.utcoffset() is None or value.year < 1990:
            return None
        return value.astimezone(dt.timezone.utc).isoformat().replace("+00:00", "Z")
    except (ValueError, TypeError, OverflowError):
        return None


def available_at(item, now):
    if item["date"] > now.date().isoformat():
        return False
    for key in ("publishedAt", "updatedAt"):
        value = snapshot_time(item.get(key))
        if value and value > now:
            return False
    return True

def embed_url(url):
    split = urlsplit(url)
    if split.hostname in {"www.youtube.com", "youtube.com", "youtu.be", "www.youtube-nocookie.com"}:
        try:
            ident = (parse_qs(split.query, max_num_fields=32).get("v", [""])[0]
                     if split.path == "/watch" else split.path.rsplit("/", 1)[-1])
        except ValueError:
            return None
        if (split.path.startswith(("/embed/", "/shorts/"))
                or split.path == "/watch" or split.hostname == "youtu.be") and re.fullmatch(r"[A-Za-z0-9_-]{11}", ident):
            return f"https://www.youtube.com/watch?v={ident}"
    return None

def pick_media(source, rows, base):
    final = []
    seen = set()
    for kind, href, mime in rows:
        if not isinstance(kind, str) or not isinstance(mime, str):
            continue
        # Normal asset URLs must stay on the publisher's explicit media origin list.
        # Provider embeds are link-out only and never fetched/embedded by this tool.
        url = safe_url(href, base, EMBED_HOSTS)
        outbound = embed_url(url) if url and kind in {"video", "audio", "embed", ""} else None
        if outbound:
            kind, url = "embed", outbound
        else:
            url = safe_url(href, base, source.hosts | source.media_hosts)
            if not url:
                continue
            mime = (mime or "").split(";", 1)[0].strip().lower()
            path = urlsplit(url).path.lower()
            path_rules = dict(source.media_path_rules)
            if urlsplit(url).hostname in path_rules and not re.fullmatch(path_rules[urlsplit(url).hostname], path):
                continue
            # Extension required for type-unknown metadata. Explicit dangerous
            # extensions such as SVG/HTML are refused even with misleading MIME.
            if path.endswith((".svg", ".svgz", ".html", ".htm", ".php", ".js", ".xml")):
                continue
            if kind not in MEDIA_TYPES:
                kind = next((key for key in MEDIA_TYPES if mime in MEDIA_TYPES[key] or path.endswith(MEDIA_EXT[key])), "")
            if not kind or not (mime in MEDIA_TYPES[kind] or (not mime and path.endswith(MEDIA_EXT[kind]))):
                continue
        if url not in seen:
            final.append({"kind": kind, "url": url})
            seen.add(url)
        if len(final) == MAX_MEDIA:
            break
    return final

def child_text(node, tags):
    for tag in tags:
        child = node.find(tag)
        if child is not None:
            value = "".join(child.itertext()).strip()
            if value:
                return value
    return ""

def item_links(node, atom):
    if not atom:
        return child_text(node, ("link",))
    for child in node.findall(ATOM + "link"):
        if child.get("rel", "alternate") == "alternate" and child.get("type", "text/html") in {"text/html", "application/xhtml+xml"}:
            return child.get("href", "")
    return ""

def feed_media(node, atom):
    result = []
    for child in node.iter():
        if child.tag == MEDIA + "thumbnail":
            result.append(("image", child.get("url"), ""))
        elif child.tag == MEDIA + "content":
            result.append((child.get("medium", ""), child.get("url"), child.get("type", "")))
        elif child.tag == MEDIA + "player":
            result.append(("embed", child.get("url"), ""))
        elif child.tag == "enclosure":
            result.append(("", child.get("url"), child.get("type", "")))
        elif atom and child.tag == ATOM + "link" and child.get("rel") == "enclosure":
            result.append(("", child.get("href"), child.get("type", "")))
        if len(result) >= 24:
            break
    return result

def promotional(source, node, url, title):
    path = urlsplit(url).path.lower()
    categories = {(c.text or "").strip().lower() for c in (node.findall("category") if node is not None else ())}
    return (bool(source.excluded_paths) and path.startswith(source.excluded_paths)
            or bool(categories & set(source.excluded_categories))
            or any(re.search(pattern, title, re.I) for pattern in source.excluded_title_patterns))


def parse_feed(source, data, base):
    if len(data) > source.byte_limit:
        raise Unsafe("oversized feed")
    xml = data.decode("utf-8-sig", errors="strict")
    if xml.lstrip().startswith("{"):
        obj = json.loads(xml)
        if (not isinstance(obj.get("version"), str)
                or obj["version"] not in {"https://jsonfeed.org/version/1", "https://jsonfeed.org/version/1.1"}
                or not isinstance(obj.get("items"), list)):
            raise Unsafe("unrecognized JSON Feed schema")
        rows = []
        for entry in obj["items"][:MAX_SCANNED]:
            if not isinstance(entry, dict):
                continue
            media = []
            if entry.get("image"):
                media.append(("image", entry["image"], ""))
            for part in entry.get("attachments", [])[:MAX_MEDIA] if isinstance(entry.get("attachments", []), list) else []:
                if isinstance(part, dict):
                    media.append(("", part.get("url"), part.get("mime_type", "")))
            url = safe_url(entry.get("url") or entry.get("id"), base, source.hosts, canonical=True)
            extension = entry.get("_feed_core") if isinstance(entry.get("_feed_core"), dict) else {}
            extra_media = extension.get("media")
            if isinstance(extra_media, list):
                media = [(part.get("kind"), part.get("url"), "") for part in extra_media[:MAX_MEDIA]
                         if isinstance(part, dict)] + media
            rows.append({"sourceId": source.id, "url": url, "title": entry.get("title", ""),
                         "date": entry.get("date_published") or entry.get("date_modified") or extension.get("date"),
                         "publishedAt": entry.get("date_published"), "updatedAt": entry.get("date_modified"),
                         "media": pick_media(source, media, url or base)})
        return normalize_saved_items(rows, source)
    if re.search(r"<!\s*(?:DOCTYPE|ENTITY)", xml, re.I):
        raise Unsafe("DTD and entity declarations are not permitted")
    tree = ET.fromstring(xml)
    if tree.tag == ATOM + "feed":
        atom, nodes = True, tree.iterfind(ATOM + "entry")
        rss_ns = ""
    elif tree.tag == "rss":
        atom, nodes = False, tree.iterfind("channel/item")
        rss_ns = ""
    elif tree.tag == "{http://www.w3.org/1999/02/22-rdf-syntax-ns#}RDF":
        rss_ns = "{http://purl.org/rss/1.0/}"
        atom, nodes = False, tree.iterfind(rss_ns + "item")
    else:
        raise Unsafe("unrecognized feed root")
    seen, items = set(), []
    for count, node in enumerate(nodes, 1):
        if count > MAX_SCANNED or len(items) >= MAX_ITEMS:
            break
        url = safe_url(child_text(node, (rss_ns + "link",)) if rss_ns else item_links(node, atom), base, source.hosts, canonical=True)
        title = plain_title(child_text(node, (ATOM + "title",) if atom else (rss_ns + "title",)))
        raw_published = child_text(node, (ATOM + "published",) if atom else (
            "{http://purl.org/dc/terms/}issued", "pubDate", "{http://purl.org/dc/elements/1.1/}date", "date"))
        raw_updated = child_text(node, (ATOM + "updated",) if atom else ("{http://purl.org/dc/terms/}modified",))
        raw_date = raw_published or raw_updated
        date = item_date(raw_date)
        if not url or not title or not date or url in seen or promotional(source, node, url, title):
            continue
        seen.add(url)
        item = {"id": sha256((source.id + "|" + url).encode()).hexdigest()[:24],
                "sourceId": source.id, "title": title, "url": url, "date": date,
                "media": pick_media(source, feed_media(node, atom), url)}
        published, updated = item_timestamp(raw_published), item_timestamp(raw_updated)
        if published:
            item["publishedAt"] = published
        if updated and (not published or snapshot_time(updated) >= snapshot_time(published)):
            item["updatedAt"] = updated
        items.append(item)
    return items

REJECT = (Unsafe, URLError, OSError, ET.ParseError, UnicodeError, ValueError)

def refresh_source(source, *, page_media=False, fetcher=fetch):
    deadline = time.monotonic() + SOURCE_SECONDS
    try:
        data, end_url = fetcher(source.feed, source.hosts, source.byte_limit, deadline)
        items = parse_feed(source, data, end_url)
    except REJECT:
        return source.id, "unavailable", []
    # Only first-party article URL prefixes for specifically approved publishers.
    # No HTML discovery, scraping of page body, or auto-fetching media files.
    if page_media and source.article_prefix:
        eligible = [x for x in items if len(x["media"]) < MAX_MEDIA
                    and urlsplit(x["url"]).path.startswith(source.article_prefix)]
        for item in eligible[:PAGE_LIMIT]:
            if time.monotonic() > deadline - 0.25:
                break
            try:
                html, end = fetcher(item["url"], source.hosts, PAGE_BYTES, deadline, page=True)
                if not urlsplit(end).path.startswith(source.article_prefix):
                    continue
                parser = HeadMetadata()
                parser.feed(html.decode("utf-8", errors="replace"))
                found = pick_media(source, parser.values, end)
                seen = {m["url"] for m in item["media"]}
                item["media"] = (item["media"] + [m for m in found if m["url"] not in seen])[:MAX_MEDIA]
            except REJECT:
                continue  # Feed article remains usable if head metadata is unavailable.
    return source.id, "ok", items

def normalize_saved_items(rows, source):
    final, seen = [], set()
    for saved in rows[:MAX_DIGEST_ITEMS]:
        if not isinstance(saved, dict) or saved.get("sourceId") != source.id:
            continue
        url = safe_url(saved.get("url"), source.feed, source.hosts, canonical=True)
        title = plain_title(saved.get("title") if isinstance(saved.get("title"), str) else "")
        date = item_date(saved.get("date") if isinstance(saved.get("date"), str) else None)
        if not url or not title or not date or url in seen or promotional(source, None, url, title):
            continue
        seen.add(url)
        candidates = saved.get("media")
        candidates = candidates[:MAX_MEDIA] if isinstance(candidates, list) else []
        media = pick_media(source, [(m.get("kind"), m.get("url"), "") for m in candidates if isinstance(m, dict)], url)
        item = {"id": sha256((source.id + "|" + url).encode()).hexdigest()[:24],
                "sourceId": source.id, "title": title, "url": url, "date": date, "media": media}
        published, updated = item_timestamp(saved.get("publishedAt")), item_timestamp(saved.get("updatedAt"))
        if published and published[:10] == date:
            item["publishedAt"] = published
        if updated and (not published or snapshot_time(updated) >= snapshot_time(published)) and (published or updated[:10] == date):
            item["updatedAt"] = updated
        final.append(item)
        if len(final) >= MAX_ITEMS:
            break
    return final

def read_bounded_json(path):
    with path.open("rb") as stream:
        blob = stream.read(OUTPUT_BYTES + 1)
    if len(blob) > OUTPUT_BYTES:
        raise Unsafe("local snapshot exceeds read budget")
    return json.loads(blob)

def previous_snapshot(path):
    try:
        snapshot = read_bounded_json(path)
        if isinstance(snapshot, dict) and snapshot.get("schemaVersion") == 1:
            return snapshot
    except (OSError, ValueError):
        pass
    return {}


def snapshot_time(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z", value):
        return None
    try:
        return dt.datetime.fromisoformat(value)
    except ValueError:
        return None


def load_seed(path, seed_sources=None):
    seed_sources = seed_sources or {}
    try:
        data = read_bounded_json(path)
    except (OSError, ValueError) as exc:
        raise Unsafe("editorial seed could not be read as bounded JSON") from exc
    rows = data.get("items") if isinstance(data, dict) else data
    if not isinstance(rows, list) or len(rows) > MAX_ITEMS:
        raise Unsafe("editorial seed needs a short items list")
    if any(not isinstance(r, dict) or not isinstance(r.get("sourceId"), str) or r["sourceId"] not in seed_sources for r in rows):
        raise Unsafe("editorial seed has an unapproved publisher")
    out = {sid: normalize_saved_items(rows, source) for sid, source in seed_sources.items()}
    if sum(map(len, out.values())) != len(rows):
        raise Unsafe("editorial seed entries must have unique approved article URLs, dates and titles")
    return [(k, "ok", entries) for k, entries in out.items() if entries]

def atomic_json(path, obj, *, limit=OUTPUT_BYTES):
    payload = (json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n").encode()
    if len(payload) > limit:
        raise Unsafe("serialized output exceeds budget")
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix=".feed-", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(payload)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(name, path)
        if os.name != "nt":
            os.chmod(path, 0o644)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def iso_time(value):
    return value.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def validated_state(saved, source, now):
    """Never let a corrupted cache widen endpoints, inject headers, or defer forever."""
    if not isinstance(saved, dict):
        return {}
    out = {}
    if type(saved.get("representationVersion")) is int and saved["representationVersion"] == REPRESENTATION_VERSION:
        out["representationVersion"] = REPRESENTATION_VERSION
    for key in ("attemptedAt", "lastSuccessfulCheckAt", "nextAttemptAt"):
        value = snapshot_time(saved.get(key))
        if value and value <= now + dt.timedelta(days=2) and (key == "nextAttemptAt" or value <= now):
            out[key] = iso_time(value)
    for key in ("consecutiveFailures", "unchangedCount", "itemCount"):
        value = saved.get(key)
        if type(value) is int and 0 <= value <= 100000:
            out[key] = value
    feed = safe_url(saved.get("feedUrl"), source.feed or source.discovery_url, source.hosts)
    if feed:
        out["feedUrl"] = feed
    for key in ("etag", "lastModified"):
        value = header_value(saved.get(key))
        if value:
            out[key] = value
    if isinstance(saved.get("health"), str) and saved["health"] in {"healthy", "cached", "backoff", "quarantined", "empty", "schema-drift"}:
        out["health"] = saved["health"]
    if type(saved.get("httpStatus")) is int and 100 <= saved["httpStatus"] <= 599:
        out["httpStatus"] = saved["httpStatus"]
    return out


def retry_after_seconds(value, now):
    if not isinstance(value, str) or len(value) > 100:
        return 0
    if value.isdecimal():
        return min(86400, int(value))
    try:
        instant = parsedate_to_datetime(value)
        if instant.tzinfo:
            return max(0, min(86400, int((instant - now).total_seconds())))
    except (ValueError, TypeError, OverflowError):
        pass
    return 0


def public_refresh_state(state, sources):
    """Expose freshness/health without HTTP validators or internal endpoint choices."""
    if not isinstance(state, dict) or state.get("schemaVersion") != 1:
        raise Unsafe("invalid refresh state")
    generated = snapshot_time(state.get("generatedAt"))
    if generated is None or not isinstance(state.get("sources"), dict):
        raise Unsafe("refresh state needs a timestamp and source map")
    public = {}
    for source in sources:
        saved = state["sources"].get(source.id)
        if not isinstance(saved, dict):
            continue
        clean = validated_state(saved, source, generated)
        row = {key: value for key, value in clean.items() if key not in {"feedUrl", "etag", "lastModified", "unchangedCount", "representationVersion"}}
        if type(saved.get("unchanged")) is bool:
            row["unchanged"] = saved["unchanged"]
        public[source.id] = row
    return {"schemaVersion": 1, "generatedAt": iso_time(generated), "sources": public}


def collect_source(source, prior_items, saved, *, now, fetcher=fetch_response, force=False, discovery=False, page_media=False):
    cached = normalize_saved_items(prior_items, source)
    state = validated_state(saved, source, now)
    next_at = snapshot_time(state.get("nextAttemptAt"))
    if next_at and next_at > now and not force:
        state["health"] = "cached" if not state.get("consecutiveFailures") else ("quarantined" if state.get("consecutiveFailures", 0) >= 5 else "backoff")
        return source.id, "deferred", cached, state
    state["attemptedAt"] = iso_time(now)
    deadline = time.monotonic() + SOURCE_SECONDS
    candidates = list(dict.fromkeys(u for u in [state.get("feedUrl"), source.feed, *source.alternate_feeds] if u))
    last_error, http_status, server_wait = "No valid publisher feed was found", 0, 0
    if discovery and source.discovery_url and (not candidates or state.get("consecutiveFailures", 0) >= 2):
        try:
            reply = fetcher(source.discovery_url, source.hosts, PAGE_BYTES, deadline, page=True)
            body, end = (reply.data, reply.url) if isinstance(reply, HttpReply) else reply
            candidates.extend(u for u in discover_feeds(source, body, end) if u not in candidates)
        except REJECT:
            pass  # Existing feed and last-good content remain available.
    for endpoint in candidates[:4]:
        if not safe_url(endpoint, source.feed or source.discovery_url, source.hosts):
            continue
        if time.monotonic() >= deadline:
            break
        validators = {}
        if cached and endpoint == state.get("feedUrl") and state.get("representationVersion") == REPRESENTATION_VERSION:
            if state.get("etag"):
                validators["If-None-Match"] = state["etag"]
            if state.get("lastModified"):
                validators["If-Modified-Since"] = state["lastModified"]
        try:
            reply = fetcher(endpoint, source.hosts, source.byte_limit, deadline, conditional=validators)
            if not isinstance(reply, HttpReply):
                reply = HttpReply(reply[0], reply[1])
            http_status = reply.status
            if not safe_url(reply.url, endpoint, source.hosts):
                raise Unsafe("response escaped approved publisher")
            if reply.status == 304:
                if not cached or not validators:
                    raise Unsafe("304 without a validated prior representation")
                entries = cached
                unchanged = True
            elif reply.status == 200:
                try:
                    entries = [row for row in parse_feed(source, reply.data, reply.url) if available_at(row, now)]
                except (Unsafe, ET.ParseError, UnicodeError, json.JSONDecodeError):
                    state["health"] = "schema-drift"
                    last_error = "Publisher feed format could not be parsed"
                    continue
                if not entries:
                    # A successful transport is not proof the adapter still extracts.
                    last_error = "Feed produced no valid dated items; last-good content retained"
                    state["health"] = "empty" if not cached else "schema-drift"
                    continue
                unchanged = {x["id"] for x in entries} == {x["id"] for x in cached}
                if page_media and source.article_prefix:
                    for item in [x for x in entries if len(x["media"]) < MAX_MEDIA and urlsplit(x["url"]).path.startswith(source.article_prefix)][:PAGE_LIMIT]:
                        if time.monotonic() >= deadline - 0.25:
                            break
                        try:
                            head = fetcher(item["url"], source.hosts, PAGE_BYTES, deadline, page=True)
                            body, end = (head.data, head.url) if isinstance(head, HttpReply) else head
                            if not urlsplit(end).path.startswith(source.article_prefix):
                                continue
                            parser = HeadMetadata()
                            parser.feed(body.decode("utf-8", errors="replace"))
                            known = {m["url"] for m in item["media"]}
                            item["media"] = (item["media"] + [m for m in pick_media(source, parser.values, end) if m["url"] not in known])[:MAX_MEDIA]
                        except REJECT:
                            pass
                # Changed validators belong to this successfully parsed representation only.
                state["etag"] = header_value(reply.etag)
                state["lastModified"] = header_value(reply.last_modified)
            else:
                raise Unsafe("unexpected publisher status")
            state.update(feedUrl=reply.url, lastSuccessfulCheckAt=iso_time(now), consecutiveFailures=0,
                         representationVersion=REPRESENTATION_VERSION,
                         unchangedCount=min(16, state.get("unchangedCount", 0) + 1) if unchanged else 0,
                         itemCount=len(entries), health="healthy", httpStatus=reply.status,
                         unchanged=unchanged)
            interval = min(source.max_interval, source.min_interval * (2 ** min(3, state["unchangedCount"])))
            state["nextAttemptAt"] = iso_time(now + dt.timedelta(seconds=max(300, interval)))
            state.pop("lastError", None)
            return source.id, "ok", entries, state
        except HTTPError as exc:
            http_status = exc.code
            server_wait = max(server_wait, retry_after_seconds(exc.headers.get("Retry-After"), now))
            last_error = f"Publisher returned HTTP {exc.code}"
            exc.close()
            if http_status in {429, 503}:
                break  # Honor throttling instead of immediately hitting another path.
        except (ET.ParseError, UnicodeError, json.JSONDecodeError) as exc:
            state["health"] = "schema-drift"
            last_error = "Publisher feed format could not be parsed"
        except REJECT as exc:
            last_error = "Publisher unavailable or response failed feed validation"
    failures = min(100000, state.get("consecutiveFailures", 0) + 1)
    interval = max(server_wait, min(86400, max(1800, source.min_interval) * (2 ** min(failures - 1, 5))))
    state.update(consecutiveFailures=failures, nextAttemptAt=iso_time(now + dt.timedelta(seconds=interval)),
                 httpStatus=http_status, lastError=last_error, unchanged=False)
    if state.get("health") not in {"empty", "schema-drift"}:
        state["health"] = "quarantined" if failures >= 5 else "backoff"
    return source.id, "unavailable", cached, state


def refresh(output, *, sources=(), seed_sources=None, page_media=False, seed=None, fetcher=fetch,
            now=None, state_path=None, report_path=None, force=False, discovery=False):
    """Refresh atomically. Persistent state activates conditional/adaptive operation.

    Without state_path, the original one-shot API stays available for small consumers.
    All-source failure leaves the digest untouched but persists health/backoff state.
    """
    sources = tuple(sources)
    if not sources or len(sources) > MAX_SOURCES or len({s.id for s in sources}) != len(sources):
        raise Unsafe("a unique bounded source policy is required")
    now = now or dt.datetime.now(dt.timezone.utc)
    if now.tzinfo is None:
        raise Unsafe("collection time requires a timezone")
    now = now.astimezone(dt.timezone.utc)
    generated = iso_time(now)
    curated = load_seed(seed, seed_sources) if seed else []
    previous = previous_snapshot(output)
    prior_items = previous.get("items", []) if isinstance(previous.get("items", []), list) else []
    prior_sources = previous.get("sources", []) if isinstance(previous.get("sources", []), list) else []
    previous_time = snapshot_time(previous.get("generatedAt"))
    prior = {}
    duplicate_ids = set()
    if previous_time and previous_time <= now:
        for row in prior_sources:
            if not isinstance(row, dict) or not isinstance(row.get("id"), str):
                continue
            if row["id"] in prior:
                duplicate_ids.add(row["id"])
            check = snapshot_time(row.get("lastSuccessfulCheckAt"))
            if check and check <= previous_time and row.get("origin", "feed") == "feed":
                prior[row["id"]] = row
        for ident in duplicate_ids:
            prior.pop(ident, None)
    managed = state_path is not None
    stored = previous_snapshot(Path(state_path)) if managed else {}
    stored_sources = stored.get("sources", {}) if isinstance(stored.get("sources"), dict) else {}
    def perform(source):
        if managed:
            initial = {**prior.get(source.id, {}), **stored_sources.get(source.id, {})} if isinstance(stored_sources.get(source.id, {}), dict) else prior.get(source.id, {})
            return collect_source(source, prior_items, initial, now=now,
                                  fetcher=fetch_response if fetcher is fetch else fetcher,
                                  force=force, discovery=discovery, page_media=page_media)
        ident, status, entries = refresh_source(source, page_media=page_media, fetcher=fetcher)
        return ident, status, entries, {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        gathered = list(pool.map(perform, sources))
    states, items, stored_next = [], [], {}
    indexed = {s.id: s for s in sources}
    for ident, status, entries, detail in gathered:
        row = {"id": ident, "status": "ok" if status == "ok" or (status == "deferred" and not detail.get("consecutiveFailures")) else "unavailable", "origin": "feed"}
        if managed:
            stored_next[ident] = detail
            row.update({k: v for k, v in detail.items() if k not in {"etag", "lastModified", "unchangedCount", "representationVersion"}})
        elif status == "ok":
            row["lastSuccessfulCheckAt"] = generated
        else:
            entries = normalize_saved_items(prior_items, indexed[ident])
            if ident in prior:
                row["lastSuccessfulCheckAt"] = prior[ident]["lastSuccessfulCheckAt"]
        states.append(row)
        items.extend(x for x in entries if available_at(x, now))
    live_ok = sum(status == "ok" for _, status, _, _ in gathered)
    attempted = sum(status != "deferred" for _, status, _, _ in gathered)
    if managed:
        atomic_json(state_path, {"schemaVersion": 1, "generatedAt": generated, "sources": stored_next}, limit=STATE_BYTES)
    report = {"schemaVersion": 1, "attemptedAt": generated, "sourceCount": len(sources),
              "attemptedSources": attempted, "successfulSources": live_ok,
              "deferredSources": len(sources) - attempted,
              "failedSources": attempted - live_ok, "sources": states,
              "previousSnapshotPreserved": bool(attempted and not live_ok)}
    if report_path:
        atomic_json(report_path, report)
    if attempted and not live_ok:
        if managed and any(status == "deferred" and entries and detail.get("lastSuccessfulCheckAt")
                           and not detail.get("consecutiveFailures") for _, status, entries, detail in gathered):
            # A failed due feed is not a total outage when other validated sources
            # are still within their refresh interval. Publish health, retain the
            # digest and its timestamp, and let the next scheduled probe recover.
            return previous
        raise Unsafe("all public sources unavailable; previous output left unchanged")
    if not attempted:
        return previous  # Do not create a fake fresh build timestamp on a no-op.
    for ident, status, entries in curated:
        states.append({"id": ident, "status": status, "origin": "editorial"})
        items.extend(entries)
    items.sort(key=lambda item: (item["date"], item["id"]), reverse=True)
    # Publishers can syndicate the same canonical URL. Keep one stable representation.
    seen = set()
    unique = []
    for row in items:
        if row["url"] not in seen:
            seen.add(row["url"])
            unique.append(row)
    if len(unique) > MAX_DIGEST_ITEMS:
        raise Unsafe("digest item budget exceeded; increase the reviewed budget, never silently truncate sources")
    obj = {"schemaVersion": 1, "generatedAt": generated, "items": unique, "sources": states}
    atomic_json(output, obj)
    return obj
