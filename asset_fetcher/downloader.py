from __future__ import annotations

import asyncio
import httpx
from pathlib import Path
from typing import List

from .config import AssetFetcherConfig
from .logging import get_logger
from .models import Asset, AssetType
from .utils import ensure_directory, get_file_extension, make_hash


class DownloadError(Exception):
    """Raised when a download fails after retry attempts."""


class AssetDownloader:
    """Download assets concurrently and save them to organized folders."""

    def __init__(self, config: AssetFetcherConfig, http_client: httpx.AsyncClient) -> None:
        self.config = config
        self.http_client = http_client
        self.logger = get_logger(self.__class__.__name__)
        self.semaphore = asyncio.Semaphore(self.config.concurrency_limit)
        ensure_directory(self.config.images_dir)
        ensure_directory(self.config.videos_dir)

    async def download_asset(self, asset: Asset) -> Asset:
        if asset.local_path and asset.local_path.exists():
            return asset

        folder = self.config.images_dir if asset.asset_type == AssetType.IMAGE else self.config.videos_dir
        ensure_directory(folder)
        file_hash = make_hash(asset.download_url, asset.provider.value, asset.asset_type.value)
        extension = get_file_extension(asset.download_url)
        destination = folder / f'{file_hash}{extension}'
        asset.local_path = destination
        if destination.exists() and destination.stat().st_size > 0:
            return asset

        async with self.semaphore:
            last_error = None
            for attempt in range(1, self.config.retry_attempts + 1):
                try:
                    response = await self.http_client.get(
                        asset.download_url,
                        timeout=self.config.request_timeout_seconds,
                        headers={'User-Agent': self.config.user_agent},
                    )
                    response.raise_for_status()
                    content = response.content
                    if not content:
                        raise DownloadError('Downloaded file is empty.')
                    tmp_path = folder / f'.{file_hash}.partial'
                    tmp_path.write_bytes(content)
                    tmp_path.rename(destination)
                    asset.local_path = destination
                    return asset
                except (httpx.HTTPError, OSError, DownloadError) as exc:
                    last_error = exc
                    self.logger.warning(
                        'download_retry',
                        extra={
                            'url': asset.download_url,
                            'attempt': attempt,
                            'error': str(exc),
                        },
                    )
                    if attempt >= self.config.retry_attempts:
                        break
                    await asyncio.sleep(self.config.retry_backoff_seconds * attempt)

        raise DownloadError(f'Unable to download asset from {asset.download_url}: {last_error}')

    async def download_assets(self, assets: List[Asset]) -> List[Asset]:
        tasks = [self.download_asset(asset) for asset in assets]
        completed = await asyncio.gather(*tasks, return_exceptions=True)
        valid_assets: List[Asset] = []
        for result in completed:
            if isinstance(result, Asset):
                valid_assets.append(result)
            else:
                self.logger.error('asset_download_failed', extra={'error': str(result)})
        return valid_assets
