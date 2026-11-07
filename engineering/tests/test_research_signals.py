"""Synthetic, mocked-network checks for the public research signal boundary.

These fixtures do not query GitHub, represent real reports, or measure projects.
"""
import contextlib
import copy
import datetime as dt
import importlib.util
import io
import json
import tempfile
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('research_signals', ROOT / 'scripts/refresh_research_signals.py')
signals = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(signals)
NOW = dt.datetime(2026, 10, 27, 20, tzinfo=dt.timezone.utc)
AT = '2026-10-27T20:00:00Z'
OLD = '2026-10-20T10:00:00Z'
REPO_PATH = '/repos/' + signals.REPOSITORY
ISSUES_PATH = REPO_PATH + '/issues?state=open&labels=research-rating-approved&sort=created&direction=asc&per_page=100'


def catalog():
    return {'entries': [{'id': 'synthetic-tool', 'repo': 'Example/Synthetic', 'evaluation': {'track': 'synthetic-track'}}]}


def snapshot(collection):
    result = {'schema_version': 1, collection: {} if collection == 'repositories' else [], 'errors': [], 'last_attempted_at': None}
    if collection == 'ratings':
        result['last_completed_at'] = None
    return result


def repository(name='Example/Synthetic'):
    return {'private': False, 'full_name': name, 'html_url': 'https://github.com/' + name,
            'stargazers_count': 9, 'forks_count': 2, 'archived': False,
            'pushed_at': OLD, 'license': {'spdx_id': 'MIT'},
            'owner': {'id': 900, 'login': 'synthetic-owner', 'type': 'User'}}


def issue(number=1, author_id=100, score='4', updated_at=OLD):
    values = ('synthetic-tool', 'synthetic-track', score, 'synthetic-fixture-1',
              'Synthetic report for validation only. No project was actually tested.')
    body = '\n\n'.join('### ' + heading + '\n\n' + value for heading, value in zip(signals.HEADINGS, values))
    return {'number': number, 'html_url': f'https://github.com/{signals.REPOSITORY}/issues/{number}',
            'body': body, 'state': 'open', 'updated_at': updated_at, 'comments': 1,
            'user': {'id': author_id, 'login': 'synthetic-account', 'type': 'User'},
            'labels': [{'name': signals.APPROVAL_LABEL}]}


def approval(report, actor_id=900, association='OWNER'):
    number = 1000 + report['number']
    return {'id': number, 'html_url': report['html_url'] + '#issuecomment-' + str(number),
            'body': 'atlas-rating-approved: sha256=' + signals.body_hash(report['body']),
            'updated_at': AT, 'author_association': association,
            'user': {'id': actor_id, 'login': 'synthetic-reviewer', 'type': 'User'}}


class QueueClient:
    """The expected call sequence is part of each synthetic transaction fixture."""
    blocked_until = None

    def __init__(self, calls):
        self.calls = list(calls)
        self.seen = []

    def take(self, method, path):
        self.seen.append((method, path))
        if not self.calls:
            raise AssertionError('Unexpected network call: ' + method + ' ' + path)
        expected_method, expected_path, result = self.calls.pop(0)
        if (method, path) != (expected_method, expected_path):
            raise AssertionError(f'Expected {(expected_method, expected_path)}, got {(method, path)}')
        if isinstance(result, Exception):
            raise result
        return copy.deepcopy(result)

    def get(self, path):
        return self.take('get', path), {}

    def get_all(self, path):
        return self.take('get_all', path)


def rating_calls(reports, comments=None, final=None):
    result = [('get_all', ISSUES_PATH, reports)]
    if reports:
        result.append(('get', REPO_PATH, repository(signals.REPOSITORY)))
    for report in reports:
        rows = comments[report['number']] if comments is not None else [approval(report)]
        result.append(('get_all', f'{REPO_PATH}/issues/{report["number"]}/comments?per_page=100', rows))
    result.append(('get_all', ISSUES_PATH, reports if final is None else final))
    return result


class FakeResponse:
    def __init__(self, payload=None, headers=None, raw=None):
        self.raw = json.dumps(payload).encode() if raw is None else raw
        self.headers = headers or {}

    def read(self, size):
        return self.raw[:size]

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class FakeOpener:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.requests = []

    def open(self, request, timeout):
        self.requests.append((request, timeout))
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


