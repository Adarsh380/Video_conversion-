const fs=require('fs');
const inFile='C:\\Users\\Dell\\Downloads\\47109696_1_1234_video_project.sessions.json';
const outFile='C:\\Users\\Dell\\Downloads\\47109696_1_1234_video_project.sanitized.sessions.json';
if(!fs.existsSync(inFile)){ console.error('INPUT_MISSING', inFile); process.exit(1);}
let data=JSON.parse(fs.readFileSync(inFile,'utf8'));
let sessions = Array.isArray(data.sessions)?data.sessions:data;
function escapeRe(s){ return s.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&'); }
function clean(s){ if(typeof s!=='string') return s;
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]+/g,' ');
  const toks=['/Filter','obj','endstream','FlateDecode','%PDF','xref','trailer','stream','endobj','<?xpacket','<<'];
  toks.forEach(t=>{ s = s.replace(new RegExp(escapeRe(t),'gi'),' '); });
  s = s.replace(/\s{2,}/g,' ').trim();
  if(s.length>1200) s = s.slice(0,1200)+'…';
  return s;
}

sessions.forEach(sess=>{ ['narration','summary','text','on_screen_text'].forEach(k=>{ if(sess[k]) sess[k]=clean(sess[k]); }); });
fs.writeFileSync(outFile, JSON.stringify({sessions},null,2),'utf8');
console.log('WROTE', outFile, 'COUNT', sessions.length);
