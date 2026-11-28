"""Real loopback browser test. External URLs are blocked for the fixture."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright


def run(browser, url, output, width):
    context = browser.new_context(viewport={"width":width,"height":740}, reduced_motion="reduce")
    context.route("**/*", lambda route: route.continue_() if route.request.url.startswith(url) else route.abort())
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(url)
    desktop = page.get_by_role("region", name="Desktop workspace")
    expect(desktop).to_be_hidden()
    assert page.evaluate("localStorage.length") == 0
    if output:
        page.screenshot(path=output / f"off-{width}.png")
    page.get_by_role("button", name="Try desktop preview").click()
    expect(desktop).to_be_visible()
    launcher = page.get_by_role("button", name="Tools", exact=True)
    expect(launcher).to_be_focused()
    launcher.press("Enter")
    search = page.get_by_role("searchbox", name="Find a tool")
    expect(search).to_be_focused()
    search.fill("not-a-tool")
    expect(page.get_by_text("No tools match.")).to_be_visible()
    search.press("Escape")
    expect(launcher).to_be_focused()
    page.get_by_label("Desktop shortcuts").get_by_role("button", name="Open Scratchpad", exact=True).click()
    note = page.get_by_role("textbox", name="Scratchpad text")
    note.fill("Synthetic note stays through task switches")
    page.get_by_label("Pinned and running tools").get_by_role("button", name="Projects",exact=True).click()
    expect(page.get_by_role("heading", name="Projects")).to_be_visible()
    page.get_by_role("button", name="Show desktop",exact=True).click()
    expect(page.get_by_role("heading", name="Projects")).to_be_hidden()
    page.get_by_role("button", name="Restore windows",exact=True).click()
    expect(page.get_by_role("heading", name="Projects")).to_be_visible()
    page.get_by_label("Pinned and running tools").get_by_role("button", name="Scratchpad",exact=True).click()
    expect(note).to_have_value("Synthetic note stays through task switches")
    if output:
        page.screenshot(path=output / f"on-{width}.png")
    page.get_by_label("Desktop shortcuts").get_by_role("button", name="Open Taskbar settings", exact=True).click()
    page.get_by_role("button", name="Pin Taskbar settings", exact=True).click()
    page.get_by_role("button", name="Move Taskbar settings left", exact=True).click()
    assert page.locator("#running [data-task]").evaluate_all("e => e.map(b=>b.dataset.task)") == ["projects","settings","note"]
    assert page.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth")
    page.get_by_role("button", name="Turn desktop preview off").click()
    expect(desktop).to_be_hidden()
    expect(page.get_by_label("Enable desktop preview")).to_be_focused()
    page.reload()
    expect(desktop).to_be_hidden()
    page.get_by_role("button", name="Try desktop preview").click()
    assert page.locator("#running [data-task]").evaluate_all("e => e.map(b=>b.dataset.task)") == ["projects","settings","note"]
    assert not errors, errors
    context.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser")
    parser.add_argument("--output", type=Path)
    options = parser.parse_args()
    if options.output:
        options.output.mkdir(parents=True, exist_ok=True)
    handler = partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).resolve().parent))
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server, sync_playwright() as pw:
        Thread(target=server.serve_forever,daemon=True).start()
        browser = pw.chromium.launch(headless=True, executable_path=options.browser)
        for width in (390, 1280):
            run(browser, f"http://127.0.0.1:{server.server_port}/", options.output, width)
        browser.close()
    print("Desktop taskbar passes Chromium at 390 px and 1280 px.")
