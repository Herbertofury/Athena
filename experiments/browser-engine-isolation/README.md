# Browser engine isolation fixture

This is a runnable engine-level reference for the shared browser contract, not a claim that Noxviola or the Athena Constellation host ships split view. It opens two real Chromium profiles against the **same synthetic loopback origin** and checks HttpOnly cookies at the server, local/session storage, IndexedDB, Cache Storage, service-worker registration, each profile’s popup, restart persistence, and clearing one profile without changing the other. No real providers, accounts, secrets, screenshots or external requests.

With Python Playwright and a compatible Chromium already available, run:

    python -B experiments/browser-engine-isolation/check.py --browser /path/to/chromium

Omit the flag to use Playwright’s installed Chromium. The fixture uses disposable browser directories. It does not prove UI split panes, Windows WebView2, Firefox, OAuth, protected media, secure vault storage, or compatibility with a live provider.
