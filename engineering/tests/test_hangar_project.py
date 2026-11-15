"""Synthetic offline fixtures, not captured provider records or acceptance."""
import dataclasses
import importlib.util
import json
from pathlib import Path
import sys
import unittest

PATH = Path(__file__).resolve().parents[1] / "experiments/hangar-project-lab/metadata.py"
SPEC = importlib.util.spec_from_file_location("hangar_project_metadata", PATH)
m = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = m
SPEC.loader.exec_module(m)


def project():
    return {"id": 14, "name": "Synthetic Plugin", "visibility": "public",
            "namespace": {"owner": "synthetic-owner", "slug": "synthetic-plugin"},
            "mainPageContent": None, "avatarUrl": "https://cdn.example.org/icon.webp?v=1",
            "supportedPlatforms": {"PAPER": ["1.21", "1.21.1"]}}


def version():
    return {"id": 238, "projectId": 14, "name": "Synthetic Display", "visibility": "public",
            "description": "Synthetic **body** ![image](https://example.org/image.png)",
            "reviewState": "reviewed", "channel": {"name": "Release", "flags": ["FROZEN"]},
            "downloads": {"PAPER": {"externalUrl": "https://example.org/versions/latest/builds/latest",
                                      "downloadUrl": None, "fileInfo": None}},
            "platformDependencies": {"PAPER": ["1.21", "1.21.1"]},
            "platformDependenciesFormatted": {"PAPER": ["1.21-1.21.1"]},
            "pluginDependencies": {"PAPER": [{"name": "Synthetic Dependency", "required": True,
                                                "platform": "PAPER", "projectId": 22, "externalUrl": None}]}}


def response(obj, kind="project", **changes):
    path = "/api/v1/projects/14"
    if kind == "version":
        path += "/versions/238"
    elif kind == "main_page":
        path = "/api/v1/pages/main/14"
    body = obj if isinstance(obj, bytes) else json.dumps(obj).encode()
    values = dict(request_url=m.ORIGIN + path, final_url=m.ORIGIN + path,
                  captured_at="2026-11-11T12:00:00Z", status=200,
                  content_type="text/plain;charset=UTF-8" if kind == "main_page" else "application/json",
                  body=body, byte_count=len(body), complete=True)
    values.update(changes)
    return m.Response(**values)


