const fs = require('fs');
const path = require('path');

function ensureTmp() { const dir = path.join(process.cwd(), 'tmp'); try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {} return dir; }
function getJson2VideoConfig() { return { baseUrl: 'https://api.json2video.com', maxRetries: 2, timeoutMs: 30000 }; }

async function requestJson(url, opts = {}, maxRetries = 0) {
  ensureTmp();
  const logPath = path.join(process.cwd(), 'tmp', 'json2video_debug.log');
  const apiKeyPresent = !!process.env.JSON2VIDEO_API_KEY;
  const entry = { ts: new Date().toISOString(), url, apiKeyPresent };
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch (e) { body = { text }; }
    entry.status = res.status;
    entry.response = (typeof body === 'object' && body !== null && body.message) ? { message: body.message } : (typeof body === 'object' ? { keys: Object.keys(body).slice(0,10) } : { text: text.slice(0,200) });
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    if (!res.ok && maxRetries > 0) return requestJson(url, opts, maxRetries - 1);
    return { status: res.status, body };
  } catch (err) {
    entry.error = String(err.message || err);
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    if (maxRetries > 0) return requestJson(url, opts, maxRetries - 1);
    throw err;
  }
}

async function renderMovie(movieJson) {
  const cfg = getJson2VideoConfig();
  const endpoint = cfg.baseUrl.replace(/\/+$/,'') + '/v2/movies';
  const headers = { 'Content-Type': 'application/json', 'x-api-key': process.env.JSON2VIDEO_API_KEY || '' };
  const opts = { method: 'POST', headers, body: JSON.stringify(movieJson) };
  const resp = await requestJson(endpoint, opts, cfg.maxRetries);
  const body = resp && resp.body ? resp.body : {};
  const project = body && (body.project || body.projectId || body.id) ? (body.project || body.projectId || body.id) : null;
  return {
    status: resp.status,
    body,
    project,
    projectId: project,
    renderId: project,
    jobId: body.jobId || null,
    videoUrl: body.url || body.videoUrl || null,
    message: body.message || null,
    fallback: !!body.fallback,
  };
}

async function getRenderStatus(renderId) {
  const cfg = getJson2VideoConfig();
  const endpoint = cfg.baseUrl.replace(/\/+$/,'') + '/v2/movies?project=' + encodeURIComponent(renderId);
  const headers = { 'x-api-key': process.env.JSON2VIDEO_API_KEY || '' };
  return requestJson(endpoint, { method: 'GET', headers }, cfg.maxRetries);
}

module.exports = { getJson2VideoConfig, requestJson, renderMovie, getRenderStatus };

