#!/usr/bin/env python3
"""Run a real two-profile isolation proof on a synthetic loopback site."""
import argparse
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit, parse_qs
from playwright.sync_api import sync_playwright

SETUP = """async identity => {
 localStorage.setItem('profile',identity); sessionStorage.setItem('profile',identity);
 const db=await new Promise((resolve,reject)=>{
   const req=indexedDB.open('accounts',1);
   req.onupgradeneeded=()=>req.result.createObjectStore('identity');
   req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
 });
 await new Promise((resolve,reject)=>{
   const tx=db.transaction('identity','readwrite'); tx.objectStore('identity').put(identity,'user');
   tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error);
 });
 db.close();
 const cache=await caches.open('profile'); await cache.put('/record',new Response(identity));
 await navigator.serviceWorker.register('/worker.js');
 await navigator.serviceWorker.ready;
}"""
READ = """async () => {
 const stored=await new Promise((resolve,reject)=>{
   const req=indexedDB.open('accounts',1);
   req.onupgradeneeded=()=>req.result.createObjectStore('identity');
   req.onsuccess=()=>{const db=req.result, get=db.transaction('identity').objectStore('identity').get('user');
     get.onsuccess=()=>{db.close(); resolve(get.result ?? null)}; get.onerror=()=>reject(get.error);};
   req.onerror=()=>reject(req.error);
 });
 const cached=await caches.match('/record');
 return {local:localStorage.getItem('profile'), session:sessionStorage.getItem('profile'),
         indexed:stored, cached:cached?await cached.text():null,
         worker:!!(await navigator.serviceWorker.getRegistration()),
         cookie:await fetch('/whoami').then(r=>r.text())};
}"""

class Fixture(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass
    def do_GET(self):
        source=urlsplit(self.path)
        identity=parse_qs(source.query).get('identity', [''])[0]
        content_type='text/html; charset=utf-8'
        body=b"<!doctype html><title>Two account isolation fixture</title><a href='/popup' target='_blank'>Open same-origin popup</a>"
        if source.path=='/whoami':
            content_type='text/plain'
            body=self.headers.get('Cookie','').encode()
        elif source.path=='/worker.js':
            content_type='application/javascript'
            body=b"self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));"
        self.send_response(200)
        self.send_header('Content-Type',content_type)
        self.send_header('Content-Length',str(len(body)))
        self.send_header('Cache-Control','no-store')
        if source.path=='/login' and identity in ('A','B'):
            self.send_header('Set-Cookie',f'identity={identity}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400')
        self.end_headers(); self.wfile.write(body)

def run(driver, binary, root, origin):
    def launch(profile):
        context=driver.chromium.launch_persistent_context(root/profile,headless=True,executable_path=binary)
        context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(origin+'/') else route.abort())
        return context, context.pages[0]
    a, first=launch('A')
    b, second=launch('B')
    try:
        first.goto(origin+'/login?identity=A')
        first.evaluate(SETUP,'A')
        second.goto(origin+'/')
        empty=second.evaluate(READ)
        assert empty==dict(local=None,session=None,indexed=None,cached=None,worker=False,cookie=''), empty
        second.goto(origin+'/login?identity=B')
        second.evaluate(SETUP,'B')
        for item, value in ((first,'A'), (second,'B')):
            assert item.evaluate(READ)==dict(local=value,session=value,indexed=value,cached=value,worker=True,cookie='identity='+value)
            with item.expect_popup() as popup:
                item.get_by_role('link',name='Open same-origin popup').click()
            with_context=popup.value
            with_context.wait_for_load_state()
            assert with_context.evaluate(READ)['cookie']=='identity='+value
            with_context.close()
    finally:
        a.close(); b.close()
    a, first=launch('A'); b, second=launch('B')
    try:
        first.goto(origin+'/'); second.goto(origin+'/')
        for item,value in ((first,'A'),(second,'B')):
            result=item.evaluate(READ)
            assert result==dict(local=value,session=None,indexed=value,cached=value,worker=True,cookie='identity='+value)
        a.clear_cookies()
        first.evaluate("() => localStorage.clear()")
        assert first.evaluate(READ)['cookie']==''
        assert second.evaluate(READ)['cookie']=='identity=B'
        assert second.evaluate(READ)['local']=='B'
    finally:
        a.close(); b.close()

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser')
    args=parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='athena-browser-fixture-') as root, ThreadingHTTPServer(('127.0.0.1',0),Fixture) as server, sync_playwright() as driver:
        Thread(target=server.serve_forever,daemon=True).start()
        run(driver,args.browser,Path(root),f'http://127.0.0.1:{server.server_port}')
        server.shutdown()
    print('Two real Chromium profiles isolated same-origin stores, popups and restart; clearing A did not clear B.')
