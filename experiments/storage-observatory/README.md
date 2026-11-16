# Athena Storage Observatory (isolated experiment)

Original read-only capacity visualization. Start a static HTTP server from the repository root and open `experiments/storage-observatory/`. Do not open as file:// because module imports need an HTTP origin.

`node --test experiments/storage-observatory/*.test.mjs` runs the six model/DOM tests using the existing linkedom dependency. No new dependencies.

Demo values are fictional. User-selected JSON reports are read into memory only, not uploaded, saved or disk-verified. No scanning, cleanup, deletion or native filesystem access exists. See [research, limitations and backlog](../../docs/ui-design-library/storage-management-study.md).
