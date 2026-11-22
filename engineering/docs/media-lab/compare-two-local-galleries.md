# Compare two saved Modrinth galleries offline

From the Athena source directory with Node.js 22 or later:

```sh
node engineering/scripts/compare_local_galleries.mjs --project AANobbMI --before older.json --after newer.json
```

Select two locally retained Modrinth project responses. Both must name the
exact same case-sensitive project ID, not a slug or creator name. The
comparison uses the same ordered preview/original URL-pair rules as Athena's
Media workspace, but requires neither a Media card nor a running app. It
does not perform network requests or modify either file. Keep the supplied
files unchanged while they are read.

The JSON result identifies both exact input byte counts and SHA-256 digests.
A matching result covers **only the URL pairs and their order**. It does not
show that the images, full responses, publishing rights, or source authenticity
match. The tool does not infer collection dates or which snapshot should win;
`before` and `after` are caller-supplied order. Raw paths, URLs, and response
contents are never printed.

- Exit **0**: comparison computed; look at `result.status` for `matching` or
  `changed`.
- Exit **3**: gallery alone is `unknown` because it is absent or has an
  unsupported URL; this is not an empty-gallery match.
- Exit **2**: input refused; no result emitted. Each file must be ordinary,
  UTF-8 JSON, 1 byte to 2 MiB, with unambiguous keys and the selected ID.

```sh
node --test engineering/tests/local-gallery-files-cli.test.mjs
```
