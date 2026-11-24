"""Your Event Summary workspace. Implement CONTRACT.md without changing specs.py.

These placeholders are intentionally unfinished. Tests run your code with your
normal Python permissions; the runner is not a sandbox. Use only your own trusted code.
"""

def validate_event(event):
    """Validate normalized fields/types/bounds and return a new dictionary."""
    raise NotImplementedError('Implement validate_event from CONTRACT.md')

def parse_events_csv(text):
    """Parse bounded standard CSV with the exact header; validate every row."""
    raise NotImplementedError('Implement parse_events_csv from CONTRACT.md')

def summarize_events(events, slowest_limit=3):
    """Deduplicate identical IDs, reject conflicts, aggregate and sort deterministically."""
    raise NotImplementedError('Implement summarize_events from CONTRACT.md')
