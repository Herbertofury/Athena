"""Bounded GET confirmation must distinguish HEAD-only 410 from actual removal."""
import importlib.util
import pathlib
import unittest
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location('links', pathlib.Path(__file__).resolve().parents[1] / 'scripts/check_software_links.py')
links = importlib.util.module_from_spec(spec)
spec.loader.exec_module(links)

class HeadConfirmationTests(unittest.TestCase):
    def check(self, get_status):
        url = 'https://public.example/downloads'
        opener = MagicMock()
        gone = HTTPError(url, 410, 'Gone', {}, None)
        response = MagicMock()
        response.status = get_status
        response.geturl.return_value = url
        response.headers = {'Content-Type': 'text/html'}
        response.read.return_value = b'Official downloads'
        response.__enter__.return_value = response
        opener.open.side_effect = [gone, response if get_status < 400 else HTTPError(url, get_status, 'Gone', {}, None)]
        with patch.object(links, 'public_url', return_value=url), patch.object(links, 'build_opener', return_value=opener):
            result = links.check_url(url)
        requests = [x.args[0] for x in opener.open.call_args_list]
        self.assertEqual([r.get_method() for r in requests], ['HEAD', 'GET'])
        self.assertEqual(requests[1].get_header('Range'), 'bytes=0-16383')
        self.assertEqual(result['head_status'], 410)
        self.assertEqual(result['method'], 'GET')
        return result, response

    def test_head_410_get_206_is_reachable_with_bounded_read(self):
        result, response = self.check(206)
        self.assertEqual(result['outcome'], 'reachable')
        self.assertEqual(result['status'], 206)
        response.read.assert_called_once_with(16384)
        self.assertIn('sample_sha256', result)

    def test_confirmed_get_404_and_410_remain_not_found(self):
        for status in (404, 410):
            with self.subTest(status=status):
                result, _ = self.check(status)
                self.assertEqual(result['outcome'], 'not_found')
                self.assertEqual(result['status'], status)

if __name__ == '__main__':
    unittest.main()
