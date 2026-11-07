"""Evidence-boundary tests for the research explorer; all fixtures are synthetic.

The retained JSON-lab checks only read an existing measured artifact. They do
not execute a benchmark, manufacture observations, or promote any candidate.
"""

import copy
import datetime as dt
import hashlib
import importlib.util
import json
import math
import shutil
import statistics
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "research_explorer_builder", ROOT / "scripts/build_research_explorer.py"
)
explorer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(explorer)
TODAY = dt.date(2026, 10, 27)
SOURCE_URL = "https://example.org/synthetic-explorer-source"


def catalog_fixture():
    """A contract fixture, never a real candidate or source record."""
    source = {
        "url": SOURCE_URL,
        "title": "Synthetic source fixture only",
        "checked_at": "2026-10-27",
        "published_at": "2026-10-26",
        "note": "Synthetic evidence-boundary test, not research evidence.",
    }
    entry = {
        "id": "synthetic-parser",
        "name": "Synthetic parser fixture",
        "kind": "repository",
        "category": "synthetic-tools",
        "summary": "Synthetic fixture; makes no claim about real software.",
        "tags": ["synthetic"],
        "url": SOURCE_URL,
        "repo": "Example/Synthetic",
        "paper_url": None,
        "source_ids": ["SYNTHETIC001"],
        "sources": [source],
        "status": "candidate",
        "maturity": "experimental",
        "priority": 1,
        "priority_reason": "Exercise validation only.",
        "evaluation": {
            "track": "json-serialization",
            "proposal": "Use a synthetic fixture to test rejection rules.",
            "metrics": ["fixture failures detected"],
            "caveats": ["Synthetic; never a measured performance result."],
        },
    }
    catalog = {
        "schema_version": 1,
        "snapshot_date": "2026-10-27",
        "snapshot_timezone": "America/Denver",
        "categories": [{"id": "synthetic-tools", "label": "Synthetic tools"}],
        "tracks": [
            {"id": "json-serialization", "label": "Synthetic JSON track"},
            {"id": "local-storage", "label": "Synthetic storage track"},
        ],
        "entries": [entry],
    }
    registry = [{
        "id": "SYNTHETIC001", "url": SOURCE_URL,
        "title": "Synthetic source fixture only", "observed_version": "fixture",
        "topic": "synthetic", "note": "Test fixture, not research evidence.",
        "checked_at": "2026-10-27", "review_after_days": 30,
        "evidence": "primary_documented",
    }]
    return catalog, registry


def results_fixture(evidence="external_reported"):
    result = {
        "schema_version": 1,
        "cohorts": [{
            "id": "synthetic-json-cohort",
            "label": "Synthetic result-validation fixture",
            "track": "json-serialization",
            "metric": "synthetic_elapsed_ms",
            "unit": "ms",
            "direction": "lower",
            "evidence": evidence,
            "description": "Synthetic; not a measured or reported result.",
            "protocol": "Synthetic fixture; no benchmark is executed.",
            "caveats": ["Do not publish this fixture as evidence."],
            "source_url": SOURCE_URL,
            "observed_at": "2026-10-27",
        }],
        "observations": [{
            "candidate_id": "synthetic-parser",
            "cohort_id": "synthetic-json-cohort",
            "value": 2.5,
            "subject": "Synthetic configuration",
            "note": "Synthetic value used only to validate the schema.",
            "source_url": SOURCE_URL,
            "observed_at": "2026-10-27",
        }],
    }
    if evidence == "atlas_measured":
        result["observations"][0].update({
            "sample_count": 15,
            "raw_sha256": "a" * 64,
            "workload_sha256": "b" * 64,
        })
    return result


def signal_fixture():
    return {
        "schema_version": 1,
        "repositories": {
            "example/synthetic": {
                "stars": 0, "forks": 0, "archived": False,
                "observed_at": "2026-10-27T18:00:00Z",
                "url": "https://github.com/Example/Synthetic",
            }
        },
        "errors": [],
    }


def community_fixture():
    return {
        "schema_version": 1,
        "ratings": [{
            "candidate_id": "synthetic-parser", "track": "json-serialization",
            "score": 4, "author_id": 123456, "author": "synthetic-account",
            "experience": "Synthetic fixture, not a real user report.",
            "version": "synthetic-1", "review_state": "approved",
            "issue_url": "https://github.com/Herbertofury/Engineering-Atlas/issues/1",
            "updated_at": "2026-10-27T18:00:00Z",
        }],
        "errors": [],
    }


def test_plan_fixture():
    return {
        "schema_version": 1,
        "reviewed_at": "2026-10-27",
        "description": "Synthetic planning fixture only; no experiment was run.",
        "plans": [{
            "id": "planned-synthetic-contract-v1",
            "title": "Synthetic parser contract",
            "priority": 1,
            "status": "planned",
            "decision": "Can the synthetic schema reject invalid proposals?",
            "layer_ids": ["synthetic-storage"],
            "candidate_ids": ["synthetic-parser"],
            "controls": ["Synthetic current implementation fixture."],
            "gates": ["Preserve the complete synthetic output."],
            "metrics": ["Synthetic fixture errors detected; not performance evidence."],
            "protocol": ["Validate without executing any candidate."],
        }],
    }


