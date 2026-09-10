from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, Optional


class AssetType(str, Enum):
    IMAGE = 'image'
    VIDEO = 'video'


class Provider(str, Enum):
    PEXELS = 'pexels'
    PIXABAY = 'pixabay'
    UNSPLASH = 'unsplash'


@dataclass
class Asset:
    """Standardized representation of a downloaded stock media asset."""

    scene_id: str
    keyword: str
    provider: Provider
    asset_type: AssetType
    download_url: str
    thumbnail_url: str
    resolution: str
    duration: Optional[float]
    author: str
    license: str
    local_path: Optional[Path] = None
    source_id: Optional[str] = None
    raw_metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['provider'] = self.provider.value
        data['asset_type'] = self.asset_type.value
        data['local_path'] = str(self.local_path) if self.local_path else None
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Asset':
        local_path = Path(data['local_path']) if data.get('local_path') else None
        return cls(
            scene_id=data['scene_id'],
            keyword=data['keyword'],
            provider=Provider(data['provider']),
            asset_type=AssetType(data['asset_type']),
            download_url=data['download_url'],
            thumbnail_url=data['thumbnail_url'],
            resolution=data.get('resolution', ''),
            duration=data.get('duration'),
            author=data.get('author', ''),
            license=data.get('license', ''),
            local_path=local_path,
            source_id=data.get('source_id'),
            raw_metadata=data.get('raw_metadata', {}),
        )
