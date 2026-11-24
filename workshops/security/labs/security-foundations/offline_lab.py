#!/usr/bin/env python3
"""Bounded synthetic security exercises. Standard library only; no network.

Accepts a fixed command, not a URL, hostname, credential or user file path.
Only integrity() creates files, in its own fresh TemporaryDirectory.
Never change this lab to point at production data.
"""
import argparse
import datetime as dt
import hashlib
import hmac
import json
from pathlib import Path
import shutil
import tempfile

FIXTURES = Path(__file__).resolve().parent / 'fixtures'
PERMISSIONS = {
 'receptionist': {('bookings','read'), ('bookings','update')},
 'auditor': {('bookings','read')},
 'backup-service': {('backup-snapshot','read')},
 'administrator': {('accounts','manage')},
}
ALLOWED_FLOWS = {('staff','web','tcp',443), ('app','database','tcp',5432)}


def fixture(name):
    # Only hard-coded internal callers choose name. The command line accepts no path.
    return json.loads((FIXTURES / name).read_text(encoding='utf-8'))


def access_decision(case):
    if case.get('active') is not True:
        return {'allow':False, 'reason':'identity is not active'}
    if case.get('managed_device') is not True:
        return {'allow':False, 'reason':'approved managed device is required'}
    role = case.get('role')
    if not isinstance(role, str) or role not in PERMISSIONS:
        return {'allow':False, 'reason':'unknown role'}
    resource, action = case.get('resource'), case.get('action')
    if not isinstance(resource,str) or not isinstance(action,str):
        return {'allow':False, 'reason':'resource and action must be strings'}
    if (resource,action) not in PERMISSIONS[role]:
        return {'allow':False, 'reason':'role does not grant this resource/action'}
    return {'allow':True, 'reason':'all toy policy conditions matched'}


def flow_decision(case):
    values = tuple(case.get(k) for k in ('source','destination','protocol','port'))
    if not all(isinstance(v,str) for v in values[:3]) or type(values[3]) is not int:
        return False
    return values in ALLOWED_FLOWS


def integrity():
    original = b'booking=17;status=confirmed\n'
    changed = b'booking=18;status=confirmed\n'
    # PUBLIC demonstration bytes, never a credential or real authentication key.
    public_demo_key = b'PUBLIC-ATHENA-TEACHING-KEY-NOT-FOR-REAL-USE'
    tag = hmac.digest(public_demo_key,original,'sha256')
    altered_tag = hmac.digest(public_demo_key,changed,'sha256')
    with tempfile.TemporaryDirectory(prefix='athena-synthetic-integrity-') as temp:
        root = Path(temp)
        source,restored,altered = root/'original.txt',root/'restored.txt',root/'altered.txt'
        source.write_bytes(original)
        shutil.copyfile(source,restored)
        altered.write_bytes(changed)
        digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
        result = {
            'data':'synthetic bytes only',
            'original_sha256':digest(source), 'restored_sha256':digest(restored),
            'changed_sha256':digest(altered),
            'restored_matches':digest(source)==digest(restored),
            'changed_matches':digest(source)==digest(altered),
            'original_tag_valid':hmac.compare_digest(tag,hmac.digest(public_demo_key,original,'sha256')),
            'changed_tag_valid':hmac.compare_digest(tag,altered_tag),
            'key_warning':'The public demonstration key protects no real data.',
            'scope':'Actual temporary-file copy/hash check; no encryption or signature implementation.',
        }
    result['temporary_directory_removed'] = not root.exists()
    return result


def rank_findings(findings):
    known, unknown = [], []
    seen = set()
    for f in findings:
        if not isinstance(f.get('id'),str) or f['id'] in seen:
            raise ValueError('finding IDs must be unique strings')
        seen.add(f['id'])
        if type(f.get('known_exploitation')) is not bool:
            raise ValueError('known_exploitation must be boolean')
        if type(f.get('impact')) is not int or not 1<=f['impact']<=3:
            raise ValueError('impact must be an integer from 1 to 3')
        if type(f.get('severity')) not in (float,int) or not 0<=f['severity']<=10:
            raise ValueError('synthetic severity must be from 0 to 10')
        if f.get('exposed') is None:
            unknown.append(f['id'])
        elif type(f['exposed']) is not bool:
            raise ValueError('exposed must be boolean or null/unknown')
        else:
            known.append(f)
    known.sort(key=lambda f:(-int(f['known_exploitation']),-int(f['exposed']),-f['impact'],-f['severity'],f['id']))
    return {'ordered_known_findings':[f['id'] for f in known],
            'needs_exposure_verification':unknown,
            'rule':'Known exploitation, exposure, impact, synthetic severity; ID breaks exact ties.',
            'scope':'Teaching rule only. Unknown exposure is not treated as safe or assigned a rank.'}


