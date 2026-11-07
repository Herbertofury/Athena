"""Offline itch.io DOM-subtree experiment; no network or source mutations.

Input is a caller-owned browser capture, never an embedded third-party fixture.
Selectors are scoped to the two observed public project/devlog representations.
"""
from __future__ import annotations
import argparse
import json
import re
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from extractors import (ExtractionError, base_record, cls, document, one,
                        ordered_body, public_url, receipt, sha256, text)


def same_url(a, b):
    return (public_url(a) or '').rstrip('/') == (public_url(b) or '').rstrip('/')


def capture_document(capture):
    fragments = capture.get('html')
    if not isinstance(fragments, list) or not fragments:
        raise ExtractionError('Missing DOM fragments')
    return document('<html><head>' + ''.join(capture.get('meta', [])) + '</head><body>' +
                    ''.join(f['html'] for f in fragments) + '</body></html>')


def number(values, label):
    vals = set(values)
    if not vals:
        return None
    if len(vals) != 1 or not re.fullmatch(r'[1-9][0-9]*', next(iter(vals))):
        raise ExtractionError('Ambiguous or invalid ' + label)
    return int(next(iter(vals)))


def attach_profile(record, profile, creator):
    """Require reciprocal creator/profile URL and numeric game/account joins."""
    if len(record['people']) != 1:
        raise ExtractionError('Profile fixture requires one author')
    p = record['people'][0]
    expected = p['profile']
    if not same_url(creator.get('url'), expected):
        raise ExtractionError('Creator URL mismatch')
    c = document('<div>' + creator.get('headerHtml', '') + '</div>')
    links = c.xpath('//a[contains(concat(" ",normalize-space(@rel)," ")," me ")]/@href')
    if not any(same_url(u, profile.get('url')) for u in links):
        raise ExtractionError('Missing creator to community join')
    raw = ''.join(profile.get(k, '') for k in ('headerHtml','creatorLinkHtml','followHtml','gameHtml'))
    d = document('<div>' + raw + '</div>')
    backlinks = d.xpath('//*[' + cls('user_data') + ']//a/@href')
    if not any(same_url(u, expected) for u in backlinks):
        raise ExtractionError('Missing community to creator join')
    ids = []
    for u in d.xpath('//a/@href'):
        ids += parse_qs(urlsplit(u).query).get('user_id', [])
    uid = number(ids, 'profile account ID')
    if uid is None or p['id'] != uid:
        raise ExtractionError('Profile account ID mismatch')
    cards = [n for n in d.xpath('//*[' + cls('game_cell') + ']')
             if any(same_url(u, record['identity']['projectUrl']) for u in n.xpath('.//a/@href'))]
    card = one(cards, 'profile project card', required=True)
    if number([card.get('data-game_id', '')], 'profile game ID') != record['identity']['projectId']:
        raise ExtractionError('Profile game ID mismatch')
    author_labels = card.xpath('.//*[' + cls('game_author') + ']//a/@data-label')
    if author_labels != ['user:' + str(uid)]:
        raise ExtractionError('Profile card author mismatch')
    header = one(d.xpath('//*[' + cls('stat_header_widget') + ']'), 'profile header', required=True)
    avatar = one(header.xpath('.//*[' + cls('avatar') + ']'), 'profile avatar')
    if avatar is not None:
        match = re.fullmatch(r'\s*background-image\s*:\s*url\(([\"\']?)([^\"\'()]+)\1\)\s*;?\s*', avatar.get('style', ''))
        p['avatar'] = public_url(match.group(2), profile['url']) if match else None
    p['communityProfile'] = public_url(profile['url'])
    p['avatarEvidence'] = 'reciprocal profile links plus matching account/project DOM attributes; CSS URL only, decode not performed by parser'


