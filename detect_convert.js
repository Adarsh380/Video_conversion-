const fs = require('fs');
const path = require('path');
const file = process.argv[2];
if (!file) { console.error('Usage: node detect_convert.js <file>'); process.exit(2); }
const buf = fs.readFileSync(file);
function hasPrefix(b, arr){ if (!b || b.length < arr.length) return false; for (let i=0;i<arr.length;i++) if (b[i]!==arr[i]) return false; return true; }
const UTF8BOM = [0xEF,0xBB,0xBF];
const UTF16LE = [0xFF,0xFE];
const UTF16BE = [0xFE,0xFF];
let encoding = null;
if (hasPrefix(buf, UTF8BOM)) encoding='utf8';
else if (hasPrefix(buf, UTF16LE)) encoding='utf16le';
else if (hasPrefix(buf, UTF16BE)) encoding='utf16be';
const tryDecode = (enc) => {
  if (enc==='utf16be') {
    const swapped = Buffer.alloc(buf.length);
    for (let i=0;i+1<buf.length;i+=2){ swapped[i]=buf[i+1]; swapped[i+1]=buf[i]; }
    if (buf.length%2) swapped[buf.length-1]=buf[buf.length-1];
    return swapped.toString('utf16le');
  } else {
    return buf.toString(enc);
  }
}
const candidates = encoding ? [encoding, 'utf8', 'utf16le', 'utf16be'] : ['utf8','utf16le','utf16be'];
const results = [];
for (const c of candidates){
  try {
    const s = tryDecode(c);
    const trimmed = s.trim();
    let ok=false;
    if (trimmed.startsWith('{')||trimmed.startsWith('[')){
      try{ JSON.parse(trimmed); ok=true; }catch(e){}
    }
    results.push({enc:c, ok, sample: trimmed.slice(0,200)});
    if (ok){
      const out = file.replace(/\.json$/i, '.utf8.json');
      fs.copyFileSync(file, file + '.bak');
      fs.writeFileSync(out, trimmed, {encoding:'utf8'});
      console.log('WROTE:'+out+' BAK:'+file+'.bak');
      const lines = trimmed.split(/\r\n|\n/).slice(0,40).join('\n');
      console.log(lines);
      process.exit(0);
    }
  } catch(err){
    results.push({enc:c, err:err.message});
  }
}
console.error('No valid JSON detected using utf8/utf16le/utf16be. Samples:');
console.error(JSON.stringify(results, null, 2));
process.exit(1);
