const { searchImages } = require('./asset-fetcher');
const { generateNarration } = require('./llm');
const fs = require('fs');
const path = require('path');
const STOPWORDS = new Set(['about', 'after', 'also', 'and', 'are', 'been', 'from', 'have', 'into', 'more', 'over', 'that', 'the', 'their', 'these', 'this', 'with']);

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function truncateAtBoundary(value, limit) {
  const text = cleanText(value);
  if (text.length <= limit) return text;
  const boundary = Math.max(text.lastIndexOf('. ', limit), text.lastIndexOf('; ', limit), text.lastIndexOf(', ', limit));
  return `${text.slice(0, boundary > limit * 0.55 ? boundary + 1 : limit).trim()}...`;
}

function sourcePreview(value) {
  const text = cleanText(value);
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  return truncateAtBoundary(sentences.slice(0, 2).join(' '), 220);
}

function visualQuery(scene) {
  const words = cleanText(`${scene.title} ${scene.keyConcept}`).toLowerCase().match(/[a-z][a-z-]{2,}/g) || [];
  const query = words.filter((word) => !STOPWORDS.has(word)).slice(0, 5).join(' ');
  return query || 'education concept';
}

function isMeaningfulHeading(title) {
  const value = cleanText(title);
  return value.length >= 5 && !/^(scene|page|section|part)\s*\d+$/i.test(value);
}

