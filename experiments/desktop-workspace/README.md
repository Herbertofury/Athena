# Desktop Workspace Lab

A dependency-free, in-app desktop/taskbar reference. It is **off on a fresh profile**. Open the preview and explicitly enable it to try tool search, shortcuts, persistent pin order, running indicators, minimize/restore, and Show Desktop. Turn it back off from the header or the taskbar settings. No OS taskbar, processes, bookmarks, permissions, credentials, or sync are used. Only the preview switch and pin order persist on the current browser origin; scratchpad text lives only in that page.

## Run it locally

From this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
node --test model.test.mjs
python3 test-browser.py --browser /path/to/chromium --output ./visual-check
```

Open http://127.0.0.1:8000/ in your browser. Run the server in a separate terminal if testing manually. The Playwright test starts its own temporary loopback server and blocks outside requests.

## What to reuse

A host owns its activities and commands; the pure model owns pins, the open/minimized stack and the active tool. Keep projects' existing design tokens and navigation. Use stable allowlisted host IDs, never platform commands or URLs inferred from a label. Add native window actions only where a host already supports them, and validate that real host independently. This demo displays the focused pane only; draggable overlapping windows, OS integration and bookmark import are not claimed.

- [OpenTaskbar, reviewed Rust source](https://github.com/alztrk/opentaskbar/tree/3fcfd1baa5e41e97f0c3251e2b57bf4328a1c95f): stable pins, running indicators, quick launcher and predictable focus.
- [Super Bookmark Desktop, reviewed source](https://github.com/kylepaulsen/SuperBookmarkDesktop/tree/e97136e5c76be7dae1a5eaee22522ebee3280efa): a spatial shelf where shortcuts behave like a familiar desktop.
- Both are MIT reference projects. This implementation copies no source or assets and does not install either project or replace the system desktop.
- GameSync Next's Tauri desktop already has a sidebar and platform adapter; its sidebar is the intended integration seam, not something this lab replaces. GameSync Next is not modified or proven by the Athena demo.
