#!/usr/bin/env python3
"""Run the complete two-renderer lab on loopback; never contact third-party hosts."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import expect, sync_playwright

ROOT=Path(__file__).resolve().parent

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):
        pass

def check(browser,origin,width):
    context=browser.new_context(viewport={'width':width,'height':900},has_touch=width<500)
    page=context.new_page()
    errors=[]; outside=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.on('request',lambda req: outside.append(req.url) if not req.url.startswith(origin+'/') else None)
    page.route('**/*',lambda rt: rt.continue_() if rt.request.url.startswith(origin+'/') else rt.abort())
    page.goto(origin+'/')
    assert not page.locator('iframe').count()
    page.get_by_role('button',name='Prism Optics').press('Enter')
    prism=page.frame_locator('iframe[title="Prism Optics"]')
    prism.get_by_role('heading',name='Prism Optics').wait_for()
    surface=prism.locator('#field')
    assert surface.get_attribute('data-paints') is not None
    n=int(surface.get_attribute('data-paints'))
    def wait_paint(before):
        page.wait_for_function("""n => +(document.querySelector('iframe').contentDocument
          .querySelector('#field').dataset.paints||0)>n""",arg=before)
    box=surface.bounding_box()
    pos={'x':14,'y':15}
    if width<500:
        surface.tap(position=pos)
    else:
        page.mouse.move(box['x']+13,box['y']+17)
        page.mouse.click(box['x']+14,box['y']+15)
    wait_paint(n)
    page.wait_for_timeout(1200)
    tail=int(surface.get_attribute('data-paints'))
    page.wait_for_timeout(150)
    assert tail == int(surface.get_attribute('data-paints')), 'Finite effects did not sleep'
    prism.get_by_role('button',name='Ordinary control').click()
    assert prism.get_by_role('status').inner_text() == 'Ordinary control activated.'
    prism.get_by_label('Motion').select_option('still')
    n=int(surface.get_attribute('data-paints'))
    prism.get_by_role('button',name='Pulse').press('Enter')
    page.wait_for_timeout(90)
    assert n==int(surface.get_attribute('data-paints'))
    page.get_by_role('button',name='Aether Scenes').click()
    aether=page.frame_locator('iframe[title="Aether Scenes"]')
    aether.get_by_label('Scene', exact=True).wait_for()
    expect(aether.locator('#scene').locator('option')).to_have_count(18)
    assert aether.locator('#mode').locator('option').count()>=6
    assert not page.locator('iframe[title="Prism Optics"]').count()
    aether.locator('#mode').select_option('well')
    assert aether.locator('#mode').input_value()=='well'
    page.get_by_role('button',name='Off',exact=True).click()
    assert not page.locator('iframe').count()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert not outside and not errors,(outside,errors)
    context.close()

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--browser')
    opts=ap.parse_args()
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
    Thread(target=server.serve_forever,daemon=True).start()
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path=opts.browser,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
            for width in (390,1280):check(browser,f'http://127.0.0.1:{server.server_port}',width)
            browser.close()
    finally:
        server.shutdown();server.server_close()
    print('PASS: actual mobile/desktop switching, finite Canvas, real settings, control isolation, and loopback only.')

if __name__=='__main__':
    main()
