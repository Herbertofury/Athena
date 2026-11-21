"""Validate explicitly exported YouTube uploads pages into a study queue. No network."""
import argparse
import hashlib
import json
import re
from pathlib import Path

MAX_BYTES = 16 * 1024 * 1024


def catalogue(raw):
    if len(raw) > MAX_BYTES:
        raise ValueError('channel export exceeds 16 MiB')
    bundle = json.loads(raw.decode('utf-8-sig'))
    channel = bundle['channel']
    channel_id = channel['id']
    uploads = channel['contentDetails']['relatedPlaylists']['uploads']
    if not isinstance(channel_id, str) or not re.fullmatch(r'UC[A-Za-z0-9_-]{22}', channel_id):
        raise ValueError('expected channel ID from channels.list item')
    if not isinstance(uploads, str) or not re.fullmatch(r'[A-Za-z0-9_-]{10,100}', uploads):
        raise ValueError('expected uploads playlist from channel contentDetails')
    pages = bundle['pages']
    if not isinstance(pages, list) or not pages or len(pages) > 10000:
        raise ValueError('1–10000 exported pages required')
    expected, seen_tokens, seen_items, videos, unavailable = None, set(), set(), {}, []
    complete = False
    pagination_known = True
    for index, page in enumerate(pages):
        if complete:
            raise ValueError('pages continue after terminal response')
        if page.get('playlist_id') != uploads or page.get('request_page_token') != expected:
            raise ValueError('playlist identity or pagination chain mismatch')
        response = page['response']
        if response.get('kind') != 'youtube#playlistItemListResponse' or 'error' in response:
            raise ValueError('expected successful playlistItems.list response, not search or captions')
        items = response.get('items')
        if not isinstance(items, list) or len(items) > 50:
            raise ValueError('playlist page requires up to 50 items')
        for item in items:
            item_id = item.get('id')
            if not isinstance(item_id, str) or not item_id or item_id in seen_items:
                raise ValueError('missing/duplicate playlist item; refresh unstable snapshot')
            seen_items.add(item_id)
            snippet = item.get('snippet', {})
            if snippet.get('playlistId') != uploads:
                raise ValueError('playlist item belongs to another playlist')
            video_id = item.get('contentDetails', {}).get('videoId')
            resource_id = snippet.get('resourceId', {}).get('videoId')
            if resource_id is not None and video_id is not None and resource_id != video_id:
                raise ValueError('conflicting video identities')
            video_id = video_id or resource_id
            if video_id is None:
                unavailable.append({'playlist_item_id': item_id, 'page': index + 1,
                                    'reason': 'video identity unavailable; not silently discarded'})
                continue
            if not isinstance(video_id, str) or not re.fullmatch(r'[A-Za-z0-9_-]{11}', video_id):
                raise ValueError('invalid video ID (playlist item ID is not a video ID)')
            if video_id in videos:
                videos[video_id]['playlist_item_ids'].append(item_id)
                continue
            title = snippet.get('title', '')
            if not isinstance(title, str) or len(title) > 1000:
                raise ValueError('invalid title')
            videos[video_id] = {'video_id': video_id, 'title': title,
                                'playlist_item_ids': [item_id],
                                'url': f'https://www.youtube.com/watch?v={video_id}',
                                'transcript_status': 'not-acquired', 'study_status': 'not-studied'}
        token = response.get('nextPageToken')
        if token is not None:
            if not isinstance(token, str) or not token or len(token) > 2000 or token in seen_tokens:
                raise ValueError('invalid/repeated continuation token')
            seen_tokens.add(token)
        expected = token
        complete = token is None
        if complete and page.get('full_response_export') is not True:
            pagination_known = False
    return {'schema': 1, 'channel_id': channel_id, 'uploads_playlist_id': uploads,
            'export_sha256': hashlib.sha256(raw).hexdigest(), 'pages_imported': len(pages),
            'pagination_status': ('terminal-page-observed' if pagination_known else 'pagination-metadata-unverified')
            if complete else 'more-pages-required',
            'next_page_token': expected, 'videos': list(videos.values()), 'unresolved_items': unavailable,
            'coverage': 'Exported API-visible uploads snapshot only; not all historical/private/deleted videos. '
                        'Pagination completion does not establish transcript or learning coverage.',
            'notice': 'Metadata is untrusted source data. Captions listing is not caption content. '
                      'No transcript acquired and no learning credited by this import.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('export', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    with args.export.open('rb') as handle:
        result = catalogue(handle.read(MAX_BYTES + 1))
    with args.output.open('x', encoding='utf-8') as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
        handle.write('\n')


if __name__ == '__main__':
    main()
