"""Offline official documentation-example replay, never a Discord API client."""
import argparse
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent


def replay(module_path, fixture_path):
    sys.path.insert(0, str(module_path.parent))
    spec = importlib.util.spec_from_file_location('discord_component_replay', module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    raw = fixture_path.read_bytes()
    payload = json.loads(raw)
    # Deliberately synthetic adapter envelope. No real message/author/channel.
    envelope = {'id': '1', 'channel_id': '2', 'content': '',
                'embeds': [{'type': 'components', 'components': [payload['component']]}]}
    record = module.normalize_message(envelope, access='available')
    body = record['body']
    events = body['events']
    media = [e for e in events if e['type'] in ('media', 'file')]
    texts = [e for e in events if e['type'] == 'text' and e['source'] != 'content']
    sha = lambda b: hashlib.sha256(b.encode() if isinstance(b, str) else b).hexdigest()
    return {
        'schema_version': 1,
        'classification': 'official documentation code example in synthetic message envelope; not a live Discord message',
        'fixture_bytes': len(raw), 'fixture_sha256': sha(raw),
        'implementation_sha256': sha(module_path.read_bytes()),
        'envelope': {'synthetic': True, 'message_id': '1', 'channel_id': '2',
                     'creator_identity_invented': False, 'source_component_value_unchanged': True},
        'input_raw_projection_sha256': sha(body['raw']),
        'event_count': len(events),
        'component_count': sum(e['type'] == 'component_start' for e in events),
        'component_types': dict(sorted(Counter(str(e['componentType']) for e in events if e['type'] == 'component_start').items())),
        'text_event_count': len(texts),
        'text_characters': len(body['text']), 'text_sha256': sha(body['text']),
        'media_reference_count': len(media),
        'media_url_sha256_in_order': [sha(e['url']) if e['url'] else None for e in media],
        'media_spoiler_states': [e['spoiler'] for e in media],
        'link_event_count': sum(e['type'] == 'link' for e in events),
        'all_media_unfetched': all(not e['downloaded'] and not e['playbackVerified'] for e in media),
        'projection_complete': body['projectionComplete'],
        'api_response_observed': False, 'provider_rendering_verified': False,
        'network_used': False, 'full_support_accepted': False,
        'limits': ['Markdown links stay within text, not separate link events.',
                   'Source artwork URLs are references, not decoded or played media.',
                   'No account, message history, grants, authorization parity or target acceptance.'],
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--module', type=Path, default=HERE.parent / 'site-extraction-lab/discord_message.py')
    p.add_argument('--fixture', type=Path, default=HERE / 'fixtures/official-component-example.json')
    args = p.parse_args()
    print(json.dumps(replay(args.module, args.fixture), indent=2, sort_keys=True))


if __name__ == '__main__':
    main()