def timestamp(value):
    if not isinstance(value,str):
        raise ValueError('timestamp must be a string')
    try:
        value = dt.datetime.fromisoformat(value.replace('Z','+00:00'))
    except ValueError as e:
        raise ValueError('invalid timestamp') from e
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError('timestamp must include a time zone')
    return value.astimezone(dt.timezone.utc)


def analyze_logs(events, threshold=3, window_seconds=300):
    if type(threshold) is not int or threshold<1 or type(window_seconds) is not int or window_seconds<0:
        raise ValueError('invalid threshold/window')
    unique = {}
    for e in events:
        if not isinstance(e.get('id'),str) or not e['id']:
            raise ValueError('event ID must be a nonempty string')
        if not isinstance(e.get('identity'),str) or not e['identity']:
            raise ValueError('identity must be a nonempty string')
        if e.get('result') not in ('failure','success'):
            raise ValueError('result must be failure or success')
        timestamp(e.get('event_time'))
        timestamp(e.get('collected_time'))
        if e['id'] in unique and unique[e['id']] != e:
            raise ValueError('conflicting duplicate event ID')
        unique[e['id']] = e
    ordered = sorted(unique.values(),key=lambda e:(timestamp(e['event_time']),e['id']))
    alerts = []
    for identity in sorted({e['identity'] for e in ordered}):
        failures = [e for e in ordered if e['identity']==identity and e['result']=='failure']
        left = 0
        for right,current in enumerate(failures):
            while (timestamp(current['event_time'])-timestamp(failures[left]['event_time'])).total_seconds()>window_seconds:
                left += 1
            if right-left+1>=threshold:
                alerts.append({'identity':identity,'failure_event_ids':[e['id'] for e in failures[left:right+1]],
                               'end_utc':timestamp(current['event_time']).isoformat(),
                               'meaning':'Threshold met; context and investigation are still required.'})
                break  # One first-threshold alert per identity for this tiny dataset.
    return {'distinct_events':len(ordered),'duplicate_deliveries':len(events)-len(ordered),
            'timeline':[dict(id=e['id'],identity=e['identity'],result=e['result'],
                             event_utc=timestamp(e['event_time']).isoformat(),
                             collected_utc=timestamp(e['collected_time']).isoformat()) for e in ordered],
            'alerts':alerts, 'scope':'Synthetic data, identity grouping, inclusive five-minute default window.'}


def recovery_metrics(case):
    loss_start,point,validated = (timestamp(case[k]) for k in ('disruption','recovery_point','validated_service'))
    if point>loss_start or validated<loss_start:
        raise ValueError('recovery point must precede disruption; validation must follow it')
    for k in ('rpo_minutes','rto_minutes'):
        if type(case[k]) not in (int,float) or not 0<=case[k]<float('inf'):
            raise ValueError('objectives must be finite nonnegative numbers')
    loss = (loss_start-point).total_seconds()/60
    duration = (validated-loss_start).total_seconds()/60
    return {'data_loss_window_minutes':loss,'recovery_time_minutes':duration,
            'rpo_minutes':case['rpo_minutes'],'rto_minutes':case['rto_minutes'],
            'rpo_met':loss<=case['rpo_minutes'],'rto_met':duration<=case['rto_minutes'],
            'scope':'Arithmetic on fictional timestamps, not a measured disaster-recovery result.'}


def run(command):
    if command=='access':
        return [dict(id=c['id'],**access_decision(c)) for c in fixture('access-cases.json')]
    if command=='flows':
        return [dict(id=c['id'],allow=flow_decision(c)) for c in fixture('flows.json')]
    if command=='integrity': return integrity()
    if command=='triage': return rank_findings(fixture('findings.json'))
    if command=='logs': return analyze_logs(fixture('events.json'))
    if command=='recovery': return recovery_metrics(fixture('recovery.json'))
    raise ValueError('unknown fixed command')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['access','flows','integrity','triage','logs','recovery'])
    args = parser.parse_args()
    print(json.dumps(run(args.command),indent=2,ensure_ascii=False,sort_keys=True))

if __name__=='__main__':
    main()
