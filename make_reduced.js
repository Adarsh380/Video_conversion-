const fs=require('fs');
const inFile='C:\\Users\\Dell\\Downloads\\47109696_1_1234_video_project.sanitized.sessions.json';
const reducedFile='C:\\Users\\Dell\\Downloads\\47109696_1_1234_video_project.reduced.sessions.json';
if(!fs.existsSync(inFile)){ console.error('INPUT_MISSING', inFile); process.exit(1); }
let data=JSON.parse(fs.readFileSync(inFile,'utf8'));
let sessions = Array.isArray(data.sessions)?data.sessions:data;
const reduced = sessions.map((s,i)=>({ title: s.title||`Scene ${i+1}`, text: (s.narration||s.summary||s.text||s.on_screen_text||'').slice(0,1000), duration: Number(s.duration_seconds||s.duration||6) }));
fs.writeFileSync(reducedFile, JSON.stringify({sessions:reduced},null,2),'utf8');
console.log('WROTE', reducedFile, 'COUNT', reduced.length);
