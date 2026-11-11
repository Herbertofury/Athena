"""Synthetic Steam news observations; no third-party prose or remote requests."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch

PATH = Path(__file__).resolve().parents[1] / "experiments/steam-news-lab/news.py"
SPEC = importlib.util.spec_from_file_location("steam_news_lab", PATH)
news = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(news)


def row(**changes):
    result = dict(appid=620, gid="000-opaque:entry", title="Synthetic title", author="Synthetic author",
                  feedlabel="Synthetic label", feedname="test_feed", date=123,
                  contents="Synthetic contents", url="https://example.invalid/redirect",
                  is_external_url=True, feed_type=1, tags=[])
    result.update(changes)
    return result


def capture(rows=None, maxlength=0, **changes):
    url = news.ENDPOINT + "?appid=620&count=3&maxlength=" + str(maxlength) + "&enddate=200&format=json"
    result = dict(requestUrl=url, finalUrl=url, status=200, complete=True,
                  body=json.dumps(dict(appnews=dict(appid=620, count=800, newsitems=[row()] if rows is None else rows))))
    result.update(changes)
    return result


def state(value):
    return news.collect_news(620, [value]).receipt()["attempts"][0]["state"]


class SteamNewsTests(unittest.TestCase):
    def test_selection_is_exact_uint32(self):
        for value in (True, False, 0, -1, 2**32, "620", 620.0, None):
            with self.subTest(value=value), self.assertRaises(news.NewsError):
                news.collect_news(value, [])
        self.assertEqual(news.collect_news(620, []).receipt()["recordCount"], 0)

    def test_capture_container_and_bounds(self):
        for value in (None, {}, (), [capture()] * (news.MAX_CAPTURES + 1)):
            with self.assertRaises(news.NewsError):
                news.collect_news(620, value)
        self.assertEqual(state(None), "envelope_invalid")
        self.assertEqual(state(capture(body="x" * (news.MAX_BODY_BYTES + 1))), "string_limit")
        self.assertEqual(state(capture(body=None)), "body_invalid")
        self.assertEqual(state(capture(extra=[0] * (news.MAX_ARRAY + 1))), "container_limit")
        nested = []
        for _ in range(news.MAX_DEPTH + 1):
            nested = [nested]
        self.assertEqual(state(capture(extra=nested)), "structure_limit")
        self.assertEqual(state(capture(extra=float("inf"))), "nonfinite")
        self.assertEqual(state(capture(extra=2**256)), "integer_limit")
        with patch.object(news, "MAX_TOTAL_BODY_BYTES", 1):
            self.assertEqual(state(capture()), "total_body_limit")
        with patch.object(news, "MAX_NODES", 5):
            self.assertEqual(state(capture()), "structure_limit")

    def test_strict_json_and_unicode(self):
        for raw in ('{"appnews":{},"appnews":{}}', '{"x":NaN}', '{"x":Infinity}', '{"x":1e9999}', '{broken', '"\\ud800"', b'\xff'):
            with self.subTest(raw=raw):
                self.assertNotEqual(state(capture(body=raw)), "observed")
        self.assertEqual(state(capture(body="[" * 30 + "]" * 30)), "structure_limit")
        self.assertEqual(state(capture(body="\ud800")), "invalid_unicode")

    def test_endpoint_identity_and_query(self):
        good = capture()
        bad = [good["requestUrl"].replace("https:", "http:"),
               good["requestUrl"].replace("api.steampowered.com", "evil.invalid"),
               good["requestUrl"].replace("api.steampowered.com", "user:password@api.steampowered.com"),
               good["requestUrl"].replace("api.steampowered.com", "api.steampowered.com:443"),
               good["requestUrl"].replace("GetNewsForApp/", "GetNewsForAppAuthed/"),
               good["requestUrl"] + "&key=secret", good["requestUrl"] + "&appid=620",
               good["requestUrl"] + "#fragment", good["requestUrl"].replace("appid=620", "appid=440"),
               good["requestUrl"].replace("count=3", "count=0"),
               good["requestUrl"].replace("maxlength=0", "maxlength=true"),
               good["requestUrl"].replace("format=json", "format=xml"),
               good["requestUrl"] + "&feeds=", good["requestUrl"].replace("appid=620", "appid=0620")]
        for url in bad:
            with self.subTest(url=url):
                self.assertNotEqual(state(capture(requestUrl=url, finalUrl=url)), "observed")
        self.assertEqual(state(capture(finalUrl=good["finalUrl"] + "&extra=1")), "redirect_or_final_identity_mismatch")
        self.assertEqual(state(capture(redirected=True)), "redirect_or_final_identity_mismatch")
        self.assertEqual(state(capture(redirects=["https://example.invalid"])), "redirect_or_final_identity_mismatch")

    def test_failures_remain_ordered_with_bounded_prefix(self):
        evidence = news.collect_news(620, [capture(status=503), capture(complete=False), capture(status=True), capture()])
        self.assertEqual([a["state"] for a in evidence.attempts], ["http_status_failed", "capture_incomplete", "http_status_failed", "observed"])
        self.assertEqual(evidence.attempts[0]["source"]["status"], 503)
        self.assertLessEqual(len(evidence.attempts[0]["bodyPrefix"]), news.PREFIX_BYTES)
        self.assertEqual(evidence.receipt()["recordCount"], 1)

    def test_transport_errors_override_success_metadata(self):
        for field in ("error", "transportError", "transportFailure", "failure"):
            result = news.collect_news(620, [capture(**{field: "PRIVATE failure"})])
            self.assertEqual(result.receipt()["attempts"][0]["state"], "transport_failed")
            self.assertEqual(result.receipt()["recordCount"], 0)
            self.assertNotIn("PRIVATE", json.dumps(result.receipt()))
        self.assertEqual(state(capture(transportState="timeout")), "transport_failed")

    def test_transport_failure_sentinels_are_exact(self):
        for field in ("error", "transportError", "transportFailure", "failure"):
            for value in (0, 0.0, 1, [], {}):
                with self.subTest(field=field, value=value):
                    self.assertEqual(state(capture(**{field: value})), "transport_failed")
            for value in (None, False, ""):
                with self.subTest(field=field, value=value):
                    self.assertEqual(state(capture(**{field: value})), "observed")

    def test_response_count_cannot_contradict_rows(self):
        for count, expected in ((None, "response_count_invalid"), (True, "response_count_invalid"), ("800", "response_count_invalid"), (0, "response_count_inconsistent"), (800, "observed")):
            raw = json.dumps({"appnews": {"appid": 620, "count": count, "newsitems": [row()]}})
            result = news.collect_news(620, [capture(body=raw)])
            attempt = result.receipt()["attempts"][0]
            self.assertEqual(attempt["state"], expected)
            self.assertEqual(attempt["returnedCount"], 1)
            self.assertEqual(attempt["responseCount"], count if type(count) is int else None)
            self.assertFalse(result.receipt()["acceptance"]["wholeHistoryAccepted"])

    def test_response_identity_and_structure(self):
        for appid in (True, "620", 440, None):
            raw = json.dumps({"appnews": {"appid": appid, "newsitems": []}})
            self.assertEqual(state(capture(body=raw)), "response_appid_mismatch")
        for value in ({}, {"appnews": []}, {"appnews": None}):
            self.assertEqual(state(capture(body=json.dumps(value))), "appnews_invalid")
        for value in (None, {}, ""):
            self.assertEqual(state(capture(body=json.dumps({"appnews": {"appid": 620, "newsitems": value}}))), "newsitems_invalid")
        self.assertEqual(state(capture(rows=[row()] * 4)), "returned_count_exceeds_request")

    def test_response_field_states_are_explicit(self):
        for value, expected in (({}, "missing"), ({"appnews": None}, "null"), ({"appnews": []}, "malformed")):
            result = news.collect_news(620, [capture(body=json.dumps(value))])
            self.assertEqual(result.receipt()["attempts"][0]["appnewsState"], expected)
        for value, expected in ((None, "null"), (True, "malformed"), (0, "present")):
            raw = json.dumps({"appnews": {"appid": 620, "count": value, "newsitems": []}})
            result = news.collect_news(620, [capture(body=raw)])
            self.assertEqual(result.receipt()["attempts"][0]["responseFieldStates"]["count"], expected)
            self.assertEqual(result.receipt()["attempts"][0]["responseFieldStates"]["newsitems"], "empty")

    def test_duplicate_observations_and_distinct_scopes(self):
        first = capture()
        second = capture(rows=[row(contents="Other window output")])
        second["requestUrl"] = second["requestUrl"].replace("enddate=200", "enddate=201")
        second["finalUrl"] = second["requestUrl"]
        result = news.collect_news(620, [first, copy.deepcopy(first), second])
        self.assertEqual(len(result.records[0]["observations"]), 3)
        self.assertEqual(result.receipt()["sameScopeConflictCount"], 0)

    def test_row_identity_dates_feeds_and_opaque_gid(self):
        for changes in ({"appid": True}, {"appid": 440}, {"gid": 123}, {"gid": ""}, {"gid": " "},
                        {"date": True}, {"date": "123"}, {"date": -1}, {"date": 200}, {"feedname": None}):
            evidence = news.collect_news(620, [capture(rows=[row(**changes)])])
            self.assertEqual(evidence.receipt()["recordCount"], 0, changes)
            self.assertEqual(len(evidence.attempts[0]["rows"]), 1)
        item = capture()
        item["requestUrl"] += "&feeds=other_feed"
        item["finalUrl"] = item["requestUrl"]
        self.assertEqual(news.collect_news(620, [item]).receipt()["recordCount"], 0)
        self.assertEqual(news.collect_news(620, [capture()]).records[0]["gid"], "000-opaque:entry")

    def test_missing_null_empty_malformed_are_distinct(self):
        rows = [row(contents=None), row(contents=""), row(contents=1)]
        evidence = news.collect_news(620, [capture(rows=rows)])
        self.assertEqual([r["fieldStates"]["contents"] for r in evidence.attempts[0]["rows"]], ["null", "empty", "malformed"])
        absent = row()
        del absent["contents"]
        absent["is_external_url"] = 1
        output = news.collect_news(620, [capture(rows=[absent])]).attempts[0]["rows"][0]
        self.assertEqual(output["fieldStates"]["contents"], "missing")
        self.assertEqual(output["fieldStates"]["is_external_url"], "malformed")
        self.assertNotIn("contents", output)

    def test_html_bbcode_plain_and_empty(self):
        for contents, fmt, expected in (("<p>Hi<img src='https://example.invalid/a.png'></p>", "html", "partial_html"),
                                       ("[list][*]Hello[/list]", "bbcode", "unsupported_bbcode"),
                                       ("Hello", "plain", "plain_preserved"), ("", "empty", "empty_preserved")):
            with self.subTest(fmt=fmt):
                result = news.collect_news(620, [capture(rows=[row(contents=contents)])])
                item = result.attempts[0]["rows"][0]
                self.assertEqual(item["contents"], contents)
                self.assertEqual(item["projection"]["format"], fmt)
                self.assertEqual(item["projection"]["state"], expected)
                self.assertFalse(item["projection"]["projectionComplete"])
                self.assertEqual(item["contentsBytes"], len(contents.encode()))

    def test_projection_failure_never_drops_source(self):
        contents = '<img srcset=",">'
        result = news.collect_news(620, [capture(rows=[row(contents=contents)])])
        item = result.attempts[0]["rows"][0]
        self.assertEqual(item["projection"]["state"], "projection_failed")
        self.assertEqual(item["contents"], contents)
        with patch.object(news._HELPERS, "document", side_effect=ValueError("PRIVATE error")):
            self.assertEqual(news.collect_news(620, [capture(rows=[row(contents="<p>broken")])]).attempts[0]["rows"][0]["projection"]["state"], "projection_failed")

    def test_relative_media_is_not_resolved_against_redirect(self):
        result = news.collect_news(620, [capture(rows=[row(contents='<img src="/media.png"><a href="article">x</a>')])])
        projection = result.attempts[0]["rows"][0]["projection"]
        self.assertEqual(projection["unresolvedReferenceCount"], 2)
        self.assertIsNone(projection["body"]["events"][0]["src"])

    def test_full_survives_blurb_and_expected_variants(self):
        full = capture(rows=[row(contents="Full source")])
        blurb = capture(rows=[row(contents="Blurb")], maxlength=160)
        for inputs, preferred in (([full, blurb], 0), ([blurb, full], 1)):
            result = news.collect_news(620, inputs)
            record = result.records[0]
            self.assertEqual(record["preferredObservation"], preferred)
            self.assertFalse(record["sameScopeConflict"])
            self.assertEqual(len(record["observations"]), 2)
        result = news.collect_news(620, [full, capture(rows=[row(contents="Conflicting source")]), capture(status=500)])
        self.assertEqual(result.receipt()["sameScopeConflictCount"], 1)
        self.assertEqual(len(result.attempts), 3)

    def test_scope_and_optional_maxlength_are_preserved(self):
        source = capture()
        source["requestUrl"] = source["requestUrl"].replace("&maxlength=0", "")
        source["finalUrl"] = source["requestUrl"]
        result = news.collect_news(620, [source])
        self.assertEqual(result.attempts[0]["rows"][0]["provenance"], "unspecified_length")
        self.assertEqual(result.attempts[0]["responseCount"], 800)
        self.assertEqual(result.receipt()["attempts"][0]["returnedCount"], 1)
        self.assertFalse(any(result.receipt()["acceptance"].values()))

    def test_receipt_is_whitelist_and_copy_isolated(self):
        source = capture(rows=[row(contents='<img src="https://example.invalid/PRIVATE">PRIVATE prose')], headers={"PRIVATE": "secret"})
        result = news.collect_news(620, [source])
        expected = result.receipt()
        output = json.dumps(expected)
        for forbidden in ("PRIVATE", "example.invalid", "Synthetic", "000-opaque", "test_feed", "secret", "headers"):
            self.assertNotIn(forbidden, output)
        source["body"] = "mutated"
        attempts = result.attempts
        attempts[0]["rows"][0]["contents"] = "mutated"
        records = result.records
        records[0]["observations"].clear()
        receipt = result.receipt()
        receipt["attempts"][0]["rows"][0]["projection"]["format"] = "PRIVATE"
        receipt["acceptance"]["runtimeReady"] = True
        self.assertEqual(result.receipt(), expected)
        self.assertNotEqual(result.attempts[0]["rows"][0]["contents"], "mutated")
        self.assertEqual(len(result.records[0]["observations"]), 1)


if __name__ == "__main__":
    unittest.main()