class TestPlanValidationTests(unittest.TestCase):
    def setUp(self):
        self.catalog, _ = catalog_fixture()
        self.catalog["layers"] = [{"id": "synthetic-storage", "label": "Synthetic storage"}]
        self.registry = test_plan_fixture()

    def validate(self):
        return explorer.validate_test_plans(self.registry, self.catalog, TODAY)

    def test_valid_proposal_preserves_planned_status_and_catalog_evidence(self):
        before = copy.deepcopy((self.registry, self.catalog))
        self.assertEqual(self.validate(), {"planned-synthetic-contract-v1"})
        self.assertEqual((self.registry, self.catalog), before)
        directory = explorer.markdown_test_plan_directory({**self.catalog, "test_plans": self.registry["plans"]})
        self.assertIn("?plan=planned-synthetic-contract-v1#catalog", directory)
        self.assertIn("Every row is planned, not a result", directory)
        self.assertIn("Synthetic storage", directory)

    def test_non_objects_invalid_schemas_and_undated_registry_fail(self):
        for value in (None, [], "plans", 1):
            with self.subTest(registry=value):
                self.registry = value
                with self.assertRaisesRegex(ValueError, "must be an object"):
                    self.validate()
        for schema in (True, 1.0, "1", 2, None):
            with self.subTest(schema=schema):
                self.registry = test_plan_fixture()
                self.registry["schema_version"] = schema
                with self.assertRaisesRegex(ValueError, "schema"):
                    self.validate()
        for value in (None, "", "2026-10-28"):
            with self.subTest(reviewed_at=value):
                self.registry = test_plan_fixture()
                self.registry["reviewed_at"] = value
                with self.assertRaises(ValueError):
                    self.validate()

    def test_rejects_missing_unknown_or_result_fields(self):
        for field in ("observations", "results", "measured_winner"):
            with self.subTest(field=field):
                self.registry = test_plan_fixture()
                self.registry["plans"][0][field] = []
                with self.assertRaisesRegex(ValueError, "test-plan field"):
                    self.validate()
        self.registry = test_plan_fixture()
        del self.registry["plans"][0]["controls"]
        with self.assertRaisesRegex(ValueError, "test-plan field"):
            self.validate()
        self.registry = test_plan_fixture()
        self.registry["observations"] = []
        with self.assertRaisesRegex(ValueError, "registry field"):
            self.validate()

    def test_rejects_invalid_empty_or_non_object_plan_rows(self):
        for rows in (None, {}, [], [None], ["planned-synthetic"], [7]):
            with self.subTest(rows=rows):
                self.registry = test_plan_fixture()
                self.registry["plans"] = rows
                with self.assertRaises(ValueError):
                    self.validate()

    def test_rejects_invalid_or_duplicate_plan_id(self):
        for value in ("", "   ", "not-a-plan", "planned-BAD", None):
            with self.subTest(id=value):
                self.registry = test_plan_fixture()
                self.registry["plans"][0]["id"] = value
                with self.assertRaises(ValueError):
                    self.validate()
        self.registry = test_plan_fixture()
        self.registry["plans"].append(copy.deepcopy(self.registry["plans"][0]))
        with self.assertRaisesRegex(ValueError, "duplicate test-plan ID"):
            self.validate()

    def test_rejects_execution_claims_and_noninteger_priority(self):
        for status in (None, "measured", "accepted", "running", "best"):
            with self.subTest(status=status):
                self.registry = test_plan_fixture()
                self.registry["plans"][0]["status"] = status
                with self.assertRaisesRegex(ValueError, "cannot claim"):
                    self.validate()
        for priority in (True, 1.0, "1", 0, 4, None):
            with self.subTest(priority=priority):
                self.registry = test_plan_fixture()
                self.registry["plans"][0]["priority"] = priority
                with self.assertRaisesRegex(ValueError, "priority"):
                    self.validate()

    def test_rejects_incomplete_protocol_and_reference_lists(self):
        for key in ("layer_ids", "candidate_ids", "controls", "gates", "metrics", "protocol"):
            for value in (None, "text", [], [""], ["   "], [None], [True], ["duplicate", "duplicate"]):
                with self.subTest(key=key, value=value):
                    self.registry = test_plan_fixture()
                    self.registry["plans"][0][key] = value
                    with self.assertRaisesRegex(ValueError, "test-plan " + key):
                        self.validate()
        for key in ("title", "decision"):
            self.registry = test_plan_fixture()
            self.registry["plans"][0][key] = "   "
            with self.assertRaisesRegex(ValueError, "missing " + key):
                self.validate()

    def test_rejects_unknown_candidate_and_layer_references(self):
        for key, message in (("candidate_ids", "candidate"), ("layer_ids", "layer")):
            with self.subTest(key=key):
                self.registry = test_plan_fixture()
                self.registry["plans"][0][key] = ["missing-synthetic-reference"]
                with self.assertRaisesRegex(ValueError, "Unknown test-plan " + message):
                    self.validate()

    def test_loader_keeps_legacy_catalogs_valid_and_never_mixes_proposals_into_results(self):
        self.catalog["layers"][0].update(decision="Synthetic comparison only.", gate="Synthetic gate.",
                                         baseline_ids=["synthetic-parser"], challenger_ids=[], watch_ids=[])
        self.catalog["entries"][0]["layers"] = ["synthetic-storage"]
        _, sources = catalog_fixture()
        results = results_fixture()
        files = {"research-catalog": self.catalog, "sources": sources, "research-results": results,
                 "research-signals": signal_fixture(), "research-community": community_fixture()}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "data").mkdir()
            for name, data in files.items():
                (root / "data" / (name + ".json")).write_text(json.dumps(data))
            with patch.object(explorer, "import_retained_json_lab", return_value=([], [])):
                legacy = explorer.load_bundle(root)
                self.assertEqual(legacy["test_plans"], [])
                self.assertIsNone(legacy["test_plans_reviewed_at"])
                self.assertEqual(legacy["results"], results)
                path = root / "data/research-test-plans.json"
                path.write_text(json.dumps(self.registry))
                planned = explorer.load_bundle(root)
                self.assertEqual(planned["test_plans"], self.registry["plans"])
                self.assertEqual(planned["test_plans_reviewed_at"], "2026-10-27")
                self.assertEqual(planned["results"], results)
                path.write_text("null\n")
                with self.assertRaisesRegex(ValueError, "registry must be an object"):
                    explorer.load_bundle(root)