function groupForPresentation(plannedScenes) {
  const totalWords = plannedScenes.reduce((sum, scene) => sum + cleanText(scene.text || scene.fullContent).split(/\s+/).filter(Boolean).length, 0);
  const maxSceneWords = 850;
  const sourceUnits = [];
  plannedScenes.forEach((scene) => {
    const words = cleanText(scene.text || scene.fullContent).split(/\s+/).filter(Boolean);
    if (words.length <= maxSceneWords) { sourceUnits.push(scene); return; }
    for (let offset = 0; offset < words.length; offset += maxSceneWords) {
      const part = Math.floor(offset / maxSceneWords) + 1;
      const text = words.slice(offset, offset + maxSceneWords).join(' ');
      sourceUnits.push({ ...scene, id: `${scene.id}_part_${part}`, title: `${scene.title || 'Section'} (continued ${part})`, text, fullContent: text, sourceWordStart: offset, sourceWordEnd: Math.min(offset + maxSceneWords, words.length) });
    }
  });  const targetWords = totalWords <= 160 ? 70 : totalWords <= 600 ? 105 : 135;
  
  const groups = [];
  let current = null;

  function startGroup(scene, index) {
    return { sourceScenes: [scene], sourceIndexes: [index], words: cleanText(scene.text || scene.fullContent).split(/\s+/).filter(Boolean).length };
  }
  function flush(reason) {
    if (!current) return;
    const first = current.sourceScenes[0];
    const sourceText = current.sourceScenes.map((scene) => scene.text || scene.fullContent || '').join(' ').trim();
    const sourcePages = current.sourceScenes.flatMap((scene) => [scene.sourcePageStart, scene.sourcePageEnd]).filter((page) => Number.isFinite(Number(page)));
    groups.push({
      id: first.id || `scene_${groups.length + 1}`,
      title: truncateAtBoundary(first.title || `Section ${groups.length + 1}`, 72),
      keyConcept: truncateAtBoundary(sourcePreview(sourceText), 120),
      supportingText: truncateAtBoundary(sourcePreview(sourceText.slice(120).replace(/^\S+\s+/, '')), 180),
      sourceSceneIds: current.sourceScenes.map((scene) => scene.id),
      sourceIndexes: current.sourceIndexes,
      sourceText,
      sourceWordCount: current.words,
      sourcePageStart: sourcePages.length ? Math.min(...sourcePages.map(Number)) : null,
      sourcePageEnd: sourcePages.length ? Math.max(...sourcePages.map(Number)) : null,
      groupingReason: reason,
    });
    current = null;
  }

  sourceUnits.forEach((scene, index) => {
    const sceneWords = cleanText(scene.text || scene.fullContent).split(/\s+/).filter(Boolean).length;
    const headingBoundary = current && isMeaningfulHeading(scene.title) && current.words >= targetWords * 0.45;
    const contentBoundary = current && ((current.words + sceneWords > maxSceneWords) || (current.words >= targetWords && (current.words + sceneWords > targetWords * 1.25 || isMeaningfulHeading(scene.title))));
    if (headingBoundary || contentBoundary) flush(headingBoundary ? 'heading-boundary' : 'content-target');
    if (!current) current = startGroup(scene, index);
    else { current.sourceScenes.push(scene); current.sourceIndexes.push(index); current.words += sceneWords; }
  });
  flush('document-end');
  return groups;
}
const CURATED_IMAGES = [
  { terms: ['climate', 'warming', 'emission', 'carbon', 'environment', 'temperature', 'weather', 'ocean', 'ice'], urls: ['https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1600', 'https://images.pexels.com/photos/1108701/pexels-photo-1108701.jpeg?auto=compress&cs=tinysrgb&w=1600'], label: 'Climate and natural environment' },
  { terms: ['solar', 'wind', 'renewable', 'energy', 'electricity'], urls: ['https://images.pexels.com/photos/433308/pexels-photo-433308.jpeg?auto=compress&cs=tinysrgb&w=1600', 'https://images.pexels.com/photos/356036/pexels-photo-356036.jpeg?auto=compress&cs=tinysrgb&w=1600'], label: 'Renewable energy infrastructure' },
  { terms: ['chemistry', 'chemical', 'element', 'atom', 'molecule', 'physics', 'science', 'laboratory'], urls: ['https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=1600', 'https://images.pexels.com/photos/256381/pexels-photo-256381.jpeg?auto=compress&cs=tinysrgb&w=1600'], label: 'Scientific research' },
  { terms: ['computer', 'software', 'coding', 'programming', 'technology', 'digital'], urls: ['https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1600', 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1600'], label: 'Technology and computing' },
  { terms: ['data', 'analysis', 'business', 'market', 'finance', 'economic', 'policy', 'report'], urls: ['https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=1600', 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1600'], label: 'Data and analysis' },
  { terms: ['health', 'medical', 'patient', 'hospital', 'medicine'], urls: ['https://images.pexels.com/photos/1504814/pexels-photo-1504814.jpeg?auto=compress&cs=tinysrgb&w=1600', 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=1600'], label: 'Healthcare' },
  { terms: ['history', 'historical', 'war', 'century', 'archive'], urls: ['https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=1600', 'https://images.pexels.com/photos/36006/pexels-photo-36006.jpeg?auto=compress&cs=tinysrgb&w=1600'], label: 'Historical archive' },
  { terms: ['education', 'learning', 'student', 'research', 'study', 'knowledge'], urls: ['https://images.pexels.com/photos/256381/pexels-photo-256381.jpeg?auto=compress&cs=tinysrgb&w=1600', 'https://images.pexels.com/photos/5428003/pexels-photo-5428003.jpeg?auto=compress&cs=tinysrgb&w=1600'], label: 'Learning and research' },
];

function curatedCandidates(scene, index) {
  const content = cleanText(`${scene.title} ${scene.keyConcept} ${scene.supportingText}`).toLowerCase();
  const match = CURATED_IMAGES.find((candidate) => candidate.terms.some((term) => content.includes(term)));
  const candidate = match || CURATED_IMAGES[index % CURATED_IMAGES.length];
  const preferred = candidate.urls.map((src) => ({ type: 'image', src, source: 'curated-library', reason: candidate.label }));
  const related = CURATED_IMAGES.filter((other) => other !== candidate).flatMap((other) => other.urls.map((src) => ({ type: 'image', src, source: 'curated-library', reason: other.label })));
  return preferred.concat(related);
}

async function isReachableImage(src) {
  try {
    const response = await fetch(src, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    return response.ok && contentType.startsWith('image/');
  } catch (_) {
    return false;
  }
}

function visualKeywords(scene) {
  const titleWords = cleanText(scene.title).toLowerCase().match(/[a-z][a-z-]{2,}/g) || [];
  const contentWords = cleanText(`${scene.sourceText || ''} ${scene.keyConcept} ${scene.supportingText}`).toLowerCase().match(/[a-z][a-z-]{2,}/g) || [];
  const frequencies = new Map();
  contentWords.forEach((word) => { if (!STOPWORDS.has(word)) frequencies.set(word, (frequencies.get(word) || 0) + 1); });
  const rankedContent = [...frequencies.entries()].sort((a, b) => b[1] - a[1]).map(([word]) => word);
  return [...new Set([...titleWords, ...rankedContent])].slice(0, 8);
}

function rankAsset(asset, keywords, usedUrls) {
  const tags = Array.isArray(asset.tags) ? asset.tags.join(' ').toLowerCase() : '';
  const searchable = `${tags} ${asset.url || ''}`.toLowerCase();
  const relevance = keywords.reduce((score, keyword) => score + (searchable.includes(keyword) ? 4 : 0), 0);
  const uniqueness = usedUrls.has(asset.url) ? -100 : 3;
  const sourceBonus = asset.source === 'pixabay' ? 2 : 0;
  return relevance + uniqueness + sourceBonus;
}

async function findVisual(scene, index, usedUrls) {
  const keywords = visualKeywords(scene);
  const query = keywords.join(' ') || visualQuery(scene);
  let fetchedAssets = [];
  let fetchError = null;
  try {
    fetchedAssets = await searchImages(query, { perPage: 8 });
  } catch (error) {
    fetchError = error.message || String(error);
  }
  const rankedAssets = fetchedAssets
    .filter((asset) => asset && asset.url)
    .map((asset) => ({ ...asset, rankingScore: rankAsset(asset, keywords, usedUrls) }))
    .sort((a, b) => b.rankingScore - a.rankingScore);
  for (const asset of rankedAssets) {
    if (usedUrls.has(asset.url)) continue;
    if (await isReachableImage(asset.url)) {
      usedUrls.add(asset.url);
      return {
        type: 'image', src: asset.url, source: asset.source || 'pixabay', query, keywords,
        reason: 'Highest relevance and uniqueness score', fallback: false, error: null,
        assetsFetched: fetchedAssets.length, rankedAssets: rankedAssets.slice(0, 8), selectedAsset: asset,
      };
    }
  }
  const fallback = curatedCandidates(scene, index).find((candidate) => !usedUrls.has(candidate.src));
  if (fallback && await isReachableImage(fallback.src)) {
    usedUrls.add(fallback.src);
    return {
      ...fallback, query, keywords, fallback: true, error: fetchError || 'No provider asset passed validation',
      assetsFetched: fetchedAssets.length, rankedAssets: rankedAssets.slice(0, 8), selectedAsset: fallback,
    };
  }
  return {
    type: null, src: null, source: null, query, keywords, fallback: true,
    error: fetchError || 'No unique reachable image candidate', assetsFetched: fetchedAssets.length,
    rankedAssets: rankedAssets.slice(0, 8), selectedAsset: null,
  };
}
async function generateSceneNarration(scene, index) {
  const sourceContent = cleanText(scene.sourceText || `${scene.keyConcept} ${scene.supportingText}`);
  const narrationInput = `${scene.title}\n\n${sourceContent}`.trim();
  try {
    const narrationText = await generateNarration({ text: narrationInput, context: sourceContent });
    const text = cleanText(narrationText || narrationInput);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    let duration = Math.max(3, Math.round(wordCount / 2.5));
    let audioReference = null;
    let audioStatus = 'skipped';

    return {
    sceneId: scene.id,
    status: text ? 'generated' : 'failed',
    textLength: text.length,
    wordCount,
    duration,
    text,
    audioReference,
    audioStatus,
    sourceSceneIds: scene.sourceSceneIds
  };
    return {
      sceneId: scene.id,
      status: text ? 'generated' : 'failed',
      textLength: text.length,
      wordCount,
      duration,
      text,
      audioReference,
      audioStatus,
      sourceSceneIds: scene.sourceSceneIds,
    };
  } catch (error) {
    return { sceneId: scene.id, status: 'failed', textLength: 0, wordCount: 0, duration: 0, text: '', audioReference: null, audioStatus: 'failed', error: error.message || String(error), sourceSceneIds: scene.sourceSceneIds };
  }
}
function estimateLines(text, width, fontSize) {
  const charactersPerLine = Math.max(12, Math.floor(width / (fontSize * 0.52)));
  return Math.max(1, Math.ceil(cleanText(text).length / charactersPerLine));
}

function estimateSceneDuration(scene) {
  const words = cleanText(scene.sourceText || `${scene.title} ${scene.keyConcept} ${scene.supportingText}`).split(/\s+/).filter(Boolean).length;
  return Math.min(120, Math.max(7, Math.round(8 + Math.sqrt(words) * 2.2))); 
}
function buildTextElement({ text, x, y, width, height, fontSize, color, startDelay, duration, align = 'left', fontWeight = 'normal', animation }) {
  return {
    type: 'text', text, x, y, width, ...(height ? { height } : {}), fontSize, color,
    fontFamily: 'Arial, sans-serif', fontWeight, align, verticalAlign: 'top', overflow: 'ellipsis',
    startDelay, duration, ...(animation ? { animation } : {}),
  };
}

function buildVisualElement(visual, sceneDuration, imageOnRight) {
  if (!visual.src) return null;
  return {
    type: visual.type,
    src: visual.src,
    position: 'custom',
    x: imageOnRight ? 740 : 60,
    y: 72,
    size: { width: 480, height: 576 },
    fit: 'cover',
    opacity: 0.9,
    start: 0,
    end: sceneDuration,
  };
}

async function buildMultiSceneMovie(plannedScenes, options = {}) {
  try {
    if (!Array.isArray(plannedScenes) || plannedScenes.length === 0) throw new Error('Planned scenes must be a non-empty array');
    const presentationScenes = groupForPresentation(plannedScenes, options.targetSceneCount || 6);
    const usedImageUrls = new Set();
    const visuals = [];
    for (let index = 0; index < presentationScenes.length; index += 1) {
      visuals.push(await findVisual(presentationScenes[index], index, usedImageUrls));
    }
    const palette = [
      { accent: '#38bdf8', body: '#e0f2fe' }, { accent: '#fbbf24', body: '#fef3c7' },
      { accent: '#34d399', body: '#d1fae5' }, { accent: '#fb7185', body: '#ffe4e6' },
      { accent: '#a78bfa', body: '#ede9fe' }, { accent: '#f97316', body: '#ffedd5' },
    ];
    const narrations = [];
    for (let index = 0; index < presentationScenes.length; index += 1) {
      narrations.push(await generateSceneNarration(presentationScenes[index], index));
    }
    const scenes = presentationScenes.map((scene, index) => {
      const imageOnRight = index % 2 === 0;
      const sceneDuration = estimateSceneDuration(scene);
      const colors = palette[index % palette.length];
      const textX = imageOnRight ? 64 : 676;
      const textWidth = 520;
      const safeTop = 64;
      const safeBottom = 656;
      const gap = 18;
      const titleSize = scene.title.length > 48 ? 42 : 50;
      const conceptSize = scene.keyConcept.length > 90 ? 25 : 29;
      const supportSize = scene.supportingText.length > 130 ? 18 : 21;
      const blocks = [
        { kind: 'title', text: scene.title, fontSize: titleSize, color: colors.accent, weight: 'bold', animation: { type: 'fadeIn', duration: 0.35 } },
        { kind: 'concept', text: scene.keyConcept, fontSize: conceptSize, color: '#ffffff', weight: '600', animation: { type: 'fadeIn', duration: 0.45 } },
        ...(scene.supportingText ? [{ kind: 'support', text: scene.supportingText, fontSize: supportSize, color: colors.body, weight: 'normal' }] : []),
      ];
      const layoutBlocks = (fontAdjustment = 0) => {
        let y = safeTop;
        return blocks.map((block) => {
          const fontSize = Math.max(block.kind === 'title' ? 34 : 16, block.fontSize - fontAdjustment);
          const lineCount = estimateLines(block.text, textWidth, fontSize);
          const lineHeight = fontSize * 1.28;
          const height = Math.ceil(Math.max(lineHeight, lineCount * lineHeight));
          const positioned = { ...block, x: textX, y, width: textWidth, height, fontSize, lineHeight };
          y += height + gap;
          return positioned;
        });
      };
      let layoutBlocksResult = layoutBlocks(0);
      for (let adjustment = 1; adjustment <= 12 && layoutBlocksResult[layoutBlocksResult.length - 1].y + layoutBlocksResult[layoutBlocksResult.length - 1].height > safeBottom; adjustment += 1) {
        layoutBlocksResult = layoutBlocks(adjustment);
      }
      const elements = [];
      const visual = buildVisualElement(visuals[index], sceneDuration, imageOnRight);
      if (visual) elements.push(visual);
      layoutBlocksResult.forEach((block) => elements.push(buildTextElement({ text: block.text, x: block.x, y: block.y, width: block.width, height: block.height, fontSize: block.fontSize, color: block.color, startDelay: block.kind === 'title' ? 0.35 : block.kind === 'concept' ? 1.05 : 2, duration: Math.max(1, sceneDuration - (block.kind === 'title' ? 0.5 : 1)), align: 'left', fontWeight: block.weight, animation: block.animation })));
      return { id: scene.id || `scene_${index + 1}`, duration: sceneDuration, transition: { type: 'fade', duration: 0.45 }, elements };
    });
    let textOverlapCount = 0;
    let textImageCollisionCount = 0;
    let textOverflowCount = 0;
    scenes.forEach((scene) => {
      const boxes = scene.elements.filter((element) => element.type === 'text').map((element) => ({ x: Number(element.x) || 0, y: Number(element.y) || 0, width: Number(element.width) || 0, height: Number(element.height) || 0 }));
      boxes.forEach((box) => { if (box.x < 0 || box.y < 0 || box.x + box.width > 1280 || box.y + box.height > 720) textOverflowCount += 1; });
      for (let first = 0; first < boxes.length; first += 1) for (let second = first + 1; second < boxes.length; second += 1) {
        const a = boxes[first]; const b = boxes[second];
        if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) textOverlapCount += 1;
      }
      const imageBoxes = scene.elements.filter((element) => element.type === 'image').map((element) => ({ x: Number(element.x) || 0, y: Number(element.y) || 0, width: Number(element.size?.width || 0), height: Number(element.size?.height || 0) }));
      boxes.forEach((textBox) => imageBoxes.forEach((imageBox) => { if (textBox.x < imageBox.x + imageBox.width && textBox.x + textBox.width > imageBox.x && textBox.y < imageBox.y + imageBox.height && textBox.y + textBox.height > imageBox.y) textImageCollisionCount += 1; }));
    });
    const counts = scenes.reduce((result, scene, index) => {
      scene.elements.forEach((element) => { if (element.type === 'text') result.text += 1; if (element.type === 'image') result.image += 1; if (element.type === 'video') result.video += 1; });
      if (visuals[index].src) result.scenesWithVisuals += 1;
      if (visuals[index].fallback) result.visualFallbacks += 1;
      if (visuals[index].error) result.imageUrlErrors += 1;
      return result;
    }, { text: 0, image: 0, video: 0, scenesWithVisuals: 0, visualFallbacks: 0, imageUrlErrors: 0 });
    const movie = {
      scenes, name: options.name || 'Document Video', width: options.width || 1280, height: options.height || 720,
      resolution: options.resolution || 'hd', fps: options.fps || 24,
      metadata: { totalScenes: scenes.length, totalDuration: scenes.reduce((total, scene) => total + scene.duration, 0), createdAt: new Date().toISOString(), format: 'JSON2Video', narrationByScene: Object.fromEntries(narrations.map((narration) => [narration.sceneId, narration])) },
    };
    return { success: true, movie, sceneCount: scenes.length, totalDurationMs: movie.metadata.totalDuration, quality: {
      scenesBeforeQualityOptimization: plannedScenes.length, scenesAfterQualityOptimization: scenes.length,
      textElements: counts.text, imageElements: counts.image, videoElements: counts.video,
      scenesWithVisuals: counts.scenesWithVisuals, scenesWithoutVisuals: scenes.length - counts.scenesWithVisuals,
      visualFallbacks: counts.visualFallbacks, imageUrlErrors: counts.imageUrlErrors, totalDuration: movie.metadata.totalDuration,
      uniqueImageUrls: usedImageUrls.size, duplicateImageUrls: scenes.length - usedImageUrls.size,
      sceneDurations: scenes.map((scene) => scene.duration),
      minSceneDuration: Math.min(...scenes.map((scene) => scene.duration)),
      maxSceneDuration: Math.max(...scenes.map((scene) => scene.duration)),
      variableSceneDurations: new Set(scenes.map((scene) => scene.duration)).size > 1,
      textOverlapCount,
      textOverflowCount,
      textImageCollisionCount,
      imageSelections: visuals.map((visual, index) => ({ sceneId: scenes[index].id, url: visual.src, source: visual.source, query: visual.query, reason: visual.reason })),
      assetDiagnostics: visuals.map((visual, index) => ({ sceneId: scenes[index].id, keywords: visual.keywords || [], query: visual.query, assetsFetched: visual.assetsFetched || 0, rankedAssets: visual.rankedAssets || [], selectedAsset: visual.selectedAsset || null, selectedUrl: visual.src || null })),
      narrationDiagnostics: narrations,
      narrationFailures: narrations.filter((narration) => narration.status !== 'generated').length,
      narrationScenes: narrations.length,
      narrationCoverageValid: narrations.length === scenes.length && narrations.every((narration) => narration.status === 'generated' && narration.textLength > 0 && narration.duration > 0),
      sceneSources: presentationScenes.map((scene) => ({ sceneId: scene.id, sourceSceneIds: scene.sourceSceneIds, sourceIndexes: scene.sourceIndexes, sourcePageStart: scene.sourcePageStart, sourcePageEnd: scene.sourcePageEnd, sourceWordCount: scene.sourceWordCount, groupingReason: scene.groupingReason })),
      sourceContentCoverageValid: presentationScenes.every((scene) => Array.isArray(scene.sourceSceneIds) && scene.sourceSceneIds.length > 0),
      sourceOrderValid: presentationScenes.flatMap((scene) => scene.sourceIndexes || []).every((sourceIndex, index, all) => index === 0 || sourceIndex > all[index - 1]),
      duplicateSourceSceneIds: presentationScenes.flatMap((scene) => scene.sourceSceneIds || []).length - new Set(presentationScenes.flatMap((scene) => scene.sourceSceneIds || [])).size,
      oversizedScenes: presentationScenes.filter((scene) => (scene.sourceWordCount || 0) > 850).length,
    } };
  } catch (error) {
    return { success: false, error: error.message, movie: null };
  }
}

module.exports = { buildMultiSceneMovie };
