from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from .models import AssetType, Provider
from .utils import make_hash


class CacheManager:
    """File-backed cache for search results with TTL support."""

    def __init__(self, cache_dir: Path, ttl_seconds: int) -> None:
        self.cache_file = cache_dir / 'search_cache.json'
        self.ttl_seconds = ttl_seconds
        self._data: Dict[str, Dict[str, Any]] = {}
        self._load_cache()

    def _load_cache(self) -> None:
        if not self.cache_file.exists():
            self._data = {}
            return
        try:
            with self.cache_file.open('r', encoding='utf-8') as handle:
                self._data = json.load(handle)
        except (OSError, ValueError):
            self._data = {}

    def _save_cache(self) -> None:
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        with self.cache_file.open('w', encoding='utf-8') as handle:
            json.dump(self._data, handle, indent=2)

    def build_key(self, provider: Provider, asset_type: AssetType, keyword: str) -> str:
        return make_hash(provider.value, asset_type.value, keyword.lower())

    def get(self, provider: Provider, asset_type: AssetType, keyword: str) -> Optional[List[Dict[str, Any]]]:
        key = self.build_key(provider, asset_type, keyword)
        entry = self._data.get(key)
        if not entry:
            return None
        if time.time() - entry.get('timestamp', 0) > self.ttl_seconds:
            self._data.pop(key, None)
            self._save_cache()
            return None
        return entry.get('results')

    def set(self, provider: Provider, asset_type: AssetType, keyword: str, results: List[Dict[str, Any]]) -> None:
        key = self.build_key(provider, asset_type, keyword)
        self._data[key] = {
            'timestamp': time.time(),
            'results': results,
        }
        self._save_cache()
