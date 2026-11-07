"""Isolated, offline, sample-scoped public-content extraction experiments.

Returns rich bodies in memory. receipt() deliberately excludes third-party prose.
No network, browser, session, cookie, payment or source mutation functionality.
"""
from __future__ import annotations

import hashlib
import json
import re
from urllib.parse import urljoin, urlsplit, urlunsplit

from lxml import etree, html


class ExtractionError(ValueError):
    """Input cannot safely establish the requested sample-scoped relationship."""


def sha256(value):
    return hashlib.sha256(value.encode("utf-8") if isinstance(value, str) else value).hexdigest()


def json_loads(value):
    def pairs(items):
        result = {}
        for key, val in items:
            if key in result:
                raise ExtractionError("Duplicate JSON key")
            result[key] = val
        return result
    def reject_constant(value):
        raise ExtractionError("Non-finite JSON constant")
    return json.loads(value, object_pairs_hook=pairs, parse_constant=reject_constant)


def document(value):
    # Observed fixture responses are UTF-8; fragments lack a charset declaration.
    return html.fromstring(value, parser=html.HTMLParser(no_network=True, encoding="utf-8"))


def one(nodes, label, required=False):
    if len(nodes) > 1:
        raise ExtractionError("Ambiguous " + label)
    if not nodes:
        if required:
            raise ExtractionError("Missing " + label)
        return None
    return nodes[0]


def cls(name):
    return 'contains(concat(" ",normalize-space(@class)," ")," ' + name + ' ")'


def text(node):
    return " ".join(node.text_content().split()) if node is not None else None


def public_url(value, origin=""):
    """Safe reference only; never a request. Drop delivery queries and fragments.

    All query parameters are removed, rather than maintaining an incomplete
    credential denylist. Original raw URLs stay in the caller's input fixture.
    """
    if not isinstance(value, str) or not value.strip():
        return None
    value = value.strip()
    if any(ord(ch) < 32 or ord(ch) == 127 for ch in value):
        return None
    try:
        parsed = urlsplit(urljoin(origin, value))
        if parsed.scheme not in ("https", "http") or not parsed.hostname or parsed.username or parsed.password:
            return None
        # Accessing .port also rejects malformed or out-of-range ports.
        parsed.port
        return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))
    except ValueError:
        return None


def ordered_body(node, origin="", completeness="selected_scope"):
    if node is None:
        return None
    events = []
    def emit_text(value):
        if value is not None and value != "":
            events.append({"type": "text", "text": value})
    def walk(current):
        if not isinstance(current.tag, str) or current.tag in ("script", "style"):
            return
        if current.tag == "a":
            raw = current.get("data-href") or current.get("href")
            events.append({"type": "link_start", "url": public_url(raw, origin),
                           "referenceRejected": bool(raw) and public_url(raw, origin) is None})
        if current.tag in ("img", "video", "audio", "iframe", "source"):
            event = {"type": "media", "tag": current.tag}
            for key in ("src", "data-src", "data-full", "poster"):
                if current.get(key):
                    event[key] = public_url(current.get(key), origin)
                    if event[key] is None:
                        event["referenceRejected"] = True
            if current.get("type"):
                event["mimeHint"] = current.get("type")
            if current.get("srcset"):
                # A data URL can contain commas; reject the entire attribute.
                rawset = current.get("srcset")
                event["srcset"] = [] if re.search(r"(?:data|javascript|blob):", rawset, re.I) else [
                    u for part in rawset.split(",") if (u := public_url(part.strip().split()[0], origin))]
            events.append(event)
        if current.tag == "br":
            events.append({"type": "break"})
        emit_text(current.text)
        for child in current:
            walk(child)
            emit_text(child.tail)
        if current.tag == "a":
            events.append({"type": "link_end"})
    walk(node)
    return {"format": "html", "raw": html.tostring(node, encoding="unicode", with_tail=False),
            "text": node.text_content(), "events": events, "completeness": completeness}


