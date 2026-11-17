"""Validate the evidence ledger without turning source checks into test results."""
import json
from pathlib import Path
from urllib.parse import urlsplit

root = Path(__file__).resolve().parent
ledger = json.loads((root / 'source-checks.json').read_text())
assert ledger['schema_version'] == 1
checks = ledger['checks']
assert len(checks) == 6
assert len({c['id'] for c in checks}) == len(checks)
allowed = {'learn.microsoft.com', 'veracrypt.io', 'docs.clamav.net', 'keepassxc.org'}
for claim in checks:
    url = urlsplit(claim['source_url'])
    assert url.scheme == 'https' and url.hostname in allowed
    assert not url.username and not url.password
    assert claim['claim'] and claim['evidence_method']
    assert claim['verification_status'].startswith('source-supported')
    assert claim['execution_tested'] is False
assert ledger['portability_contract']['test_status'] == 'not-run'
assert len(ledger['unknowns']) >= 4
assert {'configuration', 'application_state', 'cache', 'logs', 'temporary_files'} <= set(ledger['portability_contract']['distinct_fields'])
for path in root.iterdir():
    if path.suffix in {'.md', '.json'}:
        text = path.read_text()
        assert 'chatgpt.com/c/' not in text
        assert 'Sentinel_' not in text
print('PASS: six sourced claim groups, explicit unknowns, no claimed execution tests, no private conversation links')