class ReportValidationTests(unittest.TestCase):
    def setUp(self):
        self.entries = signals.catalog_entries(catalog())

    def test_valid_report_keeps_version_track_and_stable_identity(self):
        parsed = signals.parse_rating(issue(), self.entries)
        self.assertEqual((parsed['candidate_id'], parsed['track'], parsed['author_id'], parsed['score']),
                         ('synthetic-tool', 'synthetic-track', 100, 4))
        self.assertEqual(parsed['version'], 'synthetic-fixture-1')

    def test_rejects_malformed_headings_scores_and_missing_fields(self):
        body = issue()['body']
        malformed = [None, '', body.replace('### Rating', '### rating'),
                     body + '\n### Rating\n5', 'unapproved preamble\n' + body,
                     body.replace('### Rating\n\n4', '### Rating\n\n5.0'),
                     body.replace('### Rating\n\n4', '### Rating\n\n6'),
                     body.replace('### Rating\n\n4', '### Rating\n\ntrue'),
                     body.replace('synthetic-fixture-1', '_No response_'),
                     body.replace('synthetic-fixture-1', 'first\nsecond')]
        for value in malformed:
            with self.subTest(body=value):
                with self.assertRaises(ValueError):
                    signals.parse_body(value)

    def test_rejects_unknown_candidate_wrong_track_bots_closed_issues_and_prs(self):
        mutations = [lambda x: x.update(body=x['body'].replace('synthetic-tool', 'unknown-tool')),
                     lambda x: x.update(body=x['body'].replace('synthetic-track', 'another-track')),
                     lambda x: x['user'].update(type='Bot'), lambda x: x['user'].update(id=True),
                     lambda x: x.update(state='closed'), lambda x: x.update(pull_request={}),
                     lambda x: x.update(html_url='https://github.com/example/another/issues/1')]
        for mutate in mutations:
            report = issue()
            mutate(report)
            with self.subTest(report=report):
                with self.assertRaises(ValueError):
                    signals.parse_rating(report, self.entries)

    def test_raw_hash_detects_whitespace_edits(self):
        body = issue()['body']
        self.assertNotEqual(signals.body_hash(body), signals.body_hash(body + '\n'))
        self.assertEqual(signals.parse_body(body), signals.parse_body(body + '\n'))

    def test_catalog_rejects_bad_shapes_before_network_access(self):
        for value in ([], {'entries': [None]}, {'entries': [{'id': 'x', 'evaluation': None}]},
                      {'entries': [catalog()['entries'][0]] * 2}):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    signals.catalog_entries(value)


