"""Original teaching fixtures, not production migration helpers."""


def label_before(record):
    name = record['name'].strip()
    if not name:
        raise ValueError('empty name')
    return '[' + record['kind'] + '] ' + name


def clean_name(raw_name):
    name = raw_name.strip()
    if not name:
        raise ValueError('empty name')
    return name


def label_after(record):
    # Evaluate validation before reading kind, preserving the original error order.
    name = clean_name(record['name'])
    return '[' + record['kind'] + '] ' + name


def creator_before(raw):
    name = raw.strip()
    if not name:
        raise ValueError('empty name')
    return name.casefold()


def project_before(raw):
    name = raw.strip()
    if not name:
        raise ValueError('empty name')
    return name  # Project identifiers remain case-sensitive.


def creator_after(raw):
    return clean_name(raw).casefold()


def project_after(raw):
    return clean_name(raw)


def receipt_before(n):
    return {'n': n, 'complete': n == 0}


def receipt_after(n):
    # Keep the existing keyword argument and persisted format at the boundary.
    pending_count = n
    return {'n': pending_count, 'complete': pending_count == 0}
