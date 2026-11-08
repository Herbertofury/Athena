# Execution contracts and threat boundaries

## Trusted program and fixed inputs

`run_lab.py` accepts exactly one exercise name from eight choices. There are no user repository, remote, arbitrary shell command, file path, or user-code parameters. `lab.py` is trusted teaching source. Its internal Python classes are not a public sandbox API: modifying/importing the source gives the caller Python's normal powers. The safety claims describe the unmodified CLI, not hostile code sharing its process, compromised Python/Git executables, filesystem attackers, or arbitrary extensions to the lab.

Three fixed paths are generated inside each fresh repository: README.txt, notes.txt, release.json. Internal writes validate the filename allowlist and a 4096-byte maximum. All content is synthetic. No personal identity or credentials are used. Commits use `Synthetic Learner <learner@example.invalid>` and a fixed UTC timestamp. The repository explicitly selects SHA-1 object format for consistent full 40-hex revision handling; this is an identifier choice, not a cryptographic authentication claim.

## Repository ownership and lifetime

Each command creates its own `TemporaryDirectory` under `/tmp` on POSIX, ignoring inherited TMPDIR, containing a repository, empty template/hooks directory, and isolated home. Context-manager cleanup removes only that owned directory after successful and exceptional execution. No caller-provided directory is removed. No existing working tree is opened. Failure during initialization also closes the owning context. A forcibly killed Python process or operating-system failure can leave temporary files; ordinary context-manager cleanup is not a guarantee against those failures.

Temporary output streams are explicitly placed inside the owned repository root directory, ignoring inherited TMPDIR, and closed after each command. Archives remain in memory. The CLI writes only JSON to stdout/stderr; it does not save a release artifact or publish anything.

## Git process isolation

At repository creation, Git is selected from the ordered fixed allowlist `/usr/local/bin/git`, `/usr/bin/git`, `/bin/git`, requiring `Path.is_file()` and `os.access(X_OK)`. No inherited PATH or caller-provided executable is accepted. This environment selects `/usr/local/bin/git` (2.52.0). Python 3.12.14 is verified; fallback selection is unit-tested with filesystem probes mocked, not fake executables run. Other runtime versions, installation paths and operating systems are unverified. Module import does not start Git or create files/repositories. The subprocess environment is constructed from scratch rather than filtered: inherited GIT_DIR, GIT_WORK_TREE, GIT_INDEX_FILE, GIT_OBJECT_DIRECTORY, GIT_ALTERNATE_OBJECT_DIRECTORIES, GIT_EXEC_PATH, GIT_CONFIG_COUNT/KEY/VALUE, GIT_TEMPLATE_DIR, SSH helpers, loader variables and unrelated environment values do not propagate.

System/global Git configuration is disabled; HOME/XDG_CONFIG_HOME are fresh. Empty templates and hooks are explicitly selected. Credential helpers, signing, automatic maintenance, filesystem monitoring, external attribute/exclude files, rerere, autostash and network protocols are disabled. No remote is configured and no network operation exists in the allowlist. This removes network paths from this program; it is not an OS-level network sandbox or packet-capture attestation.

Fixed version and HEAD-author queries record observed runtime/identity evidence. Only exact internal command tuples are accepted, plus `show <full-sha>:<fixed-file>` and `revert --no-edit <full-sha>`. No push, fetch, clone, reset, clean, shell aliases, Git configuration writes, or arbitrary arguments are accepted. Diff commands disable external diff and text conversion. `subprocess.run` receives an argument list, `shell=False`, stdin=DEVNULL, and a 10-second per-operation timeout.

Each stdout/stderr stream is read up to 65537 bytes; more than 65536 is rejected. Streams spool to owned temporary files, avoiding unbounded RAM capture. The timeout and fixed tiny inputs bound normal operation, but there is no independent hard disk quota for a compromised Git binary. Nonzero status fails closed except merge exit 1 in the deliberate conflict exercise, where unmerged entries and markers must additionally be observed. The runner never interprets arbitrary exit 1 as a successful conflict.

## Revision gate

The requested revision must be exactly 40 lowercase ASCII hex characters. `HEAD` must match it and porcelain status must be empty, including untracked files, before content checks. Tests read release.json from that commit using Git, not from a possibly different working file. The fixed predicates require exactly feature/version fields, a strictly positive integer version (Python bool is explicitly excluded), and a boolean feature flag. This is real fixed Python assertion logic, not execution of learner source. Dirty, mismatched, and assertion-failed are distinct results. Malformed JSON returns `invalid-release-json`; a JSON list, scalar or null returns `invalid-release-shape`, without executing code or raising an incidental attribute/type error. The gate rechecks HEAD and cleanliness after the content predicates; changed HEAD or new dirt rejects acceptance. The evidence includes full revision, postcheck revision, tree, check results and cleanliness. This is a single-process local teaching run, not a concurrency-safe CI runner for hostile external mutation.

## Artifact and digest

Artifact creation requires the exact clean current revision and an exact tracked-path set. Each file is read from the committed revision with exact newline/whitespace preservation. The uncompressed USTAR archive uses sorted paths, fixed zero timestamps/owners, empty owner names, and mode 0644. SHA-256 is computed over the complete archive bytes; the manifest separately hashes file bytes. One payload byte is flipped in memory to demonstrate tamper detection against the retained reference digest. No archive extraction or code execution occurs.

Matching digests demonstrate integrity only relative to a trusted reference. They do not authenticate an author, establish trusted provenance, sign an artifact, or establish that it is safe to run. Capstone success is deliberately labeled local: no CI server, remote publication, production deployment, signing service, dependency verification, or authorization was exercised.

## Failure reporting and verification

Success JSON is printed only after the owned repository context has exited successfully. Unexpected Git failures, timeouts, oversized output and failed invariants raise an error, produce exit 1, and do not produce a success envelope. Invalid argument parsing exits 2. Expected conflict and rejected revision gates remain clearly labeled within successful teaching results.

The unittest suite covers all commands, repeated evidence, malformed input, denied command/path shapes, exact archive bytes, staged/untracked dirtiness, mismatch, bad content, process flags/timeout/output errors, missing Git, cleanup, outside sentinel preservation, hostile inherited configuration/templates/hooks, and CLI parsing. Tests use real Git except explicitly injected failure cases. Tests do not establish Windows compatibility, resistance to a compromised executable, or production deployment safety.
