"""Your Repair Quotes workspace. Implement these functions from CONTRACT.md.

The reference solution is separate. Do not change the visible acceptance tests
just to make them pass. These placeholders intentionally raise NotImplementedError.
"""

def validate_item(item):
    """Validate exact keys/types/bounds; return a new normalized row."""
    raise NotImplementedError('Implement validate_item from CONTRACT.md')

def quote_total(items):
    """Return line count, unit count, subtotal cents and SKU-sorted aggregates."""
    raise NotImplementedError('Implement quote_total from CONTRACT.md')

def format_cents(cents):
    """Return a decimal display string with exactly two fractional digits."""
    raise NotImplementedError('Implement format_cents from CONTRACT.md')

def parse_quote_json(text):
    """Parse bounded JSON, reject duplicate keys and validate every item."""
    raise NotImplementedError('Implement parse_quote_json from CONTRACT.md')
