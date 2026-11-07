"""Synthetic defensive Discord tests; no real messages, grants or transfers."""
from copy import deepcopy
import json
from pathlib import Path
import sys
import unittest

LAB = Path(__file__).resolve().parents[1] / 'experiments' / 'site-extraction-lab'
sys.path.insert(0, str(LAB))
from discord_message import normalize_message, discord_receipt, snowflake
from extractors import ExtractionError


def synthetic(**updates):
    message = dict(id='123456789012345678', channel_id='223456789012345678', guild_id='323456789012345678',
                   author=dict(id='423456789012345678', username='SYNTHETIC PRIVATE NAME', avatar='a_' + 'a' * 32),
                   member=dict(nick='SYNTHETIC NICK', avatar='b' * 32), content='SYNTHETIC PRIVATE BODY',
                   embeds=[], attachments=[], components=[])
    message.update(updates)
    return message


def attachment(ident='523456789012345678', **updates):
    item = dict(id=ident, filename='SPOILER_synthetic.gif', content_type='image/gif', size=123,
                url='https://cdn.discordapp.com/attachments/223456789012345678/' + ident + '/synthetic.gif?ex=aaa&is=bbb&hm=PRIVATE_SIGNATURE',
                proxy_url='https://media.discordapp.net/attachments/223456789012345678/' + ident + '/synthetic.gif?hm=PRIVATE_PROXY',
                description='SYNTHETIC PRIVATE ALT', width=10, height=20)
    item.update(updates)
    return item


