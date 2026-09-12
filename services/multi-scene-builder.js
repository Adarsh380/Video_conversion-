const { searchImages } = require('./asset-fetcher');
const { generateNarration } = require('./llm');
const fs = require('fs');
const path = require('path');
const STOPWORDS = new Set(['a', 'about', 'after', 'again', 'also', 'am', 'an', 'and', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by', 'can', 'could', 'does', 'during', 'each', 'for', 'from', 'had', 'has', 'have', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'more', 'most', 'much', 'not', 'of', 'on', 'only', 'or', 'other', 'over', 'such', 'than', 'that', 'the', 'their', 'these', 'they', 'this', 'those', 'through', 'to', 'under', 'very', 'was', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'with', 'would', 'your']);
const ABSTRACT_TERMS = new Set(['advanced', 'analysis', 'approach', 'aspect', 'comprehensive', 'concept', 'context', 'demonstrates', 'example', 'explanation', 'fact', 'focus', 'idea', 'importance', 'information', 'introduction', 'issue', 'method', 'overview', 'principle', 'process', 'role', 'section', 'topic', 'understanding']);
const VISUAL_FILLER_TERMS = new Set(['advanced', 'analysis', 'approach', 'comparing', 'content', 'demonstrates', 'explanation', 'explains', 'example', 'find', 'finding', 'important', 'information', 'method', 'middle', 'overview', 'process', 'result', 'results', 'shows', 'support', 'time', 'topic', 'use', 'using', 'value', 'way', 'ways']);
const RANKING_GENERIC_TERMS = new Set(['search', 'use', 'find', 'value', 'time', 'comparing', 'middle', 'element', 'platform', 'support', 'content', 'online', 'method', 'process', 'information']);

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

function singularizeToken(value) {
  if (value.length <= 3 || value.endsWith('ss') || value.endsWith('us') || value.endsWith('is')) return value;
  if (value.endsWith('ies') && value.length > 4) return `${value.slice(0, -3)}y`;
  if (value.endsWith('s') && !value.endsWith('ss') && !value.endsWith('us') && !value.endsWith('is')) return value.slice(0, -1);
  return value;
}

function normalizeToken(value) {
  const token = String(value || '').toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
  return token ? singularizeToken(token) : '';
}

function normalizedTokens(value) {
  return cleanText(value).toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g)?.map(normalizeToken).filter(Boolean) || [];
}

function generateVisualQueries(scene) {
  const titleWords = normalizedTokens(scene.title).filter((word) => word.length >= 3 && !STOPWORDS.has(word) && !VISUAL_FILLER_TERMS.has(word) && !ABSTRACT_TERMS.has(word));
  const bodyWords = normalizedTokens([scene.keyConcept || '', scene.sourceText || '', scene.supportingText || ''].join(' ')).filter((word) => word.length >= 3 && !STOPWORDS.has(word) && !VISUAL_FILLER_TERMS.has(word) && !ABSTRACT_TERMS.has(word));
  const frequency = bodyWords.reduce((counts, word) => counts.set(word, (counts.get(word) || 0) + 1), new Map());
  const titleSet = new Set(titleWords);
  const normalizeConcept = (tokens) => [...new Set(tokens)].join(' ');
  const titleCandidates = [];
  for (let size = Math.min(4, titleWords.length); size >= 1; size -= 1) {
    for (let index = 0; index <= titleWords.length - size; index += 1) {
      const tokens = titleWords.slice(index, index + size);
      const repeats = tokens.reduce((sum, word) => sum + Math.min(frequency.get(word) || 0, 3), 0);
      titleCandidates.push({ tokens, score: size * 24 + repeats * 4 + (size > 1 ? 8 : 0) });
    }
  }
  const titlePhrase = titleCandidates.sort((left, right) => right.score - left.score || right.tokens.length - left.tokens.length)[0]?.tokens || [];
  const concepts = titlePhrase.length ? [normalizeConcept(titlePhrase)] : [];
  const usedWords = new Set(titlePhrase);
  const bodyCandidates = [];
  for (let size = 3; size >= 2; size -= 1) {
    for (let index = 0; index <= bodyWords.length - size; index += 1) {
      const tokens = bodyWords.slice(index, index + size);
      if (new Set(tokens).size !== tokens.length) continue;
      const phrase = normalizeConcept(tokens);
      const occurrences = bodyWords.reduce((count, _, offset) => count + (bodyWords.slice(offset, offset + size).join(' ') === phrase ? 1 : 0), 0);
      const titleOverlap = tokens.filter((word) => titleSet.has(word)).length;
      const repeats = tokens.reduce((sum, word) => sum + Math.min(frequency.get(word) || 0, 3), 0);
      if (occurrences < 2 && titleOverlap === 0 && repeats < size + 1) continue;
      bodyCandidates.push({ tokens, score: occurrences * 12 + size * 6 + repeats * 2 + titleOverlap * 10 });
    }
  }
  bodyWords.filter((word) => !usedWords.has(word) && (frequency.get(word) || 0) >= 2).forEach((word) => bodyCandidates.push({ tokens: [word], score: (frequency.get(word) || 0) * 8 + (titleSet.has(word) ? 12 : 0) }));
  bodyCandidates.sort((left, right) => right.score - left.score || right.tokens.length - left.tokens.length);
  let wordCount = titlePhrase.length;
  bodyCandidates.forEach((candidate) => {
    const key = normalizeConcept(candidate.tokens);
    if (concepts.length >= 6 || wordCount + candidate.tokens.length > 8 || !key) return;
    if (concepts.some((concept) => concept === key || candidate.tokens.some((word) => concept.split(' ').includes(word)))) return;
    candidate.tokens.forEach((word) => usedWords.add(word));
    concepts.push(key);
    wordCount += candidate.tokens.length;
  });
  return concepts.length >= 3 ? concepts : [...concepts, 'education', 'subject', 'learning'].slice(0, 3);
}function visualKeywords(scene) {
  return generateVisualQueries(scene);
}

function rankAsset(asset, keywords, usedUrls, scene) {
  const uniqueTags = [...new Set((Array.isArray(asset.tags) ? asset.tags : []).map((tag) => normalizedTokens(tag).join(' ')).filter(Boolean))];
  const metadataPhrases = [...new Set([...uniqueTags, normalizedTokens(asset.url || '').join(' '), normalizedTokens(asset.credit?.pageURL || '').join(' ')].filter(Boolean))];
  const metadata = [...new Set(metadataPhrases.flatMap((phrase) => normalizedTokens(phrase)))];
  const metadataTerms = new Set(metadata);
  const concepts = [...new Set(keywords.map((keyword) => normalizedTokens(keyword).join(' ')).filter(Boolean))];
  const meaningful = (term) => !RANKING_GENERIC_TERMS.has(term) && !VISUAL_FILLER_TERMS.has(term) && !ABSTRACT_TERMS.has(term) && !STOPWORDS.has(term);
  const titleTerms = normalizedTokens(scene?.title || '').filter(meaningful);
  const titleConcepts = new Set(concepts.slice(0, 2));
  const conceptTerms = concepts.flatMap((concept) => normalizedTokens(concept)).filter(meaningful);
  const sceneTitleTokens = new Set(titleTerms);
  const hasPhrase = (phrase) => metadataPhrases.some((metadataPhrase) => metadataPhrase === phrase || metadataPhrase.includes(` ${phrase} `));
  const matchedConcepts = [];
  let phraseScore = 0;
  let conceptCoverageScore = 0;
  let titleScore = 0;
  const matchedTerms = new Set();
  concepts.forEach((concept) => {
    const terms = normalizedTokens(concept);
    const phraseMatch = hasPhrase(concept);
    const termMatch = terms.every((term) => metadataTerms.has(term));
    if (!phraseMatch && !termMatch) return;
    const meaningfulTerms = terms.filter(meaningful);
    const genericOnly = meaningfulTerms.length === 0;
    const titlePriority = titleConcepts.has(concept) || meaningfulTerms.some((term) => sceneTitleTokens.has(term));
    matchedConcepts.push(concept);
    terms.forEach((term) => matchedTerms.add(term));
    conceptCoverageScore += genericOnly ? 0 : (meaningfulTerms.length > 1 ? 12 : 7);
    if (phraseMatch) phraseScore += genericOnly ? 0 : (meaningfulTerms.length > 1 ? 32 : 18);
    if (titlePriority) titleScore += genericOnly ? 0 : (phraseMatch ? 34 : 24);
  });
  const genericMatches = [...matchedTerms].filter((term) => RANKING_GENERIC_TERMS.has(term));
  const meaningfulMatches = [...matchedTerms].filter(meaningful);
  const genericPenalty = genericMatches.length && !meaningfulMatches.length ? -12 : Math.min(0, -genericMatches.length);
  const meaningfulConceptCount = matchedConcepts.filter((concept) => normalizedTokens(concept).some(meaningful)).length;
  const queryMeaningfulCount = concepts.filter((concept) => normalizedTokens(concept).some(meaningful)).length;
  const sparseConceptPenalty = queryMeaningfulCount >= 2 && meaningfulConceptCount < 2 ? -14 : 0;
  const singleTokenPenalty = meaningfulConceptCount === 1 && matchedConcepts.every((concept) => normalizedTokens(concept).filter(meaningful).length <= 1) ? -30 : 0;
  const matchedTitleTerms = [...new Set(meaningfulMatches.filter((term) => sceneTitleTokens.has(term)))];
  const matchedConceptTerms = [...new Set(meaningfulMatches.filter((term) => conceptTerms.includes(term)))];
  const coherenceScore = matchedConcepts.length === 0 ? -6 : Math.min(18, matchedTitleTerms.length * 6 + Math.max(0, matchedConceptTerms.length - matchedTitleTerms.length) * 2) + sparseConceptPenalty + singleTokenPenalty;
  const qualityScore = Number(asset.width) >= 800 && Number(asset.height) >= 450 ? 1 : 0;
  const uniquenessScore = usedUrls.has(asset.url) ? -100 : 3;
  const score = phraseScore + conceptCoverageScore + titleScore + genericPenalty + coherenceScore + qualityScore + uniquenessScore;
  return { score, phraseScore, conceptCoverageScore, titleScore, genericPenalty, coherenceScore, qualityScore, uniquenessScore, matchedConcepts };
}function diagnosticAsset(asset, ranking) {
  return { type: asset.type, url: asset.url, source: asset.source, tags: Array.isArray(asset.tags) ? asset.tags : [], credit: asset.credit ? { name: asset.credit.name, pageURL: asset.credit.pageURL } : undefined, width: asset.width, height: asset.height, rankingScore: ranking.score, ...ranking };
}
function generateAlternateQueries(scene, primaryConcepts) {
  const terms = new Set(normalizedTokens([scene.title || '', scene.sourceText || '', scene.keyConcept || '', scene.supportingText || ''].join(' ')));
  const normalizeConcept = (concept) => normalizedTokens(cleanText(concept)).join(' ');
  const uniqueConcepts = (concepts) => {
    const seen = new Set();
    return concepts.map(cleanText).filter(Boolean).filter((concept) => {
      const normalized = normalizeConcept(concept);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  };
  const normalizedPrimaryConcepts = uniqueConcepts(primaryConcepts);
  const primaryWords = new Set(normalizedPrimaryConcepts.flatMap((concept) => normalizedTokens(concept)));
  const contexts = [
    { triggers: ['algorithm', 'data', 'search', 'sorted', 'array', 'code', 'programming'], visuals: ['algorithm', 'computer', 'data structure', 'programming', 'code', 'diagram', 'visualization'] },
    { triggers: ['industrial', 'factory', 'steam', 'manufacturing', 'machine'], visuals: ['factory', 'steam engine', 'machinery', 'manufacturing', 'industrial'] },
    { triggers: ['plant', 'photosynthesis', 'leaf', 'sunlight', 'chlorophyll'], visuals: ['plant', 'leaf', 'sunlight', 'chlorophyll', 'laboratory'] },
  ];
  const missing = uniqueConcepts(contexts
    .filter((context) => context.triggers.some((trigger) => terms.has(trigger)))
    .flatMap((context) => context.visuals))
    .filter((visual) => normalizedTokens(visual).some((word) => !primaryWords.has(word)));
  const relevantPrimaryConcepts = normalizedPrimaryConcepts.filter((concept) =>
    normalizedTokens(concept).some((word) => terms.has(word))
  );
  const queries = [];
  for (let offset = 0; offset < missing.length && queries.length < 2; offset += 3) {
    const concepts = missing.slice(offset, offset + 3);
    let wordCount = concepts.reduce((total, concept) => total + normalizedTokens(concept).length, 0);
    for (const concept of relevantPrimaryConcepts) {
      if (concepts.length >= 6) break;
      const conceptWords = normalizedTokens(concept);
      if (concepts.some((existing) => normalizeConcept(existing) === normalizeConcept(concept))) continue;
      if (wordCount + conceptWords.length > 8) continue;
      concepts.push(concept);
      wordCount += conceptWords.length;
    }
    if (concepts.length < 3 || wordCount > 8) continue;
    const normalizedQuery = concepts.flatMap(normalizedTokens).join(' ');
    if (normalizedQuery && !queries.includes(normalizedQuery)) queries.push(normalizedQuery);
  }
  return queries;
}const MIN_RELEVANCE_SCORE = 20;
async function findVisual(scene, index, usedUrls) {
  const keywords = visualKeywords(scene);
  const primaryQuery = keywords.join(' ') || visualQuery(scene);
  const alternateQueries = generateAlternateQueries(scene, keywords);
  const rankQuery = async (query) => {
    let fetchedAssets = [];
    let error = null;
    try { fetchedAssets = await searchImages(query, { perPage: 8 }); }
    catch (fetchFailure) { error = fetchFailure.message || String(fetchFailure); }
    const rankedAssets = fetchedAssets.filter((asset) => asset && asset.url)
      .map((asset) => { const ranking = rankAsset(asset, keywords, usedUrls, scene); return diagnosticAsset(asset, ranking); })
      .sort((left, right) => right.score - left.score);
    return { fetchedAssets, rankedAssets, error };
  };
  const attempts = [{ query: primaryQuery, ...(await rankQuery(primaryQuery)) }];
  const initialBestScore = attempts[0].rankedAssets[0]?.score || 0;
  let alternateSearchUsed = false;
  if (initialBestScore < MIN_RELEVANCE_SCORE) {
    for (const query of alternateQueries) {
      alternateSearchUsed = true;
      const result = await rankQuery(query);
      attempts.push({ query, ...result });
      if ((result.rankedAssets[0]?.score || 0) >= MIN_RELEVANCE_SCORE) break;
    }
  }
  const fetchedAssets = attempts.reduce((total, attempt) => total + attempt.fetchedAssets.length, 0);
  const errors = attempts.map((attempt) => attempt.error).filter(Boolean);
  const rankedAssets = [...new Map(attempts.flatMap((attempt) => attempt.rankedAssets).map((asset) => [asset.url, asset])).values()]
    .sort((left, right) => right.score - left.score);
  let selected = null;
  for (const asset of rankedAssets) {
    if (asset.score < MIN_RELEVANCE_SCORE || usedUrls.has(asset.url)) continue;
    if (await isReachableImage(asset.url)) { selected = asset; break; }
  }
  const selectedQuery = selected ? attempts.find((attempt) => attempt.rankedAssets.some((asset) => asset.url === selected.url))?.query || primaryQuery : primaryQuery;
  const diagnostics = {
    visualQuery: primaryQuery, alternateQueries, initialBestScore, alternateSearchUsed, selectedQuery,
    selectedScore: selected?.score ?? null, relevanceStatus: selected && selected.score >= 40 ? 'STRONG' : selected && selected.score >= 20 ? 'ACCEPTABLE' : 'WEAK',
    query: selectedQuery, keywords, assetsFetched: fetchedAssets, rankedAssets: rankedAssets.slice(0, 8), topCandidates: rankedAssets.slice(0, 3), errors,
  };
  if (selected) {
    usedUrls.add(selected.url);
    return { type: 'image', src: selected.url, source: selected.source || 'pixabay', ...diagnostics, reason: 'Highest relevance and uniqueness score', fallback: false, error: errors.join('; ') || null, selectedAsset: selected };
  }
  const fallback = curatedCandidates(scene, index).find((candidate) => !usedUrls.has(candidate.src));
  if (fallback && await isReachableImage(fallback.src)) {
    usedUrls.add(fallback.src);
    return { ...fallback, ...diagnostics, selectedScore: null, fallback: true, error: errors.join('; ') || 'No provider asset passed validation', selectedAsset: fallback };
  }
  return { type: null, src: null, source: null, ...diagnostics, fallback: true, error: errors.join('; ') || 'No unique reachable image candidate', selectedAsset: null };
}async function generateSceneNarration(scene, index) {
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
      assetDiagnostics: visuals.map((visual, index) => ({ sceneId: scenes[index].id, keywords: visual.keywords || [], query: visual.query, visualQuery: visual.visualQuery, alternateQueries: visual.alternateQueries || [], initialBestScore: visual.initialBestScore || 0, alternateSearchUsed: visual.alternateSearchUsed || false, selectedQuery: visual.selectedQuery, selectedScore: visual.selectedScore, relevanceStatus: visual.relevanceStatus, assetsFetched: visual.assetsFetched || 0, rankedAssets: visual.rankedAssets || [], topCandidates: visual.topCandidates || [], selectedAsset: visual.selectedAsset || null, selectedUrl: visual.src || null, errors: visual.errors || [], error: visual.error || null })),
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