class CatalogValidationTests(unittest.TestCase):
    def setUp(self):
        self.catalog, self.registry = catalog_fixture()

    def validate(self):
        return explorer.validate_catalog(self.catalog, self.registry, TODAY)

    def test_valid_candidate_remains_a_candidate(self):
        self.assertEqual(self.validate(), {"synthetic-parser"})
        self.assertEqual(self.catalog["entries"][0]["status"], "candidate")

    def add_layers(self):
        self.catalog["layers"] = [{
            "id": "synthetic-storage", "label": "Synthetic storage layer",
            "decision": "Synthetic comparison role only.",
            "gate": "Synthetic adoption gate; never real acceptance.",
            "baseline_ids": ["synthetic-parser"], "challenger_ids": [], "watch_ids": [],
        }]
        self.catalog["entries"][0]["layers"] = ["synthetic-storage"]

    def test_stack_role_preserves_candidate_status_and_generates_one_canonical_map(self):
        self.add_layers()
        self.assertEqual(self.validate(), {"synthetic-parser"})
        text = explorer.markdown_layer_map(self.catalog)
        self.assertIn("?layer=synthetic-storage#catalog", text)
        self.assertIn("Synthetic adoption gate", text)
        self.assertEqual(self.catalog["entries"][0]["status"], "candidate")

    def test_stack_layers_reject_incomplete_or_unknown_entry_assignments(self):
        for assigned in (None, [], ["unknown"], ["synthetic-storage", "synthetic-storage"]):
            with self.subTest(assigned=assigned):
                self.add_layers()
                self.catalog["entries"][0]["layers"] = assigned
                with self.assertRaisesRegex(ValueError, "stack layer"):
                    self.validate()

    def test_stack_layer_roles_reject_unknown_candidates_and_overlap(self):
        self.add_layers()
        self.catalog["layers"][0]["challenger_ids"] = ["missing-candidate"]
        with self.assertRaisesRegex(ValueError, "Unknown stack layer choice"):
            self.validate()
        self.catalog["layers"][0]["challenger_ids"] = ["synthetic-parser"]
        with self.assertRaisesRegex(ValueError, "conflicting stack layer roles"):
            self.validate()

    def test_stack_layer_choices_must_belong_to_the_named_layer(self):
        self.add_layers()
        other = copy.deepcopy(self.catalog["layers"][0])
        other["id"] = "synthetic-other"
        self.catalog["layers"].append(other)
        with self.assertRaisesRegex(ValueError, "outside assigned layer"):
            self.validate()

    def test_stack_taxonomy_rejects_empty_duplicate_and_invalid_roles(self):
        self.catalog["layers"] = []
        with self.assertRaisesRegex(ValueError, "cannot be empty"):
            self.validate()
        self.add_layers()
        self.catalog["layers"].append(copy.deepcopy(self.catalog["layers"][0]))
        with self.assertRaisesRegex(ValueError, "duplicate stack layer"):
            self.validate()
        self.add_layers()
        self.catalog["layers"][0]["baseline_ids"] = []
        with self.assertRaisesRegex(ValueError, "needs a reference choice"):
            self.validate()

    def test_stack_taxonomy_rejects_non_object_rows_with_controlled_errors(self):
        for row in (None, "synthetic-storage", 7, [], True):
            with self.subTest(row=row):
                self.catalog["layers"] = [row]
                with self.assertRaisesRegex(ValueError, "Stack layer must be an object"):
                    self.validate()

    def test_rejects_duplicate_entry_ids(self):
        self.catalog["entries"].append(copy.deepcopy(self.catalog["entries"][0]))
        with self.assertRaisesRegex(ValueError, "duplicate entry ID"):
            self.validate()

    def test_rejects_unknown_source_ids(self):
        self.catalog["entries"][0]["source_ids"] = ["SYNTHETIC999"]
        with self.assertRaisesRegex(ValueError, "Unregistered source"):
            self.validate()

    def test_rejects_mismatched_source_register_url(self):
        self.registry[0]["url"] = "https://example.org/different-synthetic-source"
        with self.assertRaisesRegex(ValueError, "URL mismatch"):
            self.validate()

    def test_rejects_source_ids_without_corresponding_details(self):
        self.catalog["entries"][0]["sources"] = []
        with self.assertRaisesRegex(ValueError, "detail count"):
            self.validate()

    def test_rejects_future_snapshot_check_and_publication_dates(self):
        mutations = [
            lambda c: c.update(snapshot_date="2026-10-28"),
            lambda c: c["entries"][0]["sources"][0].update(checked_at="2026-10-28"),
            lambda c: c["entries"][0]["sources"][0].update(published_at="2026-10-28"),
        ]
        for mutate in mutations:
            with self.subTest(mutation=mutate):
                self.catalog, self.registry = catalog_fixture()
                mutate(self.catalog)
                with self.assertRaisesRegex(ValueError, "Future"):
                    self.validate()

    def test_rejects_publication_after_source_was_checked(self):
        self.catalog["entries"][0]["sources"][0].update(
            checked_at="2026-10-25", published_at="2026-10-26"
        )
        with self.assertRaisesRegex(ValueError, "Publication after"):
            self.validate()

    def test_unknown_publication_date_is_preserved(self):
        self.catalog["entries"][0]["sources"][0]["published_at"] = None
        self.validate()
        self.assertIsNone(self.catalog["entries"][0]["sources"][0]["published_at"])

    def test_paper_publication_year_does_not_fabricate_an_exact_date(self):
        entry = self.catalog["entries"][0]
        entry["kind"] = "paper"
        entry["publication_year"] = 2026
        entry["sources"][0]["published_at"] = None
        self.validate()
        self.assertEqual(entry["publication_year"], 2026)
        self.assertIsNone(entry["sources"][0]["published_at"])

    def test_rejects_future_or_invalid_paper_publication_year(self):
        for year in (2027, 1899, True, False, 2026.0, "2026"):
            with self.subTest(publication_year=year):
                self.catalog, self.registry = catalog_fixture()
                entry = self.catalog["entries"][0]
                entry["kind"] = "paper"
                entry["publication_year"] = year
                with self.assertRaises(ValueError):
                    self.validate()

    def test_rejects_publication_year_on_nonpaper_entry(self):
        self.catalog["entries"][0]["publication_year"] = 2026
        with self.assertRaises(ValueError):
            self.validate()

    def test_rejects_unsupported_status_promotion(self):
        for status in ("accepted", "measured", "production_proven", "best"):
            with self.subTest(status=status):
                self.catalog["entries"][0]["status"] = status
                with self.assertRaisesRegex(ValueError, "promote"):
                    self.validate()

    def test_rejects_missing_or_blank_proposal(self):
        for value in (None, "", "   "):
            with self.subTest(proposal=value):
                self.catalog["entries"][0]["evaluation"]["proposal"] = value
                with self.assertRaisesRegex(ValueError, "proposal"):
                    self.validate()
        del self.catalog["entries"][0]["evaluation"]["proposal"]
        with self.assertRaisesRegex(ValueError, "proposal"):
            self.validate()

    def test_rejects_empty_or_meaningless_metrics_and_caveats(self):
        for field in ("metrics", "caveats"):
            for value in ([], [""], ["  "], [None], "not a list"):
                with self.subTest(field=field, value=value):
                    self.catalog, self.registry = catalog_fixture()
                    self.catalog["entries"][0]["evaluation"][field] = value
                    with self.assertRaisesRegex(ValueError, field):
                        self.validate()

    def test_rejects_unknown_track(self):
        self.catalog["entries"][0]["evaluation"]["track"] = "unregistered-track"
        with self.assertRaisesRegex(ValueError, "track"):
            self.validate()

    def test_rejects_noninteger_schema_and_priority(self):
        for value in (True, 1.0, "1"):
            with self.subTest(schema=value):
                self.catalog, self.registry = catalog_fixture()
                self.catalog["schema_version"] = value
                with self.assertRaises(ValueError):
                    self.validate()
            with self.subTest(priority=value):
                self.catalog, self.registry = catalog_fixture()
                self.catalog["entries"][0]["priority"] = value
                with self.assertRaises(ValueError):
                    self.validate()

    def test_rejects_credentials_and_active_url_schemes(self):
        for value in ("http://example.org", "javascript:alert(1)",
                      "https://secret@example.org", "https://example.org/\nprivate"):
            with self.subTest(url=value):
                self.catalog["entries"][0]["url"] = value
                with self.assertRaises(ValueError):
                    self.validate()


