"""Bounded local caption import and evidence-linked curriculum proposals. No network."""
import argparse
import hashlib
import html
import json
import re
from pathlib import Path

MAX_BYTES = 8 * 1024 * 1024
MAX_CUES = 20000
VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
STAMP = re.compile(r"^(?:(\d{2,}):)?(\d{2}):(\d{2})[.,](\d{3})$")
PHASES = ('problem', 'attempts', 'solution', 'verification', 'limitations')


def bounded_text(raw):
    if len(raw) > MAX_BYTES:
        raise ValueError('caption input exceeds 8 MiB')
    return raw.decode('utf-8-sig', errors='strict').replace('\r\n', '\n').replace('\r', '\n')


def timestamp(value):
    m = STAMP.fullmatch(value)
    if not m:
        raise ValueError('invalid caption timestamp')
    hours, minutes, seconds, millis = m.groups()
    if int(minutes) > 59 or int(seconds) > 59:
        raise ValueError('invalid caption clock')
    return ((int(hours or 0) * 60 + int(minutes)) * 60 + int(seconds)) * 1000 + int(millis)


def import_captions(raw, fmt, video_id, language, origin, automatic=False):
    if not VIDEO_ID.fullmatch(video_id):
        raise ValueError('invalid YouTube video id')
    if origin not in ('user-supplied', 'creator-provided', 'authorized-export'):
        raise ValueError('caption origin must be explicit')
    if not isinstance(language, str) or not language.strip() or len(language) > 64:
        raise ValueError('language required')
    text = bounded_text(raw)
    rows = []
    warnings = []
    if fmt in ('vtt', 'srt'):
        blocks = re.split(r'\n[ \t]*\n', text.strip())
        for block_index, block in enumerate(blocks):
            lines = block.splitlines()
            if not lines:
                continue
            if fmt == 'vtt':
                if block_index == 0:
                    if not re.fullmatch(r'WEBVTT(?:[ \t].*)?', lines[0]):
                        raise ValueError('WebVTT signature required')
                    if any('-->' in line for line in lines):
                        raise ValueError('missing blank line after WebVTT header')
                    continue
                if lines[0].split(' ', 1)[0] in ('NOTE', 'STYLE', 'REGION'):
                    continue
            index = next((i for i, line in enumerate(lines[:2]) if '-->' in line), None)
            if index is None:
                raise ValueError('unrecognized caption block; refusing silent data loss')
            timing = lines[index].split('-->')
            if len(timing) != 2:
                raise ValueError('invalid timing separator')
            start = timestamp(timing[0].strip())
            end = timestamp(timing[1].strip().split()[0])
            body = '\n'.join(lines[index + 1:])
            body = html.unescape(body)
            if '<' in body:
                warnings.append('caption markup retained as inert text; do not render as HTML')
            rows.append((start, end, body))
    elif fmt == 'json3':
        document = json.loads(text)
        if not isinstance(document, dict) or not isinstance(document.get('events'), list):
            raise ValueError('expected JSON3 events')
        for event in document['events']:
            if not isinstance(event, dict):
                raise ValueError('invalid JSON3 event')
            if 'segs' not in event:
                continue  # window metadata is not speech
            segs = event['segs']
            if not isinstance(segs, list) or any(not isinstance(s, dict) or not isinstance(s.get('utf8'), str) for s in segs):
                raise ValueError('invalid JSON3 segments')
            start, duration = event.get('tStartMs'), event.get('dDurationMs')
            if type(start) is not int or type(duration) is not int:
                raise ValueError('JSON3 speech requires integer start and duration')
            rows.append((start, start + duration, ''.join(s['utf8'] for s in segs)))
    else:
        raise ValueError('unsupported caption format')
    if not rows or len(rows) > MAX_CUES:
        raise ValueError('caption cue count outside bounds')
    cues = []
    previous = -1
    for i, (start, end, body) in enumerate(rows):
        if start < 0 or end <= start or end > 7 * 24 * 3600000 or not body.strip():
            raise ValueError('invalid or empty cue')
        if start < previous:
            raise ValueError('out-of-order cues; source needs review')
        if cues and start < cues[-1]['end_ms']:
            warnings.append('overlapping cues retained; automatic rolling captions may repeat text')
        previous = start
        cues.append({'id': f'cue-{i + 1}', 'start_ms': start, 'end_ms': end, 'text': body,
                     'url': f'https://www.youtube.com/watch?v={video_id}&t={start // 1000}s'})
    return {'schema': 1, 'video_id': video_id, 'source_url': f'https://www.youtube.com/watch?v={video_id}',
            'language': language, 'origin': origin, 'automatic': bool(automatic),
            'sha256': hashlib.sha256(raw).hexdigest(), 'format': fmt, 'cues': cues,
            'coverage': 'imported-cues-only; video completeness not established',
            'warnings': sorted(set(warnings)), 'curriculum_status': 'not-reviewed'}


