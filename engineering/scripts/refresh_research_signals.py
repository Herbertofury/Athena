#!/usr/bin/env python3
"""Manually refresh public GitHub signals. Every HTTP request is GET-only.

Popularity is a dated observation, not quality. Community reports need both a
maintainer label and approval of the exact issue-body hash. This module does not
publish, label, comment, schedule work, or execute content retrieved from GitHub.
"""
from __future__ import annotations

import argparse
import copy
import datetime as dt
import hashlib
import json
import os
import re
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPOSITORY = 'Herbertofury/Engineering-Atlas'
API = 'https://api.github.com'
API_VERSION = '2026-03-10'
APPROVAL_LABEL = 'research-rating-approved'
APPROVAL = re.compile(r'atlas-rating-approved: sha256=([a-f0-9]{64})\Z')
HEADINGS = ('Candidate ID', 'Evaluation track', 'Rating', 'Version used', 'Experience and evidence')
ID = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*\Z')
REPO = re.compile(r'[A-Za-z0-9][A-Za-z0-9-]{0,38}/[A-Za-z0-9_.-]{1,100}\Z')
LOGIN = re.compile(r'[A-Za-z0-9][A-Za-z0-9-]{0,38}\Z')
MAX_BYTES = 5 * 1024 * 1024


def utc_now():
    return dt.datetime.now(dt.timezone.utc)