def markdown_body(raw, origin=""):
    """Preserve all Markdown; only a deliberately incomplete media projection."""
    tokens = []
    pattern = r'!\[[^\]]*\]\(([^\s)]+)\)|<img\b[^>]*\bsrc=[\"\']([^\"\']+)[\"\'][^>]*>|(?<!!)\[([^\]]*)\]\(([^\s)]+)\)'
    previous = 0
    for match in re.finditer(pattern, raw, re.I):
        if match.start() > previous:
            tokens.append({"type": "text", "text": raw[previous:match.start()]})
        url = public_url(match.group(1) or match.group(2) or match.group(4), origin)
        if match.group(4) is not None:
            tokens.extend([{"type": "link_start", "url": url, "referenceRejected": url is None},
                           {"type": "text", "text": match.group(3)}, {"type": "link_end"}])
        else:
            tokens.append({"type": "media", "tag": "image_reference", "src": url,
                           "referenceRejected": url is None})
        previous = match.end()
    if previous < len(raw):
        tokens.append({"type": "text", "text": raw[previous:]})
    return {"format": "markdown", "raw": raw, "text": raw, "events": tokens,
            "completeness": "source_field_preserved", "projectionComplete": False}


def schemas(doc):
    output = []
    def flatten(value):
        if isinstance(value, list):
            for item in value:
                flatten(item)
        elif isinstance(value, dict):
            output.append(value)
            if isinstance(value.get("@graph"), list):
                flatten(value["@graph"])
    for script in doc.xpath('//script[@type="application/ld+json"]'):
        try:
            flatten(json_loads(script.text or "{}"))
        except ExtractionError:
            raise
        except (ValueError, TypeError):
            pass
    return output


def schema_of(doc, expected):
    matches = []
    for item in schemas(doc):
        types = item.get("@type", [])
        if expected in ([types] if isinstance(types, str) else types):
            matches.append(item)
    return one(matches, expected + " schema") or {}


def base_record(family, origin):
    return {"family": family, "sourceUrl": public_url(origin), "identity": {}, "people": [],
            "body": None, "notes": [], "gallery": [], "files": [], "gates": [],
            "follow": {"nativeMutationTested": False, "nativeImportTested": False,
                       "local": "Independent local creator subscription; not implemented by this lab"},
            "warnings": [], "scope": "sample_scoped_parser_experiment", "fullSupportAccepted": False}


def person(value, role, origin=""):
    if not isinstance(value, dict) or not any(value.get(k) for k in ("id", "name", "username", "url", "link")):
        return None
    return {"id": value.get("id"), "name": value.get("name") or value.get("username"),
            "username": value.get("username"), "role": role,
            "profile": public_url(value.get("url") or value.get("link"), origin),
            "avatar": public_url(value.get("avatar_url") or value.get("image"), origin)}


def unique_ids(values, key, label, allow_missing=False):
    seen = set()
    for value in values:
        ident = value.get(key)
        if ident is None and allow_missing:
            continue
        if not valid_id(ident) or ident in seen:
            raise ExtractionError("Missing or duplicate " + label)
        seen.add(ident)


def valid_id(value):
    return isinstance(value, (str, int)) and not isinstance(value, bool) and str(value).strip() != ""


def require_id(value, label):
    if not valid_id(value):
        raise ExtractionError("Missing " + label)
    return value


