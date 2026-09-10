const path = require("path");

function analyzeDocumentStructure(normalizedDoc) {
  if (!normalizedDoc) throw new Error("Invalid document");
  const pages = normalizedDoc.pages || [];
  const headings = normalizedDoc.headings || [];
  const fullText = normalizedDoc.fullText || normalizedDoc.text || "";
  return { totalPages: pages.length, totalHeadings: headings.length, textLength: fullText.length, hasHeadings: headings.length > 0, hasMultiplePages: pages.length > 1, strategy: headings.length > 0 ? "heading-based" : "page-based", headings: headings.slice(0, 50) };
}

function divideIntoSections(normalizedDoc) {
  if (!normalizedDoc) throw new Error("Invalid document");
  const pages = Array.isArray(normalizedDoc.pages) ? normalizedDoc.pages : [];
  const sections = [];
  let sectionIndex = 0;

  pages.forEach((page, pageIndex) => {
    const pageNumber = Number(page.pageNumber || pageIndex + 1);
    const pageText = String(page.text || '').trim();
    if (!pageText) return;
    const headings = Array.isArray(page.headings) && page.headings.length ? page.headings : [];
    const boundaries = headings.map((heading) => ({ heading, offset: pageText.indexOf(String(heading)) })).filter((item) => item.offset >= 0).sort((a, b) => a.offset - b.offset);
    const segments = boundaries.length ? boundaries.map((boundary, index) => ({
      heading: boundary.heading,
      text: pageText.slice(boundary.offset, boundaries[index + 1]?.offset || pageText.length).trim(),
    })) : [{ heading: `Page ${pageNumber}`, text: pageText }];

    segments.forEach((segment) => {
      const words = segment.text.split(/\s+/).filter(Boolean);
      const maxWords = 850;
      for (let start = 0; start < words.length; start += maxWords) {
        const part = words.slice(start, start + maxWords).join(' ').trim();
        if (!part) continue;
        const partNumber = Math.floor(start / maxWords);
        sections.push({
          id: `section_${sectionIndex + 1}`,
          index: sectionIndex,
          heading: partNumber === 0 ? segment.heading : `${segment.heading} (continued ${partNumber + 1})`,
          text: part,
          sourcePageStart: pageNumber,
          sourcePageEnd: pageNumber,
          sourceWordStart: start,
          sourceWordEnd: Math.min(start + maxWords, words.length),
        });
        sectionIndex += 1;
      }
    });
  });

  return sections;
}
function createScenes(sections, options) {
  options = options || {};
  if (!Array.isArray(sections)) throw new Error("Sections must be an array");
  const defaultDuration = options.defaultDuration || 5;
  const textLengthMultiplier = options.textLengthMultiplier || 0.01;
  const scenes = [];
  sections.forEach(function (section, idx) {
    const textLength = (section.text || "").length;
    const baseDuration = Math.max(defaultDuration, textLength * textLengthMultiplier);
    const duration = Math.min(baseDuration, 30);
    scenes.push({ id: "scene_" + (idx + 1), index: idx, title: section.heading || ("Scene " + (idx + 1)), text: section.text || "", fullContent: section.text || "", duration: Math.round(duration * 10) / 10, sourcePageStart: section.sourcePageStart || 1, sourcePageEnd: section.sourcePageEnd || 1 });
  });
  return scenes;
}

// Generic placeholder titles (e.g. "Scene 3", "Page 12") don't count as real topic boundaries.
const GENERIC_TITLE_PATTERN = /^(scene|page|section)\s*\d+$/i;

function isMeaningfulTitle(title) {
  if (!title) return false;
  const t = String(title).trim();
  if (t.length < 4) return false;
  if (GENERIC_TITLE_PATTERN.test(t)) return false;
  return true;
}

