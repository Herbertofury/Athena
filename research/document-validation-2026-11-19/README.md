# Document validation source review, 2026-11-19

Four additive software identities: Ace by DAISY App, PDF Accessibility Checker (PAC), veraPDF and EPUBCheck. Official per-field citations are in data/software/document-validation-expanded.json. These cover different jobs: EPUB accessibility, Windows PDF accessibility inspection, PDF/A/PDF-UA machine rules, and EPUB structural conformance respectively. No universal ranking or full accessibility certification.

Windows distribution is not synonymous with folder portability: Ace uses NSIS installers; current PAC uses EXE/MSI rather than its historical ZIPs; veraPDF may put configuration under the user directory; EPUBCheck can relocate its JAR/lib tree but needs a separate Java runtime. Exact caches/temp/settings confinement and installed Windows behavior remain untested.

PAC release notes identify 26.1.2.0 dated2026-11-17. Other records retain unverified dated maintenance, even where documentation names a current version. MIT/dual-license source availability is not used to infer distribution pricing, so three pricing fields remain unknown. PAC is free of charge but vendor terms restrict rehosting: Athena links official downloads rather than redistributing installers.

Only public official documentation was read. No installs, settings changes, private documents, email, binaries or copied media. No measured performance or security claim. A guessed EPUBCheck LICENSE.txt page returned404; independent review then found the product-page MIT statement conflicts with the actual v5.4.0 LICENSE.md (BSD-3-Clause). The record now uses the release-pinned BSD terms, retaining the conflict explicitly. Exact Windows version floors and configuration paths not supported by the reviewed sources remain limitations.

This change adds actual runtime catalog entries and generated documentation in its branch, not a claim of main-branch deployment, browser acceptance, installed application testing or completed source-repository retirement. Tests validate catalog shape, evidence bindings, existing-record preservation and query visibility, not correctness of third-party applications.