def modrinth(inputs, origin):
    project, members, versions, uploader = [json_loads(inputs[k]) for k in ("project", "members", "versions", "uploader")]
    require_id(project.get("id"), "project ID")
    require_id(project.get("team"), "team ID")
    require_id(uploader.get("id"), "uploader ID")
    unique_ids(versions, "id", "version ID")
    unique_ids([m["user"] for m in members], "id", "member ID")
    record = base_record("modrinth", origin)
    record["identity"] = {"id": project["id"], "teamId": project["team"], "organizationId": project.get("organization"), "title": project.get("title")}
    for member in members:
        if member["team_id"] != project["team"]:
            raise ExtractionError("Team identity mismatch")
        p = person(member["user"], "project_member", origin)
        p["projectRole"] = member["role"]
        record["people"].append(p)
    for version in versions:
        if version["project_id"] != project["id"]:
            raise ExtractionError("Release project mismatch")
    selected = versions[0] if versions else None
    if selected:
        if selected["author_id"] != uploader["id"]:
            raise ExtractionError("Release uploader mismatch")
        record["people"].append(person(uploader, "release_uploader", origin))
        record["release"] = {k: selected.get(k) for k in ("id", "author_id", "version_number", "game_versions", "loaders", "environment", "dependencies")}
        record["releaseChangelog"] = selected.get("changelog")
        unique_ids(selected["files"], "id", "file ID")
        for file in selected["files"]:
            record["files"].append({"id": file["id"], "name": file.get("filename"), "size": file.get("size"),
                                    "hashes": file.get("hashes"), "url": public_url(file.get("url")),
                                    "primary": file.get("primary"), "gate": "public_manifest_only", "downloaded": False})
    record["body"] = markdown_body(project["body"], origin) if isinstance(project.get("body"), str) else None
    record["projectImage"] = public_url(project.get("icon_url"))
    record["gallery"] = [{"url": public_url(g.get("url")), "original": public_url(g.get("raw_url")), "ordering": g.get("ordering")}
                         for g in sorted(project.get("gallery", []), key=lambda g: g.get("ordering", 0))]
    record["follow"]["observedScope"] = "documented project follow; no creator-follow assumption"
    record["warnings"] = ["Markdown mixed-event projection is incomplete; original body preserved.", "Organization ID is opaque; organization ownership/avatar is not resolved.", "Version array is not a complete-history acceptance."]
    return record


def pmc(inputs, origin):
    page, profile = document(inputs["item"]), document(inputs["profile"])
    record = base_record("pmc", origin)
    rid = one(page.xpath('//*[@id="resource_id"]'), "resource ID", True)
    aid = one(page.xpath('//*[@id="author_id"]'), "author ID", True)
    ident = text(aid)
    require_id(ident, "author ID")
    require_id(text(rid), "resource ID")
    bylines = page.xpath('//*[@id="resource_object"]//*[' + cls("mini-profile") + ']//a[@data-mid=$mid]', mid=ident)
    if not bylines:
        raise ExtractionError("Author byline mismatch")
    profiles = {public_url(n.get("href"), origin) for n in bylines}
    if len(profiles) != 1:
        raise ExtractionError("Conflicting author byline profiles")
    avatar_anchor = one(profile.xpath('//*[@id="avatar"]'), "profile avatar identity", True)
    if avatar_anchor.get("data-mid") != ident:
        raise ExtractionError("Profile author mismatch")
    avatar = one(avatar_anchor.xpath('.//img'), "creator avatar")
    record["identity"] = {"id": text(rid)}
    record["people"] = [{"id": ident, "name": next((text(x) for x in bylines if text(x)), None), "role": "submission_author",
                         "profile": next(iter(profiles)), "avatar": public_url(avatar.get("src"), origin) if avatar is not None else None}]
    record["body"] = ordered_body(one(page.xpath('//*[@id="r-text-block"]'), "rich body"), origin)
    for anchor in page.xpath('//*[@id="resource-options"]//a[' + cls("third-party-download") + ']'):
        record["files"].append({"url": public_url(anchor.get("href"), origin), "gate": "outbound_discovery_not_manifest", "downloaded": False})
    button = one(page.xpath('//*[@id="subscribe_full"]//button[' + cls("subscribe") + ']'), "subscribe control")
    record["follow"]["observed"] = button is not None
    record["warnings"] = ["Body images include badges; image count is not screenshot count.", "Update logs and profile history were not exhausted."]
    return record