class ResultValidationTests(unittest.TestCase):
    def setUp(self):
        self.results = results_fixture()
        self.candidate_tracks = {
            "synthetic-parser": "json-serialization", "synthetic-database": "local-storage"
        }

    def validate(self):
        return explorer.validate_results(self.results, self.candidate_tracks, TODAY)

    def test_keeps_external_report_in_its_own_lane(self):
        cohorts = self.validate()
        self.assertEqual(cohorts["synthetic-json-cohort"]["evidence"], "external_reported")

    def test_rejects_unknown_candidate_and_cohort(self):
        for field, value in (("candidate_id", "unknown"), ("cohort_id", "unknown")):
            with self.subTest(field=field):
                self.results = results_fixture()
                self.results["observations"][0][field] = value
                with self.assertRaises(ValueError):
                    self.validate()

    def test_rejects_candidate_in_incompatible_track(self):
        self.results["observations"][0]["candidate_id"] = "synthetic-database"
        with self.assertRaises(ValueError):
            self.validate()

    def test_rejects_unknown_cohort_track(self):
        self.results["cohorts"][0]["track"] = "nonexistent-track"
        with self.assertRaises(ValueError):
            self.validate()

    def test_rejects_observation_evidence_conflicting_with_cohort(self):
        self.results["observations"][0]["evidence"] = "atlas_measured"
        with self.assertRaises(ValueError):
            self.validate()

    def test_rejects_unsupported_evidence_promotion(self):
        for evidence in ("accepted", "production_proven", "community", "synthetic"):
            with self.subTest(evidence=evidence):
                self.results["cohorts"][0]["evidence"] = evidence
                with self.assertRaises(ValueError):
                    self.validate()

    def test_rejects_invalid_and_nonfinite_measurements(self):
        for value in (None, True, "2.5", math.nan, math.inf, -math.inf):
            with self.subTest(value=value):
                self.results["observations"][0]["value"] = value
                with self.assertRaisesRegex(ValueError, "measurement"):
                    self.validate()

    def test_duplicate_configuration_requires_distinct_identity(self):
        duplicate = copy.deepcopy(self.results["observations"][0])
        duplicate["subject"] = "A different label does not create a different configuration"
        self.results["observations"].append(duplicate)
        with self.assertRaisesRegex(ValueError, "configurations"):
            self.validate()

    def test_rejects_duplicate_cohort_identity(self):
        self.results["cohorts"].append(copy.deepcopy(self.results["cohorts"][0]))
        with self.assertRaisesRegex(ValueError, "cohort"):
            self.validate()

    def test_rejects_future_cohort_and_observation_dates(self):
        for collection in ("cohorts", "observations"):
            with self.subTest(collection=collection):
                self.results = results_fixture()
                self.results[collection][0]["observed_at"] = "2026-10-28"
                with self.assertRaisesRegex(ValueError, "Future"):
                    self.validate()

    def test_local_evidence_requires_repetition_and_artifact_hashes(self):
        for field, value in (("sample_count", 4), ("raw_sha256", ""),
                             ("raw_sha256", "g" * 64), ("workload_sha256", None)):
            with self.subTest(field=field, value=value):
                self.results = results_fixture("atlas_measured")
                self.results["observations"][0][field] = value
                with self.assertRaises((ValueError, TypeError)):
                    self.validate()

    def test_local_sample_count_must_be_an_integer(self):
        for count in (5.5, 15.0, "15", True, None, math.nan, math.inf):
            with self.subTest(sample_count=count):
                self.results = results_fixture("atlas_measured")
                self.results["observations"][0]["sample_count"] = count
                with self.assertRaisesRegex(ValueError, "repeated samples"):
                    self.validate()

    def test_cohort_caveats_must_contain_meaningful_text(self):
        for caveats in ([], [""], ["   "], [None], [False], "not a list"):
            with self.subTest(caveats=caveats):
                self.results["cohorts"][0]["caveats"] = caveats
                with self.assertRaisesRegex(ValueError, "caveats"):
                    self.validate()

    def test_rejects_noninteger_result_schema(self):
        for schema in (True, 1.0, "1"):
            with self.subTest(schema=schema):
                self.results["schema_version"] = schema
                with self.assertRaises(ValueError):
                    self.validate()


