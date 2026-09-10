const fs=require('fs');
const p='C:/Users/Dell/Downloads/floor plan mccarthy _video_project.json';
const s=fs.readFileSync(p,'utf8');
const j=JSON.parse(s);
console.log('TOP_KEYS',Object.keys(j));
console.log('SCENES', j.scenes.length);
j.scenes.forEach((sc,i)=>{
  const title = sc.title || sc.name || `scene${i+1}`;
  const dur = sc.duration || sc.durationSeconds || 'n/a';
  const text = sc.text || sc.narration || sc.on_screen_text || sc.onScreenText || '';
  const textLen = text.length;
  const vk = (sc.visualKeywords || sc.keywords || []).length;
  const assets = sc.assets || sc.assetInformation || sc.assetInformation || sc.assetsInfo || [];
  console.log(`${i+1}. ${title} — duration:${dur} textLen:${textLen} keywords:${vk} assets:${(assets || []).length}`);
});