def iso(value):
    return value.astimezone(dt.timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')


def timestamp(value):
    if not isinstance(value, str):
        raise ValueError('Missing timestamp')
    try:
        parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        raise ValueError('Timestamp is not valid ISO 8601') from None
    if parsed.tzinfo is None:
        raise ValueError('Timestamp needs an explicit timezone')
    try:
        return parsed.astimezone(dt.timezone.utc)
    except OverflowError:
        raise ValueError('Timestamp is outside the supported UTC range') from None


def positive_integer(value):
    return type(value) is int and value > 0


def valid_repo(value):
    return isinstance(value, str) and REPO.fullmatch(value) and value.split('/')[1] not in {'.', '..'}


class ApiError(Exception):
    """A sanitized error: never include response bodies, headers, or credentials."""

    def __init__(self, kind, message, status=None, retry_at=None):
        super().__init__(message)
        self.kind, self.status, self.retry_at = kind, status, retry_at


def api_url(value):
    if not isinstance(value, str) or any(ord(c) < 32 for c in value):
        raise ApiError('invalid_url', 'Invalid GitHub API URL')
    url = API + value if value.startswith('/') else value
    try:
        parsed = urllib.parse.urlsplit(url)
        invalid = (parsed.scheme != 'https' or parsed.hostname != 'api.github.com'
                   or parsed.port not in {None, 443} or parsed.username or parsed.password or parsed.fragment)
    except ValueError:
        raise ApiError('invalid_url', 'Invalid GitHub API URL') from None
    if invalid:
        raise ApiError('invalid_url', 'Only credential-free HTTPS GitHub API URLs are allowed')
    return url


class GitHubRedirect(urllib.request.HTTPRedirectHandler):
    max_redirections = 3
    max_repeats = 2

    def redirect_request(self, request, response, code, message, headers, newurl):
        # Authorization is never forwarded to another host or to HTTP.
        api_url(newurl)
        return super().redirect_request(request, response, code, message, headers, newurl)


def retry_time(headers, now):
    retry = headers.get('retry-after')
    if retry is not None:
        try:
            return now + dt.timedelta(seconds=max(0, int(retry)))
        except (ValueError, OverflowError):
            try:
                parsed = parsedate_to_datetime(retry)
                if parsed.tzinfo is not None:
                    return max(now, parsed.astimezone(dt.timezone.utc))
            except (ValueError, TypeError, OverflowError):
                pass
    if headers.get('x-ratelimit-remaining') == '0':
        try:
            return max(now, dt.datetime.fromtimestamp(int(headers['x-ratelimit-reset']), dt.timezone.utc))
        except (KeyError, ValueError, OverflowError, OSError):
            pass
    return now + dt.timedelta(seconds=60)


class GitHubClient:
    def __init__(self, token=None, timeout=20, max_pages=100, opener=None, clock=utc_now):
        self._token = token
        self.timeout, self.max_pages, self.clock = timeout, max_pages, clock
        self.opener = opener or urllib.request.build_opener(GitHubRedirect())
        self.blocked_until = None

    def get(self, path):
        now = self.clock()
        if self.blocked_until is not None:
            raise ApiError('rate_limit', 'Requests stopped for this refresh after an API limit or access error', retry_at=iso(self.blocked_until))
        headers = {'Accept': 'application/vnd.github.raw+json', 'User-Agent': 'Engineering-Atlas-Research/1',
                   'X-GitHub-Api-Version': API_VERSION}
        if self._token:
            headers['Authorization'] = 'Bearer ' + self._token
        request = urllib.request.Request(api_url(path), headers=headers, method='GET')
        try:
            with self.opener.open(request, timeout=self.timeout) as response:
                response_headers = {k.lower(): v for k, v in response.headers.items()}
                raw = response.read(MAX_BYTES + 1)
        except urllib.error.HTTPError as exc:
            response_headers = {k.lower(): v for k, v in exc.headers.items()} if exc.headers else {}
            if exc.code in {403, 429}:
                self.blocked_until = retry_time(response_headers, now)
                raise ApiError('rate_limit_or_forbidden', 'GitHub denied the request or rate-limited this refresh; no further requests will be made', exc.code, iso(self.blocked_until)) from None
            if exc.code == 401:
                self.blocked_until = now + dt.timedelta(seconds=60)
            raise ApiError('http_error', 'GitHub request failed with HTTP ' + str(exc.code), exc.code) from None
        except (urllib.error.URLError, TimeoutError, OSError):
            raise ApiError('network_error', 'GitHub request could not complete; previous evidence is retained') from None
        if response_headers.get('x-ratelimit-remaining') == '0':
            self.blocked_until = retry_time(response_headers, now)
        if len(raw) > MAX_BYTES:
            raise ApiError('response_too_large', 'GitHub response exceeded the bounded response size')
        try:
            result = json.loads(raw.decode('utf-8'))
        except (UnicodeDecodeError, ValueError):
            raise ApiError('invalid_response', 'GitHub returned invalid JSON') from None
        return result, response_headers

    def get_all(self, path):
        """Follow every next link, or raise without returning a partial list."""
        initial = urllib.parse.urlsplit(api_url(path))
        initial_query = urllib.parse.parse_qs(initial.query)
        rows, seen = [], set()
        url = api_url(path)
        page_number = int(initial_query.get('page', ['1'])[0])
        for _ in range(self.max_pages):
            if url in seen:
                raise ApiError('pagination_error', 'Repeated pagination link')
            seen.add(url)
            result, headers = self.get(url)
            if not isinstance(result, list):
                raise ApiError('invalid_response', 'Paginated GitHub response must be a list')
            rows.extend(result)
            link = headers.get('link', '')
            links = re.findall(r'<([^>]+)>\s*;\s*rel="([^"]+)"', link)
            next_urls = [href for href, relation in links if relation == 'next']
            if not next_urls:
                if 'rel="next"' in link:
                    raise ApiError('pagination_error', 'Unrecognized next-page link')
                return rows
            if len(next_urls) != 1:
                raise ApiError('pagination_error', 'Ambiguous next-page link')
            next_url = api_url(next_urls[0])
            parsed = urllib.parse.urlsplit(next_url)
            query = urllib.parse.parse_qs(parsed.query)
            expected = {k: v for k, v in initial_query.items() if k != 'page'}
            actual = {k: v for k, v in query.items() if k != 'page'}
            if parsed.path != initial.path or actual != expected or query.get('page') != [str(page_number + 1)]:
                raise ApiError('pagination_error', 'Pagination changed its endpoint, filters, or page order')
            page_number += 1
            url = next_url
        raise ApiError('pagination_limit', 'Page limit reached; a partial collection will not replace the previous snapshot')


def error_record(exc, subject, now):
    row = {'kind': exc.kind, 'subject': subject, 'at': now, 'message': str(exc)}
    if exc.status is not None:
        row['http_status'] = exc.status
    if exc.retry_at is not None:
        row['retry_at'] = exc.retry_at
    return row


def catalog_entries(catalog):
    rows = catalog.get('entries') if isinstance(catalog, dict) else None
    if not isinstance(rows, list):
        raise ValueError('Catalog entries must be a list')
    result = {}
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get('evaluation'), dict):
            raise ValueError('Catalog candidate must have an evaluation object')
        ident = row.get('id')
        track = row.get('evaluation', {}).get('track')
        if not isinstance(ident, str) or not ID.fullmatch(ident) or ident in result:
            raise ValueError('Catalog has an invalid or duplicate candidate ID')
        if not isinstance(track, str) or not track.strip():
            raise ValueError('Catalog candidate needs an evaluation track')
        if row.get('repo') is not None and not valid_repo(row['repo']):
            raise ValueError('Catalog has an invalid GitHub repository name')
        result[ident] = row
    return result