def wordpress(inputs, origin):
    payload = json_loads(inputs["post"])
    if isinstance(payload, list) and len(payload) != 1:
        raise ExtractionError("Expected exactly one WordPress post; select an item explicitly")
    post = payload[0] if isinstance(payload, list) else payload
    require_id(post.get("id"), "post ID")
    record = base_record("wordpress", origin)
    record["identity"] = {"id": post["id"], "sourceUrl": public_url(post.get("link")), "title": post.get("title", {}).get("rendered")}
    authors = post.get("_embedded", {}).get("author", [])
    unique_ids(authors, "id", "embedded author ID")
    matching = [a for a in authors if a.get("id") == post.get("author")]
    if authors and len(matching) != 1:
        raise ExtractionError("Embedded post author mismatch")
    for author in matching:
        p = person(author, "post_writer", origin)
        p["avatar"] = public_url(author.get("avatar_urls", {}).get("96"), origin)
        record["people"].append(p)
    if not matching:
        record["people"] = [{"id": post.get("author"), "name": None, "avatar": None, "role": "unresolved_post_writer"}]
        record["warnings"].append("Author identity is unresolved; featured image is not an avatar.")
    content = post.get("content", {})
    if content.get("protected"):
        record["gates"].append("protected_body")
    elif "rendered" in content:
        record["body"] = ordered_body(html.fragment_fromstring(content["rendered"] or "", create_parent=True), origin)
    record["metadataSummary"] = post.get("excerpt", {}).get("rendered")
    record["projectImageId"] = post.get("featured_media")
    record["gallery"] = [{"id": m.get("id"), "url": public_url(m.get("source_url"))}
                         for m in post.get("_embedded", {}).get("wp:featuredmedia", [])]
    record["warnings"].append("Writer identity is not automatically original mod developer; pagination remains incomplete.")
    return record


def rss(inputs, origin):
    raw = inputs["feed"]
    if re.search(br"<!\s*(?:DOCTYPE|ENTITY)", raw, re.I):
        raise ExtractionError("RSS DTD/entity declarations are not supported")
    root = etree.fromstring(raw, parser=etree.XMLParser(resolve_entities=False, load_dtd=False, no_network=True))
    output = []
    for item in root.findall("./channel/item"):
        record = base_record("rss", origin)
        guid = item.findtext("guid") or item.findtext("link")
        record["identity"] = {"id": "rss-guid:" + sha256(guid) if guid else None,
                              "guidUrl": public_url(guid, origin), "sourceUrl": public_url(item.findtext("link"), origin)}
        record["sourceGuid"] = guid
        author = item.findtext("{http://purl.org/dc/elements/1.1/}creator")
        record["people"] = [{"id": None, "name": author, "role": "feed_author_display_only", "avatar": None}]
        body = item.findtext("{http://purl.org/rss/1.0/modules/content/}encoded")
        record["metadataSummary"] = item.findtext("description")
        record["body"] = ordered_body(html.fragment_fromstring(body, create_parent=True), origin) if body is not None else None
        record["files"] = [{"url": public_url(e.get("url"), origin), "size": e.get("length"), "mimeHint": e.get("type"),
                            "gate": "enclosure_manifest_only", "downloaded": False} for e in item.findall("enclosure")]
        record["warnings"] = ["Feed window is not complete history.", "Display name and channel image do not establish creator ID/avatar."]
        output.append(record)
    ids = [r["identity"].get("id") or r["identity"].get("sourceUrl") for r in output]
    if any(x is None for x in ids) or len(set(ids)) != len(ids):
        raise ExtractionError("Missing or duplicate RSS item identity")
    return output


