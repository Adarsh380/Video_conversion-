(async function(){
  try{
    const fs = require('fs');
    const body = fs.readFileSync('tmp/demo.json','utf8');
    const apiKey = process.env.JSON2VIDEO_API_KEY || '';
    const url = 'https://api.json2video.com/v2/movies';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: body,
    });
    const text = await res.text();
    fs.writeFileSync('tmp/json2video_probe_response.txt', `STATUS:${res.status}\n` + text);
    console.log('WROTE tmp/json2video_probe_response.txt');
  }catch(e){
    console.error('PROBE_ERR', e && e.message || e);
  }
})();