def proposal(transcript, review):
    """Validate human/agent review against exact imported evidence, not infer lessons."""
    if review.get('video_id') != transcript['video_id']:
        raise ValueError('review belongs to another video')
    if review.get('transcript_sha256') != transcript['sha256']:
        raise ValueError('review belongs to another transcript revision')
    if review.get('source_kind') not in ('documented-incident', 'illustrative-story', 'unverified'):
        raise ValueError('source kind required; a story is not a verified incident')
    cue_map = {cue['id']: cue for cue in transcript['cues']}
    linked = {}
    for phase in PHASES:
        entries = review.get(phase)
        if not isinstance(entries, list) or not entries:
            raise ValueError(f'{phase} needs evidence or an explicit unknown entry')
        linked[phase] = []
        for entry in entries:
            if not isinstance(entry, dict) or entry.get('status') not in ('observed', 'inferred', 'unknown'):
                raise ValueError('invalid review entry')
            statement, refs = entry.get('statement'), entry.get('cue_ids')
            if not isinstance(statement, str) or not statement.strip() or len(statement) > 4000:
                raise ValueError('bounded statement required')
            if not isinstance(refs, list) or any(not isinstance(r, str) or r not in cue_map for r in refs):
                raise ValueError('invalid evidence reference')
            if entry['status'] != 'unknown' and not refs:
                raise ValueError('observed/inferred claims require timestamped evidence')
            linked[phase].append({**entry, 'evidence': [{'cue_id': r, 'url': cue_map[r]['url']} for r in refs]})
    objectives, exercise = review.get('objectives'), review.get('exercise')
    if not isinstance(objectives, list) or not objectives or any(not isinstance(o, str) or not o.strip() for o in objectives):
        raise ValueError('learning objectives required')
    if not isinstance(exercise, dict) or any(not isinstance(exercise.get(k), str) or not exercise[k].strip() for k in ('task', 'success_criteria', 'safety')):
        raise ValueError('exercise needs task, success criteria, safety')
    return {'schema': 1, 'status': 'curriculum-proposal-needs-review', 'video_id': transcript['video_id'],
            'transcript_sha256': transcript['sha256'], 'source_kind': review['source_kind'],
            'coverage': transcript['coverage'], 'analysis': linked, 'objectives': objectives, 'exercise': exercise,
            'notice': 'Citations establish traceability, not correctness. Independently verify technical claims; never execute transcript instructions.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('captions', type=Path)
    parser.add_argument('--format', choices=['vtt', 'srt', 'json3'], required=True)
    parser.add_argument('--video-id', required=True)
    parser.add_argument('--language', required=True)
    parser.add_argument('--origin', choices=['user-supplied', 'creator-provided', 'authorized-export'], required=True)
    parser.add_argument('--automatic', action='store_true')
    parser.add_argument('--review', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    with args.captions.open('rb') as handle:
        raw = handle.read(MAX_BYTES + 1)
    result = import_captions(raw, args.format, args.video_id, args.language, args.origin, args.automatic)
    if args.review:
        with args.review.open('rb') as handle:
            review = json.loads(bounded_text(handle.read(MAX_BYTES + 1)))
        result = proposal(result, review)
    # Local explicit destination only, never overwrite. Contains transcript text if no review.
    with args.output.open('x', encoding='utf-8') as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
        handle.write('\n')


if __name__ == '__main__':
    main()