class HangarProjectTests(unittest.TestCase):
    def test_project_lossless_unknown_and_icon(self):
        obj = project()
        obj["futureField"] = {"x": [None, {}, "", 0, False]}
        obj["description"] = "Synthetic prose only"
        result = m.capture_project(response(obj), 14)
        self.assertTrue(result.accepted)
        self.assertEqual(result.record["source"], obj)
        self.assertEqual(result.raw_body, response(obj).body)
        self.assertEqual(result.record["ownerIdentityKind"], "namespace_not_person")
        self.assertEqual(result.record["projectIcon"]["reference"], "https://cdn.example.org/icon.webp")
        self.assertNotIn("Synthetic prose", json.dumps(result.receipt()))
        self.assertNotIn("synthetic-owner", json.dumps(result.receipt()))
        self.assertEqual(result.record["mainPageContentState"], "null")

    def test_independent_page_never_changes_null(self):
        p = m.capture_project(response(project()), 14)
        page = m.capture_main_page(response(b"Synthetic body ![x](https://example.org/x.png)", "main_page"), 14)
        self.assertTrue(page.accepted)
        self.assertEqual(page.record["body"]["raw"], page.raw_body.decode())
        self.assertFalse(page.record["body"]["projectionComplete"])
        self.assertFalse(page.record["projectVisibilityEstablished"])
        self.assertEqual(p.record["mainPageContentState"], "null")
        self.assertNotEqual(p.record["provenance"]["requestUrl"], page.record["provenance"]["requestUrl"])

    def test_field_states(self):
        for value, state in [(None, "null"), ("", "empty"), ("Synthetic body", "present")]:
            obj = project(); obj["mainPageContent"] = value
            self.assertEqual(m.capture_project(response(obj), 14).record["mainPageContentState"], state)
        obj = project(); del obj["mainPageContent"]
        self.assertEqual(m.capture_project(response(obj), 14).record["mainPageContentState"], "unknown")

    def test_version_lossless_separate_download_semantics(self):
        obj = version()
        result = m.capture_version(response(obj, "version"), 14, 238)
        self.assertTrue(result.accepted)
        self.assertEqual(result.record["source"], obj)
        self.assertEqual(result.record["downloads"]["PAPER"]["fileInfoState"], "null")
        self.assertFalse(result.record["fileBytesVerified"])
        self.assertFalse(result.record["immutableExternalReleaseEstablished"])
        self.assertEqual(result.record["versionIdentityKind"], "provider_display_identity")

    def test_uploaded_file_metadata_not_verification(self):
        obj = version()
        obj["downloads"]["PAPER"] = {"externalUrl": None, "downloadUrl": "https://hangar.papermc.io/api/v1/example",
                                       "fileInfo": {"name": "synthetic.jar", "sizeBytes": 123,
                                                    "sha256Hash": "0" * 64}}
        result = m.capture_version(response(obj, "version"), 14, 238)
        self.assertTrue(result.accepted)
        self.assertEqual(result.record["source"]["downloads"], obj["downloads"])
        self.assertFalse(result.record["fileBytesVerified"])

    def test_immutable_and_copy_access(self):
        result = m.capture_version(response(version(), "version"), 14, 238)
        result.record["source"]["downloads"].clear()
        result.receipt()["status"] = 404
        self.assertTrue(result.record["source"]["downloads"])
        self.assertEqual(result.receipt()["status"], 200)
        with self.assertRaises(dataclasses.FrozenInstanceError):
            result._raw = b"changed"
        envelope = response(project())
        with self.assertRaises(dataclasses.FrozenInstanceError):
            envelope.status = 404

    def test_errors_retained_and_not_accepted(self):
        for status in (201, 301, 401, 403, 404, 429, 500, 503):
            with self.subTest(status=status):
                result = m.capture_project(response(b'{"error":"synthetic"}', status=status), 14)
                self.assertFalse(result.accepted)
                self.assertEqual(result.receipt()["status"], status)
                self.assertEqual(result.receipt()["reason"], "http_error")
                self.assertEqual(result.raw_body, b'{"error":"synthetic"}')
                self.assertIsNone(result.record)

    def test_envelope_mismatches(self):
        for changes, reason in [({"complete": False}, "incomplete_response"),
                                ({"byte_count": 0}, "byte_count_mismatch"),
                                ({"byte_count": True}, "byte_count_mismatch"),
                                ({"status": True}, "invalid_status"),
                                ({"captured_at": "2026-11-11"}, "invalid_capture_time"),
                                ({"content_type": "text/html"}, "unexpected_content_type"),
                                ({"body": "not bytes"}, "invalid_body_type")]:
            with self.subTest(changes=changes):
                result = m.capture_project(response(project(), **changes), 14)
                self.assertFalse(result.accepted)
                self.assertEqual(result.receipt()["reason"], reason)

    def test_redirect_origin_and_scope(self):
        for url in ["https://evil.example/api/v1/projects/14", m.ORIGIN + "/api/v1/projects/15",
                    m.ORIGIN + "/api/v1/projects/14?token=secret", m.ORIGIN + "/api/v1/projects/14#x",
                    "http://hangar.papermc.io/api/v1/projects/14", m.ORIGIN + "/api/v1/projects/synthetic-owner/synthetic-plugin",
                    m.ORIGIN + "/api/v1/projects?limit=1"]:
            for key in ("request_url", "final_url"):
                result = m.capture_project(response(project(), **{key: url}), 14)
                self.assertFalse(result.accepted)
                self.assertNotIn("secret", json.dumps(result.receipt()))
                self.assertNotIn("evil", json.dumps(result.receipt()))

    def test_identity_and_visibility(self):
        for field, value in [("id", 15), ("id", True), ("visibility", "hidden"), ("visibility", None),
                             ("namespace", None), ("name", "")]:
            obj = project(); obj[field] = value
            self.assertFalse(m.capture_project(response(obj), 14).accepted)
        for value in (15, True, None, "14"):
            obj = version(); obj["projectId"] = value
            self.assertFalse(m.capture_version(response(obj, "version"), 14, 238).accepted)
        self.assertFalse(m.capture_project(response(project()), True).accepted)
        self.assertFalse(m.capture_version(response(version(), "version"), 14, 239).accepted)

    def test_duplicate_nonfinite_and_malformed(self):
        for raw in [b'{"id":14,"id":14}', b'{"x":NaN}', b'{"x":Infinity}', b'{"x":1e999}',
                    b'{"x":"\\ud800"}', b"\xff", b"<html>error</html>", b'{"id":14', b"[]"]:
            result = m.capture_project(response(raw), 14)
            self.assertFalse(result.accepted)
            self.assertEqual(result.raw_body, raw)
            self.assertIsNone(result.record)

    def test_surrogate_key_rejected_with_raw_evidence(self):
        raw = json.dumps(project()).encode()[:-1] + b',"\\ud800":"synthetic"}'
        result = m.capture_project(response(raw), 14)
        self.assertFalse(result.accepted)
        self.assertEqual(result.receipt()["reason"], "malformed_payload")
        self.assertEqual(result.raw_body, raw)
        self.assertIsNone(result.record)
        obj = project(); obj["unknown_\u2603"] = "synthetic"
        self.assertEqual(m.capture_project(response(obj), 14).record["source"], obj)

    def test_bounds(self):
        for raw, reason in [(b" " * (m.MAX_BYTES + 1), "byte_limit"),
                            (b"[" * (m.MAX_DEPTH + 1) + b"]" * (m.MAX_DEPTH + 1), "depth_limit")]:
            result = m.capture_project(response(raw), 14)
            self.assertEqual(result.receipt()["reason"], reason)
        self.assertFalse(m.capture_project(response(b" " * (m.MAX_BYTES + 1)), 14).receipt()["rawRetained"])
        obj = project(); obj["extra"] = [None] * (m.MAX_ITEMS + 1)
        self.assertEqual(m.capture_project(response(obj), 14).receipt()["reason"], "item_limit")
        obj["extra"] = "a" * (m.MAX_TEXT + 1)
        self.assertEqual(m.capture_project(response(obj), 14).receipt()["reason"], "text_limit")
        obj["extra"] = [[0] * 4000 for _ in range(6)]
        self.assertEqual(m.capture_project(response(obj), 14).receipt()["reason"], "node_limit")

    def test_unsafe_references_rejected(self):
        for value in ["javascript:alert(1)", "file:///tmp/a", "https://user:pass@example.org/a",
                      "https://127.0.0.1/a", "https://[::1]/a", "https://localhost/a", "https://a.internal/a",
                      "https://example.org:99999/a", "https://example.org/%0a", "//example.org/a",
                      "https://example.org\\evil/a", 42]:
            obj = project(); obj["avatarUrl"] = value
            self.assertFalse(m.capture_project(response(obj), 14).accepted, value)

    def test_markdown_unsafe_reference_preserves_text_but_marks_rejected(self):
        obj = project(); obj["mainPageContent"] = "Synthetic ![x](javascript:bad)"
        result = m.capture_project(response(obj), 14)
        self.assertTrue(result.accepted)
        self.assertEqual(result.record["mainPageBody"]["raw"], obj["mainPageContent"])
        self.assertTrue(result.record["mainPageBody"]["events"][1]["referenceRejected"])

    def test_invalid_version_shapes(self):
        for key, value in [("downloads", []), ("downloads", {"PAPER": None}),
                           ("platformDependencies", {"PAPER": "1.21"}),
                           ("pluginDependencies", {"PAPER": ["plugin"]}),
                           ("pluginDependencies", {"PAPER": [{"required": "true"}]}),
                           ("channel", "Release")]:
            obj = version(); obj[key] = value
            self.assertFalse(m.capture_version(response(obj, "version"), 14, 238).accepted)

    def test_missing_null_empty_download_states(self):
        for value, state in [(None, "null"), ({}, "empty")]:
            obj = version(); obj["downloads"] = value
            self.assertEqual(m.capture_version(response(obj, "version"), 14, 238).record["downloadState"], state)
        obj = version(); del obj["downloads"]
        self.assertEqual(m.capture_version(response(obj, "version"), 14, 238).record["downloadState"], "unknown")

    def test_future_states_are_preserved_not_interpreted(self):
        obj = version(); obj["reviewState"] = "future-state"; obj["channel"]["flags"] += ["FUTURE_FLAG"]
        result = m.capture_version(response(obj, "version"), 14, 238)
        self.assertEqual(result.record["source"], obj)
        self.assertFalse(result.record["fileBytesVerified"])

    def test_charset_and_private_markdown_references(self):
        result = m.capture_project(response(project(), content_type="application/json;charset=UTF-16"), 14)
        self.assertFalse(result.accepted)
        obj = project(); obj["mainPageContent"] = "Synthetic ![x](http://127.0.0.1/x)"
        result = m.capture_project(response(obj), 14)
        self.assertTrue(result.accepted)
        self.assertTrue(result.record["mainPageBody"]["events"][1]["referenceRejected"])
        self.assertIsNone(result.record["mainPageBody"]["events"][1]["src"])

    def test_channel_shape_and_scalar_json(self):
        for channel in [{"flags": 4}, {"flags": [True]}, {"color": []}]:
            obj = version(); obj["channel"] = channel
            self.assertFalse(m.capture_version(response(obj, "version"), 14, 238).accepted)
        for raw in (b"null", b"true", b"23", b'"synthetic"'):
            self.assertFalse(m.capture_project(response(raw), 14).accepted)

    def test_no_envelope(self):
        result = m.capture_project({}, 14)
        self.assertFalse(result.accepted)
        self.assertEqual(result.receipt()["reason"], "invalid_envelope")


if __name__ == "__main__":
    unittest.main()
