"""Asset fetcher package for document-to-video pipeline."""

from .config import AssetFetcherConfig, load_config
from .fetcher import AssetFetcher
from .keywords import KeywordExtractor

__all__ = [
    'AssetFetcherConfig',
    'AssetFetcher',
    'KeywordExtractor',
]