def extract_itch(capture, profile=None, creator=None):
    url = public_url(capture.get('url'))
    parsed = urlsplit(url or '')
    if parsed.scheme != 'https' or not re.fullmatch(r'[a-z0-9-]+\.itch\.io', parsed.hostname or ''):
        raise ExtractionError('Unsupported itch.io origin')
    route = re.fullmatch(r'/([^/]+)(?:/devlog/([1-9][0-9]*)/([^/]+))?/?', parsed.path)
    if not route or route[1] in ('login','purchase','download'):
        raise ExtractionError('Unsupported project/devlog route')
    devlog = route[2] is not None
    project_url = parsed.scheme + '://' + parsed.netloc + '/' + route[1]
    d = capture_document(capture)
    r = base_record('itch', url)
    r['identity'] = {'kind':'devlog' if devlog else 'project', 'projectUrl':project_url,
                     'devlogId':int(route[2]) if devlog else None}
    tools = one(d.xpath('//*[' + cls('user_tools') + ']'), 'user tools')
    ids = tools.xpath('.//*[@data-game_id]/@data-game_id') if tools is not None else []
    related = tools.xpath('.//a[' + cls('related_games_btn') + ']/@href') if tools is not None else []
    for u in related:
        m = re.fullmatch(r'https://itch.io/games-like/([1-9][0-9]*)/[^/]+', u)
        if m:
            ids.append(m[1])
    r['identity']['projectId'] = number(ids, 'project ID')
    title = one(d.xpath('//section[' + cls('post_header') + ']/h1') if devlog else
                d.xpath('//h1[' + cls('game_title') + ']'), 'item title', required=True)
    r['identity']['title'] = text(title)
    body = one(d.xpath('//section[' + cls('post_body') + ']') if devlog else
               d.xpath('//div[' + cls('formatted_description') + ']'), 'item body')
    r['body'] = ordered_body(body, url, 'captured_public_body_subtree')
    rows = d.xpath('//*[' + cls('game_info_panel_widget') + ']//tr[td[1][normalize-space()="Author" or normalize-space()="Authors"]]/td[2]/a')
    follow = one(tools.xpath('.//a[' + cls('follow_user_btn') + ']'), 'follow identity') if tools is not None else None
    uid = number([follow.get('data-user_id')] if follow is not None and follow.get('data-user_id') else [], 'author ID')
    for a in rows:
        purl = public_url(a.get('href'), url)
        if not purl:
            raise ExtractionError('Invalid author URL')
        p = {'id':uid if len(rows) == 1 else None, 'name':text(a), 'role':'project_author', 'profile':purl,'avatar':None}
        r['people'].append(p)
    if devlog:
        authors = d.xpath('//section[' + cls('post_header') + ']//*[' + cls('post_meta') + ']/a')
        a = one(authors, 'devlog byline', required=True)
        if not any(same_url(p['profile'], a.get('href')) for p in r['people']):
            raise ExtractionError('Devlog byline/project author mismatch')
        for p in r['people']:
            if same_url(p['profile'], a.get('href')):
                p['role'] = 'project_author_and_devlog_byline'
        stamp = one(d.xpath('//section[' + cls('post_header') + ']//*[' + cls('post_meta') + ']/span[@title]'), 'post timestamp')
        r['identity']['publishedAtSource'] = stamp.get('title') if stamp is not None else None
    containers = d.xpath('//section[' + cls('post_files') + ']') if devlog else d.xpath('//*[' + cls('upload_list_widget') + ']')
    container = one(containers, 'file metadata')
    if container is not None:
        for upload in container.xpath('.//div[' + cls('upload') + ']'):
            name = one(upload.xpath('.//strong[' + cls('name') + ']'), 'file name', required=True)
            size = one(upload.xpath('.//*[' + cls('file_size') + ']'), 'file size')
            version = one(upload.xpath('.//*[' + cls('version_name') + ']'), 'file version')
            r['files'].append({'name':text(name), 'sizeLabel':text(size), 'versionLabel':text(version),
                               'dateLabels':upload.xpath('.//abbr/@title'), 'downloadVerified':False,
                               'scope':'devlog_associated_metadata' if devlog else 'current_project_metadata'})
    cover = one(d.xpath('//meta[@property="og:image"]/@content'), 'project preview')
    r['projectImage'] = public_url(cover, url)
    if (profile is None) != (creator is None):
        raise ExtractionError('Profile and creator must be supplied together')
    if profile is not None:
        attach_profile(r, profile, creator)
    if r['body'] is None:
        r['warnings'].append('Full body absent; metadata was not substituted.')
    if not r['people'] or any(p['avatar'] is None for p in r['people']):
        r['warnings'].append('Author avatar missing; project cover/banner not substituted.')
    r['warnings'].append('Captured DOM subtrees only; complete page/history, native follow, entitlement and downloads unaccepted.')
    r['gates'] = ['public_metadata_only', 'no_download_transfer']
    return r


def replay_capture(path):
    raw = Path(path).read_bytes()
    data = json.loads(raw)
    result = {'schemaVersion':1,'checkedAt':'2026-10-31','networkUsed':False,'fullSupportAccepted':False,
              'fixture':{'bytes':len(raw),'sha256':sha256(raw),'publication':'private caller-owned DOM capture; raw third-party bodies excluded'},
              'implementationReceipts':{n:{'sha256':sha256((Path(__file__).parent/n).read_bytes())} for n in ('itch.py','extractors.py')},'cases':[]}
    for key in ('flowfit','ldtkDevlog'):
        r = extract_itch(data[key], data.get('simrealistProfile') if key=='flowfit' else None,
                         data.get('simrealistCreator') if key=='flowfit' else None)
        expected = {'flowfit': (2290338, 1745407, 6), 'ldtkDevlog': (740403, 121597, 8)}[key]
        if (r['identity']['projectId'], r['people'][0]['id'], len(data[key]['images'])) != expected:
            raise ExtractionError('Actual fixture identity/count mismatch')
        if key == 'flowfit' and (not r['people'][0]['avatar'] or r['files'][0]['name'] != 'SimRealist_-_Flowfit_0.3.1.4.zip'):
            raise ExtractionError('Actual profile/file expectation failed')
        if key == 'ldtkDevlog' and r['identity']['devlogId'] != 663374:
            raise ExtractionError('Actual devlog identity mismatch')
        projected = [e.get('src') for e in r['body']['events'] if e['type']=='media' and e.get('tag')=='img']
        observed = [public_url(i['src']) for i in data[key]['images']]
        if projected != observed:
            raise ExtractionError('Browser/parser image order mismatch')
        result['cases'].append({'label':key,'status':'actual_dom_replay_passed','result':receipt(r),
             'checks':{'imageOrderMatchesBrowser':True,'imageCount':len(projected),'authorCount':len(r['people']),
                       'browserDecodedImageCount':sum(i['complete'] and i['naturalWidth']>0 for i in data[key]['images']),
                       'parserDecodedImages':False,'bodySubtreeOnly':True}})
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture',type=Path)
    parser.add_argument('--output',required=True,type=Path)
    args = parser.parse_args()
    args.output.write_text(json.dumps(replay_capture(args.capture),indent=2)+'\n')
