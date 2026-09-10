try { require('dotenv').config({ path: '.env.local' }); require('dotenv').config(); } catch(e) { }
try { require('dotenv').config(); } catch(e) { }
const fs=require('fs');
const { buildJson2VideoMovie } = require('./services/json2video-movie');
const { renderMovie } = require('./services/json2video-client');
const file='C:\\Users\\Dell\\Downloads\\47109696_1_1234_video_project.reduced.sessions.json';
if(!fs.existsSync(file)){ console.error('MISSING', file); process.exit(1); }
const data=JSON.parse(fs.readFileSync(file,'utf8'));
const sessions=data.sessions || data;
const movie=buildJson2VideoMovie(sessions);
(async()=>{
  try{
    const res = await renderMovie(movie);
    console.log('RENDER_OK', res);
  }catch(e){ console.error('RENDER_ERR', e && e.message || e); process.exit(1); }
})();