class ModerationTests(unittest.TestCase):
    def setUp(self):
        self.entries = signals.catalog_entries(catalog())
        self.previous = snapshot('ratings')
        self.previous['last_completed_at'] = OLD
        self.previous['ratings'] = [{'candidate_id': 'synthetic-tool', 'fixture': 'Retain this exact old evidence on failure.'}]
        self.previous['errors'] = [{'kind': 'synthetic_older_failure', 'at': OLD}]

    def collect(self, client, previous=None):
        with patch.object(signals, 'utc_now', return_value=NOW):
            return signals.refresh_ratings(self.entries, self.previous if previous is None else previous, client, AT)

    def assert_retained(self, result, summary):
        self.assertFalse(summary['complete'])
        self.assertEqual(result['ratings'], self.previous['ratings'])
        self.assertEqual(result['errors'][0], self.previous['errors'][0])
        self.assertEqual(result['last_attempted_at'], AT)
        self.assertEqual(result['last_completed_at'], OLD)
        self.assertEqual(self.previous['last_attempted_at'], None)

    def test_owner_approval_records_auditable_hash_and_comment(self):
        report = issue()
        client = QueueClient(rating_calls([report]))
        result, summary = self.collect(client)
        self.assertTrue(summary['complete'])
        row = result['ratings'][0]
        self.assertEqual(row['approval_body_sha256'], signals.body_hash(report['body']))
        self.assertEqual(row['approval_actor_id'], 900)
        self.assertEqual(row['approval_comment_url'], approval(report)['html_url'])
        self.assertFalse(client.calls)

    def test_success_advances_completion_time_without_rewriting_report_time(self):
        report = issue(updated_at=OLD)
        finished = NOW + dt.timedelta(minutes=5)
        with patch.object(signals, 'utc_now', return_value=finished):
            result, summary = signals.refresh_ratings(self.entries, self.previous,
                QueueClient(rating_calls([report])), AT)
        self.assertTrue(summary['complete'])
        self.assertEqual(result['last_attempted_at'], AT)
        self.assertEqual(result['last_completed_at'], '2026-10-27T20:05:00Z')
        self.assertEqual(result['ratings'][0]['updated_at'], OLD)
        self.assertEqual(self.previous['last_completed_at'], OLD)

    def test_failed_first_collection_has_no_completion_timestamp(self):
        client = QueueClient([('get_all', ISSUES_PATH, signals.ApiError('network_error', 'Synthetic first collection failure'))])
        result, summary = self.collect(client, previous=snapshot('ratings'))
        self.assertFalse(summary['complete'])
        self.assertEqual(result['last_attempted_at'], AT)
        self.assertIsNone(result['last_completed_at'])

    def test_edit_requires_new_approval_even_if_label_still_present(self):
        report = issue()
        old_approval = approval(report)
        report['body'] += '\nNew evidence after the original review.'
        result, summary = self.collect(QueueClient(rating_calls([report], {1: [old_approval]})))
        self.assertTrue(summary['complete'])
        self.assertEqual(result['ratings'], [])
        self.assertEqual(result['errors'][-1]['kind'], 'approval_required')

    def test_unrelated_comments_do_not_expire_exact_body_approval(self):
        report = issue(updated_at=AT)
        report['comments'] = 2
        comments = {1: [approval(report), {'body': 'Synthetic unrelated discussion.'}]}
        result, _ = self.collect(QueueClient(rating_calls([report], comments)))
        self.assertEqual(len(result['ratings']), 1)

    def test_public_forged_marker_and_bot_marker_cannot_approve(self):
        report = issue()
        forged = approval(report, actor_id=101, association='CONTRIBUTOR')
        bot = approval(report)
        bot['user']['type'] = 'Bot'
        result, summary = self.collect(QueueClient(rating_calls([report], {1: [forged, bot]})))
        self.assertTrue(summary['complete'])
        self.assertEqual(result['ratings'], [])

    def test_triage_role_needs_verified_identity_and_is_cached(self):
        user = {'id': 600, 'login': 'synthetic-triager', 'type': 'User'}
        endpoint = REPO_PATH + '/collaborators/synthetic-triager/permission'
        client = QueueClient([('get', endpoint, {'permission': 'read', 'role_name': 'triage', 'user': user})])
        reviewers = signals.Reviewers(client, repository(signals.REPOSITORY))
        self.assertTrue(reviewers.authorized(user))
        self.assertTrue(reviewers.authorized(user))
        self.assertEqual(len(client.seen), 1)

    def test_membership_read_only_and_custom_read_roles_do_not_approve(self):
        user = {'id': 600, 'login': 'synthetic-reader', 'type': 'User'}
        for role in ('read', 'synthetic-custom-reader'):
            client = QueueClient([('get', REPO_PATH + '/collaborators/synthetic-reader/permission',
                                   {'permission': 'read', 'role_name': role, 'user': user})])
            reviewers = signals.Reviewers(client, repository(signals.REPOSITORY))
            self.assertFalse(reviewers.authorized(user))

    def test_permission_identity_mismatch_or_fetch_failure_preserves_snapshot(self):
        report = issue()
        comment = approval(report, actor_id=600, association='MEMBER')
        permission_path = REPO_PATH + '/collaborators/synthetic-reviewer/permission'
        failures = [signals.ApiError('http_error', 'Synthetic permission failure', 403),
                    {'permission': 'write', 'role_name': 'write', 'user': {'id': 999}}]
        for failure in failures:
            calls = rating_calls([report], {1: [comment]})
            calls.insert(-1, ('get', permission_path, failure))
            result, summary = self.collect(QueueClient(calls))
            self.assert_retained(result, summary)

    def test_issue_comment_or_final_page_failure_retains_entire_snapshot(self):
        report = issue()
        for position in (0, 2, 3):
            calls = rating_calls([report])
            method, path, _ = calls[position]
            calls[position] = (method, path, signals.ApiError('network_error', 'Synthetic partial collection'))
            result, summary = self.collect(QueueClient(calls))
            self.assert_retained(result, summary)

    def test_changed_body_or_removed_label_during_collection_retains_snapshot(self):
        report = issue()
        for change in ('body', 'label', 'closure'):
            final = copy.deepcopy(report)
            if change == 'body':
                final['body'] += '\nEdited.'
            elif change == 'label':
                final['labels'] = []
            else:
                final['state'] = 'closed'
            result, summary = self.collect(QueueClient(rating_calls([report], final=[final])))
            self.assert_retained(result, summary)

    def test_newest_approved_report_uses_account_id_across_login_change(self):
        older, newer = issue(1, score='2'), issue(2, score='5', updated_at=AT)
        newer['user']['login'] = 'synthetic-renamed-account'
        result, summary = self.collect(QueueClient(rating_calls([newer, older])))
        self.assertTrue(summary['complete'])
        self.assertEqual(len(result['ratings']), 1)
        self.assertEqual(result['ratings'][0]['score'], 5)
        self.assertEqual(result['ratings'][0]['author_id'], older['user']['id'])

    def test_empty_complete_listing_withdraws_prior_ratings(self):
        result, summary = self.collect(QueueClient(rating_calls([])))
        self.assertTrue(summary['complete'])
        self.assertEqual(result['ratings'], [])
        self.assertEqual(result['last_completed_at'], AT)

    def test_missing_approval_label_cannot_be_published(self):
        report = issue()
        report['labels'] = []
        result, summary = self.collect(QueueClient([('get_all', ISSUES_PATH, [report])]))
        self.assert_retained(result, summary)

    def test_rejected_or_pr_rows_are_not_fetched_as_approvable_reports(self):
        malformed, pr = issue(1, score='0'), issue(2)
        pr['pull_request'] = {'url': 'https://api.github.com/synthetic'}
        reports = [malformed, pr]
        client = QueueClient([('get_all', ISSUES_PATH, reports), ('get_all', ISSUES_PATH, reports)])
        result, summary = self.collect(client)
        self.assertTrue(summary['complete'])
        self.assertEqual(summary['rejected'], 1)
        self.assertEqual(result['ratings'], [])

    def test_private_or_wrong_repository_cannot_authorize_reviewers(self):
        for mutate in (lambda x: x.update(private=True), lambda x: x.update(full_name='Example/Another')):
            data = repository(signals.REPOSITORY)
            mutate(data)
            with self.assertRaises(signals.ApiError):
                signals.Reviewers(QueueClient([]), data)