def repository_observation(payload, observed_at):
    if not isinstance(payload, dict) or payload.get('private') is not False:
        raise ValueError('Only confirmed public repository metadata can be recorded')
    full_name = payload.get('full_name')
    if not valid_repo(full_name) or payload.get('html_url') != 'https://github.com/' + full_name:
        raise ValueError('Repository identity or canonical URL is invalid')
    for field in ('stargazers_count', 'forks_count'):
        if type(payload.get(field)) is not int or payload[field] < 0:
            raise ValueError('Repository popularity count is missing or invalid')
    if type(payload.get('archived')) is not bool:
        raise ValueError('Repository archive state is missing')
    pushed = payload.get('pushed_at')
    if pushed is not None:
        pushed = iso(timestamp(pushed))
    license_data = payload.get('license')
    license_id = None
    if license_data is not None:
        if not isinstance(license_data, dict):
            raise ValueError('Repository license metadata is invalid')
        license_id = license_data.get('spdx_id')
        if license_id == 'NOASSERTION':
            license_id = None
        elif not isinstance(license_id, str) or not license_id.strip():
            raise ValueError('Repository license identifier is invalid')
    return {'stars': payload['stargazers_count'], 'forks': payload['forks_count'], 'archived': payload['archived'],
            'license': license_id, 'pushed_at': pushed, 'url': payload['html_url'], 'observed_at': observed_at}


def refresh_repositories(entries, previous, client, observed_at, max_repos=50):
    result = copy.deepcopy(previous)
    result['last_attempted_at'] = observed_at
    wanted = {row['repo'].lower() for row in entries.values() if row.get('repo')}
    result['repositories'] = {key: value for key, value in result['repositories'].items() if key in wanted}
    # Missing and oldest observations go first, so bounded runs eventually cover all entries.
    ordered = sorted(wanted, key=lambda key: (result['repositories'].get(key, {}).get('observed_at', ''), key))
    updated, new_errors = 0, 0
    for name in ordered[:max_repos]:
        try:
            payload, _ = client.get('/repos/' + name)
            result['repositories'][name] = repository_observation(payload, observed_at)
            updated += 1
        except ValueError as exc:
            failure = ApiError('invalid_repository_data', str(exc))
            result['errors'].append(error_record(failure, name, observed_at))
            new_errors += 1
        except ApiError as exc:
            result['errors'].append(error_record(exc, name, observed_at))
            new_errors += 1
            if client.blocked_until is not None:
                break
    return result, {'updated': updated, 'selected': min(max_repos, len(ordered)), 'total': len(wanted), 'new_errors': new_errors}


def body_hash(body):
    if not isinstance(body, str):
        raise ValueError('Issue body must be text')
    return hashlib.sha256(body.encode('utf-8')).hexdigest()


