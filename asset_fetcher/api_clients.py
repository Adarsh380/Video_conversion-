from __future__ import annotations

import asyncio
import httpx
from pathlib import Path
from typing import Any, Dict, List, Optional

from .config import AssetFetcherConfig
from .logging import get_logger
from .models import Asset, AssetType, Provider
from .utils import get_file_extension, sanitize_keyword


class AssetProviderError(Exception):
    """Raised when an API provider returns an error or invalid response."""


class StockMediaClient:
    """Client for searching stock image and video providers."""

    def __init__(self, config: AssetFetcherConfig, http_client: httpx.AsyncClient) -> None:
        self.config = config
        self.http_client = http_client
        self.logger = get_logger(self.__class__.__name__)

    async def search_images(self, provider: Provider, keyword: str) -> List[Asset]:
        if provider == Provider.PEXELS:
            return await self._search_pexels_photos(keyword)
        if provider == Provider.PIXABAY:
            return await self._search_pixabay_images(keyword)
        if provider == Provider.UNSPLASH:
            return await self._search_unsplash_photos(keyword)
        return []

    async def search_videos(self, provider: Provider, keyword: str) -> List[Asset]:
        if provider == Provider.PEXELS:
            return await self._search_pexels_videos(keyword)
        if provider == Provider.PIXABAY:
            return await self._search_pixabay_videos(keyword)
        return []

    async def _request_json(self, method: str, url: str, headers: Dict[str, str], params: Dict[str, Any]) -> Dict[str, Any]:
        for attempt in range(1, self.config.retry_attempts + 1):
            try:
                response = await self.http_client.request(method, url, headers=headers, params=params)
                if response.status_code in {429, 500, 502, 503, 504}:
                    raise AssetProviderError(f'API responded with retryable status {response.status_code}')
                response.raise_for_status()
                return response.json()
            except (httpx.HTTPError, AssetProviderError, ValueError) as exc:
                self.logger.warning(
                    'api_request_retry', extra={'url': url, 'status_code': getattr(exc, 'response', None), 'attempt': attempt, 'error': str(exc)}
                )
                if attempt >= self.config.retry_attempts:
                    raise
                await asyncio.sleep(self.config.retry_backoff_seconds * attempt)
        raise AssetProviderError('Exceeded retry attempts for API request.')

    async def _search_pexels_photos(self, keyword: str) -> List[Asset]:
        if not self.config.pexels_api_key:
            raise AssetProviderError('Missing PEXELS_API_KEY')
        headers = {'Authorization': self.config.pexels_api_key}
        url = 'https://api.pexels.com/v1/search'
        params = {'query': sanitize_keyword(keyword), 'per_page': self.config.max_search_results_per_keyword}
        payload = await self._request_json('GET', url, headers, params)
        photos = payload.get('photos', [])
        assets = []
        for item in photos:
            src = item.get('src', {})
            assets.append(
                Asset(
                    scene_id='',
                    keyword=keyword,
                    provider=Provider.PEXELS,
                    asset_type=AssetType.IMAGE,
                    download_url=src.get('original') or src.get('large2x') or src.get('large') or src.get('medium', ''),
                    thumbnail_url=src.get('medium', ''),
                    resolution=f"{item.get('width', 0)}x{item.get('height', 0)}",
                    duration=None,
                    author=item.get('photographer', 'Pexels'),
                    license='Pexels License',
                    source_id=str(item.get('id', '')),
                    raw_metadata=item,
                )
            )
        return assets

    async def _search_pexels_videos(self, keyword: str) -> List[Asset]:
        if not self.config.pexels_api_key:
            raise AssetProviderError('Missing PEXELS_API_KEY')
        headers = {'Authorization': self.config.pexels_api_key}
        url = 'https://api.pexels.com/videos/search'
        params = {'query': sanitize_keyword(keyword), 'per_page': self.config.max_search_results_per_keyword}
        payload = await self._request_json('GET', url, headers, params)
        videos = payload.get('videos', [])
        assets = []
        for item in videos:
            files = item.get('video_files', [])
            if not files:
                continue
            file = max(files, key=lambda file_item: file_item.get('width', 0) * file_item.get('height', 0))
            assets.append(
                Asset(
                    scene_id='',
                    keyword=keyword,
                    provider=Provider.PEXELS,
                    asset_type=AssetType.VIDEO,
                    download_url=file.get('link', ''),
                    thumbnail_url=item.get('image', ''),
                    resolution=f"{file.get('width', 0)}x{file.get('height', 0)}",
                    duration=float(item.get('duration', 0) or 0),
                    author=item.get('user', {}).get('name', 'Pexels'),
                    license='Pexels License',
                    source_id=str(item.get('id', '')),
                    raw_metadata=item,
                )
            )
        return assets

    async def _search_pixabay_images(self, keyword: str) -> List[Asset]:
        if not self.config.pixabay_api_key:
            raise AssetProviderError('Missing PIXABAY_API_KEY')
        url = 'https://pixabay.com/api/'
        params = {
            'key': self.config.pixabay_api_key,
            'q': sanitize_keyword(keyword),
            'image_type': 'photo',
            'per_page': self.config.max_search_results_per_keyword,
        }
        payload = await self._request_json('GET', url, {}, params)
        hits = payload.get('hits', [])
        assets = []
        for item in hits:
            assets.append(
                Asset(
                    scene_id='',
                    keyword=keyword,
                    provider=Provider.PIXABAY,
                    asset_type=AssetType.IMAGE,
                    download_url=item.get('largeImageURL', ''),
                    thumbnail_url=item.get('previewURL', ''),
                    resolution=f"{item.get('imageWidth', 0)}x{item.get('imageHeight', 0)}",
                    duration=None,
                    author=item.get('user', 'Pixabay'),
                    license='Pixabay License',
                    source_id=str(item.get('id', '')),
                    raw_metadata=item,
                )
            )
        return assets

    async def _search_pixabay_videos(self, keyword: str) -> List[Asset]:
        if not self.config.pixabay_api_key:
            raise AssetProviderError('Missing PIXABAY_API_KEY')
        url = 'https://pixabay.com/api/videos/'
        params = {
            'key': self.config.pixabay_api_key,
            'q': sanitize_keyword(keyword),
            'per_page': self.config.max_search_results_per_keyword,
        }
        payload = await self._request_json('GET', url, {}, params)
        hits = payload.get('hits', [])
        assets = []
        for item in hits:
            video_map = item.get('videos', {})
            if not video_map:
                continue
            best_file = max(video_map.values(), key=lambda file_item: file_item.get('width', 0) * file_item.get('height', 0))
            thumbnail = ''
            picture_id = item.get('picture_id')
            if picture_id:
                thumbnail = f'https://i.vimeocdn.com/video/{picture_id}_295x166.jpg'
            assets.append(
                Asset(
                    scene_id='',
                    keyword=keyword,
                    provider=Provider.PIXABAY,
                    asset_type=AssetType.VIDEO,
                    download_url=best_file.get('url', ''),
                    thumbnail_url=thumbnail,
                    resolution=f"{best_file.get('width', 0)}x{best_file.get('height', 0)}",
                    duration=float(item.get('duration', 0) or 0),
                    author=item.get('user', 'Pixabay'),
                    license='Pixabay License',
                    source_id=str(item.get('id', '')),
                    raw_metadata=item,
                )
            )
        return assets

    async def _search_unsplash_photos(self, keyword: str) -> List[Asset]:
        if not self.config.unsplash_access_key:
            raise AssetProviderError('Missing UNSPLASH_ACCESS_KEY')
        headers = {'Authorization': f'Client-ID {self.config.unsplash_access_key}'}
        url = 'https://api.unsplash.com/search/photos'
        params = {
            'query': sanitize_keyword(keyword),
            'per_page': self.config.max_search_results_per_keyword,
        }
        payload = await self._request_json('GET', url, headers, params)
        results = payload.get('results', [])
        assets = []
        for item in results:
            urls = item.get('urls', {})
            assets.append(
                Asset(
                    scene_id='',
                    keyword=keyword,
                    provider=Provider.UNSPLASH,
                    asset_type=AssetType.IMAGE,
                    download_url=urls.get('full', '') or urls.get('raw', ''),
                    thumbnail_url=urls.get('small', ''),
                    resolution=f"{item.get('width', 0)}x{item.get('height', 0)}",
                    duration=None,
                    author=item.get('user', {}).get('name', 'Unsplash'),
                    license='Unsplash License',
                    source_id=item.get('id'),
                    raw_metadata=item,
                )
            )
        return assets
