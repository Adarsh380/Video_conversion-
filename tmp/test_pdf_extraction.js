const fs = require('fs');
const { parseDocument } = require('../services/document-parser');
(async () => {
  const file = process.argv[2] || 'tmp/climate.pdf';
  const result = await parseDocument(fs.readFileSync(file), file);
  const sample = String(result.fullText || '').replace(/\s+/g, ' ').slice(0, 180);
  const pass = result.success !== false && result.pageCount > 0 && result.fullText.length > 0 && Array.isArray(result.pages);
  console.log('PDF_EXTRACTION: ' + (pass ? 'PASS' : 'FAIL'));
  console.log('PAGE_COUNT: ' + result.pageCount);
  console.log('TEXT_LENGTH: ' + result.fullText.length);
  console.log('NEEDS_OCR: ' + result.needsOcr);
  console.log('FIRST_TEXT_SAMPLE: ' + sample);
  process.exitCode = pass ? 0 : 1;
})().catch((error) => {
  console.log('PDF_EXTRACTION: FAIL');
  console.log('PAGE_COUNT: 0');
  console.log('TEXT_LENGTH: 0');
  console.log('NEEDS_OCR: unknown');
  console.log('FIRST_TEXT_SAMPLE: ' + error.message);
  process.exitCode = 1;
});
