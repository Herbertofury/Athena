# Extractor release and safe diagnostics review

Reviewed 2026-10-27. Sources: EXT01, BROTLI01, CERTIFI01, NET03. Research-only upstream candidate; no extractor installed or deployed.

## yt-dlp 2026.10.26

The [official release](https://github.com/yt-dlp/yt-dlp/releases/tag/2026.10.26), published October 26 at 22:25 UTC, raises the minimum Python version to 3.11 and the official Windows executable requirement to Windows 10. Its maintainers report updated bundled Brotli and curl-cffi dependencies addressing the linked Brotli and certifi advisories. It also includes a Boosty direct-link extraction fix through the Odnoklassniki extractor. A supported extractor is not permission to access restricted content; no such route was executed here.

The [reviewed Brotli advisory](https://github.com/advisories/GHSA-9v8h-qqgm-4m35) lists affected PyPI brotli versions >=1.0.3 and <1.2.1, and brotlicffi >=1.0.3 and <1.2.1.0. The [certifi advisory](https://github.com/advisories/GHSA-6q48-6c7w-9gw2) concerns compromised intermediates chaining to an included root; it identifies 2026.10.18 as patched and explains the selective root restoration in 2026.10.19. Check the actual distribution and vendored libraries, not only the top-level package version.

Local Python package metadata showed certifi 2026.10.19; yt-dlp, brotli, brotlicffi and curl-cffi were not installed in that interpreter. This is not an audit of other environments, browser binaries, embedded native libraries or any target project. No other project's dependency, TODO or wiki was modified.

## Implementation follow-through: diagnostic privacy

[reqwest 0.13.5 documents](https://docs.rs/reqwest/0.13.5/reqwest/struct.Error.html) that errors may include request URLs. Atlas now classifies transport, JSON, known cooldown, rate-limit, cancellation and size failures using fixed messages rather than echoing raw error strings. Unknown errors remain generic. This improves future diagnosis without claiming the cause of the earlier unexplained request failure.

Tests attach a synthetic secret-bearing URL to a request error, supply malformed JSON and unknown private-looking messages, and verify only fixed category text is returned. Actual secrets, headers and response payloads are not used. Existing retained results are unchanged. This is neither a complete observability system nor proof that every network failure can be diagnosed.
