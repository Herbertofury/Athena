"""Optional real TCP integration checks. A socket denial must remain a failure."""
import http.client
import importlib.util
import json
import pathlib
import socket
import threading
import unittest
ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fixture', ROOT/'labs/network/http_fixture.py')
fixture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixture)


class LoopbackTests(unittest.TestCase):
    def setUp(self):
        self.server = fixture.create_server()
        self.worker = threading.Thread(target=self.server.serve_forever, kwargs={'poll_interval': 0.02}, daemon=True)
        self.worker.start()
        self.addCleanup(self.close_server)

    def close_server(self):
        self.server.shutdown()
        self.server.server_close()
        self.worker.join(timeout=2)
        self.assertFalse(self.worker.is_alive(), 'listener worker must stop')
        self.assertEqual(self.server.socket.fileno(), -1, 'listener socket must close')

    def request(self, method, path):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=2)
        try:
            connection.request(method, path)
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), response.read()
        finally:
            connection.close()

    def test_loopback_bind_and_health(self):
        self.assertEqual(self.server.server_address[0], '127.0.0.1')
        status, headers, body = self.request('GET', '/health')
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)['fixture'], 'athena-loopback-v1')
        self.assertEqual(int(headers['Content-Length']), len(body))

    def test_head(self):
        status, headers, body = self.request('HEAD', '/health')
        self.assertEqual(status, 200)
        self.assertGreater(int(headers['Content-Length']), 0)
        self.assertEqual(body, b'')

    def test_head_wire_contains_no_body(self):
        # http.client masks HEAD bodies by design; inspect actual wire bytes.
        with socket.create_connection(('127.0.0.1', self.server.server_port), timeout=2) as client:
            client.sendall(b'HEAD /health HTTP/1.0\r\nHost: localhost\r\n\r\n')
            chunks = []
            while True:
                part = client.recv(4096)
                if not part:
                    break
                chunks.append(part)
        headers, body = b''.join(chunks).split(b'\r\n\r\n', 1)
        self.assertIn(b' 200 ', headers)
        self.assertIn(b'Content-Length:', headers)
        self.assertEqual(body, b'')

    def test_not_found(self):
        self.assertEqual(self.request('GET', '/missing')[0], 404)

    def test_busy(self):
        self.assertEqual(self.request('GET', '/busy')[0], 503)

    def test_post_rejected(self):
        self.assertEqual(self.request('POST', '/health')[0], 405)

    def test_malformed_target(self):
        # The high-level client rejects this before sending; exercise server wire input.
        with socket.create_connection(('127.0.0.1', self.server.server_port), timeout=2) as client:
            client.sendall(b'GET http://[ HTTP/1.0\r\nHost: localhost\r\n\r\n')
            chunks = []
            while True:
                part = client.recv(4096)
                if not part:
                    break
                chunks.append(part)
        headers, body = b''.join(chunks).split(b'\r\n\r\n', 1)
        self.assertIn(b' 400 ', headers)
        self.assertEqual(json.loads(body), {'error': 'invalid request target'})

    def test_other_methods_are_fixed_json(self):
        for method in ['PUT', 'DELETE', 'OPTIONS', 'PATCH', 'TRACE', 'CONNECT']:
            status, headers, body = self.request(method, '/health')
            self.assertEqual(status, 405)
            self.assertEqual(json.loads(body), {'error': 'method not allowed'})
        status, headers, body = self.request('PRIVATE_TEST_VALUE', '/health')
        self.assertEqual(status, 501)
        self.assertEqual(json.loads(body), {'error': 'request rejected', 'status': 501})
        self.assertNotIn(b'PRIVATE_TEST_VALUE', body)


if __name__ == '__main__':
    unittest.main()
