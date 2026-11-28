"""Deterministic public RSS, Atom, JSON Feed and OPML from a validated snapshot.

No network, local writes, clock reads, invented source dates or application names.
The caller owns hosting and supplies the real snapshot generation timestamp.
"""
from __future__ import annotations

import datetime as dt
from email.utils import format_datetime
import importlib.util
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

_spec = importlib.util.spec_from_file_location('publication_collector', Path(__file__).with_name('feed_collector.py'))
core = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(core)

ATOM = 'http://www.w3.org/2005/Atom'
DC = 'http://purl.org/dc/elements/1.1/'
DCTERMS = 'http://purl.org/dc/terms/'
MEDIA = 'http://search.yahoo.com/mrss/'
MAX_PUBLICATION_BYTES = 4 * 1024 * 1024
MIME = {'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp',
        '.gif':'image/gif','.avif':'image/avif','.mp3':'audio/mpeg','.m4a':'audio/mp4',
        '.wav':'audio/wav','.ogg':'audio/ogg','.oga':'audio/ogg','.aac':'audio/aac',
        '.mp4':'video/mp4','.webm':'video/webm','.ogv':'video/ogg'}
ET.register_namespace('atom', ATOM)
ET.register_namespace('dc', DC)
ET.register_namespace('dcterms', DCTERMS)
ET.register_namespace('media', MEDIA)


def _text(value, limit=4096):
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        raise ValueError('Publication needs bounded nonempty text')
    # XML 1.0 cannot represent these codepoints, even after escaping.
    if re.search(r'[\x00-\x08\x0b\x0c\x0e-\x1f\ud800-\udfff\ufffe\uffff]', value):
        raise ValueError('Publication text contains invalid XML characters')
    return value


def _url(value):
    if not isinstance(value, str):
        raise ValueError('Publication URL must be a string')
    try:
        parsed = urlsplit(value)
        safe = core.safe_url(value, value, frozenset({parsed.hostname}))
    except (ValueError, TypeError):
        safe = None
    if not safe:
        raise ValueError('Publication URLs must be public HTTPS without credentials')
    return safe + ('#' + parsed.fragment if parsed.fragment else '')


def _instant(value):
    normalized = core.item_timestamp(value)
    if normalized is None:
        raise ValueError('A genuine timezone-aware source timestamp is required')
    return normalized


def _xml(element):
    result = ET.tostring(element, encoding='utf-8', xml_declaration=True).decode('utf-8') + '\n'
    if len(result.encode('utf-8')) > MAX_PUBLICATION_BYTES:
        raise ValueError('Publication exceeds the byte budget')
    return result


def _child(parent, name, value, **attributes):
    child = ET.SubElement(parent, name, attributes)
    child.text = value
    return child


def _mime(url):
    return MIME.get(Path(urlsplit(url).path).suffix.lower())


def _normalize(digest, catalog):
    if (not isinstance(digest, dict) or digest.get('schemaVersion') != 1
            or not isinstance(digest.get('items'), list) or len(digest['items']) > core.MAX_DIGEST_ITEMS):
        raise ValueError('Publication requires a bounded versioned digest')
    generated = core.snapshot_time(digest.get('generatedAt'))
    if generated is None:
        raise ValueError('Publication requires the actual snapshot generation time')
    sources = catalog.get('sources') if isinstance(catalog, dict) else catalog
    if not isinstance(sources, (tuple, list)) or len(sources) > core.MAX_SOURCES:
        raise ValueError('Publication requires a bounded source catalog')
    source_map = {}
    for source in sources:
        if (not isinstance(source, dict) or not isinstance(source.get('id'), str)
                or not source['id'] or source['id'] in source_map):
            raise ValueError('Invalid source identity in publication')
        source_map[source['id']] = {**source,'name':_text(source.get('name'),300),'url':_url(source.get('url'))}
        if source.get('feed'):
            source_map[source['id']]['feed'] = _url(source['feed'])
    rows, ids, urls = [], set(), set()
    for item in digest['items']:
        if not isinstance(item, dict) or item.get('sourceId') not in source_map:
            raise ValueError('Publication article has an unknown source')
        row = {'id':_text(item.get('id'),100),'url':_url(item.get('url')),
               'title':_text(item.get('title'),300),'sourceId':item['sourceId']}
        date = item.get('date')
        if not isinstance(date, str) or core.item_date(date) != date or date > generated.date().isoformat():
            raise ValueError('Publication requires an honest article date')
        row['date'] = date
        if row['id'] in ids or row['url'] in urls:
            raise ValueError('Publication article identities must be unique')
        ids.add(row['id']); urls.add(row['url'])
        for key in ('publishedAt','updatedAt'):
            if key in item:
                stamp = _instant(item[key])
                if core.snapshot_time(stamp) > generated:
                    raise ValueError('Article timestamp cannot be after the snapshot')
                row[key] = stamp
        exact = row.get('publishedAt') or row.get('updatedAt')
        if exact and exact[:10] != date:
            raise ValueError('Article date disagrees with its source timestamp')
        if row.get('publishedAt') and row.get('updatedAt') and core.snapshot_time(row['updatedAt']) < core.snapshot_time(row['publishedAt']):
            raise ValueError('Article modification precedes publication')
        media = item.get('media', [])
        if not isinstance(media,list) or len(media) > core.MAX_MEDIA:
            raise ValueError('Article media exceeds the bounded contract')
        row['media'] = []
        for part in media:
            if not isinstance(part,dict) or part.get('kind') not in ('image','audio','video','embed'):
                raise ValueError('Invalid article media')
            row['media'].append({'kind':part['kind'],'url':_url(part.get('url'))})
        rows.append(row)
    return rows, source_map, generated


