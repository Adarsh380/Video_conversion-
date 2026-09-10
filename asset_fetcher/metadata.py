from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

from .models import Asset


class MetadataManager:
    """Persistence layer for downloaded asset metadata."""

    def __init__(self, metadata_file: Path) -> None:
        self.metadata_file = metadata_file
        self._assets: List[Dict[str, any]] = []
        self._seen_ids: set[str] = set()
        self._load_metadata()

    def _load_metadata(self) -> None:
        if not self.metadata_file.exists():
            self._assets = []
            self._seen_ids = set()
            return
        try:
            with self.metadata_file.open('r', encoding='utf-8') as handle:
                data = json.load(handle)
            self._assets = data.get('assets', [])
            self._seen_ids = {asset.get('source_id') or asset.get('download_url') for asset in self._assets}
        except (OSError, ValueError):
            self._assets = []
            self._seen_ids = set()

    def save(self) -> None:
        self.metadata_file.parent.mkdir(parents=True, exist_ok=True)
        with self.metadata_file.open('w', encoding='utf-8') as handle:
            json.dump({'assets': self._assets}, handle, indent=2)

    def add_asset(self, asset: Asset) -> None:
        identifier = asset.source_id or asset.download_url
        if identifier in self._seen_ids:
            return
        self._seen_ids.add(identifier)
        self._assets.append(asset.to_dict())
        self.save()

    def find_by_download_url(self, download_url: str) -> dict | None:  # type: ignore[misc]
        for item in self._assets:
            if item.get('download_url') == download_url:
                return item
        return None
