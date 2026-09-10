const fs = require('fs');
const path = 'services/document-parser.js';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/const pdfParse = require\('pdf-parse'\);/, const { PDFParse } = require('pdf-parse'););
content = content.replace(/const data = await pdfParse\(buffer\);/, const parser = new PDFParse({ data: buffer, verbosity: 0 });
  const [textResult, infoResult] = await Promise.all([
    parser.getText(),
    parser.getInfo().catch(() => ({})),
  ]););
content = content.replace(/const fullText = String\(data && data\.text/g, const fullText = String(textResult && textResult.text);
content = content.replace(/const numPages = Number\(data && data\.numpages/g, const numPages = Number(textResult && textResult.total);
content = content.replace(/if \(data && data\.page && Array\.isArray\(data\.page\)\) {/g, if (Array.isArray(textResult && textResult.pages)) {);
content = content.replace(/pages = data\.page\.map/g, pages = (textResult.pages).map);
fs.writeFileSync(path, content);
console.log('FIXED');