class RepositorySignalTests(unittest.TestCase):
    def setUp(self):
        self.entries = signals.catalog_entries(catalog())
        self.previous = snapshot('repositories')
        self.previous['repositories']['example/synthetic'] = signals.repository_observation(repository(), OLD)

    def test_success_has_real_zero_counts_and_unknown_license_without_imputation(self):
        payload = repository()
        payload.update(stargazers_count=0, forks_count=0, license={'spdx_id': 'NOASSERTION'})
        result, summary = signals.refresh_repositories(self.entries, self.previous,
            QueueClient([('get', '/repos/example/synthetic', payload)]), AT)
        observed = result['repositories']['example/synthetic']
        self.assertEqual((observed['stars'], observed['forks'], observed['license']), (0, 0, None))
        self.assertEqual(observed['observed_at'], AT)
        self.assertEqual(self.previous['repositories']['example/synthetic']['observed_at'], OLD)
        self.assertEqual(summary['updated'], 1)

    def test_failures_keep_prior_values_and_observation_date(self):
        for failure in (signals.ApiError('http_error', 'Synthetic missing repository', 404),
                        {**repository(), 'forks_count': None}, {**repository(), 'stargazers_count': True},
                        {**repository(), 'stargazers_count': -1}, {**repository(), 'private': True}):
            result, summary = signals.refresh_repositories(self.entries, self.previous,
                QueueClient([('get', '/repos/example/synthetic', failure)]), AT)
            self.assertEqual(result['repositories'], self.previous['repositories'])
            self.assertEqual(result['last_attempted_at'], AT)
            self.assertEqual(summary['new_errors'], 1)

    def test_missing_repository_failure_does_not_create_zero_observation(self):
        result, _ = signals.refresh_repositories(self.entries, snapshot('repositories'),
            QueueClient([('get', '/repos/example/synthetic', signals.ApiError('network_error', 'Synthetic failure'))]), AT)
        self.assertNotIn('example/synthetic', result['repositories'])

    def test_malformed_api_timestamp_is_not_copied_into_error_logs(self):
        payload = repository()
        payload['pushed_at'] = 'SYNTHETIC_SECRET'
        result, summary = signals.refresh_repositories(self.entries, self.previous,
            QueueClient([('get', '/repos/example/synthetic', payload)]), AT)
        self.assertEqual(summary['new_errors'], 1)
        self.assertNotIn('SYNTHETIC_SECRET', json.dumps(result))
        self.assertEqual(result['repositories'], self.previous['repositories'])

    def test_bound_prioritizes_missing_then_oldest_and_deduplicates_case(self):
        rows = catalog()['entries']
        rows.extend([{'id': 'another-tool', 'repo': 'example/synthetic', 'evaluation': {'track': 'synthetic-track'}},
                     {'id': 'missing-tool', 'repo': 'Example/Missing', 'evaluation': {'track': 'synthetic-track'}}])
        client = QueueClient([('get', '/repos/example/missing', repository('Example/Missing'))])
        result, summary = signals.refresh_repositories(signals.catalog_entries({'entries': rows}), self.previous, client, AT, max_repos=1)
        self.assertEqual(summary['total'], 2)
        self.assertEqual(summary['selected'], 1)
        self.assertEqual(result['repositories']['example/synthetic']['observed_at'], OLD)


