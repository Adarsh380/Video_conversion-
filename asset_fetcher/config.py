from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    def load_dotenv(*args, **kwargs):
        return None

load_dotenv()


class ConfigurationError(Exception):
    """Raised when required configuration values are missing."""


@dataclass(frozen=True)
class AssetFetcherConfig:
    """Configuration values for the asset fetching system."""

    pexels_api_key: str = field(default_factory=lambda: os.getenv('PEXELS_API_KEY', '').strip())
    pixabay_api_key: str = field(default_factory=lambda: os.getenv('PIXABAY_API_KEY', '').strip())
    unsplash_access_key: str = field(default_factory=lambda: os.getenv('UNSPLASH_ACCESS_KEY', '').strip())
    assets_root: Path = Path('assets')
    cache_ttl_seconds: int = 24 * 60 * 60
    request_timeout_seconds: int = 15
    concurrency_limit: int = 8
    max_downloads_per_scene: int = 4
    max_search_results_per_keyword: int = 10
    retry_attempts: int = 3
    retry_backoff_seconds: float = 1.5
    log_level: str = 'INFO'
    user_agent: str = 'AssetFetcher/1.0 (+https://example.com)'

    images_dir: Path = field(init=False)
    videos_dir: Path = field(init=False)
    metadata_file: Path = field(init=False)
    cache_dir: Path = field(init=False)

    def __post_init__(self):
        object.__setattr__(self, 'images_dir', self.assets_root / 'images')
        object.__setattr__(self, 'videos_dir', self.assets_root / 'videos')
        object.__setattr__(self, 'metadata_file', self.assets_root / 'metadata.json')
        object.__setattr__(self, 'cache_dir', self.assets_root / 'cache')

    def validate(self) -> None:
        if not any((self.pexels_api_key, self.pixabay_api_key, self.unsplash_access_key)):
            raise ConfigurationError(
                'At least one stock media API key must be configured: PEXELS_API_KEY, PIXABAY_API_KEY, or UNSPLASH_ACCESS_KEY.'
            )


def load_config() -> AssetFetcherConfig:
    """Load and validate configuration from environment and filesystem."""
    config = AssetFetcherConfig()
    config.validate()
    for path in (config.assets_root, config.images_dir, config.videos_dir, config.cache_dir, config.metadata_file.parent):
        path.mkdir(parents=True, exist_ok=True)
    return config
