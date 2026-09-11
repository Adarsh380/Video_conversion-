const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

const CACHE_DIR = process.env.VERCEL ? path.join('/tmp', 'assets') : path.join(__dirname, '..', '.cache', 'assets');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const PIXABAY_KEY = process.env.PIXABAY_API_KEY || '';
const PIXABAY_IMAGE_ENDPOINT = 'https://pixabay.com/api/';
const PIXABAY_VIDEO_ENDPOINT = 'https://pixabay.com/api/videos/';

function hashKey(s) {
  return crypto.createHash('md5').update(String(s || '')).digest('hex');
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

async function cachedFetch(key, fn, ttlMs = 1000 * 60 * 60 * 24) {
  const file = path.join(CACHE_DIR, `${hashKey(key)}.json`);
  try {
    if (fs.existsSync(file)) {
      const stat = fs.statSync(file);
      if (Date.now() - stat.mtimeMs < ttlMs) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      }
    }
  } catch (e) { }

  const result = await fn();
  try { fs.writeFileSync(file, JSON.stringify(result, null, 2), 'utf8'); } catch (e) {}
  return result;
}

function normalizePixabayImage(hit) {
  return {
    source: 'pixabay',
    id: hit.id,
    url: hit.largeImageURL || hit.webformatURL,
    thumb: hit.previewURL,
    width: hit.imageWidth || null,
    height: hit.imageHeight || null,
    tags: hit.tags ? String(hit.tags).split(',').map(t => t.trim()) : [],
    credit: {
      user: hit.user,
      pageURL: hit.pageURL,
    },
  };
}

function normalizePixabayVideo(hit) {
  const videoUrl = hit.videos?.medium?.url || hit.videos?.small?.url || hit.videos?.large?.url;
  return {
    source: 'pixabay',
    id: hit.id,
    url: videoUrl,
    duration: Number(hit.duration || 0),
    thumb: hit.picture_id ? `https://i.vimeocdn.com/video/${hit.picture_id}_640x360.jpg` : null,
    tags: hit.tags ? String(hit.tags).split(',').map(t => t.trim()) : [],
    credit: {
      user: hit.user,
      pageURL: hit.pageURL,
    },
  };
}

async function searchImages(query = '', opts = {}) {
  if (!PIXABAY_KEY) throw new Error('Missing PIXABAY_API_KEY');
  const params = new URLSearchParams({
    key: PIXABAY_KEY,
    q: query,
    image_type: opts.image_type || 'photo',
    safesearch: String(opts.safesearch ?? true),
    per_page: String(opts.perPage ?? 12),
    order: opts.order || 'popular',
  });
  const url = `${PIXABAY_IMAGE_ENDPOINT}?${params.toString()}`;
  return cachedFetch(url, async () => {
    const json = await fetchJson(url);
    const hits = Array.isArray(json.hits) ? json.hits : [];
    return hits.map(normalizePixabayImage);
  }, opts.ttlMs || 1000 * 60 * 60 * 24);
}

async function searchVideos(query = '', opts = {}) {
  if (!PIXABAY_KEY) throw new Error('Missing PIXABAY_API_KEY');
  const params = new URLSearchParams({
    key: PIXABAY_KEY,
    q: query,
    safesearch: String(opts.safesearch ?? true),
    per_page: String(opts.perPage ?? 10),
    order: opts.order || 'popular',
    video_type: opts.video_type || 'film',
  });
  const url = `${PIXABAY_VIDEO_ENDPOINT}?${params.toString()}`;
  return cachedFetch(url, async () => {
    const json = await fetchJson(url);
    const hits = Array.isArray(json.hits) ? json.hits : [];
    return hits.map(normalizePixabayVideo);
  }, opts.ttlMs || 1000 * 60 * 60 * 24);
}

module.exports = {
  searchImages,
  searchVideos,
};
