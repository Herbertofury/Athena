# Reviewed documentation delta, without identifying Git metadata

This export preserves the reviewed documentation introduced by the three later source commits listed in manifest.json. It is deliberately **not** an original Git-history delta or a claim that those original commit objects can be restored. The identifiers serve as provenance references only.

The first change adds the23-line comparison document; the second adds a README navigation section; the third appends research, licensing and adoption criteria. Initial/final snapshots and ordered text patches are retained. The final document exactly matches the already public `feature-foundry/source/docs/competitive-landscape.md`; the README fragment matches its already public ending. Existing privacy redactions are untouched.

All selected text was reviewed for credentials, personal/private identifiers and uncleared assets. Only MIT-licensed project documentation, public upstream links and research criteria are included. The original project's MIT notice is retained. Author/committer identities, raw commit objects, signatures, messages and timestamps are omitted. No original private issue, private share links, databases, recordings or artist assets are included.

Run `python tests/foundry_delta_test.py` to verify hashes, ordered reconstruction, current source reconciliation and the metadata allowlist. The snapshots record historical research proposals, not proven candidate adoption or a claim that private-to-public approval is absent today.

This closes the reviewed-content/provenance export, **not** exact original-history recovery. Missing release archives, private issue preservation, rights review, real-user data migration and full functional acceptance remain separate retirement gates. The source repository is not deleted or archived by this change.
