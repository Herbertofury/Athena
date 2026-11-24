"""Original bounded offline teaching models. No provider APIs or network access.
These are not implementations of vendor IAM, autoscaling, billing or deployment.
"""
import hashlib
from pathlib import Path
import re
import tempfile


def integer(name, value, low=0, high=1000000):
    if type(value) is not int or not low <= value <= high:
        raise ValueError(f'{name} must be an exact integer from {low} to {high}')
    return value


def segments(path):
    if not isinstance(path, str) or not 1 <= len(path) <= 200:
        raise ValueError('scope path must be 1–200 characters')
    values = path.split('/')
    if len(values) > 8 or any(re.fullmatch(r'[a-z][a-z0-9-]{0,31}', x) is None for x in values):
        raise ValueError('scope needs 1–8 lowercase identifier segments, no empty or dot segments')
    return tuple(values)


def scope_contains(scope, resource):
    """Only segment containment in an invented hierarchy; not effective IAM access."""
    parent, child = segments(scope), segments(resource)
    return len(parent) <= len(child) and child[:len(parent)] == parent


def connection_checks(route_present, network_allows, service_listening, identity_allows):
    """Four assumed gates; no packets are sent and no policy is evaluated."""
    checks = dict(route_present=route_present, network_allows=network_allows,
                  service_listening=service_listening, identity_allows=identity_allows)
    if any(type(v) is not bool for v in checks.values()):
        raise ValueError('all gates must be explicit booleans')
    return dict(assumed_checks=checks, all_assumed_gates_pass=all(checks.values()),
                failed_assumptions=[key for key, value in checks.items() if not value])


def replica_plan(demand_rpm, capacity_rpm, target_percent, minimum, maximum):
    """Ideal instantaneous identical replicas. No startup time, queues or provider quotas."""
    integer('demand_rpm', demand_rpm)
    integer('capacity_rpm', capacity_rpm, 1)
    integer('target_percent', target_percent, 1, 100)
    integer('minimum', minimum, 0, 1000)
    integer('maximum', maximum, 0, 1000)
    if minimum > maximum:
        raise ValueError('minimum cannot exceed maximum')
    denominator = capacity_rpm * target_percent
    needed = (demand_rpm * 100 + denominator - 1) // denominator
    planned = min(maximum, max(minimum, needed))
    return dict(needed_at_target=needed, planned_replicas=planned,
                target_capacity_rpm=planned * capacity_rpm * target_percent / 100,
                physical_capacity_rpm=planned * capacity_rpm,
                target_met=demand_rpm * 100 <= planned * capacity_rpm * target_percent,
                physical_capacity_met=demand_rpm <= planned * capacity_rpm,
                capped_by_maximum=needed > maximum)


def failure_report(placements, failed_zones, demand_rpm, capacity_rpm, target_percent):
    if not isinstance(placements, list) or not 1 <= len(placements) <= 1000:
        raise ValueError('placements must contain 1–1000 zone identifiers')
    if any(not isinstance(z, str) or re.fullmatch(r'zone-[a-z]', z) is None for z in placements):
        raise ValueError('zone identifiers must match zone-a through zone-z')
    if not isinstance(failed_zones, list) or any(z not in placements for z in failed_zones):
        raise ValueError('failed_zones must list zones present in placements')
    integer('demand_rpm', demand_rpm)
    integer('capacity_rpm', capacity_rpm, 1)
    integer('target_percent', target_percent, 1, 100)
    survivors = sum(z not in failed_zones for z in placements)
    before = len(placements) * capacity_rpm * target_percent / 100
    after = survivors * capacity_rpm * target_percent / 100
    return dict(total_replicas=len(placements), surviving_replicas=survivors,
                represented_zones=sorted(set(placements)), failed_zones=sorted(set(failed_zones)),
                target_capacity_before_rpm=before, target_capacity_after_rpm=after,
                target_met_before=demand_rpm * 100 <= len(placements) * capacity_rpm * target_percent,
                target_met_after=demand_rpm * 100 <= survivors * capacity_rpm * target_percent,
                physical_capacity_met_after=demand_rpm <= survivors * capacity_rpm)


