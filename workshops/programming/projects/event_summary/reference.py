"""Reference solution for bounded synthetic CSV events; no I/O side effects."""
import csv
import io
import re
FIELDS = ['event_id', 'label', 'duration_ms', 'status']

def validate_event(event):
    if not isinstance(event, dict) or set(event) != set(FIELDS):
        raise ValueError('exact event_id, label, duration_ms and status fields required')
    if not isinstance(event['event_id'], str) or re.fullmatch('EVT-[0-9]{3,6}', event['event_id']) is None:
        raise ValueError('invalid event_id')
    if not isinstance(event['label'], str) or not 1 <= len(event['label']) <= 40 or event['label'] != event['label'].strip() or any((ord(c) < 32 for c in event['label'])):
        raise ValueError('label must be 1–40 characters, trimmed, without control characters')
    if type(event['duration_ms']) is not int or not 0 <= event['duration_ms'] <= 600000:
        raise ValueError('duration_ms must be an integer from 0 to 600000')
    if event['status'] not in ('ok', 'failed'):
        raise ValueError('status must be ok or failed')
    return {k: event[k] for k in FIELDS}

def parse_events_csv(text):
    if not isinstance(text, str) or len(text.encode('utf-8')) > 16384:
        raise ValueError('CSV text must be at most 16384 UTF-8 bytes')
    try:
        rows = list(csv.reader(io.StringIO(text, newline=''), strict=True))
    except csv.Error as exc:
        raise ValueError('invalid CSV') from exc
    if not rows or rows[0] != FIELDS:
        raise ValueError('exact CSV header and column order required')
    if len(rows) - 1 > 200:
        raise ValueError('at most 200 data rows')
    events = []
    for n, row in enumerate(rows[1:], 2):
        if len(row) != 4:
            raise ValueError(f'row {n}: four columns required')
        if re.fullmatch('[0-9]{1,6}', row[2]) is None:
            raise ValueError(f'row {n}: duration must be ASCII integer text')
        event = dict(zip(FIELDS, row))
        event['duration_ms'] = int(row[2])
        events.append(validate_event(event))
    return events

def summarize_events(events, slowest_limit=3):
    if not isinstance(events, list) or len(events) > 200:
        raise ValueError('events must be a list of at most 200 rows')
    if type(slowest_limit) is not int or not 0 <= slowest_limit <= 10:
        raise ValueError('slowest_limit must be an integer from 0 to 10')
    unique = {}
    for raw in events:
        event = validate_event(raw)
        key = event['event_id']
        if key in unique and unique[key] != event:
            raise ValueError('conflicting duplicate event_id')
        unique[key] = event
    ordered = [unique[key] for key in sorted(unique)]
    grouped = {}
    successes = 0
    total = 0
    for event in ordered:
        total += event['duration_ms']
        successes += int(event['status'] == 'ok')
        label = event['label']
        if label not in grouped:
            grouped[label] = {'label': label, 'events': 0, 'failures': 0, 'duration_ms': 0}
        grouped[label]['events'] += 1
        grouped[label]['failures'] += int(event['status'] == 'failed')
        grouped[label]['duration_ms'] += event['duration_ms']
    return {'input_rows': len(events), 'unique_events': len(ordered), 'duplicate_rows': len(events) - len(ordered), 'successes': successes, 'failures': len(ordered) - successes, 'total_duration_ms': total, 'mean_duration_ms': total / len(ordered) if ordered else None, 'by_label': [grouped[label] for label in sorted(grouped)], 'slowest': [dict(event_id=e['event_id'], duration_ms=e['duration_ms']) for e in sorted(ordered, key=lambda e: (-e['duration_ms'], e['event_id']))[:slowest_limit]]}
