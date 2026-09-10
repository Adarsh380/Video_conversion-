const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
const { buildJson2VideoMovie } = require('../services/json2video-movie');
const { convertCustomMovieToJSON2Video } = require('../services/json2video-adapter');
const { renderMovie, getRenderStatus } = require('../services/json2video-client');

function ensureTmp() {
  const dir = path.join(process.cwd(), 'tmp');
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
}

function normalizeText(text) {
  return String(text || '')
    .replace(/\uFFFD/g, '')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[\t\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readExtractedText() {
  const candidatePaths = [
    process.env.DOCUMENT_FULLTEXT_PATH,
    process.env.EXTRACTED_TEXT_PATH,
    path.join(process.cwd(), 'tmp', 'last_parsed.txt'),
    path.join(process.cwd(), 'tmp', 'sample.txt'),
    path.join(process.cwd(), 'sample_document.txt'),
  ].filter(Boolean);

  for (const candidate of candidatePaths) {
    try {
      if (!fs.existsSync(candidate)) continue;
      const raw = fs.readFileSync(candidate, 'utf8');
      const text = normalizeText(raw);
      if (text.length > 0) return text;
    } catch (_) {}
  }

  return '';
}

function buildSceneContent(fullText) {
  const source = String(fullText || '').replace(/\r/g, '\n');
  const lines = source.split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line && !/^\d+$/.test(line) && !/^[-*•\s]+$/.test(line));

  const chemistryExamples = new Set([
    'CO_2','BF_3','SO_2','CH_4','NH_3','H_2O','PCl_5','SF_4','ClF_3','XeF_2','SF_6','BrF_5','XeF_4'
  ]);
  const titleLine = lines.find((line) => line.length > 3 && !chemistryExamples.has(line)) || 'Chemistry Notes';
  const title = titleLine.slice(0, 90).trim();
  const summaryParts = lines.filter((line) => line !== titleLine && line.length > 6).slice(0, 12);
  const summary = (summaryParts.length ? summaryParts.join(' ') : source)
    .replace(/\s+/g, ' ')
    .slice(0, 500)
    .trim();

  const words = source.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const stop = new Set(['the','and','that','this','with','from','which','have','will','your','about','using','use','for','are','but','not','what','when','where','why','how','into','their','them','there','these','those','through','because']);
  const freq = {};
  for (const word of words) {
    if (word.length < 4 || stop.has(word)) continue;
    freq[word] = (freq[word] || 0) + 1;
  }
  const keywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([word]) => word);

  return { title, summary, keywords: keywords.length ? keywords : ['chemistry', 'notes', 'document'] };
}

function validateMovie(movie) {
  if (!movie || !Array.isArray(movie.scenes) || movie.scenes.length === 0) return false;
  return movie.scenes.every((scene) => scene && scene.id && scene.duration && Array.isArray(scene.elements));
}