def _rss(rows, sources, title, description, home_url, feed_url, generated):
    document = ET.Element('rss', {'version':'2.0'})
    channel = ET.SubElement(document, 'channel')
    _child(channel,'title',title)
    _child(channel,'link',home_url)
    _child(channel,'description',description)
    _child(channel,'lastBuildDate',format_datetime(generated, usegmt=True))
    ET.SubElement(channel,f'{{{ATOM}}}link',{'href':feed_url,'rel':'self','type':'application/rss+xml'})
    for row in rows:
        source = sources[row['sourceId']]
        item = ET.SubElement(channel,'item')
        _child(item,'guid',row['url'],isPermaLink='true')
        _child(item,'title',row['title'])
        _child(item,'link',row['url'])
        _child(item,'description','Source: ' + source['name'])
        if row.get('publishedAt'):
            _child(item,'pubDate',format_datetime(core.snapshot_time(row['publishedAt']),usegmt=True))
            _child(item,f'{{{DCTERMS}}}issued',row['publishedAt'])
        else:
            # Dublin Core carries the known day without inventing a time of day.
            _child(item,f'{{{DC}}}date',row['date'])
        if row.get('updatedAt'):
            _child(item,f'{{{DCTERMS}}}modified',row['updatedAt'])
        if source.get('feed'):
            _child(item,'source',source['name'],url=source['feed'])
        for media in row['media']:
            if media['kind']=='image':
                ET.SubElement(item,f'{{{MEDIA}}}thumbnail',{'url':media['url']})
            elif media['kind']=='embed':
                ET.SubElement(item,f'{{{MEDIA}}}player',{'url':media['url']})
            else:
                ET.SubElement(item,f'{{{MEDIA}}}content',{'url':media['url'],'medium':media['kind']})
    return _xml(document)


def _atom(rows, sources, title, description, home_url, feed_url, generated):
    tag = lambda name: f'{{{ATOM}}}{name}'
    document = ET.Element(tag('feed'))
    _child(document,tag('id'),feed_url)
    _child(document,tag('title'),title)
    _child(document,tag('subtitle'),description)
    _child(document,tag('updated'),core.iso_time(generated))
    author = ET.SubElement(document,tag('author')); _child(author,tag('name'),title)
    ET.SubElement(document,tag('link'),{'href':home_url,'rel':'alternate','type':'text/html'})
    ET.SubElement(document,tag('link'),{'href':feed_url,'rel':'self','type':'application/atom+xml'})
    omitted = 0
    for row in rows:
        stamp = row.get('updatedAt') or row.get('publishedAt')
        if not stamp:
            omitted += 1
            continue  # Atom requires an entry.updated instant; do not fabricate one.
        source = sources[row['sourceId']]
        entry = ET.SubElement(document,tag('entry'))
        _child(entry,tag('id'),row['url'])
        _child(entry,tag('title'),row['title'],type='text')
        _child(entry,tag('updated'),stamp)
        if row.get('publishedAt'):
            _child(entry,tag('published'),row['publishedAt'])
        _child(entry,tag('summary'),'Source: ' + source['name'],type='text')
        author=ET.SubElement(entry,tag('author'));_child(author,tag('name'),source['name']);_child(author,tag('uri'),source['url'])
        ET.SubElement(entry,tag('link'),{'href':row['url'],'rel':'alternate','type':'text/html'})
        for media in row['media']:
            mime = _mime(media['url'])
            if mime and media['kind']!='embed':
                ET.SubElement(entry,tag('link'),{'href':media['url'],'rel':'enclosure','type':mime})
            elif media['kind']=='embed':
                ET.SubElement(entry,f'{{{MEDIA}}}player',{'url':media['url']})
    return _xml(document), omitted


