const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.PIXABAY_API_KEY || '';

async function searchVideos(query, opts = {}) {
  if (!API_KEY) throw new Error('Missing PIXABAY_API_KEY');
  const params = new URLSearchParams({
    key: API_KEY,
    q: query,
    safesearch: String(opts.safesearch ?? true),
    editors_choice: String(opts.editorsChoice ?? false),
    per_page: String(opts.perPage ?? 10),
    video_type: 'film',
    order: 'popular',
  });
  const url = `https://pixabay.com/api/videos/?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pixabay error ${res.status}`);
  const json = await res.json();
  const hits = Array.isArray(json.hits) ? json.hits : [];
  return hits.map((h) => {
    const video = h.videos?.medium?.url || h.videos?.small?.url || h.videos?.tiny?.url;
    return {
      url: video,
      duration: Number(h.duration || 0),
      credit: {
        source: 'Pixabay',
        user: h.user,
        pageURL: h.pageURL,
        tags: h.tags,
      },
    };
  });
}

module.exports = { searchVideos };
