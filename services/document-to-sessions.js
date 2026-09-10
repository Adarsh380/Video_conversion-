const { generateNarration } = require('./llm');

function simpleKeywordExtractor(text, count = 6) {
  if (!text) return [];
  const words = String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const stop = new Set(['the','and','that','this','with','from','which','have','will','your','about','using','use','for','are','but','not','what','when','where','why','how','into']);
  const freq = {};
  for (const w of words) {
    if (w.length < 4) continue;
    if (stop.has(w)) continue;
    freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,count).map(([w]) => w);
}

function splitTextIntoChunks(text, approxWordsPerChunk = 80) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const chunks = [];
  for (let i = 0; i < words.length; i += approxWordsPerChunk) {
    chunks.push(words.slice(i, i + approxWordsPerChunk).join(' '));
  }
  return chunks;
}

function estimateDurationFromText(text) {
  const words = String(text || '').split(/\s+/).filter(Boolean).length;
  const wpm = 160; // spoken words per minute
  const seconds = Math.max(3, Math.round((words / wpm) * 60));
  return Math.min(seconds, 30);
}

async function documentToSessions(parsed) {
  if (!parsed) throw new Error('No parsed document provided');
  const sessions = [];

  const pages = Array.isArray(parsed.pages) && parsed.pages.length ? parsed.pages : [{ text: parsed.fullText || '', headings: [] }];

  for (let p = 0; p < pages.length; p++) {
    const page = pages[p];
    const text = page.text || '';
    const hs = Array.isArray(page.headings) ? page.headings : [];

    if (hs.length) {
      // Split page into paragraphs
      const parts = text.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
      for (let hi = 0; hi < hs.length; hi++) {
        const title = hs[hi];
        // Find paragraph that contains the heading or closest paragraph
        let body = '';
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].includes(title)) {
            body = parts[i + 1] || parts[i] || '';
            break;
          }
        }
        if (!body) body = parts[0] || text;
        const visualKeywords = simpleKeywordExtractor(title + ' ' + body, 6);
        const duration = estimateDurationFromText(body);
        sessions.push({
          title: String(title).slice(0, 120),
          text: body || (parsed.fullText ? String(parsed.fullText).slice(0, 400) : ''),
          duration,
          visualKeywords,
        });
      }
    } else if (text && text.length) {
      const chunks = splitTextIntoChunks(text, 80);
      for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];
        const title = (chunk.split(/[\.\!\?]/)[0] || '').slice(0, 60).trim() || `Page ${p + 1} - part ${ci + 1}`;
        const visualKeywords = simpleKeywordExtractor(chunk, 6);
        const duration = estimateDurationFromText(chunk);
        sessions.push({ title, text: chunk, duration, visualKeywords });
      }
    }
  }

  if (!sessions.length) {
    const chunks = splitTextIntoChunks(parsed.fullText || '', 100);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const visualKeywords = simpleKeywordExtractor(chunk, 6);
      sessions.push({ title: `Scene ${i + 1}`, text: chunk, duration: estimateDurationFromText(chunk), visualKeywords });
    }
  }

  // Optional narration generation via LLM
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    try {
      const narration = await generateNarration({ text: s.text, context: parsed.fullText });
      if (narration) s.narration = narration;
    } catch (e) {
      // ignore LLM errors
    }
  }

  const MAX_SCENES = Number(process.env.MAX_SCENES || 20);
  return { sessions: sessions.slice(0, MAX_SCENES) };
}

module.exports = { documentToSessions };
