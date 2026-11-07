"""Offline Discord message projection; synthetic tests, no transport or grants.

Schemas: https://docs.discord.com/developers/resources/message ,
https://docs.discord.com/developers/components/reference and /developers/reference
(reviewed 2026-10-31). Runtime records contain private bodies/delivery URLs.
Only discord_receipt() is intended for sanitized evidence publication.
"""
from copy import deepcopy
import json
import re
from urllib.parse import urlsplit

from extractors import ExtractionError, base_record, json_loads, public_url, sha256

_CONTENT = ('content', 'embeds', 'attachments', 'components', 'message_snapshots')
_ACCESS = ('available', 'unknown', 'denied', 'intent_limited')


def snowflake(value):
    """Never coerce IEEE754 numbers or permit ambiguous/noncanonical identities."""
    if not isinstance(value, str) or not re.fullmatch(r'[1-9][0-9]{0,19}', value) or int(value) > 2**64 - 1:
        raise ExtractionError('Expected a canonical string snowflake')
    return value


def _object(value):
    if not isinstance(value, dict):
        raise ExtractionError('Expected object')
    return value


def _array(value):
    if not isinstance(value, list):
        raise ExtractionError('Expected array')
    return value


def _merge(old, new, depth=0):
    if depth > 32:
        raise ExtractionError('Payload nesting limit')
    result = deepcopy(old)
    for key, value in new.items():
        result[key] = _merge(result[key], value, depth + 1) if isinstance(value, dict) and isinstance(result.get(key), dict) else deepcopy(value)
    return result


def _delivery(value):
    # Keep a usable signed delivery URL only in memory; never strip it for fetch.
    return value if isinstance(value, str) and public_url(value) is not None and urlsplit(value).scheme == 'https' else None


def _avatar(ident, value, guild=None):
    if value is None:
        return None
    if not isinstance(value, str) or not re.fullmatch(r'(?:a_)?[a-fA-F0-9]{32}', value):
        raise ExtractionError('Malformed avatar hash')
    ext = 'gif' if value.startswith('a_') else 'png'
    path = f'guilds/{guild}/users/{ident}/avatars' if guild else f'avatars/{ident}'
    return f'https://cdn.discordapp.com/{path}/{value}.{ext}'


def _people(data):
    if 'author' not in data:
        return []
    author = _object(data['author'])
    ident = snowflake(author.get('id'))
    webhook = snowflake(data['webhook_id']) if 'webhook_id' in data else None
    guild = data.get('guild_id')
    member = _object(data.get('member', {}))
    # A webhook's author is a webhook representation, not a verified user.
    kind = 'webhook' if webhook else 'user'
    global_avatar = _avatar(ident, author.get('avatar'))
    guild_avatar = _avatar(ident, member.get('avatar'), guild) if guild and not webhook else None
    return [dict(id=webhook or ident, authorObjectId=ident, kind=kind,
                 name=author.get('global_name') or author.get('username'), username=author.get('username'),
                 nickname=member.get('nick') if not webhook else None,
                 role='message_author', profile=f'https://discord.com/users/{ident}' if not webhook else None,
                 globalAvatar=global_avatar, guildAvatar=guild_avatar,
                 avatar=guild_avatar or global_avatar)]