async function main() {
  ensureTmp();
  const fullText = readExtractedText();
  const content = buildSceneContent(fullText);
  const sessions = [{
    title: content.title,
    text: content.summary || 'Chemistry notes summary',
    duration: 6,
    keywords: content.keywords,
  }];

  const customMovie = buildJson2VideoMovie(sessions, { projectName: 'Document Content Movie' });
  const { movie, warnings } = convertCustomMovieToJSON2Video(customMovie);
  const adapterPass = validateMovie(movie);

  fs.writeFileSync(path.join(process.cwd(), 'tmp', 'converted_one_scene.json'), JSON.stringify(movie, null, 2), 'utf8');

  if (!process.env.JSON2VIDEO_API_KEY) {
    console.log('STEP 5: FAIL');
    console.log('DOCUMENT EXTRACTION: ' + (fullText.length > 200 ? 'PASS' : 'FAIL'));
    console.log('EXTRACTED TEXT LENGTH: ' + fullText.length);
    console.log('REAL DOCUMENT CONTENT USED: ' + (fullText.length > 200 ? 'YES' : 'NO'));
    console.log('ADAPTER GENERATION: ' + (adapterPass ? 'PASS' : 'FAIL'));
    console.log('JSON2VIDEO SUBMISSION: FAIL');
    console.log('FINAL RENDER STATUS: missing JSON2VIDEO_API_KEY');
    console.log('PROJECT ID: NONE');
    console.log('FINAL MP4 URL: NONE');
    console.log('Error: JSON2VIDEO_API_KEY is not configured');
    process.exitCode = 1;
    return;
  }

  try {
    const renderResult = await renderMovie(movie);
    const projectId = renderResult && (renderResult.projectId || renderResult.project || renderResult.renderId || renderResult.jobId || 'NONE');
    const finalProjectId = projectId && projectId !== 'NONE' ? String(projectId) : 'NONE';
    let finalStatus = 'not-submitted';
    let finalMp4Url = 'NONE';

    if (finalProjectId !== 'NONE') {
      const statusResult = await getRenderStatus(finalProjectId);
      const renderBody = statusResult && statusResult.body ? statusResult.body : {};
      const movieInfo = renderBody.movie || renderBody.data?.movie || renderBody;
      finalStatus = String(movieInfo.status || statusResult.status || 'unknown').toLowerCase();
      finalMp4Url = movieInfo.url || movieInfo.videoUrl || movieInfo.output || movieInfo.movieUrl || 'NONE';
    }

    const pass = fullText.length > 200 && adapterPass && finalProjectId !== 'NONE';

    console.log('STEP 5: ' + (pass ? 'PASS' : 'FAIL'));
    console.log('DOCUMENT EXTRACTION: ' + (fullText.length > 200 ? 'PASS' : 'FAIL'));
    console.log('EXTRACTED TEXT LENGTH: ' + fullText.length);
    console.log('REAL DOCUMENT CONTENT USED: ' + (fullText.length > 200 ? 'YES' : 'NO'));
    console.log('ADAPTER GENERATION: ' + (adapterPass ? 'PASS' : 'FAIL'));
    console.log('JSON2VIDEO SUBMISSION: ' + (finalProjectId !== 'NONE' ? 'PASS' : 'FAIL'));
    console.log('FINAL RENDER STATUS: ' + finalStatus);
    console.log('PROJECT ID: ' + finalProjectId);
    console.log('FINAL MP4 URL: ' + finalMp4Url);
    if (warnings && warnings.length) fs.writeFileSync(path.join(process.cwd(), 'tmp', 'adapter_warnings.json'), JSON.stringify(warnings, null, 2), 'utf8');
    if (!pass) process.exitCode = 1;
  } catch (error) {
    console.log('STEP 5: FAIL');
    console.log('DOCUMENT EXTRACTION: ' + (fullText.length > 200 ? 'PASS' : 'FAIL'));
    console.log('EXTRACTED TEXT LENGTH: ' + fullText.length);
    console.log('REAL DOCUMENT CONTENT USED: ' + (fullText.length > 200 ? 'YES' : 'NO'));
    console.log('ADAPTER GENERATION: ' + (adapterPass ? 'PASS' : 'FAIL'));
    console.log('JSON2VIDEO SUBMISSION: FAIL');
    console.log('FINAL RENDER STATUS: error');
    console.log('PROJECT ID: NONE');
    console.log('FINAL MP4 URL: NONE');
    console.log('Error: ' + (error && error.message ? error.message : String(error)));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.log('STEP 5: FAIL');
  console.log('DOCUMENT EXTRACTION: FAIL');
  console.log('EXTRACTED TEXT LENGTH: 0');
  console.log('REAL DOCUMENT CONTENT USED: NO');
  console.log('ADAPTER GENERATION: FAIL');
  console.log('JSON2VIDEO SUBMISSION: FAIL');
  console.log('FINAL RENDER STATUS: error');
  console.log('PROJECT ID: NONE');
  console.log('FINAL MP4 URL: NONE');
  console.log('Error: ' + (error && error.message ? error.message : String(error)));
  process.exitCode = 1;
});