def dwemer(inputs, origin):
    docs = {key: document(inputs[key]) for key in ("page", "description", "files", "images", "changelog", "profile")}
    record = base_record("dwemer", origin)
    schema = schema_of(docs["page"], "CreativeWork")
    record["identity"] = {"sourceUrl": public_url(schema.get("url")), "title": schema.get("name")}
    original = person(schema.get("author"), "credited_original_author", origin)
    if original:
        record["people"].append(original)
    uploader = one(docs["description"].xpath('//a[' + cls("mod-author-link") + ']'), "uploader")
    profile_name = one(docs["profile"].xpath('//*[' + cls("profile-username") + ']'), "uploader profile name")
    avatar = one(docs["profile"].xpath('//img[' + cls("profile-avatar-user") + ']'), "uploader avatar")
    if uploader is not None:
        if profile_name is not None and text(profile_name).casefold() != text(uploader).casefold():
            raise ExtractionError("Uploader profile mismatch")
        record["people"].append({"name": text(uploader), "role": "site_uploader",
                                 "profile": public_url(uploader.get("href"), origin),
                                 "avatar": public_url(avatar.get("src"), origin) if avatar is not None else None})
    record["body"] = ordered_body(one(docs["description"].xpath('//*[' + cls("mod-detailed-desc") + ']'), "full description"), origin)
    record["metadataSummary"] = schema.get("description")
    record["projectImage"] = public_url(schema.get("image"))
    for node in docs["files"].xpath('//*[' + cls("file-item") + ']'):
        name = one(node.xpath('.//*[' + cls("file-name") + ']'), "file name")
        action = one(node.xpath('.//*[' + cls("file-actions") + ']'), "file action")
        access = text(action) or ""
        gate = "login_required" if re.search(r"log\s*in|sign\s*in", access, re.I) else "unverified_transfer"
        record["files"].append({"id": node.get("data-file-id"), "name": text(name), "gate": gate, "url": None, "downloaded": False})
    unique_ids(record["files"], "id", "file ID", allow_missing=True)
    record["gallery"] = [{"url": public_url(n.get("src"), origin), "original": public_url(n.get("data-full"), origin), "ordering": n.get("data-index")}
                         for n in docs["images"].xpath('//img[@data-full]')]
    record["gates"] = sorted({f["gate"] for f in record["files"] if f["gate"] == "login_required"})
    record["warnings"] = ["Separately fetched public fragments are not complete lazy-tab history or permission to download."]
    if any(f["id"] is None for f in record["files"]):
        record["warnings"].append("A file card has no observed stable file ID; no ID was invented.")
    record["changelogFragment"] = ordered_body(docs["changelog"], origin)
    return record


def modpub(inputs, origin):
    page, files, profile = [document(inputs[k]) for k in ("page", "files", "profile")]
    record = base_record("modpub", origin)
    schema = schema_of(page, "SoftwareApplication")
    author = schema.get("author") or {}
    main = schema_of(profile, "ProfilePage").get("mainEntity") or {}
    if author.get("name") and main.get("name") and author["name"].casefold() != main["name"].casefold():
        raise ExtractionError("ModPub author profile mismatch")
    p = person(main or author, "site_author", origin)
    if p:
        record["people"].append(p)
    record["identity"] = {"title": schema.get("name"), "sourceUrl": public_url(schema.get("url"))}
    record["metadataSummary"] = schema.get("description")
    record["projectImage"] = public_url(schema.get("image"))
    record["body"] = ordered_body(one(page.xpath('//*[' + cls("user-content") + ']'), "rich body"), origin)
    for button in files.xpath('//button[@name="file_id"]'):
        box = one(button.xpath('ancestor::*[' + cls("gray-box") + '][1]'), "file box")
        name = one(box.xpath('.//h5[' + cls("mb-0") + ']'), "file title") if box is not None else None
        record["files"].append({"id": button.get("value"), "name": text(name), "disabled": button.get("disabled") is not None,
                                "gate": "disabled_control" if button.get("disabled") is not None else "unverified_control", "url": None, "downloaded": False})
    unique_ids(record["files"], "id", "file ID")
    record["warnings"] = ["Schema description is metadata only; disabled file IDs are not transfer URLs."]
    return record