def recovery_report(last_recoverable_minute, incident_minute, restored_minute, rpo_target_minutes, rto_target_minutes):
    for name, value in locals().copy().items():
        integer(name, value)
    if not last_recoverable_minute <= incident_minute <= restored_minute:
        raise ValueError('timeline must be recovery point <= incident <= restored')
    data_gap = incident_minute - last_recoverable_minute
    downtime = restored_minute - incident_minute
    return dict(data_gap_minutes=data_gap, downtime_minutes=downtime,
                rpo_target_minutes=rpo_target_minutes, rto_target_minutes=rto_target_minutes,
                rpo_met=data_gap <= rpo_target_minutes, rto_met=downtime <= rto_target_minutes)


def cost_estimate(replicas, hours, compute_credits_per_replica_hour, storage_gib_months,
                  storage_credits_per_gib_month, egress_gib, egress_credits_per_gib, budget_credits):
    for name, value in locals().copy().items():
        integer(name, value)
    compute = replicas * hours * compute_credits_per_replica_hour
    storage = storage_gib_months * storage_credits_per_gib_month
    egress = egress_gib * egress_credits_per_gib
    total = compute + storage + egress
    return dict(unit='fictional credits, not currency or provider prices',
                compute_credits=compute, storage_credits=storage, egress_credits=egress,
                total_credits=total, budget_credits=budget_credits,
                within_budget=total <= budget_credits, difference_from_budget=total-budget_credits)


def inventory(rows):
    if not isinstance(rows, list) or len(rows) > 100:
        raise ValueError('inventory must be a list of at most 100 resources')
    result = {}
    for row in rows:
        if not isinstance(row, dict) or set(row) != {'id', 'kind', 'size', 'public'}:
            raise ValueError('exact id, kind, size and public fields required')
        if not isinstance(row['id'], str) or re.fullmatch(r'[a-z][a-z0-9-]{0,31}', row['id']) is None:
            raise ValueError('invalid resource id')
        if row['id'] in result:
            raise ValueError('duplicate resource id')
        if row['kind'] not in ('compute', 'storage') or type(row['public']) is not bool:
            raise ValueError('kind must be compute/storage and public must be boolean')
        integer('size', row['size'], 1, 1000)
        result[row['id']] = dict(row)
    return result


def plan_changes(before, after):
    """Compare invented inventories. A review report only; there is no apply function."""
    old, new = inventory(before), inventory(after)
    changes, risks = [], []
    for key in sorted(set(old) | set(new)):
        if key not in old:
            changes.append(dict(id=key, action='add', fields=[]))
            if new[key]['public']:
                risks.append(dict(id=key, reason='new public exposure requires review'))
        elif key not in new:
            changes.append(dict(id=key, action='remove', fields=[]))
            risks.append(dict(id=key, reason='removal may interrupt service or lose data'))
        else:
            fields = sorted(field for field in ['kind', 'size', 'public'] if old[key][field] != new[key][field])
            if fields:
                action = 'replace' if 'kind' in fields else 'modify'
                changes.append(dict(id=key, action=action, fields=fields))
                if action == 'replace':
                    risks.append(dict(id=key, reason='kind change is modeled as replacement; review data and downtime'))
                if not old[key]['public'] and new[key]['public']:
                    risks.append(dict(id=key, reason='public exposure increases'))
    return dict(changes=changes, risks=risks, applied=False,
                scope='invented schema; not a vendor plan, policy check or deployment guarantee')


def restore_roundtrip():
    """Actual local copy/restore, only in an owned temporary directory."""
    original = b'{"report":"synthetic","completed":3}\n'
    changed = b'{"report":"synthetic","completed":4}\n'
    with tempfile.TemporaryDirectory(prefix='athena-cloud-restore-') as name:
        root = Path(name)
        source, backup, restored = root/'source.json', root/'backup.json', root/'restored.json'
        source.write_bytes(original)
        expected_digest = hashlib.sha256(source.read_bytes()).hexdigest()
        backup.write_bytes(source.read_bytes())
        source.write_bytes(changed)
        restored.write_bytes(backup.read_bytes())
        result = dict(backup_matches_original=hashlib.sha256(backup.read_bytes()).hexdigest() == expected_digest,
                      restored_matches_original=hashlib.sha256(restored.read_bytes()).hexdigest() == expected_digest,
                      current_source_differs=source.read_bytes() != restored.read_bytes(),
                      source_bytes=len(source.read_bytes()), restored_bytes=len(restored.read_bytes()))
    result['temporary_directory_removed'] = not root.exists()
    result['scope'] = 'actual local file copy and restore, not cloud durability or disaster recovery'
    return result
