try { require('dotenv').config({ path: '.env.local' }); require('dotenv').config(); } catch(e) { }
try { require('dotenv').config(); } catch(e) { }
const http = require('http');
const fs = require('fs');
const path = require('path');
const JSON5 = require('json5');
const { normalizeAndValidate } = require('./services/json');
const { buildJson2VideoMovie } = require('./services/json2video-movie');
const { renderMovie } = require('./services/json2video-client');
const { parseDocument } = require('./services/document-parser');
const { documentToSessions } = require('./services/document-to-sessions');
const { planDocument } = require('./services/scene-planner');
const { buildMultiSceneMovie } = require('./services/multi-scene-builder');
const { convertCustomMovieToJSON2Video } = require('./services/json2video-adapter');

const PORT = process.env.PORT || 3002;
const ROOT = __dirname;

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function readRequestBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, obj) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Filename');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const urlPath = (req.url || '/').split('?')[0];

  if (req.method === 'GET' && urlPath.startsWith('/narration/')) {
    const audioName = path.basename(urlPath.slice('/narration/'.length));
    if (!audioName || audioName !== urlPath.slice('/narration/'.length) || path.extname(audioName).toLowerCase() !== '.mp3') {
      return sendJson(res, 400, { success: false, error: 'Invalid narration file' });
    }
    const audioPath = path.join(__dirname, 'tmp', 'narration', audioName);
    if (!fs.existsSync(audioPath)) return sendJson(res, 404, { success: false, error: 'Narration file not found' });
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' });
    return fs.createReadStream(audioPath).pipe(res);
  }

  if (req.method === 'POST' && urlPath === '/api/inspect-document') {
    console.log('[local-api] Received POST /api/inspect-document', { headers: req.headers });
    try {
      const filename = req.headers['x-filename'] || 'upload.bin';
      const buffer = await readRequestBuffer(req);
      if (!buffer || buffer.length === 0) return sendJson(res, 400, { success: false, error: 'Empty file upload' });
      try { fs.writeFileSync(path.join(__dirname, 'tmp', 'last_upload_bytes.hex'), Buffer.from(buffer.slice(0,40)).toString('hex')); } catch (e) {}
      const parsed = await parseDocument(buffer, String(filename));
      try { fs.writeFileSync(path.join(__dirname, 'tmp', 'last_parsed.txt'), String(parsed.fullText || '').slice(0,5000), 'utf8'); } catch (e) {}
      const meta = { fileName: filename, fileType: path.extname(filename).toLowerCase().replace('.', ''), pageCount: parsed.pageCount || (parsed.pages ? parsed.pages.length : 0), uploadDate: new Date().toISOString() };
      const result = { success: true, metadata: meta, pages: parsed.pages || [], fullText: parsed.fullText || '', needsOcr: !!parsed.needsOcr };
      return sendJson(res, 200, result);
    } catch (err) {
      console.error('[local-api] inspect error:', err);
      console.error('[local-api] inspect error:', err); return sendJson(res, 400, { success: false, error: err.message || 'Failed to parse document', stack: (err && err.stack) ? String(err.stack).split('\n').slice(0,5).join('\\n') : undefined });
    }
  }

  if (req.method === 'POST' && urlPath === '/api/convert-document') {
    console.log('[local-api] Received POST /api/convert-document', { headers: req.headers });
    try {
      const filename = req.headers['x-filename'] || 'upload.bin';
      const buffer = await readRequestBuffer(req);
      if (!buffer || buffer.length === 0) return sendJson(res, 400, { success: false, error: 'Empty file upload' });
      try { fs.writeFileSync(path.join(__dirname, 'tmp', 'last_upload_bytes.hex'), Buffer.from(buffer.slice(0,40)).toString('hex')); } catch (e) {}
      const parsed = await parseDocument(buffer, String(filename));
      try { fs.writeFileSync(path.join(__dirname, 'tmp', 'last_parsed.txt'), String(parsed.fullText || '').slice(0,5000), 'utf8'); } catch (e) {}
      if (!parsed || !parsed.fullText) return sendJson(res, 400, { success: false, error: 'Unable to parse uploaded document' });

      const diagnostics = {
        documentType: path.extname(filename).toLowerCase().replace('.', '') || 'unknown',
        pages: parsed.pageCount || (parsed.pages ? parsed.pages.length : 0),
        scenesGenerated: 0,
        scenePlan: 'FAIL',
        movieJson: 'FAIL',
        schemaValidation: 'FAIL',
        fallbackUsed: false,
      };

      let movie = null;
      let scenesUsed = null;
      try {
        const plan = await planDocument(parsed);
        if (!plan || !plan.success || !Array.isArray(plan.scenes) || !plan.scenes.length) {
          throw new Error((plan && plan.error) || 'Scene planning produced no scenes');
        }
        diagnostics.scenePlan = 'PASS';
        diagnostics.scenesGenerated = plan.scenes.length;
        const buildResult = await buildMultiSceneMovie(plan.scenes, { name: `Document Render - ${filename}` });
        if (!buildResult || !buildResult.success || !buildResult.movie) {
          throw new Error('Multi-scene movie build failed');
        }
        diagnostics.movieJson = 'PASS';
        diagnostics.SCENES_BEFORE_QUALITY_OPTIMIZATION = buildResult.quality.scenesBeforeQualityOptimization;
        diagnostics.SCENES_AFTER_QUALITY_OPTIMIZATION = buildResult.quality.scenesAfterQualityOptimization;
        diagnostics.TEXT_ELEMENTS = buildResult.quality.textElements;
        diagnostics.IMAGE_ELEMENTS = buildResult.quality.imageElements;
        diagnostics.VIDEO_ELEMENTS = buildResult.quality.videoElements;
        diagnostics.SCENES_WITH_VISUALS = buildResult.quality.scenesWithVisuals;
        diagnostics.SCENES_WITHOUT_VISUALS = buildResult.quality.scenesWithoutVisuals;
        diagnostics.VISUAL_FALLBACKS = buildResult.quality.visualFallbacks;
        diagnostics.TOTAL_DURATION = buildResult.quality.totalDuration;
        diagnostics.FREE_PLAN_DURATION_VALID = buildResult.quality.totalDuration <= 60 ? 'PASS' : 'FAIL';
        normalizeAndValidate(JSON.stringify(buildResult.movie));
        diagnostics.schemaValidation = 'PASS';
        movie = buildResult.movie;
        scenesUsed = plan.scenes;
      } catch (scenePlanErr) {
        console.error('[local-api] scene planning failed, falling back to legacy one-scene pipeline:', scenePlanErr.message);
        diagnostics.fallbackUsed = true;
        try {
          const sessionPayload = await documentToSessions(parsed);
          if (!sessionPayload || !Array.isArray(sessionPayload.sessions) || !sessionPayload.sessions.length) {
            throw new Error('Failed to generate scenes from document (fallback)');
          }
          movie = buildJson2VideoMovie(sessionPayload.sessions, { projectName: `Document Render - ${filename}` });
          diagnostics.movieJson = 'PASS';
          normalizeAndValidate(JSON.stringify(movie));
          diagnostics.schemaValidation = 'PASS';
          diagnostics.scenesGenerated = sessionPayload.sessions.length;
          scenesUsed = sessionPayload.sessions;
        } catch (fallbackErr) {
          console.error('[local-api] fallback pipeline also failed:', fallbackErr.message);
          console.log('[integration-diagnostics]', JSON.stringify(diagnostics));
          return sendJson(res, 400, { success: false, error: fallbackErr.message || 'Failed to generate scenes from document', diagnostics });
        }
      }

      console.log('[integration-diagnostics]', JSON.stringify(diagnostics));
      return sendJson(res, 200, { success: true, movie, scenes: scenesUsed, diagnostics });
    } catch (err) {
      console.error('[local-api] convert error:', err);
      console.error('[local-api] convert error:', err); return sendJson(res, 400, { success: false, error: err.message || 'Convert failed', stack: (err && err.stack) ? String(err.stack).split('\n').slice(0,5).join('\\n') : undefined });
    }
  }

  if (req.method === 'POST' && urlPath === '/api/render-json2video') {
    try {
      const body = await readRequestBody(req);
      const payload = JSON5.parse(body || '{}');
      const generatedMovie = payload.movie || payload;
      let movie;
      let adapterWarnings = [];

      if (Array.isArray(generatedMovie.scenes) && generatedMovie.scenes.some((scene) => Array.isArray(scene.layers))) {
        const adapted = convertCustomMovieToJSON2Video(generatedMovie);
        movie = adapted.movie;
        adapterWarnings = adapted.warnings;
      } else if (Array.isArray(generatedMovie.scenes) && generatedMovie.scenes.some((scene) => Array.isArray(scene.elements))) {
        movie = generatedMovie;
      } else {
        const parsed = normalizeAndValidate(body || '{}');
        movie = buildJson2VideoMovie(parsed.sessions, { projectName: 'Local Render' });
      }

      if (Array.isArray(movie.scenes) && movie.scenes.some((scene) => Array.isArray(scene.elements))) {
        movie = { ...movie, scenes: movie.scenes.map((scene) => ({ ...scene, elements: Array.isArray(scene.elements) ? scene.elements.filter((element) => element.type !== 'background') : scene.elements })) };
      }
      const scenesForSubmission = Array.isArray(movie.scenes) ? movie.scenes : [];
      const originalTotalDuration = scenesForSubmission.reduce((total, scene) => {
        const duration = Number(scene.duration);
        return total + (Number.isFinite(duration) && duration > 0 ? duration : 0);
      }, 0);
      const durationTarget = 55;
      const durationScaleFactor = originalTotalDuration > durationTarget ? durationTarget / originalTotalDuration : 1;
      const durationNormalizationApplied = durationScaleFactor < 1;
      if (durationNormalizationApplied) {
        movie = {
          ...movie,
          scenes: scenesForSubmission.map((scene) => {
            const sceneDuration = Math.max(Number(scene.duration) * durationScaleFactor, Number.EPSILON);
            const elements = Array.isArray(scene.elements) ? scene.elements.map((element) => {
              const scaledElement = { ...element };
              ['duration', 'startDelay', 'start', 'end'].forEach((field) => {
                const value = Number(scaledElement[field]);
                if (Number.isFinite(value)) scaledElement[field] = Math.max(Math.min(value * durationScaleFactor, sceneDuration), 0);
              });
              return scaledElement;
            }) : scene.elements;
            return { ...scene, duration: sceneDuration, elements };
          }),
        };
      }
      const { name: ignoredMovieName, metadata: ignoredMovieMetadata, ...submissionMovie } = movie;
      const normalizedTotalDuration = Array.isArray(submissionMovie.scenes) ? submissionMovie.scenes.reduce((total, scene) => total + (Number(scene.duration) || 0), 0) : 0;
      const renderDiagnostics = {
        TOP_LEVEL_NAME_PRESENT: Object.prototype.hasOwnProperty.call(submissionMovie, 'name'),
        TOP_LEVEL_METADATA_PRESENT: Object.prototype.hasOwnProperty.call(submissionMovie, 'metadata'),
        ORIGINAL_TOTAL_DURATION: originalTotalDuration,
        NORMALIZED_TOTAL_DURATION: normalizedTotalDuration,
        DURATION_SCALE_FACTOR: durationScaleFactor,
        SCENE_COUNT: Array.isArray(submissionMovie.scenes) ? submissionMovie.scenes.length : 0,
        DURATION_NORMALIZATION_APPLIED: durationNormalizationApplied,
        RENDER_MOVIE_SCENE_COUNT: Array.isArray(submissionMovie.scenes) ? submissionMovie.scenes.length : 0,
        RENDER_MOVIE_ELEMENT_COUNT: Array.isArray(submissionMovie.scenes) ? submissionMovie.scenes.reduce((count, scene) => count + (Array.isArray(scene.elements) ? scene.elements.length : 0), 0) : 0,
        RENDER_MOVIE_FIRST_SCENE: Array.isArray(submissionMovie.scenes) ? submissionMovie.scenes[0] : null,
        RENDER_MOVIE_SOURCE: generatedMovie === payload.movie ? 'convert-document movie' : 'request movie',
        RENDER_MOVIE_SCHEMA_VALID: normalizedTotalDuration <= 55 && Array.isArray(submissionMovie.scenes) && submissionMovie.scenes.every((scene) => Number(scene.duration) > 0 && Array.isArray(scene.elements) && scene.elements.length > 0),
      };
      console.log('[render-diagnostics]', JSON.stringify(renderDiagnostics));
      const renderResult = await renderMovie(submissionMovie, { projectName: 'Local Render' });
      const project = (renderResult && renderResult.body && (renderResult.body.project || renderResult.body.projectId)) || renderResult.project || renderResult.projectId || renderResult.renderId || null;
      const success = !!project && renderResult.status && Number(renderResult.status) >= 200 && Number(renderResult.status) < 300;
      const response = { success: success, status: renderResult.status, project: project, renderId: project, videoUrl: renderResult.videoUrl, url: renderResult.videoUrl, jobId: renderResult.jobId, fallback: !!renderResult.fallback, message: renderResult.message || renderResult.error || 'Render submitted', movie };
      // Avoid leaking the full project ID in logs; only note presence
      console.log('[local-api] render-json2video -> remoteStatus=', renderResult.status, 'projectPresent=', !!project);
      return sendJson(res, 200, response);
    } catch (err) {
      console.error('[local-api] render error:', err);
      return sendJson(res, 400, { success: false, error: err.message || 'Render failed' });
    }
  }

  if (req.method === 'GET' && urlPath === '/api/render-status') {
    try {
      const renderId = new URL(req.url || '/', `http://localhost:${PORT}`).searchParams.get('id');
      if (!renderId) return sendJson(res, 400, { success: false, error: 'Missing render id' });
      const result = await require('./services/json2video-client').getRenderStatus(renderId);
      const movie = result.body && result.body.movie ? result.body.movie : (result.body || {});
      return sendJson(res, 200, { success: true, status: movie.status || result.status, videoUrl: movie.url || movie.videoUrl || null, message: movie.message || result.body.message || null });
    } catch (err) { return sendJson(res, 502, { success: false, error: err.message || 'Status request failed' }); }
  }
  if (req.method === 'GET' && urlPath === '/api/health') {
    return sendJson(res, 200, { status: 'ok', port: PORT });
  }

  sendJson(res, 404, { error: 'Unknown API route' });
}).listen(PORT, () => { console.log(`Local API server running on http://localhost:${PORT}`); });

