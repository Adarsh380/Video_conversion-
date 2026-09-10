// services/project-builder.js
const STOPWORDS = new Set([
  'the','and','is','in','it','of','to','a','for','on','with','as','that','this','an','are','by','from','or','be','at','was','were','which','but','not','have','has','had'
]);

function sanitizeText(s) {
  return String(s || '').replace(/\r\n/g,'\n').replace(/\t/g,' ').replace(/\u00A0/g,' ').trim();
}

function splitPages(text) {
  const clean = sanitizeText(text);
  if (!clean) return [];
  // If explicit page breaks exist
  if (clean.indexOf('\f') !== -1) return clean.split('\f').map(p=>p.trim()).filter(Boolean);
  // If PDF-style "Page 1" headings exist
  const pageMatches = clean.split(/\n(?=Page\s+\d+\b)/i);
  if (pageMatches.length > 1) return pageMatches.map(p=>p.trim()).filter(Boolean);
  // Fallback: chunk by ~1200 characters (approx a page)
  const size = 1200;
  const pages = [];
  for (let i = 0; i < clean.length; i += size) pages.push(clean.slice(i, i + size).trim());
  return pages;
}

function splitSections(pageText) {
  const lines = sanitizeText(pageText).split('\n');
  const sections = [];
  let current = { title: null, body: [] };

  const headingRe = /^(#{1,6})\s*(.+)$/; // markdown headings
  const allCapsRe = /^[A-Z0-9\s\-]{3,}$/;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line && current.body.length && current.title) {
      // keep blank lines
      current.body.push('');
      continue;
    }
    const h = line.match(headingRe);
    if (h) {
      if (current.title || current.body.length) sections.push({ ...current, body: current.body.join('\n').trim() });
      current = { title: h[2].trim(), body: [] };
      continue;
    }
    if (allCapsRe.test(line) && line.length < 80) {
      if (current.title || current.body.length) sections.push({ ...current, body: current.body.join('\n').trim() });
      current = { title: line.trim(), body: [] };
      continue;
    }
    current.body.push(line);
  }
  if (current.title || current.body.length) sections.push({ ...current, body: current.body.join('\n').trim() });
  // If no headings found, create a single section
  if (!sections.length) return [{ title: null, body: pageText.trim() }];
  return sections;
}

function extractKeywords(title, text, max=5) {
  const bag = {};
  const addWords = (str) => {
    if (!str) return;
    const words = String(str).toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean);
    for (const w of words) {
      if (STOPWORDS.has(w) || w.length < 3) continue;
      bag[w] = (bag[w] || 0) + 1;
    }
  };
  addWords(title);
  addWords(text);
  const arr = Object.keys(bag).sort((a,b)=>bag[b]-bag[a]);
  return arr.slice(0, max);
}

function estimateDurationSeconds(text) {
  const words = String(text || '').split(/\s+/).filter(Boolean).length;
  const seconds = Math.max(3, Math.min(30, Math.round(words / 3))); // ~180 wpm -> 3 wps conservative
  return seconds;
}

function buildProjectFromUpload({ fileName = 'uploaded', fileType = 'text', text = '', uploadTime = null }) {
  const cleaned = sanitizeText(text || '');
  const pages = splitPages(cleaned).map((p, i) => ({
    page: i + 1,
    text: p,
    length: p.length,
  }));
  const sections = [];
  pages.forEach((p) => {
    const secs = splitSections(p.text);
    secs.forEach((s, idx) => {
      sections.push({
        page: p.page,
        indexInPage: idx + 1,
        title: s.title || null,
        text: s.body || '',
      });
    });
  });

  // Build scenes from sections heuristically
  const scenes = sections.map((s, i) => {
    const title = s.title || (s.text ? s.text.split('\n')[0].slice(0,60) : `Scene ${i+1}`);
    const keywords = extractKeywords(title, s.text, 6);
    const duration = estimateDurationSeconds(s.text || title);
    return {
      id: `scene_${i+1}`,
      title: title,
      text: s.text || '',
      estimatedDuration: duration,
      keywords,
      placeholders: {
        images: [],
        videos: [],
        narration: null,
        captions: null,
      },
    };
  });

  const metadata = {
    fileName,
    fileType,
    pageCount: pages.length,
    uploadTime: uploadTime || new Date().toISOString(),
  };

  return {
    metadata,
    pages,
    sections,
    scenes,
    sessions: scenes.map((sc) => ({
      title: sc.title,
      text: sc.text,
      duration: sc.estimatedDuration,
      visualKeywords: sc.keywords,
    })),
  };
}

module.exports = { buildProjectFromUpload };