class DiscordSyntheticTests(unittest.TestCase):
    def test_snowflakes_never_coerce_or_round(self):
        for value in (123456789012345678, 1.0, True, None, '', '01', '0', '-1', '1e18', ' 1', '18446744073709551616'):
            with self.subTest(value=value), self.assertRaises(ExtractionError): snowflake(value)
        self.assertEqual(snowflake('18446744073709551615'), '18446744073709551615')
        for key in ('id', 'channel_id', 'guild_id'):
            with self.subTest(key=key), self.assertRaises(ExtractionError): normalize_message(synthetic(**{key: 123}))

    def test_user_and_guild_avatars_are_distinct(self):
        r = normalize_message(synthetic(), access='available')
        p = r['people'][0]
        self.assertEqual(p['kind'], 'user')
        self.assertIn('/guilds/323456789012345678/users/423456789012345678/avatars/', p['avatar'])
        self.assertTrue(p['globalAvatar'].endswith('.gif'))
        self.assertEqual(p['avatar'], p['guildAvatar'])
        self.assertFalse(r['follow']['nativeMutationTested'])

    def test_webhook_not_user_or_guild_member(self):
        r = normalize_message(synthetic(webhook_id='623456789012345678'))
        p = r['people'][0]
        self.assertEqual(p['kind'], 'webhook')
        self.assertEqual(p['id'], '623456789012345678')
        self.assertIsNone(p['profile'])
        self.assertIsNone(p['guildAvatar'])
        self.assertIsNone(p['nickname'])

    def test_ordered_components_file_resolution_and_no_false_playback(self):
        a = attachment()
        components = [dict(type=17, components=[dict(type=10, content='component before'),
            dict(type=9, components=[dict(type=10, content='section text')], accessory=dict(type=11, media=dict(url='https://cdn.example/thumb.gif', content_type='image/gif'))),
            dict(type=12, items=[dict(media=dict(url='attachment://' + a['filename']), description='gallery alt', spoiler=True)]),
            dict(type=13, file=dict(url='attachment://' + a['filename'])), dict(type=10, content='component after')])]
        embed = dict(title='embed title', description='embed description', fields=[dict(name='field', value='value')], video=dict(url='https://cdn.example/video.mp4'))
        r = normalize_message(synthetic(attachments=[a], embeds=[embed], components=components), access='available')
        events = r['body']['events']
        texts = [e['text'] for e in events if e['type'] == 'text']
        self.assertEqual(texts, ['SYNTHETIC PRIVATE BODY', 'embed title', 'embed description', 'field', 'value', 'component before', 'section text', 'component after'])
        media = [e for e in events if e['type'] in ('media', 'file')]
        self.assertTrue(any(e['role'] == 'video' for e in media))
        self.assertEqual(r['files'][0]['attachmentId'], a['id'])
        self.assertIn('PRIVATE_SIGNATURE', r['files'][0]['url'])
        self.assertTrue(any(e['description'] == 'gallery alt' and e['spoiler'] for e in media))
        self.assertTrue(all(e['downloaded'] is False and e['playbackVerified'] is False for e in media))

    def test_audio_metadata_and_gif_are_metadata_only(self):
        gif = attachment()
        audio = attachment('723456789012345678', filename='synthetic.ogg', content_type='audio/ogg', duration_secs=1.25, waveform='U1lOVEhFVElD')
        r = normalize_message(synthetic(attachments=[gif, audio]))
        self.assertTrue(r['files'][0]['animatedHint'])
        self.assertEqual(r['files'][1]['mediaKind'], 'audio')
        self.assertEqual(r['files'][1]['duration_secs'], 1.25)
        self.assertEqual(r['files'][1]['waveform'], 'U1lOVEhFVElD')
        self.assertFalse(r['files'][1]['playbackVerified'])

    def test_embed_only_partial_update_retains_content_files_and_avatar(self):
        original = normalize_message(synthetic(attachments=[attachment()]), access='available')
        update = dict(id=original['identity']['id'], channel_id=original['identity']['channelId'], embeds=[dict(description='new embed')])
        before = deepcopy(original)
        r = normalize_message(update, access='available', partial=True, previous=original)
        self.assertIn('SYNTHETIC PRIVATE BODY', r['body']['text'])
        self.assertIn('new embed', r['body']['text'])
        self.assertEqual(len(r['files']), 1)
        self.assertEqual(r['people'], original['people'])
        self.assertEqual(original, before)
        self.assertEqual(r['contentState'], 'partial')

    def test_explicit_empty_edit_clears_only_supplied_fields(self):
        old = normalize_message(synthetic(attachments=[attachment()]), access='available')
        r = normalize_message(dict(id=old['identity']['id'], content='', attachments=[]), access='available', partial=True, previous=old)
        self.assertEqual(r['body']['text'], '')
        self.assertEqual(r['files'], [])
        self.assertEqual(r['people'], old['people'])

    def test_intent_and_permission_failure_never_clear_last_good(self):
        old = normalize_message(synthetic(attachments=[attachment()]), access='available')
        for state in ('denied', 'intent_limited'):
            r = normalize_message(synthetic(content='', attachments=[], components=[]), access=state, previous=old)
            self.assertEqual(r['contentState'], 'retained_last_good')
            self.assertEqual(r['body']['text'], old['body']['text'])
            self.assertEqual(len(r['files']), 1)
            self.assertIn(state, r['gates'])
            fresh = normalize_message(synthetic(content=''), access=state)
            self.assertEqual(fresh['contentState'], state)
            self.assertIsNone(fresh['body'])

    def test_unknown_and_missing_are_not_empty(self):
        self.assertEqual(normalize_message(synthetic(content=''))['contentState'], 'unknown')
        self.assertEqual(normalize_message(synthetic(content=''), access='available')['contentState'], 'empty')
        self.assertEqual(normalize_message(dict(id='1', channel_id='2'), access='available')['contentState'], 'unknown')
        self.assertEqual(normalize_message(dict(id='1', channel_id='2'), access='available', partial=True)['people'], [])

    def test_forward_snapshot_does_not_borrow_author(self):
        snap = dict(message=dict(content='SYNTHETIC FORWARD', attachments=[attachment()], embeds=[], components=[]))
        r = normalize_message(synthetic(message_snapshots=[snap]))
        self.assertEqual(len(r['people']), 1)
        self.assertEqual(r['snapshots'][0]['people'], [])
        self.assertEqual(r['snapshots'][0]['body']['text'], 'SYNTHETIC FORWARD')
        self.assertEqual(r['snapshots'][0]['authorState'], 'not_in_snapshot_schema')
        self.assertEqual(r['snapshots'][0]['files'][0]['attachmentId'], '523456789012345678')

    def test_reference_missing_null_and_present_are_distinct(self):
        r = normalize_message(synthetic())
        self.assertEqual(r['referencedMessage']['state'], 'absent_unknown')
        r = normalize_message(synthetic(referenced_message=None))
        self.assertEqual(r['referencedMessage']['state'], 'explicit_null_deleted')
        old = normalize_message(synthetic(referenced_message=dict(id='823456789012345678')))
        r = normalize_message(dict(id=old['identity']['id'], embeds=[]), partial=True, previous=old)
        self.assertEqual(r['referencedMessage']['state'], 'present')
        r = normalize_message(dict(id=old['identity']['id'], referenced_message=None), partial=True, previous=old)
        self.assertEqual(r['referencedMessage']['state'], 'explicit_null_deleted')

    def test_unknown_component_warns_and_preserves_other_content(self):
        r = normalize_message(synthetic(components=[dict(type=999, secret='PRIVATE COMPONENT'), dict(type=10, content='after unknown')]))
        self.assertIn('after unknown', r['body']['text'])
        self.assertTrue(any('999' in w for w in r['warnings']))
        self.assertFalse(r['body']['projectionComplete'])
        self.assertNotIn('PRIVATE COMPONENT', json.dumps(discord_receipt(r)))

    def test_receipt_excludes_private_body_names_queries_and_delivery(self):
        payload = synthetic(attachments=[attachment()], embeds=[dict(description='https://secret.example/path?token=RAW_BODY_TOKEN')])
        r = normalize_message(payload)
        before = deepcopy(r)
        evidence = discord_receipt(r)
        serialized = json.dumps(evidence)
        for private in ('PRIVATE_SIGNATURE', 'PRIVATE_PROXY', 'PRIVATE BODY', 'PRIVATE NAME', 'PRIVATE ALT', 'SYNTHETIC NICK', 'RAW_BODY_TOKEN', '?ex=', 'waveform', '_payload'):
            self.assertNotIn(private, serialized)
        self.assertIn('urlReference', serialized)
        self.assertEqual(len(evidence['body']['textSha256']), 64)
        self.assertEqual(r, before)
        self.assertFalse(evidence['fullSupportAccepted'])

    def test_duplicate_attachment_and_scope_mismatch_rejected(self):
        with self.assertRaises(ExtractionError): normalize_message(synthetic(attachments=[attachment(), attachment()]))
        old = normalize_message(synthetic())
        for updates in (dict(id='1'), dict(channel_id='2'), dict(guild_id='3')):
            with self.assertRaises(ExtractionError): normalize_message(synthetic(**updates), partial=True, previous=old)
        with self.assertRaises(ExtractionError): normalize_message(synthetic(), previous=discord_receipt(old))

    def test_unsafe_urls_and_ambiguous_attachment_are_not_transport(self):
        a, b = attachment(), attachment('723456789012345678')
        r = normalize_message(synthetic(attachments=[a, b], components=[dict(type=13, file=dict(url='attachment://' + a['filename'])), dict(type=11, media=dict(url='javascript:steal()'))]))
        self.assertIsNone(r['files'][0]['url'])
        self.assertTrue(any('ambiguous' in w for w in r['warnings']))
        self.assertTrue(any(e.get('referenceRejected') for e in r['body']['events']))
        for url in ('http://example.com/private', 'https://user:password@example.com/private', 'data:image/png,secret'):
            r = normalize_message(synthetic(attachments=[attachment(url=url)]))
            self.assertIsNone(r['files'][0]['url'])

    def test_receipt_omits_webhook_and_arbitrary_credential_path_routes(self):
        urls = ['https://discord.com/api/webhooks/123456789012345678/synthetic-secret-token',
                'https://files.example/download/synthetic-secret-token/archive.zip',
                'https://cdn.discordapp.com/api/webhooks/123456789012345678/synthetic-secret-token',
                'https://discord.com/users/123456789012345678/synthetic-secret-token']
        for url in urls:
            with self.subTest(url=url):
                r = normalize_message(synthetic(embeds=[dict(url=url, image=dict(url=url))]))
                self.assertIn('synthetic-secret-token', json.dumps(r))
                receipt = json.dumps(discord_receipt(r))
                self.assertNotIn('synthetic-secret-token', receipt)
                self.assertNotIn('/api/webhooks/', receipt)
        # Even a CDN filename can contain a private opaque value.
        r = normalize_message(synthetic(attachments=[attachment(url='https://cdn.discordapp.com/attachments/123/456/synthetic-secret-token?hm=secret')]))
        receipt = json.dumps(discord_receipt(r))
        self.assertNotIn('synthetic-secret-token', receipt)
        self.assertIn('/attachments/123/456/', receipt)

    def test_unmatched_component_attachment_id_is_explicitly_unresolved(self):
        r = normalize_message(synthetic(components=[dict(type=13, file=dict(attachment_id='99'))]))
        self.assertIsNone(r['files'][0]['url'])
        self.assertEqual(r['files'][0]['attachmentId'], '99')
        self.assertTrue(any('Unresolved component attachment ID' in w for w in r['warnings']))
        self.assertTrue(any('no resolved delivery URL' in w for w in r['warnings']))
        self.assertFalse(r['body']['projectionComplete'])
        self.assertFalse(discord_receipt(r)['body']['projectionComplete'])

    def test_malformed_shapes_and_duplicate_json_keys_fail(self):
        for updates in (dict(type='PRIVATE TYPE'), dict(message_reference=dict(type='PRIVATE REF')), dict(attachments={}), dict(components=[dict(type=True)]), dict(author=dict(id=42)), dict(member=dict(avatar='../../bad'))):
            with self.subTest(updates=updates), self.assertRaises(ExtractionError): normalize_message(synthetic(**updates))
        with self.assertRaises(ExtractionError): normalize_message('{"id":"1","id":"2","channel_id":"3"}')


if __name__ == '__main__':
    unittest.main()
