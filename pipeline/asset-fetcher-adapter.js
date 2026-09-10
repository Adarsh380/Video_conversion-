const assetFetcher = require('../services/asset-fetcher');

async function fetchBackgroundClips(query, targetSeconds) {
  try {
    const videos = await assetFetcher.searchVideos(query, { perPage: 12, safesearch: true });
    if (Array.isArray(videos) && videos.length) {
      const long = videos.find((v) => v.duration >= (targetSeconds || 10) * 0.9);
      if (long) return [{ url: long.url, duration: long.duration || (targetSeconds || 10), credit: long.credit }];
      let picked = [];
      let sum = 0;
      for (const r of videos.sort((a, b) => (a.duration || 0) - (b.duration || 0))) {
        if (sum >= (targetSeconds || 10)) break;
        picked.push({ url: r.url, duration: r.duration || 4, credit: r.credit });
        sum += r.duration || 0;
      }
      if (picked.length) return picked;
    }
  } catch (err) {
    console.warn('[asset-adapter] video search error:', err && err.message ? err.message : err);
  }

  try {
    const images = await assetFetcher.searchImages(query, { perPage: 12 });
    if (Array.isArray(images) && images.length) {
      return images.map((img, idx) => ({
        url: img.url,
        duration: Math.min(Math.max(4, Math.round(((targetSeconds || 10) / Math.max(1, images.length)))), targetSeconds || 10),
        credit: img.credit,
      }));
    }
  } catch (err) {
    console.warn('[asset-adapter] image search error:', err && err.message ? err.message : err);
  }

  return [];
}

module.exports = { fetchBackgroundClips };