class SignalAndCommunityTests(unittest.TestCase):
    def setUp(self):
        self.catalog, _ = catalog_fixture()
        self.signals = signal_fixture()
        self.community = community_fixture()

    def validate(self):
        return explorer.validate_signals(self.signals, self.community, self.catalog, TODAY)

    def test_zero_stars_and_missing_observation_are_distinct_valid_states(self):
        self.validate()
        self.assertEqual(self.signals["repositories"]["example/synthetic"]["stars"], 0)
        self.signals["repositories"] = {}
        self.validate()
        self.assertNotIn("example/synthetic", self.signals["repositories"])

    def test_rejects_invalid_popularity_values(self):
        for field in ("stars", "forks"):
            for value in (-1, True, 0.5, "0", None):
                with self.subTest(field=field, value=value):
                    self.signals = signal_fixture()
                    self.signals["repositories"]["example/synthetic"][field] = value
                    with self.assertRaisesRegex(ValueError, "popularity"):
                        self.validate()

    def test_rejects_unknown_repository_signal(self):
        record = self.signals["repositories"].pop("example/synthetic")
        self.signals["repositories"]["example/unknown"] = record
        with self.assertRaisesRegex(ValueError, "repository"):
            self.validate()

    def test_rejects_malformed_snapshot_error_history(self):
        for collection in ("signals", "community"):
            for value in (None, {}, "", False, 0):
                with self.subTest(collection=collection, errors=value):
                    self.signals, self.community = signal_fixture(), community_fixture()
                    getattr(self, collection)["errors"] = value
                    with self.assertRaisesRegex(ValueError, "errors"):
                        self.validate()

    def test_rejects_missing_community_error_history(self):
        del self.community["errors"]
        with self.assertRaisesRegex(ValueError, "Community errors"):
            self.validate()

    def test_requires_timezone_for_snapshot_refresh_timestamps(self):
        for collection in ("signals", "community"):
            for field in ("last_attempted_at", "last_completed_at"):
                with self.subTest(collection=collection, field=field):
                    self.signals, self.community = signal_fixture(), community_fixture()
                    getattr(self, collection)[field] = "2026-10-27T18:00:00"
                    with self.assertRaisesRegex(ValueError, "timezone"):
                        self.validate()

    def test_rejects_future_snapshot_refresh_timestamps(self):
        for collection in ("signals", "community"):
            for field in ("last_attempted_at", "last_completed_at"):
                for stamp in ("2026-10-28T00:00:00Z", "2026-10-27T23:00:00-02:00"):
                    with self.subTest(collection=collection, field=field, timestamp=stamp):
                        self.signals, self.community = signal_fixture(), community_fixture()
                        getattr(self, collection)[field] = stamp
                        with self.assertRaisesRegex(ValueError, "Future"):
                            self.validate()

    def test_snapshot_refresh_timestamps_accept_null_or_valid_utc_date(self):
        for collection in ("signals", "community"):
            for field in ("last_attempted_at", "last_completed_at"):
                for stamp in (None, "2026-10-27T18:00:00Z", "2026-10-28T01:00:00+02:00"):
                    with self.subTest(collection=collection, field=field, timestamp=stamp):
                        self.signals, self.community = signal_fixture(), community_fixture()
                        getattr(self, collection)[field] = stamp
                        self.validate()

    def test_requires_timezone_and_rejects_future_observations(self):
        for stamp in ("2026-10-27T18:00:00", "2026-10-28T00:00:00Z"):
            with self.subTest(timestamp=stamp):
                self.signals["repositories"]["example/synthetic"]["observed_at"] = stamp
                with self.assertRaises(ValueError):
                    self.validate()

    def test_timestamp_dates_are_checked_in_utc(self):
        self.signals["repositories"]["example/synthetic"]["observed_at"] = "2026-10-28T01:00:00+02:00"
        self.validate()  # Still 2026-10-27 in UTC.

    def test_one_account_cannot_vote_twice_under_different_display_names(self):
        duplicate = copy.deepcopy(self.community["ratings"][0])
        duplicate["author"] = "renamed-synthetic-account"
        duplicate["issue_url"] = "https://github.com/Herbertofury/Engineering-Atlas/issues/2"
        self.community["ratings"].append(duplicate)
        with self.assertRaisesRegex(ValueError, "Duplicate account"):
            self.validate()

    def test_same_account_can_review_a_different_candidate(self):
        other = copy.deepcopy(self.catalog["entries"][0])
        other["id"] = "synthetic-other-parser"
        self.catalog["entries"].append(other)
        review = copy.deepcopy(self.community["ratings"][0])
        review["candidate_id"] = other["id"]
        review["issue_url"] = "https://github.com/Herbertofury/Engineering-Atlas/issues/2"
        self.community["ratings"].append(review)
        self.validate()

    def test_rejects_rating_track_mismatch(self):
        self.community["ratings"][0]["track"] = "local-storage"
        with self.assertRaisesRegex(ValueError, "track"):
            self.validate()

    def test_rejects_invalid_ratings(self):
        for score in (0, 6, True, 4.0, "4", None, math.nan, math.inf):
            with self.subTest(score=score):
                self.community["ratings"][0]["score"] = score
                with self.assertRaisesRegex(ValueError, "Rating"):
                    self.validate()

    def test_rejects_unreviewed_community_reports(self):
        for state in ("pending", "rejected", None):
            with self.subTest(review_state=state):
                self.community["ratings"][0]["review_state"] = state
                with self.assertRaisesRegex(ValueError, "Unreviewed"):
                    self.validate()

    def test_requires_stable_public_account_id(self):
        for account_id in (0, -1, True, "123456", 123456.0):
            with self.subTest(account_id=account_id):
                self.community["ratings"][0]["author_id"] = account_id
                with self.assertRaisesRegex(ValueError, "account ID"):
                    self.validate()

    def test_rejects_unrelated_issue_and_future_review(self):
        self.community["ratings"][0]["issue_url"] = "https://github.com/other/repo/issues/1"
        with self.assertRaisesRegex(ValueError, "this repository"):
            self.validate()
        self.community = community_fixture()
        self.community["ratings"][0]["updated_at"] = "2026-10-28T00:00:00Z"
        with self.assertRaisesRegex(ValueError, "Future"):
            self.validate()

    def test_rejects_noninteger_signal_and_community_schema(self):
        for collection in ("signals", "community"):
            for schema in (True, 1.0, "1"):
                with self.subTest(collection=collection, schema=schema):
                    self.signals, self.community = signal_fixture(), community_fixture()
                    getattr(self, collection)["schema_version"] = schema
                    with self.assertRaises(ValueError):
                        self.validate()


