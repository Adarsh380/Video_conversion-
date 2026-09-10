const fs=require('fs');
const url=process.env.NEXT_PUBLIC_RENDER_API_URL || 'http://localhost:3001/api/render-json2video';
const file='C:\\Users\\Dell\\Downloads\\47109696_1_1234_video_project.sanitized.sessions.json';
const body=fs.readFileSync(file,'utf8');
(async()=>{
  try{
    if(typeof fetch==='undefined'){
      console.error('NO_FETCH: Node global fetch not available in this runtime');
      process.exit(2);
    }
    console.log('POST', url, 'BODY_BYTES', Buffer.byteLength(body));
    const res=await fetch(url,{method:'POST', headers:{'Content-Type':'application/json'}, body});
    const text=await res.text();
    console.log('STATUS', res.status, res.statusText);
    try{ console.log('RESPONSE_JSON', JSON.parse(text)); }catch(e){ console.log('RESPONSE_TEXT_SNIPPET', text.slice(0,2000)); }
  }catch(e){ console.error('POST_ERROR', e.message); process.exit(1); }
})();
