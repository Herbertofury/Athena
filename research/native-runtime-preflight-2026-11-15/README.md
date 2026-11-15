# Native launch: complete core shell, optional modules preserved

The native Foundry bridge previously accepted an empty runtime directory or a
package missing required core assets, queried its database and reached its listening
stage. The user then encountered missing scripts/blank UI rather than an actionable
startup error. This was reproduced with real packaged asset files and mocked CLI/
listener edges, not by opening a local socket or modifying an actual user database.

The bridge now inventories its existing static snapshot and rejects missing core
HTML, JavaScript, catalog, styles, workspace host or native bootstrap **before**
CLI dispatch/listening. The error names the missing package files so the operator
can restore a complete package. Optional cinematic/weather modules may still be
omitted. No full allowlist requirement, automatic download, data deletion, schema
upgrade, permission grant or source-repository change was introduced.

`before.txt` retains eight failing subcases (seven missing core files plus empty
runtime). `after.txt` records the four new test methods passing, including optional
module omission and immutable served bytes after on-disk edits. Six framing and four
rejection-drain tests also pass locally. Real Windows/Linux CLI and HTTP integration
remain hosted CI gates, distinct from this socket-free startup-contract test.

Run `python -m unittest discover -s native/foundry/tests -p test_runtime_preflight.py`.
This validates core package presence, **not content authenticity or a signature**;
existing runtime review/provenance gates remain separate. It does not establish
complete migration or make a source repository safe to delete.
