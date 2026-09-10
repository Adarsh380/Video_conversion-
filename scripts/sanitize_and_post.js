const fs = require('fs');
const pathIn = 'C:\\Users\\Dell\\Downloads\\47109696_1_1234_video_project.repaired.json';
const outPath = 'C:\\Users\\Dell\\Downloads\\Video_conversion--master\\sanitized_movie.json';
function safeRead(p){ try{ return fs.readFileSync(p,'utf8'); }catch(e){ console.error('Read error', e.message); process.exit(2);} }
let raw = safeRead(pathIn);
let obj;
try{ obj = JSON.parse(raw); }catch(e){ console.error('JSON parse failed:', e.message); process.exit(3); }
function sanitizeString(s){
  return Array.from(s).filter(ch => {
    const cp = ch.codePointAt(0);
    if (cp === 9 || cp === 10 || cp === 13) return true;
    if (cp >= 32 && !(cp >= 127 && cp <= 159)) return true;
    return false;
  }).join('');
}
function sanitize(val){
  if(typeof val === 'string') return sanitizeString(val);
  if(Array.isArray(val)) return val.map(sanitize);
  if(val && typeof val === 'object'){
    const out = {};
    for(const k of Object.keys(val)) out[k] = sanitize(val[k]);
    return out;
  }
  return val;
}
const cleaned = sanitize(obj);
fs.writeFileSync(outPath, JSON.stringify(cleaned, null, 2), 'utf8');
console.log('Sanitized JSON written to', outPath);

// POST to renderer
const http = require('http');
const url = new URL('http://localhost:3001/api/render-json2video');
const body = JSON.stringify(cleaned);
const opts = { hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
const req = http.request(opts, (resp) => {
  let data = '';
  resp.on('data', chunk => data += chunk);
  resp.on('end', () => {
    console.log('HTTP', resp.statusCode, data.slice(0, 2000));
  });
});
req.on('error', (err) => { console.error('Request error:', err.message); process.exit(4); });
req.write(body);
req.end();