def _body(data, warnings, depth=0):
    if depth > 8:
        raise ExtractionError('Content nesting limit')
    events, files = [], []

    def emit_text(value, scope):
        if value is not None:
            if not isinstance(value, str):
                raise ExtractionError('Expected text')
            events.append(dict(type='text', text=value, source=scope))

    attachments = {}
    for item in _array(data.get('attachments', [])):
        _object(item)
        ident = snowflake(item.get('id'))
        if ident in attachments:
            raise ExtractionError('Duplicate attachment identity')
        attachments[ident] = item

    def media(item, scope, role='media', wrapper=None):
        _object(item)
        wrapper = wrapper or {}
        raw = item.get('url')
        attachment = None
        attachment_id = snowflake(item['attachment_id']) if 'attachment_id' in item else None
        if attachment_id:
            attachment = attachments.get(attachment_id)
            if attachment is None:
                warnings.append('Unresolved component attachment ID')
        if isinstance(raw, str) and raw.startswith('attachment://'):
            matches = [x for x in attachments.values() if x.get('filename') == raw[len('attachment://'):]]
            if len(matches) == 1:
                attachment = matches[0]
                if attachment_id and attachment_id != attachment['id']:
                    raise ExtractionError('Attachment reference identity mismatch')
                attachment_id = attachment['id']
            else:
                warnings.append('Unresolved or ambiguous component attachment reference')
        info = dict(attachment or {})
        info.update(item)
        # An attachment:// reference is not a remote delivery URL.
        url = _delivery(raw) or _delivery((attachment or {}).get('url'))
        if role == 'file' and url is None:
            warnings.append('File representation has no resolved delivery URL')
        mime = info.get('content_type')
        if mime is not None and not isinstance(mime, str):
            raise ExtractionError('Expected media type')
        kind = 'image' if (mime or '').startswith('image/') else 'video' if (mime or '').startswith('video/') or role == 'video' else 'audio' if (mime or '').startswith('audio/') else 'unknown'
        e = dict(type='file' if role == 'file' else 'media', source=scope, role=role,
                 attachmentId=attachment_id, url=url, proxyUrl=_delivery(info.get('proxy_url')),
                 reference=raw if isinstance(raw, str) and raw.startswith('attachment://') else None,
                 referenceRejected=bool(raw) and not url and not (isinstance(raw, str) and raw.startswith('attachment://')),
                 mimeHint=mime, mediaKind=kind, description=wrapper.get('description', info.get('description')),
                 spoiler=bool(wrapper.get('spoiler', False)) or str(info.get('filename', '')).startswith('SPOILER_'),
                 animatedHint=True if mime == 'image/gif' or (isinstance(info.get('flags'), int) and info['flags'] & 1 and scope.startswith('components')) else None,
                 downloaded=False, playbackVerified=False)
        for key in ('width', 'height', 'size', 'duration_secs', 'waveform', 'filename', 'title', 'flags'):
            if key in info:
                e[key] = info[key]
        events.append(e)
        if role == 'file':
            files.append(deepcopy(e))

    emit_text(data.get('content'), 'content')
    for index, embed in enumerate(_array(data.get('embeds', []))):
        _object(embed)
        scope = f'embeds/{index}'
        events.append(dict(type='embed_start', source=scope, embedType=embed.get('type'), url=_delivery(embed.get('url'))))
        emit_text(_object(embed.get('author', {})).get('name'), scope + '/author')
        for key in ('title', 'description'):
            emit_text(embed.get(key), scope + '/' + key)
        for i, field in enumerate(_array(embed.get('fields', []))):
            _object(field)
            emit_text(field.get('name'), f'{scope}/fields/{i}/name')
            emit_text(field.get('value'), f'{scope}/fields/{i}/value')
        for key in ('image', 'thumbnail', 'video'):
            if key in embed:
                media(embed[key], scope + '/' + key, key)
        emit_text(_object(embed.get('footer', {})).get('text'), scope + '/footer')
        events.append(dict(type='embed_end', source=scope))

    def component(item, scope, level=0):
        if level > 16:
            raise ExtractionError('Component nesting limit')
        _object(item)
        typ = item.get('type')
        if not isinstance(typ, int) or isinstance(typ, bool):
            raise ExtractionError('Expected integer component type')
        events.append(dict(type='component_start', source=scope, componentType=typ, componentId=item.get('id')))
        if typ in (1, 9, 17):
            for i, child in enumerate(_array(item.get('components', []))):
                component(child, f'{scope}/components/{i}', level + 1)
            if typ == 9 and 'accessory' in item:
                component(item['accessory'], scope + '/accessory', level + 1)
        elif typ == 10:
            emit_text(item.get('content'), scope + '/content')
        elif typ == 11:
            media(_object(item.get('media')), scope + '/media', 'thumbnail', item)
        elif typ == 12:
            for i, entry in enumerate(_array(item.get('items', []))):
                _object(entry)
                media(_object(entry.get('media')), f'{scope}/items/{i}', wrapper=entry)
        elif typ == 13:
            media(_object(item.get('file')), scope + '/file', 'file', item)
        elif typ == 2:
            emit_text(item.get('label'), scope + '/label')
            if 'url' in item:
                events.append(dict(type='link', source=scope, url=_delivery(item['url'])))
        elif typ in (3, 5, 6, 7, 8):
            emit_text(item.get('placeholder'), scope + '/placeholder')
            for i, option in enumerate(_array(item.get('options', []))):
                _object(option)
                for key in ('label', 'description'):
                    emit_text(option.get(key), f'{scope}/options/{i}/{key}')
        elif typ == 14:
            events.append(dict(type='separator', source=scope))
        else:
            # Includes modal-only components: not silently presented as messages.
            warnings.append('Unsupported message component type ' + str(typ))
            events.append(dict(type='unsupported_component', source=scope, componentType=typ))
        events.append(dict(type='component_end', source=scope))

    for index, item in enumerate(_array(data.get('components', []))):
        component(item, f'components/{index}')
    for ident, item in attachments.items():
        media(dict(item, attachment_id=ident), 'attachments/' + ident, 'file')
    snapshots = []
    for snapshot in _array(data.get('message_snapshots', [])):
        message = _object(_object(snapshot).get('message'))
        body, snapshot_files, nested = _body(message, warnings, depth + 1)
        # Snapshot schema excludes author: never borrow forwarding-user identity.
        snapshots.append(dict(body=body, files=snapshot_files, snapshots=nested, people=[], authorState='not_in_snapshot_schema'))
    present = any(key in data for key in _CONTENT)
    text = '\n'.join(e['text'] for e in events if e['type'] == 'text')
    body = dict(format='discord_fields', text=text, raw=json.dumps({k: data[k] for k in _CONTENT if k in data}, ensure_ascii=False, sort_keys=True),
                events=events, completeness='available_source_fields', projectionComplete=False,
                ordering='content_then_embed_array_then_component_tree_then_attachment_array; not a rendered layout guarantee') if present else None
    return body, files, snapshots