def fragment_document(payload):
    """Join only observed DOM fragments; no invented outer post/profile markup."""
    fragments = []
    for part in payload.get("parts", []):
        values = part.get("html", [])
        fragments.extend(values if isinstance(values, list) else [values])
    return html.fragment_fromstring("\n".join(fragments), create_parent=True)


def subscribestar(inputs, origin):
    payload = json_loads(inputs["fragments"])
    require_id(payload.get("postId"), "post ID")
    doc = fragment_document(payload)
    record = base_record("subscribestar", origin)
    record["identity"] = {"id": str(payload.get("postId")) if payload.get("postId") is not None else None}
    byline = one(doc.xpath('//a[' + cls("post-user") + ']'), "post author")
    avatar_anchor = one(doc.xpath('//a[' + cls("post-avatar") + ']'), "post avatar")
    avatar = one(avatar_anchor.xpath('.//img'), "avatar image") if avatar_anchor is not None else None
    if byline is not None:
        if avatar_anchor is not None and public_url(byline.get("href"), origin) != public_url(avatar_anchor.get("href"), origin):
            raise ExtractionError("SubscribeStar avatar author mismatch")
        record["people"] = [{"id": avatar.get("data-user-id") if avatar is not None else None,
                             "name": text(byline), "role": "public_post_author", "profile": public_url(byline.get("href"), origin),
                             "avatar": public_url(avatar.get("src"), origin) if avatar is not None else None}]
    body = one(doc.xpath('//*[' + cls("post-content") + ']//*[' + cls("trix-content") + ']'), "Trix public body")
    record["body"] = ordered_body(body, origin, "observed_public_body_fragment")
    date = one(doc.xpath('//*[' + cls("post-date") + ']//a'), "post permalink")
    if date is not None and record["identity"]["id"] is not None:
        if urlsplit(public_url(date.get("href"), origin) or "").path.rstrip("/").split("/")[-1] != record["identity"]["id"]:
            raise ExtractionError("SubscribeStar post identity mismatch")
    if doc.xpath('//*[@data-autoload="false"]'):
        record["warnings"].append("Deferred upload containers were not fetched; initial fragment is not complete uploads.")
    record["warnings"].append("Public body only; no entitled private content, account session or subscription action.")
    return record


def simsfinds(inputs, origin):
    payload = json_loads(inputs["fragments"])
    doc = fragment_document(payload)
    parsed = [json_loads(s["text"]) for s in payload.get("jsonScripts", [])]
    custom = one([s for s in parsed if isinstance(s, dict) and all(k in s for k in ("id", "creator", "game", "image"))], "semantic item JSON", True)
    for key in ("id", "creator", "game"):
        require_id(custom[key], "semantic " + key)
    record = base_record("simsfinds", origin)
    record["identity"] = {"id": str(custom["id"]), "gameId": str(custom["game"]), "title": custom.get("title")}
    creator_id = str(custom["creator"])
    byline = one(doc.xpath('//*[@id="dl7d368e9a"]//a[@data-link]'), "creator byline")
    if byline is not None and byline.get("data-link", "").split(",")[0] != creator_id:
        raise ExtractionError("SimsFinds semantic creator mismatch")
    # This ID is actually duplicated: use element type and semantic attribute.
    avatar = one(doc.xpath('//*[@id="dl7d368e9a"]//figure[@data-image]'), "scoped creator figure")
    p = {"id": creator_id, "name": text(byline), "role": "site_listed_creator_account",
         "profile": public_url(byline.get("href"), origin) if byline is not None else None,
         "avatar": public_url(avatar.get("data-image"), origin) if avatar is not None else None}
    if "profile_receipt" in inputs:
        evidence = json_loads(inputs["profile_receipt"])
        observed = evidence.get("author", {})
        if str(observed.get("id")) != creator_id or public_url(observed.get("profile")) != p["profile"]:
            raise ExtractionError("SimsFinds profile receipt mismatch")
        p["profileDisplayName"] = observed.get("profileDisplayName")
        image = observed.get("profileAvatar", {})
        p["profileAvatar"] = public_url(image.get("src"))
        p["profileAvatarDecodeReported"] = bool(image.get("decoded"))
        p["profileAvatarDimensionsReported"] = [image.get("width"), image.get("height")]
        p["profileAvatarEvidence"] = "supplied sanitized browser receipt; not independently decoded in offline replay"
    record["people"] = [p]
    record["body"] = ordered_body(one(doc.xpath('//*[@id="dl8d749e5a"]//*[@data-sfp-paragraphy]'), "item body"), origin)
    note = one(doc.xpath('//*[@id="dl9d238e7a"]//*[@data-sfp-paragraphy]'), "creator note")
    if note is not None:
        record["notes"].append(ordered_body(note, origin))
    record["projectImage"] = public_url(custom.get("image", {}).get("page"))
    record["gates"] = ["download_transfer_not_performed_by_offline_parser"]
    record["warnings"] = ["Custom application JSON is not Schema.org; Schema author placeholder is not the creator identity.",
                          "Duplicate avatar/follower DOM ID is handled through scoped semantic selectors.",
                          "Outbound Patreon identity claim does not merge creator accounts."]
    return record