class RetainedJsonLabTests(unittest.TestCase):
    IDS = {"python-stdlib-json", "orjson", "ultrajson"}
    PATH = Path("experiments/json-lab/results-2026-10-26.json")

    def test_imports_existing_samples_medians_and_hashes_without_running_a_lab(self):
        raw_bytes = (ROOT / self.PATH).read_bytes()
        raw = json.loads(raw_bytes)
        cohorts, observations = explorer.import_retained_json_lab(ROOT, self.IDS)
        self.assertEqual(len(cohorts), 9)
        self.assertEqual(len(observations), 27)
        self.assertEqual({c["evidence"] for c in cohorts}, {"atlas_measured"})
        self.assertEqual({c["track"] for c in cohorts}, {"json-serialization"})
        expected_digest = hashlib.sha256(raw_bytes).hexdigest()
        actual = {(o["candidate_id"], o["cohort_id"]): o for o in observations}
        library_ids = {"stdlib": "python-stdlib-json", "orjson": "orjson", "ujson": "ultrajson"}
        for workload, record in raw["workloads"].items():
            for operation, result in record["operations"].items():
                cohort_id = "json-" + workload.replace("_", "-") + "-" + operation.replace("_", "-")
                for library, measured in result["libraries"].items():
                    with self.subTest(workload=workload, operation=operation, library=library):
                        observation = actual[(library_ids[library], cohort_id)]
                        self.assertEqual(observation["value"], statistics.median(measured["samples_ms"]))
                        self.assertEqual(observation["sample_count"], len(measured["samples_ms"]))
                        self.assertEqual(observation["raw_sha256"], expected_digest)
                        self.assertEqual(observation["workload_sha256"], record["input_sha256"])
                        self.assertEqual(observation["observed_at"], raw["date"])
                        self.assertIn("/blob/4ed47c5c324231d65b81c3c846bd8fa3f880bee8/", observation["source_url"])
        self.assertTrue(all("not a new run" in c["caveats"][0] for c in cohorts))
        self.assertTrue(all("duplicate keys" in o["note"] for o in observations))
        self.assertTrue(all("above u64" in o["note"] for o in observations))

    def test_rejects_missing_catalog_candidates(self):
        with self.assertRaisesRegex(ValueError, "candidates missing"):
            explorer.import_retained_json_lab(ROOT, {"orjson"})

    def test_rejects_altered_samples_medians_and_provenance_in_retained_artifact(self):
        original = json.loads((ROOT / self.PATH).read_text())

        def samples(data):
            return data["workloads"]["catalog_2000"]["operations"]["decode"]["libraries"]["orjson"]

        mutations = [
            lambda d: samples(d)["samples_ms"].pop(),
            lambda d: samples(d)["samples_ms"].__setitem__(0, math.nan),
            lambda d: samples(d)["samples_ms"].__setitem__(0, 0),
            lambda d: samples(d).update(median_ms=999.0),
            lambda d: d.update(evidence="production_proven"),
        ]
        for index, mutate in enumerate(mutations):
            with self.subTest(mutation=index), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                path = root / self.PATH
                path.parent.mkdir(parents=True)
                synthetic_mutation = copy.deepcopy(original)
                mutate(synthetic_mutation)
                path.write_text(json.dumps(synthetic_mutation))
                with self.assertRaises(ValueError):
                    explorer.import_retained_json_lab(root, self.IDS)

    def test_retained_immutable_source_requires_byte_identity(self):
        original = (ROOT / self.PATH).read_bytes()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / self.PATH
            path.parent.mkdir(parents=True)
            path.write_bytes(original + b"\n")
            self.assertEqual(json.loads(path.read_bytes()), json.loads(original))
            with self.assertRaisesRegex(ValueError, "immutable source"):
                explorer.import_retained_json_lab(root, self.IDS)