def normalize_message(payload, *, access='unknown', partial=False, previous=None):
    """Normalize caller-supplied authorized data; performs no authorization.

    Caller asserts access separately (unknown is the conservative default).
    For partial updates, pass the previous runtime record, never its receipt.
    Arrays explicitly supplied replace arrays; absent fields are preserved.
    Denied/intent-limited refreshes retain last-good content. Event sequencing,
    deletion and revoked-access retention policy remain the caller's concern.
    """
    data = json_loads(payload) if isinstance(payload, (str, bytes)) else deepcopy(payload)
    _object(data)
    if access not in _ACCESS:
        raise ExtractionError('Unknown access state')
    ident = snowflake(data.get('id'))
    if 'type' in data and (not isinstance(data['type'], int) or isinstance(data['type'], bool)):
        raise ExtractionError('Expected integer message type')
    old = previous.get('_payload', {}) if previous is not None else {}
    if previous is not None:
        if '_payload' not in previous or not isinstance(old, dict) or previous.get('family') != 'discord_message' or previous['identity']['id'] != ident:
            raise ExtractionError('Previous message identity mismatch')
        for key in ('channel_id', 'guild_id'):
            if key in data and key in old and data[key] != old[key]:
                raise ExtractionError('Message scope mismatch')
    for key in ('channel_id', 'guild_id', 'webhook_id'):
        if key in data:
            snowflake(data[key])
    retained = previous is not None and access in ('denied', 'intent_limited')
    if access == 'denied':
        data = {k: v for k, v in data.items() if k in ('id', 'channel_id', 'guild_id')}
    elif access == 'intent_limited':
        data = {k: v for k, v in data.items() if k not in _CONTENT}
    # An access failure is never a fresh replacement snapshot.
    merged = _merge(old, data) if previous is not None and (partial or retained or access == 'denied') else data
    if 'channel_id' not in merged:
        raise ExtractionError('Missing channel identity')
    channel = snowflake(merged['channel_id'])
    guild = merged.get('guild_id')
    if guild is not None:
        snowflake(guild)
    origin = f'https://discord.com/channels/{guild or "@me"}/{channel}/{ident}'
    result = base_record('discord_message', origin)
    result['identity'] = dict(id=ident, channelId=channel, guildId=guild, type=merged.get('type'))
    result['people'] = _people(merged)
    result['body'], result['files'], result['snapshots'] = _body(merged, result['warnings'])
    result['access'] = dict(state=access, partialUpdate=bool(partial), retainedLastGood=retained)
    result['fieldPresence'] = sorted(k for k in _CONTENT if k in merged)
    body = result['body']
    result['contentState'] = 'retained_last_good' if retained else access if access in ('denied', 'intent_limited') else 'unknown' if access == 'unknown' or not body else 'partial' if partial else 'nonempty' if body['events'] or result['snapshots'] else 'empty'
    # Empty content alone creates a zero-length text event; inspect its substance.
    if result['contentState'] == 'nonempty' and body and not body['text'] and not any(e['type'] not in ('text',) for e in body['events']) and not result['snapshots']:
        result['contentState'] = 'empty'
    ref = merged.get('message_reference')
    if ref is not None:
        _object(ref)
        if 'type' in ref and (not isinstance(ref['type'], int) or isinstance(ref['type'], bool)):
            raise ExtractionError('Expected integer reference type')
        ref = {k: snowflake(v) if k in ('message_id', 'channel_id', 'guild_id') else v for k, v in ref.items() if k in ('type', 'message_id', 'channel_id', 'guild_id')}
    result['messageReference'] = ref
    referenced = merged.get('referenced_message')
    result['referencedMessage'] = dict(state='absent_unknown' if 'referenced_message' not in merged else 'explicit_null_deleted' if referenced is None else 'present',
                                      id=snowflake(_object(referenced).get('id')) if referenced is not None else None)
    result['warnings'].append('Offline projection of selected content fields only; no API grant, complete rendering, history, download or playback acceptance')
    if partial:
        result['warnings'].append('Partial update; absent fields preserved when prior runtime record supplied; event ordering not resolved')
    if access in ('denied', 'intent_limited', 'unknown'):
        result['gates'].append(access)
    result['_payload'] = merged  # PRIVATE in-memory state for absent-field reconciliation.
    return result


