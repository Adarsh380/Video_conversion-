from __future__ import annotations

import asyncio
import time
from typing import Dict, List

import httpx

from .api_clients import AssetProviderError, StockMediaClient
from .cache import CacheManager
from .config import AssetFetcherConfig, load_config
from .downloader import AssetDownloader
from .keywords import KeywordExtractor
from .logging import configure_logging, get_logger
from .metadata import MetadataManager
from .models import Asset, AssetType, Provider
from .utils import sanitize_keyword


class AssetFetcher:
    """High-level coordinator for keyword extraction, search, download, and metadata."""

    def __init__(self, config: AssetFetcherConfig) -> None:
        self.config = config
        configure_logging(self.config.log_level)
        self.logger = get_logger(self.__class__.__name__)
        self.cache = CacheManager(self.config.cache_dir, self.config.cache_ttl_seconds)
        self.metadata = MetadataManager(self.config.metadata_file)
        self.keyword_extractor = KeywordExtractor()
        self.http_client = httpx.AsyncClient(
            timeout=self.config.request_timeout_seconds,
            headers={'User-Agent': self.config.user_agent},
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
        )
        self.stock_client = StockMediaClient(self.config, self.http_client)
        self.downloader = AssetDownloader(self.config, self.http_client)
        self.search_semaphore = asyncio.Semaphore(self.config.concurrency_limit)

    async def close(self) -> None:
        await self.http_client.aclose()

    async def _search_provider(self, scene_id: str, provider: Provider, keyword: str, asset_type: AssetType) -> List[Asset]:
        cached = self.cache.get(provider, asset_type, keyword)
        if cached is not None:
            self.logger.info(
                'cache_hit',
                extra={'scene_id': scene_id, 'provider': provider.value, 'keyword': keyword, 'asset_type': asset_type.value},
            )
            return [Asset.from_dict(item) for item in cached]

        async with self.search_semaphore:
            self.logger.info(
                'search_started',
                extra={'scene_id': scene_id, 'provider': provider.value, 'keyword': keyword, 'asset_type': asset_type.value},
            )
            try:
                if asset_type == AssetType.IMAGE:
                    results = await self.stock_client.search_images(provider, keyword)
                else:
                    results = await self.stock_client.search_videos(provider, keyword)
            except AssetProviderError as exc:
                self.logger.error(
                    'search_error',
                    extra={
                        'scene_id': scene_id,
                        'provider': provider.value,
                        'keyword': keyword,
                        'asset_type': asset_type.value,
                        'error': str(exc),
                    },
                )
                return []

        for asset in results:
            asset.scene_id = scene_id
            asset.keyword = keyword

        self.cache.set(provider, asset_type, keyword, [asset.to_dict() for asset in results])
        return results

    def _rank_asset(self, asset: Asset) -> int:
        score = 0
        if asset.asset_type == AssetType.VIDEO:
            score += 100000
        try:
            width, height = [int(value) for value in asset.resolution.split('x') if value.isdigit()]
            score += width * height
        except ValueError:
            score += 0
        priority = {
            Provider.PEXELS: 30,
            Provider.PIXABAY: 20,
            Provider.UNSPLASH: 10,
        }
        score += priority.get(asset.provider, 0)
        return score

    def _select_assets(self, assets: List[Asset]) -> List[Asset]:
        candidates = sorted(assets, key=self._rank_asset, reverse=True)
        selected: List[Asset] = []
        for asset in candidates:
            if len(selected) >= self.config.max_downloads_per_scene:
                break
            if any(a.download_url == asset.download_url for a in selected):
                continue
            selected.append(asset)
        return selected

    async def fetch_scene(self, scene_id: str, text: str) -> List[Asset]:
        start_time = time.perf_counter()
        keywords = self.keyword_extractor.extract_keywords(text, max_keywords=8)
        if not keywords:
            self.logger.warning('keyword_extraction_empty', extra={'scene_id': scene_id})
            return []

        providers = [Provider.PEXELS, Provider.PIXABAY, Provider.UNSPLASH]
        search_tasks = []
        for keyword in keywords:
            normalized = sanitize_keyword(keyword)
            for provider in providers:
                search_tasks.append(self._search_provider(scene_id, provider, normalized, AssetType.IMAGE))
                if provider != Provider.UNSPLASH:
                    search_tasks.append(self._search_provider(scene_id, provider, normalized, AssetType.VIDEO))

        results = await asyncio.gather(*search_tasks, return_exceptions=True)
        assets: List[Asset] = []
        for item in results:
            if isinstance(item, list):
                assets.extend(item)
            else:
                self.logger.warning('search_task_failed', extra={'error': str(item)})

        selected = self._select_assets(assets)
        if not selected:
            self.logger.warning('no_assets_found', extra={'scene_id': scene_id, 'keywords': keywords})
            return []

        downloaded_assets = await self.downloader.download_assets(selected)
        for asset in downloaded_assets:
            self.metadata.add_asset(asset)

        elapsed = time.perf_counter() - start_time
        self.logger.info(
            'scene_fetch_complete',
            extra={
                'scene_id': scene_id,
                'keyword_count': len(keywords),
                'downloaded_assets': len(downloaded_assets),
                'duration_seconds': round(elapsed, 2),
            },
        )
        return downloaded_assets

    async def fetch_scenes(self, scenes: List[Dict[str, str]]) -> List[Asset]:
        tasks = [self.fetch_scene(str(scene['scene_id']), scene['text']) for scene in scenes]
        completed = await asyncio.gather(*tasks, return_exceptions=True)
        assets: List[Asset] = []
        for result in completed:
            if isinstance(result, list):
                assets.extend(result)
            else:
                self.logger.warning('scene_fetch_failed', extra={'error': str(result)})
        await self.close()
        return assets


async def fetch_assets_for_scenes(scenes: List[Dict[str, str]], config: AssetFetcherConfig | None = None) -> List[Asset]:
    config = config or load_config()
    fetcher = AssetFetcher(config)
    return await fetcher.fetch_scenes(scenes)


if __name__ == '__main__':
    import json
    from pathlib import Path
    sample = [
        {'scene_id': 'scene-1', 'text': 'A team of creative professionals editing video content with motion graphics.'},
        {'scene_id': 'scene-2', 'text': 'A friendly customer service representative talking on the phone in a modern office.'},
    ]
    config = load_config()
    fetcher = AssetFetcher(config)
    assets = asyncio.run(fetch_assets_for_scenes(sample, config))
    output_file = Path(config.assets_root) / 'sample_metadata.json'
    with output_file.open('w', encoding='utf-8') as handle:
        json.dump([asset.to_dict() for asset in assets], handle, indent=2)
    print(f'Wrote {len(assets)} assets to {output_file}')