def parse_body(body):
    if not isinstance(body, str) or len(body) > 16000:
        raise ValueError('Rating body is missing or too long')
    matches = list(re.finditer(r'^### ([^\r\n]+)\r?$', body, re.MULTILINE))
    if tuple(m.group(1) for m in matches) != HEADINGS or body[:matches[0].start()].strip():
        raise ValueError('Rating must contain each exact form heading once, in form order')
    values = {}
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(body)
        value = body[match.end():end].strip()
        if not value or value == '_No response_':
            raise ValueError('Every rating field is required')
        values[HEADINGS[index]] = value
    if not ID.fullmatch(values['Candidate ID']):
        raise ValueError('Candidate ID must be an exact catalog ID')
    if not re.fullmatch(r'[1-5]', values['Rating']):
        raise ValueError('Rating must be one integer from 1 to 5')
    if any('\n' in values[key] or '\r' in values[key] for key in HEADINGS[:4]):
        raise ValueError('Only experience and evidence may contain multiple lines')
    if len(values['Version used']) > 300 or len(values['Experience and evidence']) > 12000:
        raise ValueError('Rating field exceeds its length limit')
    return values


def human_user(user):
    return (isinstance(user, dict) and user.get('type') == 'User' and positive_integer(user.get('id'))
            and isinstance(user.get('login'), str) and LOGIN.fullmatch(user['login']) is not None)


def parse_rating(issue, entries):
    if not isinstance(issue, dict) or 'pull_request' in issue or issue.get('state') != 'open':
        raise ValueError('Only open issues can supply ratings')
    number = issue.get('number')
    if not positive_integer(number) or issue.get('html_url') != f'https://github.com/{REPOSITORY}/issues/{number}':
        raise ValueError('Rating issue does not belong to this repository')
    if not human_user(issue.get('user')):
        raise ValueError('Ratings require a human GitHub account with a stable numeric ID')
    values = parse_body(issue.get('body'))
    candidate = entries.get(values['Candidate ID'])
    if candidate is None or values['Evaluation track'] != candidate['evaluation']['track']:
        raise ValueError('Candidate or evaluation track does not match the catalog')
    return {'candidate_id': candidate['id'], 'track': values['Evaluation track'], 'score': int(values['Rating']),
            'author_id': issue['user']['id'], 'author': issue['user']['login'],
            'experience': values['Experience and evidence'], 'version': values['Version used'],
            'issue_url': issue['html_url'], 'updated_at': iso(timestamp(issue.get('updated_at'))), 'review_state': 'approved'}


def labels(issue):
    result = issue.get('labels')
    if not isinstance(result, list) or any(not isinstance(x, dict) or not isinstance(x.get('name'), str) for x in result):
        raise ApiError('invalid_response', 'Issue label metadata is missing or malformed')
    return {x['name'] for x in result}


class Reviewers:
    def __init__(self, client, repository_data):
        if not isinstance(repository_data, dict) or repository_data.get('private') is not False:
            raise ApiError('invalid_response', 'Rating repository must be confirmed public')
        if str(repository_data.get('full_name', '')).lower() != REPOSITORY.lower():
            raise ApiError('invalid_response', 'Rating repository identity does not match this project')
        owner = repository_data.get('owner')
        if (not isinstance(owner, dict) or not positive_integer(owner.get('id'))
                or owner.get('type') not in ('User', 'Organization')):
            raise ApiError('invalid_response', 'Rating repository owner identity is missing')
        self.owner_id = owner['id'] if owner.get('type') == 'User' else None
        self.client, self.cache = client, {}

    def authorized(self, user):
        if not human_user(user):
            return False
        if user['id'] == self.owner_id:
            return True
        key = (user['id'], user['login'].lower())
        if key not in self.cache:
            data, _ = self.client.get(f'/repos/{REPOSITORY}/collaborators/{user["login"]}/permission')
            if (not isinstance(data, dict) or not isinstance(data.get('user'), dict)
                    or not positive_integer(data['user'].get('id')) or data['user']['id'] != user['id']):
                raise ApiError('invalid_response', 'Reviewer permission response has a mismatched identity')
            if (not isinstance(data.get('permission'), str) or data['permission'] not in {'admin', 'write', 'read', 'none'}
                    or not isinstance(data.get('role_name'), str) or not data['role_name']):
                raise ApiError('invalid_response', 'Reviewer permission response is malformed')
            self.cache[key] = (data.get('permission') in {'admin', 'write'} or
                               data.get('role_name') in {'triage', 'triage_plus', 'write', 'maintain', 'admin'})
        return self.cache[key]


