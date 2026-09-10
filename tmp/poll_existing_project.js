const fs = require('fs');
const path = require('path');
const { getRenderStatus } = require('../services/json2video-client');

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function findMp4(obj){
  if (!obj) return null;
  if (typeof obj === 'string') return obj.includes('.mp4')?obj:null;
  if (Array.isArray(obj)){
    for (const v of obj){ const f=findMp4(v); if (f) return f; }
  } else if (typeof obj === 'object'){
    for (const k of Object.keys(obj)){
      const v = obj[k]; if (typeof v === 'string' && v.includes('.mp4')) return v;
      const f = findMp4(v); if (f) return f;
    }
  }
  return null;
}

(async function(){
  const projectId = 'u3YNksuEOib7Yyz2';
  const outPath = path.join(process.cwd(),'tmp','render_final.json');
  const maxAttempts = 360; // 30 minutes at 5s
  const intervalMs = 5000;
  try{
    for (let i=0;i<maxAttempts;i++){
      const st = await getRenderStatus(projectId);
      const body = st && st.body ? st.body : null;
      const statusField = body && (body.status||body.state||body.renderStatus) ? (body.status||body.state||body.renderStatus) : null;
      const mp4 = findMp4(body);
      console.log(new Date().toISOString(), 'poll', i+1, 'status=', st && st.status, 'statusField=', statusField, 'mp4Found=', !!mp4);
      if (mp4) {
        const result = { projectId, finalStatus: statusField||'completed', mp4 };
        fs.writeFileSync(outPath, JSON.stringify(result, null, 2),'utf8');
        console.log('MP4 found, exiting');
        process.exit(0);
      }
      const terminalFail = statusField && ['failed','error','cancelled','canceled'].includes(String(statusField).toLowerCase());
      if (terminalFail) {
        const err = { projectId, finalStatus: statusField, sanitized: { keys: body ? Object.keys(body) : null, message: body && body.message ? body.message : undefined } };
        fs.writeFileSync(outPath, JSON.stringify(err,null,2),'utf8');
        console.error('Terminal failure, exiting');
        process.exit(2);
      }
      await sleep(intervalMs);
    }
    const timeoutErr = { projectId, finalStatus: 'timeout', sanitized: 'Polling timed out' };
    fs.writeFileSync(outPath, JSON.stringify(timeoutErr,null,2),'utf8');
    console.error('Timed out, exiting');
    process.exit(3);
  } catch(e){
    const err = { projectId, finalStatus: 'error', sanitized: String(e.message||e) };
    fs.writeFileSync(outPath, JSON.stringify(err,null,2),'utf8');
    console.error('Error, exiting', e.message || e);
    process.exit(4);
  }
})();
