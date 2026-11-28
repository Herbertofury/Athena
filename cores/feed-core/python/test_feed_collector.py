"""Behavioral transport, retention, freshness and recovery tests; no live network."""
import datetime as dt
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location("collector", Path(__file__).with_name("feed_collector.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
SOURCE = m.Source("example", "https://publisher.example/rss", frozenset({"publisher.example"}),
                  discovery_url="https://publisher.example/", min_interval=1800)
NOW = dt.datetime(2026, 11, 28, 12, tzinfo=dt.timezone.utc)
RSS = b'''<rss><channel><item><title>Important update</title><link>https://publisher.example/article?utm_source=feed</link><pubDate>Sat, 28 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>'''


class CollectorTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.output = Path(self.tmp.name) / "digest.json"
        self.state = Path(self.tmp.name) / "state.json"
        self.report = Path(self.tmp.name) / "report.json"

    def run_refresh(self, fetcher, now=NOW, **kwargs):
        return m.refresh(self.output, sources=(SOURCE,), state_path=self.state,
                         report_path=self.report, now=now, fetcher=fetcher, **kwargs)

    @staticmethod
    def success(url, *args, **kwargs):
        return m.HttpReply(RSS, url, 200, '"etag-1"', "Sat, 28 Nov 2026 10:00:00 GMT")

    def test_conditional_304_reuses_exact_items_and_records_real_check(self):
        first = self.run_refresh(self.success)
        called = []
        def unchanged(url, *args, **kwargs):
            called.append(kwargs)
            return m.HttpReply(b"", url, 304)
        second = self.run_refresh(unchanged, NOW + dt.timedelta(hours=1))
        self.assertEqual(first["items"], second["items"])
        self.assertEqual(called[0]["conditional"]["If-None-Match"], '"etag-1"')
        self.assertEqual(second["sources"][0]["lastSuccessfulCheckAt"], "2026-11-28T13:00:00Z")
        self.assertEqual(second["items"][0]["date"], "2026-11-28")
        self.assertEqual(second["sources"][0]["httpStatus"], 304)

    def test_old_representation_is_refetched_once_to_acquire_real_source_timestamps(self):
        self.run_refresh(self.success)
        snapshot=json.loads(self.output.read_text())
        snapshot['items'][0].pop('publishedAt',None)
        self.output.write_text(json.dumps(snapshot))
        saved=json.loads(self.state.read_text())
        saved['sources']['example'].pop('representationVersion',None)
        self.state.write_text(json.dumps(saved))
        calls=[]
        def fetch(url,*args,**kwargs):
            calls.append(kwargs)
            return self.success(url,*args,**kwargs)
        upgraded=self.run_refresh(fetch,NOW+dt.timedelta(hours=1))
        self.assertEqual(calls[0]['conditional'],{})
        self.assertEqual(upgraded['items'][0]['publishedAt'],'2026-11-28T10:00:00Z')
        self.assertNotIn('representationVersion',upgraded['sources'][0])
        saved=json.loads(self.state.read_text())
        self.assertEqual(saved['sources']['example']['representationVersion'],m.REPRESENTATION_VERSION)
        self.assertNotIn('representationVersion',m.public_refresh_state(saved,(SOURCE,))['sources']['example'])

    def test_not_due_leaves_snapshot_bytes_and_timestamp_unchanged(self):
        first = self.run_refresh(self.success)
        before = self.output.read_bytes()
        def unexpected(*args, **kwargs):
            self.fail("A fresh source was fetched before its next attempt")
        second = self.run_refresh(unexpected, NOW + dt.timedelta(minutes=2))
        self.assertEqual(first, second)
        self.assertEqual(before, self.output.read_bytes())
        self.assertEqual(json.loads(self.report.read_text())["attemptedSources"], 0)

    def test_total_outage_keeps_digest_but_persists_health_and_backoff(self):
        first = self.run_refresh(self.success)
        before = self.output.read_bytes()
        def fail(*args, **kwargs):
            raise OSError("offline")
        with self.assertRaisesRegex(m.Unsafe, "previous output left unchanged"):
            self.run_refresh(fail, NOW + dt.timedelta(hours=1))
        self.assertEqual(before, self.output.read_bytes())
        state = json.loads(self.state.read_text())["sources"]["example"]
        self.assertEqual(state["consecutiveFailures"], 1)
        self.assertEqual(state["lastSuccessfulCheckAt"], first["generatedAt"])
        self.assertEqual(state["health"], "backoff")
        self.assertTrue(json.loads(self.report.read_text())["previousSnapshotPreserved"])

    def test_failed_due_feed_does_not_misreport_a_healthy_deferred_feed_as_outage(self):
        slower = SOURCE._replace(id="slower", min_interval=7200)
        sources = (SOURCE, slower)
        m.refresh(self.output, sources=sources, state_path=self.state,
                  report_path=self.report, now=NOW, fetcher=self.success)
        before = self.output.read_bytes()
        calls = []
        def fail(url, *args, **kwargs):
            calls.append(url)
            raise OSError("One due source is unavailable")
        result = m.refresh(self.output, sources=sources, state_path=self.state,
                           report_path=self.report, now=NOW + dt.timedelta(hours=1), fetcher=fail)
        self.assertEqual(len(calls), 1)
        self.assertEqual(self.output.read_bytes(), before)
        self.assertEqual(result["generatedAt"], m.iso_time(NOW))
        report = json.loads(self.report.read_text())
        self.assertEqual(report["failedSources"], 1)
        self.assertEqual(report["deferredSources"], 1)
        self.assertTrue(report["previousSnapshotPreserved"])
        state = json.loads(self.state.read_text())["sources"]
        self.assertEqual(state["slower"]["lastSuccessfulCheckAt"], m.iso_time(NOW))
        self.assertEqual(state["example"]["health"], "backoff")

    def test_retry_after_is_respected_without_sleep_or_extra_requests(self):
        self.run_refresh(self.success)
        calls = []
        def throttle(*args, **kwargs):
            calls.append(1)
            raise HTTPError(SOURCE.feed, 429, "Slow down", {"Retry-After": "10800"}, None)
        with self.assertRaises(m.Unsafe):
            self.run_refresh(throttle, NOW + dt.timedelta(hours=1))
        self.assertEqual(len(calls), 1)
        state = json.loads(self.state.read_text())["sources"]["example"]
        self.assertEqual(state["nextAttemptAt"], "2026-11-28T16:00:00Z")

    def test_empty_or_broken_feed_preserves_articles_and_signals_schema_drift(self):
        for data in (b"<rss><channel/></rss>", b"<html>Changed feed</html>", b"{not json}", b'{"version":[],"items":[]}'):
            self.run_refresh(self.success, NOW, force=True)
            before = self.output.read_bytes()
            with self.subTest(data=data), self.assertRaises(m.Unsafe):
                self.run_refresh(lambda url, *args, **kwargs: m.HttpReply(data, url),
                                 NOW + dt.timedelta(hours=1), force=True)
            self.assertEqual(self.output.read_bytes(), before)
            row = json.loads(self.state.read_text())["sources"]["example"]
            self.assertEqual(row["health"], "schema-drift")

    def test_quarantine_still_probes_and_recovers_without_user_action(self):
        self.run_refresh(self.success)
        def fail(*args, **kwargs):
            raise OSError("offline")
        for n in range(5):
            with self.assertRaises(m.Unsafe):
                self.run_refresh(fail, NOW + dt.timedelta(hours=n + 1), force=True)
        state = json.loads(self.state.read_text())["sources"]["example"]
        self.assertEqual(state["health"], "quarantined")
        recovered = self.run_refresh(self.success, NOW + dt.timedelta(days=2))
        self.assertEqual(recovered["sources"][0]["consecutiveFailures"], 0)
        self.assertEqual(recovered["sources"][0]["health"], "healthy")

    def test_only_publisher_declared_approved_alternates_are_discovered(self):
        page = b'''<link rel="alternate" type="application/rss+xml" href="/new.xml">
<link rel="alternate" type="application/rss+xml" href="https://evil.example/feed">
<link rel type="application/rss+xml" href="/missing-rel.xml">
<link rel="alternate" type href="/missing-type.xml">
<a href="/guessed.xml">RSS</a><script>fetch('/secret')</script>'''
        self.assertEqual(m.discover_feeds(SOURCE, page, SOURCE.discovery_url), ["https://publisher.example/new.xml"])
        calls = []
        def get(url, *args, **kwargs):
            calls.append(url)
            if kwargs.get("page"):
                return m.HttpReply(page, url)
            if url == "https://publisher.example/new.xml":
                return m.HttpReply(RSS, url)
            raise OSError("old endpoint gone")
        saved = {"consecutiveFailures": 2}
        result = m.collect_source(SOURCE, [], saved, now=NOW, fetcher=get, discovery=True)
        self.assertEqual(result[1], "ok")
        self.assertEqual(result[3]["feedUrl"], "https://publisher.example/new.xml")
        self.assertNotIn("https://evil.example/feed", calls)

    def test_json_feed_atom_rdf_and_honest_dates(self):
        body = json.dumps({"version": "https://jsonfeed.org/version/1.1", "items": [
            {"id": "1", "url": "https://publisher.example/one", "title": "JSON", "date_published": "2026-11-28T01:00:00Z"},
            {"id": "2", "url": "https://publisher.example/no-date", "title": "No date"}]}).encode()
        rows = m.parse_feed(SOURCE, body, SOURCE.feed)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["date"], "2026-11-28")
        rdf = b'''<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/"><item><title>RDF</title><link>https://publisher.example/rdf</link><dc:date>2026-11-27T03:20:00Z</dc:date></item></rdf:RDF>'''
        self.assertEqual(m.parse_feed(SOURCE, rdf, SOURCE.feed)[0]["title"], "RDF")
        future = RSS.replace(b"2026 10", b"2099 10")
        with self.assertRaises(m.Unsafe):
            self.run_refresh(lambda url, *args, **kwargs: m.HttpReply(future, url))

    def test_bad_cached_validators_urls_and_unbounded_delays_are_discarded(self):
        state = m.validated_state({"feedUrl": "https://evil.example/feed", "etag": "a\r\nb", "health":[],
                                   "nextAttemptAt": "2099-01-01T00:00:00Z", "consecutiveFailures": -1}, SOURCE, NOW)
        self.assertEqual(state, {})
        self.assertIsNone(m.safe_url("https://127.0.0.1/x", SOURCE.feed, {"127.0.0.1"}))
        self.assertIsNone(m.safe_url("https://localhost/x", SOURCE.feed, {"localhost"}))

    def test_bogus_304_cannot_make_missing_content_fresh(self):
        with self.assertRaises(m.Unsafe):
            self.run_refresh(lambda url, *args, **kwargs: m.HttpReply(b"", url, 304))
        self.assertFalse(self.output.exists())

    def test_legacy_single_shot_contract_remains_usable(self):
        result = m.refresh(self.output, sources=(SOURCE,), now=NOW,
                           fetcher=lambda url, *args, **kwargs: (RSS, url))
        self.assertEqual(result["sources"], [{"id": "example", "status": "ok", "origin": "feed", "lastSuccessfulCheckAt": "2026-11-28T12:00:00Z"}])


if __name__ == "__main__":
    unittest.main()