def approved_comment(issue, comments, reviewers):
    digest = body_hash(issue['body'])
    approved = []
    for comment in comments:
        if not isinstance(comment, dict):
            raise ApiError('invalid_response', 'Malformed issue comment response')
        body = comment.get('body')
        marker = APPROVAL.fullmatch(body.strip()) if isinstance(body, str) else None
        if not marker or marker.group(1) != digest:
            continue
        user = comment.get('user')
        # Unrelated public users cannot force privileged permission lookups.
        if comment.get('author_association') not in ('OWNER', 'MEMBER', 'COLLABORATOR') or not human_user(user):
            continue
        if not reviewers.authorized(user):
            continue
        number = comment.get('id')
        expected = f'https://github.com/{REPOSITORY}/issues/{issue["number"]}#issuecomment-{number}'
        if not positive_integer(number) or comment.get('html_url') != expected:
            raise ApiError('invalid_response', 'Approval comment identity is invalid')
        try:
            updated = timestamp(comment.get('updated_at'))
        except ValueError:
            raise ApiError('invalid_response', 'Approval comment timestamp is invalid') from None
        approved.append((updated, number, comment))
    return max(approved, key=lambda row: (row[0], row[1]))[2] if approved else None


def issue_fingerprint(issues):
    fingerprint, seen = [], set()
    for issue in issues:
        if not isinstance(issue, dict) or not positive_integer(issue.get('number')):
            raise ApiError('invalid_response', 'Issue listing contains malformed identities')
        if issue['number'] in seen:
            raise ApiError('pagination_error', 'Issue listing contains a repeated issue')
        seen.add(issue['number'])
        fingerprint.append((issue['number'], issue.get('updated_at'), issue.get('state'),
                            json.dumps(issue.get('user'), sort_keys=True),
                            json.dumps(issue.get('labels'), sort_keys=True), issue.get('body'), issue.get('comments')))
    return sorted(fingerprint, key=lambda row: row[0])


def refresh_ratings(entries, previous, client, observed_at):
    result = copy.deepcopy(previous)
    result['last_attempted_at'] = observed_at
    result.setdefault('last_completed_at', None)
    query = urllib.parse.urlencode({'state': 'open', 'labels': APPROVAL_LABEL, 'sort': 'created', 'direction': 'asc', 'per_page': 100})
    endpoint = f'/repos/{REPOSITORY}/issues?{query}'
    rejected, candidates = [], []
    try:
        issues = client.get_all(endpoint)
        initial = issue_fingerprint(issues)
        reviewers = None
        for issue in issues:
            if 'pull_request' in issue:
                continue
            subject = 'issue:' + str(issue['number'])
            if APPROVAL_LABEL not in labels(issue):
                raise ApiError('snapshot_changed', 'Approval label changed during the refresh')
            try:
                row = parse_rating(issue, entries)
            except ValueError as exc:
                rejected.append(error_record(ApiError('rating_rejected', str(exc)), subject, observed_at))
                continue
            if reviewers is None:
                repository_data, _ = client.get('/repos/' + REPOSITORY)
                reviewers = Reviewers(client, repository_data)
            comments = client.get_all(f'/repos/{REPOSITORY}/issues/{issue["number"]}/comments?per_page=100')
            approval = approved_comment(issue, comments, reviewers)
            if approval is None:
                rejected.append(error_record(ApiError('approval_required', 'No authorized approval matches the current issue body'), subject, observed_at))
                continue
            row.update({'approval_body_sha256': body_hash(issue['body']), 'approval_actor_id': approval['user']['id'],
                        'approval_actor': approval['user']['login'], 'approval_comment_url': approval['html_url']})
            candidates.append((row, issue['number']))
        # Catch edits, new approvals, removal, closure, or unstable pagination before replacement.
        if initial != issue_fingerprint(client.get_all(endpoint)):
            raise ApiError('snapshot_changed', 'Rating issues changed while being read; previous snapshot is retained')
    except ApiError as exc:
        result['errors'].append(error_record(exc, 'community_snapshot', observed_at))
        return result, {'complete': False, 'ratings': len(previous['ratings']), 'rejected': 0, 'new_errors': 1}
    newest = {}
    for row, number in candidates:
        key = (row['author_id'], row['candidate_id'], row['track'])
        current = newest.get(key)
        if current is None or (timestamp(row['updated_at']), number) > (timestamp(current[0]['updated_at']), current[1]):
            newest[key] = (row, number)
    result['ratings'] = [newest[key][0] for key in sorted(newest)]
    result['errors'].extend(rejected)
    result['last_completed_at'] = iso(utc_now())
    return result, {'complete': True, 'ratings': len(result['ratings']), 'rejected': len(rejected), 'new_errors': 0}


