import importlib.util
import json
import pathlib
import unittest
ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fixture', ROOT/'labs/network/http_fixture.py')
fixture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixture)


class ResponseTests(unittest.TestCase):
    def test_health(self):
        status, headers, body = fixture.response_for('GET', '/health')
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)['status'], 'ok')
        self.assertEqual(int(headers['Content-Length']), len(body))

    def test_head_metadata_without_body(self):
        get = fixture.response_for('GET', '/health')
        head = fixture.response_for('HEAD', '/health')
        self.assertEqual(head[:2], get[:2])
        self.assertEqual(head[2], b'')

    def test_missing_and_busy(self):
        for path, code in [('/missing', 404), ('/busy', 503)]:
            status, headers, body = fixture.response_for('GET', path)
            self.assertEqual(status, code)
            self.assertEqual(headers['Cache-Control'], 'no-store')
            self.assertIn('error', json.loads(body))

    def test_does_not_serve_paths_or_echo_input(self):
        target = '/../../private?token=DO_NOT_ECHO'
        status, headers, body = fixture.response_for('GET', target)
        self.assertEqual(status, 404)
        self.assertNotIn(b'DO_NOT_ECHO', body)
        self.assertNotIn(b'private', body)

    def test_unsupported_method(self):
        status, headers, body = fixture.response_for('POST', '/health')
        self.assertEqual(status, 405)
        self.assertEqual(headers['Allow'], 'GET, HEAD')

    def test_malformed_target_is_fixed_error(self):
        status, headers, body = fixture.response_for('GET', 'http://[')
        self.assertEqual(status, 400)
        self.assertEqual(json.loads(body), {'error': 'invalid request target'})

    def test_reject_invalid_port_before_socket(self):
        for value in [-1, 65536, '8000']:
            with self.assertRaises(ValueError):
                fixture.create_server(value)


if __name__ == '__main__':
    unittest.main()
