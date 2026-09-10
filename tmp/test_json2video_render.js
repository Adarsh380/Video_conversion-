const fs = require('fs');
const path = require('path');
const fetch = global.fetch;

function readJson(p){ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch(e){ return null; } }
function writeJson(p,obj){ fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8'); }
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function queryProjectStatus(projectId, apiKey){
  const url = `https://api.json2video.com/v2/movies?project=${encodeURIComponent(projectId)}`;
  const resp = await fetch(url, { method: 'GET', headers: { 'x-api-key': apiKey, 'Accept': 'application/json' } });
  const body = await resp.json().catch(()=>null);
  return { status: resp.status, body };
}

async function submitMovie(movieJson, apiKey){
  const url = 'https://api.json2video.com/v2/movies';
  const resp = await fetch(url, { method: 'POST', headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(movieJson) });
  const body = await resp.json().catch(()=>null);
  return { status: resp.status, body };
}

(async function(){
  try{
    let apiKey = process.env.JSON2VIDEO_API_KEY;
    try { if (!apiKey) { require('dotenv').config({ path: '.env.local' }); apiKey = process.env.JSON2VIDEO_API_KEY; } } catch(e){}
    if (!apiKey) throw new Error('Missing JSON2VIDEO_API_KEY in environment');

    const cwd = process.cwd();
    const convertedPath = path.join(cwd, 'tmp', 'converted_one_scene.json');
    if (!fs.existsSync(convertedPath)) throw new Error('converted_one_scene.json not found');
    const converted = JSON.parse(fs.readFileSync(convertedPath,'utf8'));

    const savedPath = path.join(cwd, 'tmp', 'render_test_step2.json');
    let saved = readJson(savedPath) || {};
    let projectId = saved.project || null;
    let usedSubmission = false;

    // If projectId exists, try polling it first
    if (projectId) {
      const probe = await queryProjectStatus(projectId, apiKey);
      if (!probe.body || (probe.status === 404) || (probe.body && probe.body.error && String(probe.body.error).toLowerCase().includes('not found'))) {
        projectId = null; // fallback to submission
      }
    }

    if (!projectId) {
      const submit = await submitMovie(converted, apiKey);
      if (!submit || !submit.body) throw new Error('Submission returned no body');
      const proj = submit.body.project || submit.body.projectId || (submit.body && submit.body.data && submit.body.data.project) || null;
      if (!proj) {
        if (submit.body && typeof submit.body === 'object') {
          const keys = Object.keys(submit.body).join(',');
          throw new Error(`Submission did not return a project id, response keys: ${keys}`);
        }
        throw new Error('Submission did not return a project id');
      }
      projectId = String(proj);
      saved = saved || {};
      saved.project = projectId;
      saved.status = submit.status;
      writeJson(savedPath, saved);
      usedSubmission = true;
    }

    const maxAttempts = 360; // ~30 minutes with 5s interval
    const intervalMs = 5000;
    let finalStatus = null;
    let finalUrl = null;
    let lastBody = null;

    for (let i = 0; i < maxAttempts; i++){
      const r = await queryProjectStatus(projectId, apiKey);
      lastBody = r.body || null;
      const movie = (r.body && (r.body.movie || (r.body.data && r.body.data.movie))) || null;
      const state = movie && movie.status ? String(movie.status).toLowerCase() : null;
      const url = movie && (movie.url || movie.output || movie.movieUrl) ? (movie.url || movie.output || movie.movieUrl) : null;
      if (state) {
        if (['done','completed','finished'].includes(state)) { finalStatus = state; finalUrl = url || null; break; }
        if (['error','failed'].includes(state)) { finalStatus = state; break; }
        if (['timeout','timedout'].includes(state)) { finalStatus = 'timeout'; break; }
      }
      if (r.status === 404) {
        if (usedSubmission) { finalStatus = 'error'; break; }
        const submit = await submitMovie(converted, apiKey);
        if (!submit || !submit.body) { throw new Error('Submission returned no body on fallback submit'); }
        const proj = submit.body.project || submit.body.projectId || (submit.body && submit.body.data && submit.body.data.project) || null;
        if (!proj) throw new Error('Fallback submission did not return project id');
        projectId = String(proj);
        saved.project = projectId; saved.status = submit.status; writeJson(savedPath, saved);
        usedSubmission = true;
      }
      await sleep(intervalMs);
    }

    if (!finalStatus) {
      console.log(`Step 4: FAIL`);
      console.log(`Project ID: ${projectId || 'NONE'}`);
      console.log(`Final render status: timeout`);
      console.log(`Final MP4 URL: NONE`);
      process.exit(1);
    }

    if (finalStatus && (finalStatus === 'done' || finalStatus === 'completed' || finalStatus === 'finished')) {
      if (!finalUrl) {
        console.log(`Step 4: FAIL`);
        console.log(`Project ID: ${projectId}`);
        console.log(`Final render status: ${finalStatus}`);
        console.log(`Final MP4 URL: NONE`);
        process.exit(1);
      }
      console.log(`Step 4: PASS`);
      console.log(`Project ID: ${projectId}`);
      console.log(`Final render status: ${finalStatus}`);
      console.log(`Final MP4 URL: ${finalUrl}`);
      process.exit(0);
    }

    if (finalStatus && (finalStatus === 'error' || finalStatus === 'failed' || finalStatus === 'timeout')) {
      const msg = (lastBody && (lastBody.movie && lastBody.movie.message)) || (lastBody && (lastBody.message || lastBody.error));
      console.log(`Step 4: FAIL`);
      console.log(`Project ID: ${projectId}`);
      console.log(`Final render status: ${finalStatus}`);
      console.log(`Final MP4 URL: NONE`);
      console.log(`Error: ${String(msg || 'Render error')}`);
      process.exit(1);
    }

    console.log(`Step 4: FAIL`);
    console.log(`Project ID: ${projectId || 'NONE'}`);
    console.log(`Final render status: unknown`);
    console.log(`Final MP4 URL: NONE`);
    process.exit(1);

  } catch (err) {
    console.log(`Error: ${String(err && err.message ? err.message : err)}`);
    process.exit(1);
  }
})();