def load_snapshot(path, collection):
    if not path.exists():
        data = {'schema_version': 1, collection: {} if collection == 'repositories' else [], 'errors': [], 'last_attempted_at': None}
        if collection == 'ratings':
            data['last_completed_at'] = None
        return data
    data = json.loads(path.read_text(encoding='utf-8'))
    expected = dict if collection == 'repositories' else list
    if (not isinstance(data, dict) or type(data.get('schema_version')) is not int or data['schema_version'] != 1
            or not isinstance(data.get(collection), expected) or not isinstance(data.get('errors'), list)):
        raise ValueError('Existing signal snapshot has an invalid schema; refusing to overwrite it')
    return data


def atomic_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=path.parent, prefix='.' + path.name + '.', delete=False) as handle:
            temporary = Path(handle.name)
            json.dump(data, handle, indent=2, ensure_ascii=False, allow_nan=False)
            handle.write('\n')
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()


def bounded_int(value):
    number = int(value)
    if not 1 <= number <= 1000:
        raise argparse.ArgumentTypeError('Use an integer from 1 to 1000')
    return number


def issue_number(value):
    number = int(value)
    if not 1 <= number <= 2**53 - 1:
        raise argparse.ArgumentTypeError('Use a positive GitHub issue number')
    return number


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--only', choices=('ratings', 'repositories', 'all'), default='all')
    parser.add_argument('--max-repos', type=bounded_int, default=50, help='Refresh at most this many missing/oldest repositories (default: 50)')
    parser.add_argument('--max-pages', type=bounded_int, default=100, help='Fail closed if a paginated collection exceeds this bound')
    parser.add_argument('--approval-hash', type=issue_number, metavar='ISSUE', help='Print an approval marker for the current body; never post it')
    args = parser.parse_args(argv)
    try:
        entries = catalog_entries(json.loads((args.root / 'data/research-catalog.json').read_text(encoding='utf-8')))
        client = GitHubClient(token=os.environ.get('GITHUB_TOKEN'), max_pages=args.max_pages)
        observed_at = iso(utc_now())
        if args.approval_hash:
            repository_data, _ = client.get('/repos/' + REPOSITORY)
            Reviewers(client, repository_data)  # Confirm the repository is public.
            issue, _ = client.get(f'/repos/{REPOSITORY}/issues/{args.approval_hash}')
            parse_rating(issue, entries)
            print(issue['html_url'])
            print('atlas-rating-approved: sha256=' + body_hash(issue['body']))
            return 0
        summary = {}
        if args.only in {'repositories', 'all'}:
            path = args.root / 'data/research-signals.json'
            data, summary['repositories'] = refresh_repositories(entries, load_snapshot(path, 'repositories'), client, observed_at, args.max_repos)
            atomic_write(path, data)
        if args.only in {'ratings', 'all'}:
            path = args.root / 'data/research-community.json'
            data, summary['community'] = refresh_ratings(entries, load_snapshot(path, 'ratings'), client, observed_at)
            atomic_write(path, data)
        print(json.dumps(summary, indent=2))
        return int(any(row['new_errors'] for row in summary.values()))
    except (ApiError, ValueError, OSError):
        # Avoid printing raw exception text from parsers, paths, or network libraries.
        print('Refresh could not complete. Check the local catalog/snapshot schema, file access, and GitHub read access. No credentials are printed.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