FAMILIES = {"modrinth": modrinth, "pmc": pmc, "wordpress": wordpress, "rss": rss,
            "dwemer": dwemer, "modpub": modpub, "subscribestar": subscribestar, "simsfinds": simsfinds}


def extract(family, inputs, origin=""):
    if family not in FAMILIES:
        raise ExtractionError("Unknown family")
    record = FAMILIES[family](inputs, origin)
    for item in record if isinstance(record, list) else [record]:
        if item["body"] is None:
            item["warnings"].append("Full body absent; metadata summary was not promoted to full content.")
        if not item["people"]:
            item["warnings"].append("Author missing; cover image was not substituted as avatar.")
    return record


def body_receipt(body):
    if body is None:
        return None
    events = body["events"]
    return {"format": body["format"], "completeness": body["completeness"],
            "characters": len(body["text"]), "utf8Bytes": len(body["raw"].encode()),
            "whitespaceCollapsedCharacters": len(" ".join(body["text"].split())),
            "rawSha256": sha256(body["raw"]), "textSha256": sha256(body["text"]),
            "orderedEventCount": len(events), "orderedEventTypes": [e["type"] for e in events],
            "media": [{k:v for k,v in e.items() if k != "text"} for e in events if e["type"] == "media"],
            "links": [e.get("url") for e in events if e["type"] == "link_start"],
            "projectionComplete": body.get("projectionComplete", True)}


def receipt(record):
    """Explicit whitelist: never serialize raw bodies, metadata prose or traces."""
    if isinstance(record, list):
        return [receipt(r) for r in record]
    result = {key: record[key] for key in ("family", "sourceUrl", "identity", "people", "gallery", "files", "gates", "follow", "warnings", "scope", "fullSupportAccepted")}
    result["body"] = body_receipt(record["body"])
    result["notes"] = [body_receipt(n) for n in record["notes"]]
    result["metadataSummaryPresent"] = bool(record.get("metadataSummary"))
    result["projectImage"] = record.get("projectImage")
    if record.get("changelogFragment") is not None:
        result["changelogFragment"] = body_receipt(record["changelogFragment"])
    # Redact every URL again at the receipt boundary, including nested API data.
    def sanitize(value):
        if isinstance(value, list):
            return [sanitize(x) for x in value]
        if isinstance(value, dict):
            return {k:sanitize(v) for k,v in value.items()}
        if isinstance(value, str) and re.match(r"^[a-z][a-z0-9+.-]*://", value, re.I):
            return public_url(value)
        return value
    return sanitize(result)