function groupScenesIntelligently(scenes, options) {
  options = options || {};
  if (!Array.isArray(scenes) || scenes.length === 0) return [];

  const targetMin = options.targetMinDuration || 20;
  const targetMax = options.targetMaxDuration || 45;
  const shortDurationThreshold = options.shortDurationThreshold || 10;
  const tinyTextThreshold = options.tinyTextThreshold || 20;

  function newBufferFrom(scene) {
    return {
      ids: [scene.id],
      title: scene.title,
      hasMeaningfulTitle: isMeaningfulTitle(scene.title),
      textParts: [scene.text || ""],
      duration: scene.duration || 0,
      sourcePageStart: scene.sourcePageStart,
      sourcePageEnd: scene.sourcePageEnd,
    };
  }

  function mergeInto(buffer, scene) {
    buffer.ids.push(scene.id);
    buffer.textParts.push(scene.text || "");
    buffer.duration += scene.duration || 0;
    buffer.sourcePageEnd = scene.sourcePageEnd;
    if (!buffer.hasMeaningfulTitle && isMeaningfulTitle(scene.title)) {
      buffer.title = scene.title;
      buffer.hasMeaningfulTitle = true;
    }
  }

  const groups = [];
  let buffer = null;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const isTinyFragment = (scene.text || "").trim().length < tinyTextThreshold;

    if (!buffer) {
      buffer = newBufferFrom(scene);
      continue;
    }

    const bufferIsShort = buffer.duration < shortDurationThreshold;
    const wouldExceedMax = buffer.duration + (scene.duration || 0) > targetMax;
    const sceneIsBoundaryHeading = isMeaningfulTitle(scene.title) && !isTinyFragment;

    if (buffer.duration >= targetMin && sceneIsBoundaryHeading && !bufferIsShort) {
      groups.push(buffer);
      buffer = newBufferFrom(scene);
      continue;
    }

    if (!isTinyFragment && !bufferIsShort && wouldExceedMax && buffer.duration >= targetMin / 2) {
      groups.push(buffer);
      buffer = newBufferFrom(scene);
      continue;
    }

    mergeInto(buffer, scene);
  }
  if (buffer) groups.push(buffer);

  return groups.map(function (g, idx) {
    const text = g.textParts.join("\n\n").trim();
    return {
      id: "scene_" + (idx + 1),
      index: idx,
      title: g.title || ("Scene " + (idx + 1)),
      text: text,
      fullContent: text,
      duration: Math.round(g.duration * 10) / 10,
      sourcePageStart: g.sourcePageStart || 1,
      sourcePageEnd: g.sourcePageEnd || 1,
      mergedFrom: g.ids,
    };
  });
}

function validateSceneQuality(scenesBefore, scenesAfter) {
  const before = Array.isArray(scenesBefore) ? scenesBefore.length : 0;
  const after = Array.isArray(scenesAfter) ? scenesAfter.length : 0;
  const durations = (scenesAfter || []).map(function (s) { return s.duration || 0; });
  const totalDuration = durations.reduce(function (sum, d) { return sum + d; }, 0);
  const avgDuration = durations.length ? totalDuration / durations.length : 0;
  const minDuration = durations.length ? Math.min.apply(null, durations) : 0;
  const maxDuration = durations.length ? Math.max.apply(null, durations) : 0;
  return {
    totalScenesBefore: before,
    totalScenesAfter: after,
    avgDuration: Math.round(avgDuration * 10) / 10,
    minDuration: Math.round(minDuration * 10) / 10,
    maxDuration: Math.round(maxDuration * 10) / 10,
    scenesUnder10s: durations.filter(function (d) { return d < 10; }).length,
    scenesOver60s: durations.filter(function (d) { return d > 60; }).length,
  };
}

async function planDocument(normalizedDoc, options) {
  options = options || {};
  try {
    if (!normalizedDoc || typeof normalizedDoc !== "object") throw new Error("Invalid document");
    const structure = analyzeDocumentStructure(normalizedDoc);
    const sections = divideIntoSections(normalizedDoc, options);
    const initialScenes = createScenes(sections, options);
    const scenes = options.disableGrouping ? initialScenes : groupScenesIntelligently(initialScenes, options);
    const quality = validateSceneQuality(initialScenes, scenes);
    return {
      success: true,
      strategy: structure.strategy,
      totalScenes: scenes.length,
      totalDuration: scenes.reduce(function (sum, scene) { return sum + scene.duration; }, 0),
      scenes: scenes,
      quality: quality,
      sceneCounts: { beforeGrouping: initialScenes.length, afterGrouping: scenes.length },
      metadata: { documentPages: structure.totalPages, documentHeadings: structure.totalHeadings, textLength: structure.textLength, createdAt: new Date().toISOString() },
    };
  } catch (error) {
    return { success: false, error: error.message, scenes: [] };
  }
}

module.exports = { planDocument: planDocument, analyzeDocumentStructure: analyzeDocumentStructure, divideIntoSections: divideIntoSections, createScenes: createScenes, groupScenesIntelligently: groupScenesIntelligently, validateSceneQuality: validateSceneQuality };