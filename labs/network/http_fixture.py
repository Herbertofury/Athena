"""Local-only fixed HTTP teaching responses. Not a production server."""
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlsplit
import argparse
import json


def response_for(method, target):
    """Return (status, headers, body) without I/O or filesystem access."""
    try:
        path = urlsplit(target).path
    except (TypeError, ValueError):
        path = None
    if method not in ('GET', 'HEAD'):
        status, payload = 405, {'error': 'method not allowed'}
    elif path is None:
        status, payload = 400, {'error': 'invalid request target'}
    elif path == '/health':
        status, payload = 200, {'status': 'ok', 'fixture': 'athena-loopback-v1'}
    elif path == '/busy':
        status, payload = 503, {'error': 'synthetic busy response'}
    else:
        status, payload = 404, {'error': 'not found'}
    representation = (json.dumps(payload, sort_keys=True) + '\n').encode('utf-8')
    headers = {'Content-Type': 'application/json; charset=utf-8',
               'Content-Length': str(len(representation)),
               'Cache-Control': 'no-store'}
    if status == 405:
        headers['Allow'] = 'GET, HEAD'
    return status, headers, b'' if method == 'HEAD' else representation


class FixtureHandler(BaseHTTPRequestHandler):
    def _respond(self):
        status, headers, body = response_for(self.command, self.path)
        self._send_result(status, headers, body)

    def _send_result(self, status, headers, body):
        self.send_response(status)
        for name, value in headers.items():
            self.send_header(name, value)
        self.end_headers()
        if body:
            self.wfile.write(body)

    do_GET = _respond
    do_HEAD = _respond
    do_POST = _respond
    do_PUT = _respond
    do_DELETE = _respond
    do_OPTIONS = _respond
    do_PATCH = _respond
    do_TRACE = _respond
    do_CONNECT = _respond

    def send_error(self, code, message=None, explain=None):
        # Parser/unknown-method errors also use fixed JSON, never request text.
        body = (json.dumps({'error': 'request rejected', 'status': code}) + '\n').encode('utf-8')
        headers = {'Content-Type': 'application/json; charset=utf-8',
                   'Content-Length': str(len(body)), 'Cache-Control': 'no-store'}
        self._send_result(code, headers, b'' if getattr(self, 'command', None) == 'HEAD' else body)

    def log_message(self, format, *args):
        pass  # Do not log request data; this lab has no authentication or user records.


def create_server(port=0):
    if not isinstance(port, int) or not 0 <= port <= 65535:
        raise ValueError('port must be an integer from 0 through 65535')
    return HTTPServer(('127.0.0.1', port), FixtureHandler)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=0,
                        help='local port, default 0 lets the OS choose an unused port')
    args = parser.parse_args()
    with create_server(args.port) as server:
        print(f'Local teaching fixture: http://127.0.0.1:{server.server_port}/health', flush=True)
        print('Fixed synthetic data only. Stop with Ctrl+C. No TLS or file serving.', flush=True)
        try:
            server.serve_forever(poll_interval=0.1)
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
