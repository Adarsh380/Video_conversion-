function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toSentenceCase(str) {
  return String(str || '').replace(/\s+/g, ' ').trim();
}

function makePalette(index) {
  const palettes = [
    '#1d4ed8', '#7c3aed', '#0ea5e9', '#14b8a6', '#f97316', '#ef4444', '#ec4899', '#84cc16'
  ];
  return palettes[index % palettes.length];
}

function resolveMediaUrl(index, keywordList) {
  // Choose a primary keyword for image search; fallback to 'office'
  const primary = (keywordList && keywordList.length ? String(keywordList[0]) : 'office').replace(/\s+/g, '+');
  // Use Unsplash Source to return a different image per keyword. Add index as a cache-buster.
  const imageUrl = `https://source.unsplash.com/1600x900/?${encodeURIComponent(primary)}&sig=${index}`;

  // For video fallback, cycle a small set but also attach the keyword as a hint (some CDNs ignore query)
  const fallbackVideoUrls = [
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://media.w3.org/2010/05/sintel/trailer.mp4',
  ];
  const videoUrl = fallbackVideoUrls[index % fallbackVideoUrls.length];
  const keyword = primary.replace(/\+/g, '+');
  return { imageUrl, videoUrl, keyword };
}

function buildJson2VideoMovie(sessions, options = {}) {
  const list = Array.isArray(sessions) ? sessions : [];
  if (!list.length) {
    throw new Error('No sessions available to build a JSON2Video movie.');
  }

  const projectName = options.projectName || 'Document Video';
  const totalDuration = list.reduce((sum, session) => {
    const value = Number(session.durationSeconds || session.duration || 10);
    return sum + (Number.isFinite(value) && value > 0 ? value : 10);
  }, 0);

  return {
    version: '1.0',
    name: projectName,
    description: 'Generated from the document processing pipeline',
    resolution: '1920x1080',
    aspectRatio: '16:9',
    fps: 30,
    duration: totalDuration,
    backgroundColor: '#0b1020',
    scenes: list.map((session, index) => {
      const title = toSentenceCase(session.title || session.topic || `Scene ${index + 1}`);
      const bodyText = toSentenceCase(session.text || title);
      const duration = clamp(Number(session.durationSeconds || session.duration || 10), 3, 30);
      const keywords = Array.isArray(session.keywords) && session.keywords.length
        ? session.keywords
        : Array.isArray(session.visualKeywords) && session.visualKeywords.length
          ? session.visualKeywords
          : ['professional', 'presentation'];

      const { imageUrl, videoUrl } = resolveMediaUrl(index, keywords);
      const audioUrl = options.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';

      return {
        id: `scene_${index + 1}`,
        name: title,
        duration,
        transition: {
          type: 'fade',
          duration: 0.6,
        },
        background: {
          type: 'solid',
          color: makePalette(index),
          opacity: 0.25,
        },
        layers: [
          {
            type: 'image',
            source: imageUrl,
            opacity: 0.4,
            fit: 'cover',
            position: {
              x: 0.5,
              y: 0.5,
            },
            size: {
              width: 1.0,
              height: 1.0,
            },
          },
          {
            type: 'video',
            source: videoUrl,
            opacity: 0.85,
            fit: 'cover',
            position: {
              x: 0.5,
              y: 0.5,
            },
            size: {
              width: 0.68,
              height: 0.68,
            },
            start: 0,
            end: duration,
          },
          {
            type: 'text',
            text: title,
            position: {
              x: 0.5,
              y: 0.12,
            },
            style: {
              fontSize: 48,
              fontWeight: '700',
              color: '#ffffff',
              align: 'center',
              family: 'Inter, Arial, sans-serif',
              shadow: { enabled: true, blur: 8, color: '#000000', alpha: 0.5 },
            },
            animation: {
              type: 'fadeIn',
              duration: 0.5,
            },
          },
          {
            type: 'text',
            text: bodyText,
            position: {
              x: 0.5,
              y: 0.76,
            },
            style: {
              fontSize: 28,
              fontWeight: '500',
              color: '#f8fafc',
              align: 'center',
              family: 'Inter, Arial, sans-serif',
              maxWidth: 900,
              lineHeight: 1.4,
            },
            animation: {
              type: 'slideUp',
              duration: 0.8,
            },
          },
        ],
        audio: {
          source: audioUrl,
          volume: 0.8,
          start: 0,
          end: duration,
        },
      };
    }),
  };
}

module.exports = {
  buildJson2VideoMovie,
};
