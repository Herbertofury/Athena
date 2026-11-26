"""Test the packaged native count-only review without any owner data or service."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def main(package):
    package = Path(package).resolve()
    manifest = json.loads((package / "native-package.json").read_text(encoding="utf-8"))
    engine = package / manifest["engine"]
    with tempfile.TemporaryDirectory(prefix="athena-constellation-review-") as temp:
        root = Path(temp)
        source = root / "synthetic 旧 export.json"
        keys = (
            "providers projects chats turns turnRevisions outputSnapshots files knowledgeItems "
            "knowledgeSources projectContinuity events checkpoints syncReceipts catalogRuns"
        ).split()
        payload = {key: [] for key in keys}
        payload.update(schema="project-constellation", schemaVersion=7,
                       summary={"events": 12001, "checkpoints": 1000, "providers": 0, "projects": 0, "chats": 1,
                                "turns": 3, "turnRevisions": 2, "outputSnapshots": 0, "files": 0,
                                "knowledgeItems": 0, "continuityProjects": 0},
                       meta={"neverEcho": "fixture-private-marker https://example.invalid/secret"})
        payload["events"] = [{}] * 12000
        payload["checkpoints"] = [{}] * 1000
        payload["syncReceipts"] = [{}] * 2000
        payload["catalogRuns"] = [{}] * 5
        payload["chats"] = [{"id": "chat-A"}]
        payload["turns"] = [
            {"id": "turn-A", "chatId": "chat-A", "bestRevisionId": "revision-A"},
            {"id": "turn-B", "chatId": "missing", "bestRevisionId": "revision-A"},
            {"id": "turn-C", "chatId": "chat-A", "bestRevisionId": "not-in-export"},
        ]
        payload["turnRevisions"] = [
            {"id": "revision-A", "turnId": "turn-A", "chatId": "different-chat", "text": "fixture-private-marker"},
            {"id": "revision-B", "turnId": "not-in-export"},
        ]
        payload["groups"] = []

        def run(raw, success=True):
            source.write_bytes(raw)
            files_before = {p.name for p in root.iterdir()}
            result = subprocess.run([str(engine), "review-constellation-v7", str(source)],
                                    cwd=root, capture_output=True, timeout=20)
            require((result.returncode == 0) == success, "unexpected CLI status")
            require(source.read_bytes() == raw, "export was edited")
            require({p.name for p in root.iterdir()} == files_before, "review created files")
            combined = result.stdout + result.stderr
            require(b"fixture-private-marker" not in combined and b"chat-A" not in combined
                    and b"example.invalid" not in combined, "private data echoed")
            if success:
                report = json.loads(result.stdout)
                require(report["exact_input_sha256"] == hashlib.sha256(raw).hexdigest(),
                        "wrong exact-input hash")
                return report

        raw = json.dumps(payload).encode()
        report = run(raw)
        slices = {r["kind"]: r for r in report["slices"]}
        require(slices["events"]["retained"] == 12000 and slices["events"]["omitted"] == 1,
                "source cap loss not reconciled")
        require(slices["checkpoints"]["cap_reached"] and slices["checkpoints"]["omitted"] == 0,
                "exactly full cap mislabeled")
        require(slices["syncReceipts"]["cap_reached"] and slices["syncReceipts"]["omitted"] is None,
                "unknown omission turned into a number")
        require(slices["catalogRuns"]["omitted"] == 0 and not slices["catalogRuns"]["cap_reached"],
                "under-cap collection incorrectly labeled")
        require(slices["groups"]["retained"] == 0 and slices["smartCollections"]["retained"] is None,
                "absent versus present empty extension slice collapsed")
        for kind, summary in {"providers": "providers", "projects": "projects", "chats": "chats",
                              "turns": "turns", "turnRevisions": "turnRevisions", "outputSnapshots": "outputSnapshots",
                              "files": "files", "knowledgeItems": "knowledgeItems",
                              "projectContinuity": "continuityProjects"}.items():
            require(slices[kind]["source_reported"] == len(payload[kind]) and slices[kind]["omitted"] == 0,
                    f"writer's {summary} full group total was not verified")
            mismatched = {**payload, "summary": {**payload["summary"], summary: len(payload[kind]) + 1}}
            run(json.dumps(mismatched).encode(), success=False)
        artifact_fixture = {**payload,
                            "files": [
                                {"chatId": "chat-A"}, {"chatId": "missing"},
                                {"chatId": "chatgpt:downloads", "providerId": "chatgpt", "source": "downloads-api"},
                                {"chatId": "chatgpt:downloads", "providerId": "other", "source": "downloads-api"},
                                {"chatId": "chatgpt:downloads", "providerId": "chatgpt"}, {}, {"chatId": 42}, []
                            ],
                            "outputSnapshots": [
                                {"chatId": "chat-A"}, {"chatId": "missing"},
                                {"chatId": "chatgpt:downloads", "providerId": "chatgpt", "source": "downloads-api"},
                                {"chatId": ""}, None
                            ],
                            "summary": {**payload["summary"], "files": 8, "outputSnapshots": 5}}
        artifact_report = run(json.dumps(artifact_fixture).encode())["artifact_references"]
        require(artifact_report == {
            "files": {"linked_to_exported_chat": 1, "chat_not_in_export": 3,
                      "provider_download_bucket": 1, "no_chat_link": 1, "unrecognized_row": 2},
            "output_snapshots": {"linked_to_exported_chat": 1, "chat_not_in_export": 2,
                                 "provider_download_bucket": 0, "no_chat_link": 1, "unrecognized_row": 1},
        }, "artifact link coverage or synthetic provider bucket misclassified")
        state_fixture = {**payload,
                         "groups": [{}, {"deletedAt": 1750000000000}, {"deletedAt": 0}],
                         "smartCollections": [{}, {"deletedAt": "unrecognized"}, [], {"deletedAt": None}],
                         "integrityFindings": [{"resolved": True}, {"resolved": False}, {}, {"resolved": None}],
                         "summary": {**payload["summary"], "groups": 2, "smartCollections": 3, "integrityFindings": 2}}
        state = run(json.dumps(state_fixture).encode())["lifecycle"]
        require(state["groups"] == {
            "source_reported_open": 2, "open": 2, "closed": 1, "unrecognized": 0, "matches_reported_open": True,
        }, "counted tombstoned groups as active")
        require(state["smart_collections"] == {
            "source_reported_open": 3, "open": 2, "closed": 0, "unrecognized": 2, "matches_reported_open": None,
        }, "unknown state rows did not withhold verdict")
        require(state["integrity_findings"] == {
            "source_reported_open": 2, "open": 3, "closed": 1, "unrecognized": 0, "matches_reported_open": False,
        }, "open finding summary mismatch not surfaced")
        require(report["lifecycle"]["smart_collections"]["open"] is None, "missing lifecycle slice treated as empty")
        print("Constellation lifecycle: active/deleted, unresolved/resolved, missing and malformed evidence stay distinct.")
        old = {**payload, "summary": {"events": 12001, "checkpoints": 1000}}
        legacy = {r["kind"]: r for r in run(json.dumps(old).encode())["slices"]}
        require(legacy["files"]["source_reported"] is None and legacy["files"]["omitted"] is None,
                "missing older summary totals should stay unknown")
        require(report["references"] == {
            "turns_without_exported_chat": 1, "revisions_without_exported_turn": 1,
            "revisions_with_conflicting_chat": 1,
            "best_revision_not_exported": 1, "best_revision_points_to_other_turn": 1,
        }, "turn/revision edges lost or conflated")
        run(raw.replace(b'"schemaVersion": 7', b'"schemaVersion": 8'), success=False)
        run(raw.replace(b'"events": 12001', b'"events": 120'), success=False)
        run(raw.replace(b'"schemaVersion": 7', b'"schemaVersion": 7, "schemaVersion": 7'), success=False)
        run(raw.replace(b'"id": "turn-B"', b'"id": "turn-A"'), success=False)
        run(b'\xff\xfe', success=False)
        run(b' ' * (16 * 1024 * 1024 + 1), success=False)
        print("Constellation v7: packaged CLI verified caps, references, privacy and untouched source.")


if __name__ == "__main__":
    main(sys.argv[1])
