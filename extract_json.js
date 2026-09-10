const fs = require('fs');
const path = require('path');
const file = process.argv[2];
if (!file) { console.error('Usage: node extract_json.js <file>'); process.exit(2); }
const buf = fs.readFileSync(file);
const s = buf.toString('latin1');
const first = s.indexOf('{');
const last = s.lastIndexOf('}');
if (first === -1 || last === -1 || last <= first) {
  console.error('No matching { ... } range found in file.');
  process.exit(1);
}
let candidate = s.slice(first, last+1);
// Normalize common null bytes and replace non-utf8-high bytes via Buffer from latin1 -> utf8
const recovered = Buffer.from(candidate, 'latin1').toString('utf8');
const out = file.replace(/\.json$/i, '.recovered.json');
fs.writeFileSync(out, recovered, {encoding:'utf8'});
fs.copyFileSync(file, file + '.bak2');
console.log('WROTE:'+out+' BAK:'+file+'.bak2');
const lines = recovered.split(/\r\n|\n/).slice(0,40).join('\n');
console.log(lines);
try {
  JSON.parse(recovered);
  console.log('\nPARSE_OK: extracted content is valid JSON');
} catch(e) {
  console.error('\nPARSE_FAIL: extracted content is not valid JSON:', e.message.split('\n')[0]);
}
