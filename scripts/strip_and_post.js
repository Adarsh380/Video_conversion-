const fs = require('fs');
const inPath = 'C:\\Users\\Dell\\Downloads\\Video_conversion--master\\sanitized_movie.json';
const outPath = 'C:\\Users\\Dell\\Downloads\\Video_conversion--master\\sanitized_movie_stripped.json';
function safeRead(p){ try{ return fs.readFileSync(p,'utf8'); }catch(e){ console.error('Read error', e.message); process.exit(2);} }
let obj;
try{ obj = JSON.parse(safeRead(inPath)); }catch(e){ console.error('JSON parse failed:', e.message); process.exit(3); }
function looksLikePdf(s){ return typeof s==='string' && (s.indexOf('%PDF-')!==-1 || s.indexOf('endstream')!==-1 || s.indexOf('xref')!==-1); }
function heavyBinary(s){ if(typeof s!=='string') return false; const ctl = (s.match(/[\u0000-\u001F]/g) || []).length; return ctl>50 || s.length>10000; }
function excerpt(s){ if(typeof s!=='string') return s; const cleaned = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g,''); return cleaned.slice(0,400) + (cleaned.length>400 ? '... [binary removed]' : ''); }
function sanitize(val){
  if(typeof val === 'string'){
    if(looksLikePdf(val) || heavyBinary(val)) return '[removed binary content]';
    return excerpt(val);
  }
  if(Array.isArray(val)) return val.map(sanitize);
  if(val && typeof val === 'object'){
    const out = {};
    for(const k of Object.keys(val)) out[k] = sanitize(val[k]);
    return out;
  }
  return val;
}
const stripped = sanitize(obj);
fs.writeFileSync(outPath, JSON.stringify(stripped, null, 2), 'utf8');
console.log('Stripped JSON written to', outPath);

// POST
const http = require('http');
const url = new URL('http://localhost:3001/api/render-json2video');
const body = JSON.stringify(stripped);
const opts = { hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
const req = http.request(opts, (resp) => {
  let data = '';
  resp.on('data', c=>data+=c);
  resp.on('end', ()=> console.log('HTTP', resp.statusCode, data.slice(0,2000)));
});
req.on('error', e=>{ console.error('Request error', e.message); process.exit(4); });
req.write(body);
req.end();
