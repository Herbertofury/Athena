import json
import sys
import unittest
import subprocess
import tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.video_channel import catalogue


def bundle():
    return {'channel': {'id': 'UC' + 'a' * 22, 'contentDetails': {'relatedPlaylists': {'uploads': 'UU' + 'a' * 22}}},
            'pages': [{'playlist_id': 'UU' + 'a' * 22, 'request_page_token': None, 'full_response_export': True,
                       'response': {'kind': 'youtube#playlistItemListResponse', 'items': [item()]}}]}


def item():
    return {'id': 'playlist-item-not-video', 'snippet': {'playlistId': 'UU' + 'a' * 22, 'title': 'Synthetic'},
            'contentDetails': {'videoId': 'abcdefghijk'}}


def run(b):
    return catalogue(json.dumps(b).encode())


class ChannelTests(unittest.TestCase):
    def test_video_not_playlist_id_and_no_learning_claim(self):
        out = run(bundle())
        self.assertEqual(out['videos'][0]['video_id'], 'abcdefghijk')
        self.assertEqual(out['videos'][0]['study_status'], 'not-studied')
        self.assertEqual(out['pagination_status'], 'terminal-page-observed')

    def test_missing_page_explicitly_incomplete(self):
        b = bundle(); b['pages'][0]['response']['nextPageToken'] = 'next'
        self.assertEqual(run(b)['pagination_status'], 'more-pages-required')
        b['pages'].append({'playlist_id': 'UU' + 'a' * 22, 'request_page_token': 'next', 'full_response_export': True,
                           'response': {'kind': 'youtube#playlistItemListResponse', 'items': []}})
        self.assertEqual(run(b)['pagination_status'], 'terminal-page-observed')
        b['pages'][1]['request_page_token'] = 'wrong'
        with self.assertRaises(ValueError): run(b)

    def test_omitted_pagination_metadata_not_assumed_terminal(self):
        b = bundle(); del b['pages'][0]['full_response_export']
        self.assertEqual(run(b)['pagination_status'], 'pagination-metadata-unverified')

    def test_unavailable_item_retained(self):
        b = bundle(); del b['pages'][0]['response']['items'][0]['contentDetails']
        self.assertEqual(len(run(b)['unresolved_items']), 1)

    def test_reject_search_and_identity_confusion(self):
        b = bundle(); b['pages'][0]['response']['kind'] = 'youtube#searchListResponse'
        with self.assertRaises(ValueError): run(b)
        b = bundle(); b['pages'][0]['response']['items'][0]['snippet']['resourceId'] = {'videoId': 'otherxxxxxx'}
        with self.assertRaises(ValueError): run(b)

    def test_cli_does_not_overwrite(self):
        with tempfile.TemporaryDirectory() as folder:
            source, output = Path(folder)/'input.json', Path(folder)/'output.json'
            source.write_text(json.dumps(bundle()))
            command = [sys.executable, str(Path(__file__).resolve().parents[1]/'scripts/video_channel.py'), str(source), '--output', str(output)]
            first = subprocess.run(command, capture_output=True)
            self.assertEqual(first.returncode, 0, first.stderr)
            original = output.read_bytes()
            self.assertNotEqual(subprocess.run(command, capture_output=True).returncode, 0)
            self.assertEqual(output.read_bytes(), original)

    def test_duplicate_item_and_token_cycles_rejected(self):
        b = bundle(); b['pages'][0]['response']['items'].append(item())
        with self.assertRaises(ValueError): run(b)
        b = bundle(); b['pages'][0]['response']['nextPageToken'] = 'next'
        b['pages'].append({'playlist_id': 'UU' + 'a' * 22, 'request_page_token': 'next', 'full_response_export': True,
                           'response': {'kind': 'youtube#playlistItemListResponse', 'items': [], 'nextPageToken': 'next'}})
        with self.assertRaises(ValueError): run(b)


if __name__ == '__main__': unittest.main()