class GitHubBoundaryTests(unittest.TestCase):
    def test_get_only_token_header_and_no_credential_url(self):
        opener = FakeOpener(FakeResponse({'synthetic': True}))
        client = signals.GitHubClient(token='SYNTHETIC_SECRET', opener=opener, clock=lambda: NOW)
        data, _ = client.get('/repos/Example/Synthetic')
        self.assertTrue(data['synthetic'])
        request, timeout = opener.requests[0]
        self.assertEqual(request.get_method(), 'GET')
        self.assertEqual(request.get_header('Authorization'), 'Bearer SYNTHETIC_SECRET')
        self.assertNotIn('SYNTHETIC_SECRET', request.full_url)
        self.assertEqual(timeout, 20)

    def test_forbids_cross_host_http_credentials_and_bad_ports(self):
        for url in ('https://evil.example/path', 'http://api.github.com/path',
                    'https://token@api.github.com/path', 'https://api.github.com:bad/path',
                    'https://api.github.com/path#fragment', 'https://api.github.com/\npath'):
            with self.subTest(url=url):
                with self.assertRaises(signals.ApiError):
                    signals.api_url(url)
        request = urllib.request.Request('https://api.github.com/old', headers={'Authorization': 'SYNTHETIC_SECRET'})
        with self.assertRaises(signals.ApiError):
            signals.GitHubRedirect().redirect_request(request, None, 301, '', {}, 'https://evil.example/new')

    def test_rate_limit_stops_without_retries_and_preserves_retry_after(self):
        failure = urllib.error.HTTPError('https://api.github.com/repos/x/y', 429, 'SYNTHETIC_SECRET',
                                         {'Retry-After': '120'}, io.BytesIO(b'SYNTHETIC_SECRET'))
        opener = FakeOpener(failure)
        client = signals.GitHubClient(token='SYNTHETIC_SECRET', opener=opener, clock=lambda: NOW)
        with self.assertRaises(signals.ApiError) as caught:
            client.get('/repos/Example/Synthetic')
        self.assertEqual(caught.exception.retry_at, '2026-10-27T20:02:00Z')
        self.assertNotIn('SYNTHETIC_SECRET', str(caught.exception))
        with self.assertRaises(signals.ApiError):
            client.get('/repos/Example/Another')
        self.assertEqual(len(opener.requests), 1)

    def test_final_available_request_can_succeed_before_reset_blocks_next(self):
        reset = str(int((NOW + dt.timedelta(minutes=5)).timestamp()))
        opener = FakeOpener(FakeResponse({'ok': True}, {'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': reset}))
        client = signals.GitHubClient(opener=opener, clock=lambda: NOW)
        self.assertTrue(client.get('/repos/Example/Synthetic')[0]['ok'])
        with self.assertRaises(signals.ApiError) as caught:
            client.get('/repos/Example/Another')
        self.assertEqual(caught.exception.retry_at, '2026-10-27T20:05:00Z')

    def test_network_error_does_not_expose_underlying_secrets(self):
        opener = FakeOpener(urllib.error.URLError('SYNTHETIC_SECRET'))
        client = signals.GitHubClient(opener=opener, clock=lambda: NOW)
        with self.assertRaises(signals.ApiError) as caught:
            client.get('/repos/Example/Synthetic')
        self.assertNotIn('SYNTHETIC_SECRET', str(caught.exception))

    def test_complete_pagination_and_partial_failure(self):
        path = '/repos/Example/Synthetic/issues?state=open&per_page=100'
        next_link = signals.API + path + '&page=2'
        first = FakeResponse([{'id': 1}], {'Link': f'<{next_link}>; rel="next"'})
        client = signals.GitHubClient(opener=FakeOpener(first, FakeResponse([{'id': 2}])), clock=lambda: NOW)
        self.assertEqual(client.get_all(path), [{'id': 1}, {'id': 2}])
        client = signals.GitHubClient(opener=FakeOpener(first, urllib.error.URLError('Synthetic failure')), clock=lambda: NOW)
        with self.assertRaises(signals.ApiError):
            client.get_all(path)

    def test_pagination_rejects_changed_filter_endpoint_host_or_page_and_limit(self):
        path = '/repos/Example/Synthetic/issues?state=open&per_page=100'
        bad_links = [signals.API + path.replace('state=open', 'state=closed') + '&page=2',
                     signals.API + path.replace('/issues?', '/comments?') + '&page=2',
                     'https://evil.example' + path + '&page=2', signals.API + path + '&page=3']
        for next_link in bad_links:
            opener = FakeOpener(FakeResponse([], {'Link': f'<{next_link}>; rel="next"'}))
            with self.assertRaises(signals.ApiError):
                signals.GitHubClient(opener=opener, clock=lambda: NOW).get_all(path)
            self.assertEqual(len(opener.requests), 1)
        opener = FakeOpener(FakeResponse([], {'Link': f'<{signals.API + path}&page=2>; rel="next"'}))
        with self.assertRaises(signals.ApiError) as caught:
            signals.GitHubClient(opener=opener, max_pages=1, clock=lambda: NOW).get_all(path)
        self.assertEqual(caught.exception.kind, 'pagination_limit')

    def test_invalid_json_and_oversized_response_do_not_return_partial_content(self):
        for raw in (b'SYNTHETIC_SECRET', b'x' * (signals.MAX_BYTES + 1)):
            client = signals.GitHubClient(opener=FakeOpener(FakeResponse(raw=raw)), clock=lambda: NOW)
            with self.assertRaises(signals.ApiError) as caught:
                client.get('/repos/Example/Synthetic')
            self.assertNotIn('SYNTHETIC_SECRET', str(caught.exception))