def discord_receipt(record):
    """Whitelisted hashes/counts and URL references, never prose or delivery URLs.

    Only allowlisted identity/CDN references are published; CDN attachment
    references omit filenames. References are not renewal/download routes.
    No API response, webhook token, filename, waveform, description or name is
    copied. Treat even sanitized receipt identities/references as scoped data.
    """
    def safe_reference(value):
        # Arbitrary URL paths may themselves contain tokens (e.g. webhooks).
        # Publish only known identity/CDN routes; external URLs remain hashed
        # inside the body digest. Attachment references omit filenames too.
        value = public_url(value)
        if value is None:
            return None
        parsed = urlsplit(value)
        if parsed.scheme != 'https' or parsed.port is not None:
            return None
        path = parsed.path
        sid = r'[1-9][0-9]{0,19}'
        if parsed.hostname == 'discord.com' and re.fullmatch(r'/(?:users/' + sid + r'|channels/(?:@me|' + sid + r')/' + sid + r'/' + sid + r')', path):
            return value
        if parsed.hostname in ('cdn.discordapp.com', 'media.discordapp.net'):
            match = re.fullmatch(r'/attachments/(' + sid + r')/(' + sid + r')/[^/]+', path)
            if match:
                return f'https://{parsed.hostname}/attachments/{match[1]}/{match[2]}/'
            if re.fullmatch(r'/(?:avatars/' + sid + r'|guilds/' + sid + r'/users/' + sid + r'/avatars)/(?:a_)?[a-fA-F0-9]{32}\.(?:png|gif|webp)', path):
                return value
        return None

    def digest(value):
        return sha256(value) if isinstance(value, str) else None

    def body_summary(body):
        if body is None:
            return None
        refs = []
        for e in body['events']:
            refs.append({k: e[k] for k in ('type', 'source', 'attachmentId', 'componentType', 'mediaKind', 'spoiler', 'downloaded', 'playbackVerified') if k in e})
            for key in ('url', 'proxyUrl'):
                if key in e:
                    refs[-1][key + 'Reference'] = safe_reference(e[key])
        return dict(characters=len(body['text']), textSha256=sha256(body['text']), rawSha256=sha256(body['raw']),
                    eventCount=len(refs), events=refs, projectionComplete=body['projectionComplete'])

    return dict(family='discord_message', scope='synthetic_or_caller_supplied_offline_projection', fullSupportAccepted=False,
                sourceUrlReference=safe_reference(record['sourceUrl']), identity=deepcopy(record['identity']),
                access=deepcopy(record['access']), contentState=record['contentState'], fieldPresence=list(record['fieldPresence']),
                people=[dict(id=p['id'], kind=p['kind'], nameSha256=digest(p.get('name')),
                             avatarReference=safe_reference(p.get('avatar')), globalAvatarReference=safe_reference(p.get('globalAvatar')),
                             guildAvatarReference=safe_reference(p.get('guildAvatar'))) for p in record['people']],
                body=body_summary(record['body']), fileRepresentationCount=len(record['files']),
                attachmentCount=len(record['_payload'].get('attachments', [])),
                snapshots=[dict(body=body_summary(x['body']), fileRepresentationCount=len(x['files']), authorState=x['authorState']) for x in record['snapshots']],
                messageReference=deepcopy(record['messageReference']), referencedMessage=deepcopy(record['referencedMessage']),
                warningCount=len(record['warnings']))
