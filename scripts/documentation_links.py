"""Resolve Markdown URL destinations for existence checks, not anchor validation."""
from pathlib import Path
from urllib.parse import unquote, urlsplit


def local_target(document: Path, destination: str):
    """Return a local URL path, or None for external/current-document references.

    Split before decoding so an encoded # or ? remains part of a filename.
    Scheme/netloc URLs are not local filesystem targets. This performs no fetch.
    """
    url = urlsplit(destination)
    if url.scheme or url.netloc or not url.path:
        return None
    return document.parent / unquote(url.path, errors='strict')