class LocalOutputTests(unittest.TestCase):
    def test_new_community_snapshot_has_no_successful_collection(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'research-community.json'
            result = signals.load_snapshot(path, 'ratings')
            self.assertIsNone(result['last_attempted_at'])
            self.assertIsNone(result['last_completed_at'])
            self.assertFalse(path.exists())

    def test_atomic_write_failure_preserves_previous_file_and_removes_temporary(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'snapshot.json'
            path.write_text('{"previous":true}\n', encoding='utf-8')
            with self.assertRaises(ValueError):
                signals.atomic_write(path, {'invalid': float('nan')})
            self.assertEqual(path.read_text(), '{"previous":true}\n')
            self.assertEqual(list(Path(directory).iterdir()), [path])

    def test_approval_helper_prints_marker_without_writing_snapshots(self):
        report = issue(number=2001)
        client = QueueClient([('get', REPO_PATH, repository(signals.REPOSITORY)),
                              ('get', REPO_PATH + '/issues/2001', report)])
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'data').mkdir()
            (root / 'data/research-catalog.json').write_text(json.dumps(catalog()))
            output = io.StringIO()
            with patch.object(signals, 'GitHubClient', return_value=client), contextlib.redirect_stdout(output):
                code = signals.main(['--root', directory, '--approval-hash', '2001'])
            self.assertEqual(code, 0)
            self.assertIn(report['html_url'], output.getvalue())
            self.assertIn('atlas-rating-approved: sha256=' + signals.body_hash(report['body']), output.getvalue())
            self.assertEqual([p.name for p in (root / 'data').iterdir()], ['research-catalog.json'])

    def test_malformed_existing_schema_is_refused(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'snapshot.json'
            path.write_text('{"schema_version":true,"repositories":{},"errors":[]}')
            with self.assertRaises(ValueError):
                signals.load_snapshot(path, 'repositories')


if __name__ == '__main__':
    unittest.main()
