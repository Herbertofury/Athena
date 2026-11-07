"""Original local-list experiment. All mutation is confined to invented objects."""
import json

def demo():
    original = [{'quantity': 1}]
    alias = original
    shallow = list(original)
    separate = [dict(row) for row in original]
    shallow[0]['quantity'] = 3
    return {'alias_is_original': alias is original, 'shallow_is_original': shallow is original, 'nested_item_is_shared': shallow[0] is original[0], 'original_quantity_after_shallow_edit': original[0]['quantity'], 'separate_quantity': separate[0]['quantity'], 'scope': 'Flat dictionaries here; nested structures need their own copying design.'}
if __name__ == '__main__':
    print(json.dumps(demo(), indent=2))