class StackGuideBuildTests(unittest.TestCase):
    """Exercise generated-guide ownership using only synthetic catalog data."""

    START = "<!-- stack-layer-map:start -->"
    END = "<!-- stack-layer-map:end -->"

    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        for name in ("explorer-core.mjs", "explorer.mjs", "explorer.css", "index.template.html"):
            target = self.root / "docs/explorer" / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / "docs/explorer" / name, target)
        self.stack_path = self.root / "docs/stack-selection.md"
        self.bundle, _ = catalog_fixture()
        self.bundle.update(results={"cohorts": [], "observations": []},
                           signals={"repositories": {}, "errors": []},
                           community={"ratings": [], "errors": []})
        loader = patch.object(explorer, "load_bundle", return_value=self.bundle)
        loader.start()
        self.addCleanup(loader.stop)

    def test_legacy_build_clears_prior_map_and_check_rejects_stale_map_without_writing(self):
        self.bundle["layers"] = [{
            "id": "synthetic-storage", "label": "Synthetic storage layer",
            "decision": "Synthetic comparison.", "gate": "Synthetic gate.",
            "baseline_ids": ["synthetic-parser"], "challenger_ids": [], "watch_ids": [],
        }]
        self.bundle["entries"][0]["layers"] = ["synthetic-storage"]
        before, after = "# Synthetic guide\n\n", "\n\nPreserve this authored guidance.\n"
        self.stack_path.write_text(before + self.START + "\n" + self.END + after)
        explorer.build(self.root)
        layered = self.stack_path.read_bytes()
        self.assertIn(b"Synthetic storage layer", layered)
        self.assertIn(SOURCE_URL.encode(), layered)

        del self.bundle["layers"]
        del self.bundle["entries"][0]["layers"]
        explorer.build(self.root)
        cleared = (before + self.START + "\n" + self.END + after).encode()
        self.assertEqual(self.stack_path.read_bytes(), cleared)
        manifest_path = self.root / "docs/explorer/build-manifest.json"
        manifest = json.loads(manifest_path.read_text())
        self.assertEqual(manifest["files"]["docs/stack-selection.md"], hashlib.sha256(cleared).hexdigest())
        first_manifest = manifest_path.read_bytes()
        explorer.build(self.root)
        self.assertEqual(self.stack_path.read_bytes(), cleared)
        self.assertEqual(manifest_path.read_bytes(), first_manifest)
        self.assertEqual(explorer.build(self.root, check=True)["mode"], "check")

        self.stack_path.write_bytes(layered)
        with self.assertRaisesRegex(ValueError, "docs/stack-selection.md"):
            explorer.build(self.root, check=True)
        self.assertEqual(self.stack_path.read_bytes(), layered, "Check mode must not erase stale evidence")

    def test_legacy_guide_without_markers_is_preserved_and_not_claimed_as_output(self):
        authored = "# Synthetic legacy guide\n\nEntirely authored content.\n"
        self.stack_path.write_text(authored)
        explorer.build(self.root)
        manifest = json.loads((self.root / "docs/explorer/build-manifest.json").read_text())
        self.assertNotIn("docs/stack-selection.md", manifest["files"])
        self.assertEqual(self.stack_path.read_text(), authored)
        self.assertEqual(explorer.build(self.root, check=True)["mode"], "check")
        self.assertEqual(self.stack_path.read_text(), authored)

    def test_legacy_catalog_does_not_require_a_stack_guide(self):
        self.assertFalse(self.stack_path.exists())
        explorer.build(self.root)
        self.assertFalse(self.stack_path.exists())
        self.assertEqual(explorer.build(self.root, check=True)["mode"], "check")

    def test_malformed_marker_pairs_fail_before_outputs_are_written(self):
        for text in (self.START, self.END, self.END + self.START,
                     self.START + self.START + self.END, self.START + self.END + self.END):
            with self.subTest(text=text):
                self.stack_path.write_text(text)
                for check in (False, True):
                    with self.assertRaisesRegex(ValueError, "one ordered layer-map marker pair"):
                        explorer.build(self.root, check=check)
                    self.assertEqual(self.stack_path.read_text(), text)
                    self.assertFalse((self.root / "docs/explorer/index.html").exists())


class TestPlanDirectoryBuildTests(unittest.TestCase):
    START = "<!-- test-plan-directory:start -->"
    END = "<!-- test-plan-directory:end -->"

    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        for name in ("explorer-core.mjs", "explorer.mjs", "explorer.css", "index.template.html"):
            target = self.root / "docs/explorer" / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / "docs/explorer" / name, target)
        self.queue_path = self.root / "docs/research-test-queue.md"
        self.bundle, _ = catalog_fixture()
        self.bundle.update(results={"cohorts": [], "observations": []},
                           signals={"repositories": {}, "errors": []},
                           community={"ratings": [], "errors": []})
        loader = patch.object(explorer, "load_bundle", return_value=self.bundle)
        loader.start()
        self.addCleanup(loader.stop)

    def add_plans(self):
        self.bundle["layers"] = [{
            "id": "synthetic-storage", "label": "Synthetic storage layer",
            "decision": "Synthetic comparison.", "gate": "Synthetic gate.",
            "baseline_ids": ["synthetic-parser"], "challenger_ids": [], "watch_ids": [],
        }]
        self.bundle["entries"][0]["layers"] = ["synthetic-storage"]
        self.bundle["test_plans"] = test_plan_fixture()["plans"]
        (self.root / "docs/stack-selection.md").write_text(
            "# Synthetic stack guide\n\n<!-- stack-layer-map:start -->\n<!-- stack-layer-map:end -->\n")

    def test_directory_is_deterministic_and_does_not_replace_authored_plan_details(self):
        self.add_plans()
        before, after = "# Synthetic queue\n\nPreserve admission policy.\n\n", "\n\n## Full authored plan\nKeep all warnings.\n"
        self.queue_path.write_text(before + self.START + "\n" + self.END + after)
        result = explorer.build(self.root)
        generated = self.queue_path.read_bytes()
        self.assertEqual(result["test_plans"], 1)
        self.assertTrue(generated.startswith(before.encode()))
        self.assertTrue(generated.endswith(after.encode()))
        self.assertIn(b"?plan=planned-synthetic-contract-v1#catalog", generated)
        self.assertEqual(explorer.build(self.root, check=True)["mode"], "check")
        manifest = json.loads((self.root / "docs/explorer/build-manifest.json").read_text())
        self.assertEqual(manifest["test_plans"], 1)
        self.assertEqual(manifest["files"]["docs/research-test-queue.md"], hashlib.sha256(generated).hexdigest())
        self.bundle["test_plans"] = []
        with self.assertRaisesRegex(ValueError, "research-test-queue.md"):
            explorer.build(self.root, check=True)
        self.assertEqual(self.queue_path.read_bytes(), generated, "Check mode must not erase a stale directory")
        explorer.build(self.root)
        self.assertEqual(self.queue_path.read_text(), before + self.START + "\n" + self.END + after)

    def test_legacy_queue_without_registry_or_markers_is_preserved(self):
        self.assertFalse(self.queue_path.exists())
        explorer.build(self.root)
        self.assertFalse(self.queue_path.exists())
        authored = "# Synthetic legacy queue\n\nKeep existing human-authored plans.\n"
        self.queue_path.write_text(authored)
        explorer.build(self.root)
        manifest = json.loads((self.root / "docs/explorer/build-manifest.json").read_text())
        self.assertNotIn("docs/research-test-queue.md", manifest["files"])
        self.assertEqual(self.queue_path.read_text(), authored)

    def test_registry_requires_existing_queue_and_ordered_markers_before_writing(self):
        self.add_plans()
        with self.assertRaisesRegex(ValueError, "requires the existing test queue"):
            explorer.build(self.root)
        self.assertFalse((self.root / "docs/explorer/index.html").exists())
        for content in ("# Queue without markers", self.START, self.END, self.END + self.START,
                        self.START + self.START + self.END, self.START + self.END + self.END):
            with self.subTest(content=content):
                self.queue_path.write_text(content)
                for check in (False, True):
                    with self.assertRaisesRegex(ValueError, "one ordered test-plan directory marker pair"):
                        explorer.build(self.root, check=check)
                    self.assertEqual(self.queue_path.read_text(), content)
                    self.assertFalse((self.root / "docs/explorer/index.html").exists())


