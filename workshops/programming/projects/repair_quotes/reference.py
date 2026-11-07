"""Reference solution. Pure transformations; no files, network or payments."""
import json
import re

def validate_item(item):
    if not isinstance(item, dict) or set(item) != {'sku', 'quantity', 'unit_cents'}:
        raise ValueError('item must contain exactly sku, quantity and unit_cents')
    if not isinstance(item['sku'], str) or re.fullmatch('[A-Z0-9-]{1,20}', item['sku']) is None:
        raise ValueError('sku must be 1–20 uppercase ASCII letters, digits or hyphens')
    if type(item['quantity']) is not int or not 1 <= item['quantity'] <= 1000:
        raise ValueError('quantity must be an integer from 1 to 1000')
    if type(item['unit_cents']) is not int or not 0 <= item['unit_cents'] <= 1000000:
        raise ValueError('unit_cents must be an integer from 0 to 1000000')
    return dict(sku=item['sku'], quantity=item['quantity'], unit_cents=item['unit_cents'])

def quote_total(items):
    if not isinstance(items, list) or len(items) > 100:
        raise ValueError('items must be a list of at most 100 rows')
    grouped = {}
    units = 0
    subtotal = 0
    for raw in items:
        item = validate_item(raw)
        value = item['quantity'] * item['unit_cents']
        units += item['quantity']
        subtotal += value
        if item['sku'] not in grouped:
            grouped[item['sku']] = {'sku': item['sku'], 'quantity': 0, 'subtotal_cents': 0}
        grouped[item['sku']]['quantity'] += item['quantity']
        grouped[item['sku']]['subtotal_cents'] += value
    return {'line_count': len(items), 'unit_count': units, 'subtotal_cents': subtotal, 'by_sku': [grouped[sku] for sku in sorted(grouped)]}

def format_cents(cents):
    if type(cents) is not int or not 0 <= cents <= 100000000000:
        raise ValueError('cents must be an integer from 0 to 100000000000')
    return f'{cents // 100}.{cents % 100:02d}'

def parse_quote_json(text):
    if not isinstance(text, str) or len(text.encode('utf-8')) > 8192:
        raise ValueError('quote JSON must be text of at most 8192 UTF-8 bytes')

    def pairs_to_dict(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError('duplicate JSON key: ' + key)
            result[key] = value
        return result

    def reject_constant(value):
        raise ValueError('nonstandard JSON number')
    try:
        data = json.loads(text, object_pairs_hook=pairs_to_dict, parse_constant=reject_constant)
    except (json.JSONDecodeError, RecursionError) as exc:
        raise ValueError('invalid quote JSON') from exc
    if not isinstance(data, list) or len(data) > 100:
        raise ValueError('quote root must be a list of at most 100 rows')
    return [validate_item(item) for item in data]
