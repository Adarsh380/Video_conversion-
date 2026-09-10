from __future__ import annotations

import hashlib
import mimetypes
import re
from pathlib import Path
from typing import Iterable, Optional


def ensure_directory(path: Path) -> Path:
    """Create a directory if it does not already exist."""
    path.mkdir(parents=True, exist_ok=True)
    return path


def make_hash(*items: str) -> str:
    """Generate a stable hex hash from one or more strings."""
    normalized = '|'.join(item.strip() for item in items if item is not None)
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()


def get_file_extension(url: str, default: str = '.bin') -> str:
    """Derive a file extension from a URL or content type string."""
    if not url:
        return default
    url = url.split('?')[0].split('#')[0]
    guessed = Path(url).suffix
    if guessed:
        return guessed
    mime_type = mimetypes.guess_type(url)[0]
    if mime_type:
        extension = mimetypes.guess_extension(mime_type)
        if extension:
            return extension
    return default


def sanitize_keyword(keyword: str) -> str:
    """Normalize a phrase for search and caching."""
    return re.sub(r'\s+', ' ', keyword.strip()).lower()


def chunked(iterable: Iterable, size: int):
    """Return successive chunks from an iterable."""
    it = iter(iterable)
    while True:
        chunk = []
        for _ in range(size):
            try:
                chunk.append(next(it))
            except StopIteration:
                break
        if not chunk:
            break
        yield chunk