class DeterministicBuildTests(unittest.TestCase):
    INPUTS = (
        "data/research-catalog.json", "data/research-results.json", "data/research-signals.json",
        "data/research-community.json", "data/research-test-plans.json",
        "experiments/json-lab/results-2026-10-26.json",
        "docs/explorer/explorer-core.mjs", "docs/explorer/explorer.mjs",
        "docs/explorer/explorer.css", "docs/explorer/index.template.html",
        "docs/stack-selection.md", "docs/research-test-queue.md",
    )

    @classmethod
    def fixture_inputs(cls, root):
        registry = explorer._registry_module
        # Validate the complete index before trusting its file list. Legacy
        # registers without an index still include every discovered addition.
        registry.load_sources(root)
        index_path = root / "data/source-index.json"
        if index_path.exists():
            paths = [root / name for name in json.loads(index_path.read_text())["files"]]
            paths.append(index_path)
        else:
            paths = [root / "data/sources.json", *sorted((root / "data/sources.d").glob("*.json"))]
        return (*cls.INPUTS, *registry.relative_source_names(root, paths))

    def test_fixture_inventory_preserves_indexed_additions_and_their_catalog_references(self):
        catalog, sources = catalog_fixture()
        with tempfile.TemporaryDirectory() as directory:
            source_root = Path(directory) / "source"
            copied_root = Path(directory) / "copied"
            contents = {
                "data/sources.json": [],
                "data/sources.d/synthetic-first.json": sources,
                "data/sources.d/synthetic-second.json": [{**sources[0], "id": "SYN002"}],
            }
            contents["data/source-index.json"] = {"schema_version": 1, "files": list(contents)}
            for name, value in contents.items():
                path = source_root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps(value))
            source_names = self.fixture_inputs(source_root)[len(self.INPUTS):]
            self.assertEqual(set(source_names), set(contents))
            for name in source_names:
                target = copied_root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source_root / name, target)
                self.assertEqual(target.read_bytes(), (source_root / name).read_bytes())
            copied_sources = explorer.load_sources(copied_root)
            self.assertEqual(copied_sources, [*sources, contents["data/sources.d/synthetic-second.json"][0]])
            self.assertEqual(explorer.validate_catalog(catalog, copied_sources, TODAY), {"synthetic-parser"})

    def test_actual_dataset_build_is_deterministic_and_check_does_not_write(self):
        inputs = self.fixture_inputs(ROOT)
        missing = [name for name in inputs if not (ROOT / name).is_file()]
        self.assertFalse(missing, "Required explorer inputs missing: " + ", ".join(missing))
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in inputs:
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / name, target)
            original_inputs = {name: (root / name).read_bytes() for name in inputs}
            first = explorer.build(root)
            manifest_path = root / "docs/explorer/build-manifest.json"
            manifest = json.loads(manifest_path.read_text())
            generated = {name: (root / name).read_bytes() for name in manifest["files"]}
            generated["docs/explorer/build-manifest.json"] = manifest_path.read_bytes()
            self.assertGreater(first["entries"], 3)
            self.assertGreaterEqual(first["observations"], 27)
            for name, expected_hash in manifest["files"].items():
                self.assertEqual(hashlib.sha256((root / name).read_bytes()).hexdigest(), expected_hash)
            self.assertEqual(explorer.build(root), first)
            self.assertEqual({name: (root / name).read_bytes() for name in generated}, generated)
            self.assertEqual(explorer.build(root, check=True)["mode"], "check")
            self.assertEqual({name: (root / name).read_bytes() for name in inputs}, original_inputs)
            index_path = root / "docs/explorer/index.html"
            index_path.write_bytes(index_path.read_bytes() + b"\n<!-- synthetic stale-output fixture -->\n")
            before_check = {name: (root / name).read_bytes() for name in generated}
            with self.assertRaisesRegex(ValueError, "stale"):
                explorer.build(root, check=True)
            self.assertEqual({name: (root / name).read_bytes() for name in generated}, before_check)


if __name__ == "__main__":
    unittest.main()