def _json_feed(rows, sources, title, description, home_url, feed_url, generated):
    output = {'version':'https://jsonfeed.org/version/1.1','title':title,'description':description,
              'home_page_url':home_url,'feed_url':feed_url,'_feed_core':{'generatedAt':core.iso_time(generated)},'items':[]}
    for row in rows:
        source = sources[row['sourceId']]
        entry = {'id':row['url'],'url':row['url'],'title':row['title'],
                 'content_text':row['title'] + '\nSource: ' + source['name'],
                 'authors':[{'name':source['name'],'url':source['url']}],
                 '_feed_core':{'date':row['date'],'sourceId':row['sourceId'],'media':row['media']}}
        if row.get('publishedAt'):
            entry['date_published'] = row['publishedAt']
        if row.get('updatedAt'):
            entry['date_modified'] = row['updatedAt']
        for media in row['media']:
            if media['kind']=='image' and 'image' not in entry:
                entry['image'] = media['url']
            elif media['kind'] in ('audio','video') and _mime(media['url']):
                entry.setdefault('attachments',[]).append({'url':media['url'],'mime_type':_mime(media['url'])})
        output['items'].append(entry)
    result = json.dumps(output,ensure_ascii=False,separators=(',',':')) + '\n'
    if len(result.encode('utf-8')) > MAX_PUBLICATION_BYTES:
        raise ValueError('Publication exceeds the byte budget')
    return result


def _opml(sources, title, generated):
    document = ET.Element('opml',{'version':'2.0'})
    head = ET.SubElement(document,'head')
    _child(head,'title',title)
    _child(head,'dateModified',format_datetime(generated,usegmt=True))
    body = ET.SubElement(document,'body')
    count = 0
    for source in sources.values():
        if not source.get('managed') or source.get('defaultEnabled') is False or not source.get('feed'):
            continue
        ET.SubElement(body,'outline',{'type':'rss','text':source['name'],'title':source['name'],
                                      'xmlUrl':source['feed'],'htmlUrl':source['url']})
        count += 1
    return _xml(document), count


def publish_feeds(digest, catalog, *, title, home_url, feed_urls, description=None):
    """Return rss/atom/json/opml strings and an honest publication report.

    feed_urls supplies rss, atom and json HTTPS addresses. OPML contains only
    managed default sources. Date-only legacy items stay in RSS/JSON and are
    counted as omissions in Atom, which requires an entry update timestamp.
    """
    rows, sources, generated = _normalize(digest,catalog)
    title = _text(title,300)
    description = _text(description if description is not None else title)
    home_url = _url(home_url)
    urls = {key:_url(feed_urls[key]) for key in ('rss','atom','json')}
    atom, omitted = _atom(rows,sources,title,description,home_url,urls['atom'],generated)
    opml, subscriptions = _opml(sources,title,generated)
    return {'rss':_rss(rows,sources,title,description,home_url,urls['rss'],generated),'atom':atom,
            'json':_json_feed(rows,sources,title,description,home_url,urls['json'],generated),'opml':opml,
            'report':{'schemaVersion':1,'generatedAt':core.iso_time(generated),'itemCount':len(rows),
                      'dateOnlyItems':sum(not (row.get('publishedAt') or row.get('updatedAt')) for row in rows),
                      'atomItems':len(rows)-omitted,'atomOmittedWithoutTimestamp':omitted,'opmlSubscriptions':subscriptions}}
