const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const JSZip = require('jszip');

function extractHeadings(text) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const headings = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 3 && line.length < 120) {
      const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line);
      const looksLikeHeading = isAllCaps || /[:\-]$/.test(line) || /^[A-Z][\w\s]{2,60}$/.test(line);
      if (isAllCaps || looksLikeHeading) headings.push(line);
    }
    if (headings.length >= 50) break;
  }
  return headings.slice(0, 50);
}

async function parsePdf(buffer) {
  // Robust pdf-parse shim: support function export, default export, or PDFParse class
  const pdfModule = require('pdf-parse');
  let data = null;
  try {
    if (typeof pdfModule === 'function') {
      data = await pdfModule(buffer);
    } else if (pdfModule && typeof pdfModule.default === 'function') {
      data = await pdfModule.default(buffer);
    } else if (pdfModule && typeof pdfModule.PDFParse === 'function') {
      const PDFParseClass = pdfModule.PDFParse;
      // Try instance API if available
      try {
        const inst = new PDFParseClass();
        if (typeof inst.load === 'function') {
          await inst.load(buffer);
          const fullText = (typeof inst.getText === 'function') ? await inst.getText() : (inst.text || '');
          const numpages = inst.numPages || inst.numpages || 0;
          data = { text: fullText, numpages };
        } else if (typeof PDFParseClass.parse === 'function') {
          data = await PDFParseClass.parse(buffer);
        }
      } catch (e) {
        throw e;
      }
    }
  } catch (e) {
    throw new Error('pdf-parse error: ' + (e && e.message ? e.message : String(e)));
  }
  if (!data) throw new Error('pdf-parse: unsupported module shape');

  const fullText = data.text || '';
  const pageCount = data.numpages || data.numPages || (fullText ? 1 : 0);

  let pages = [];
  if (fullText.indexOf('\f') !== -1) {
    pages = fullText.split('\f').map((t) => ({ text: t.trim(), headings: extractHeadings(t) }));
  } else if (pageCount && pageCount > 1) {
    const approxLen = Math.ceil(fullText.length / pageCount);
    for (let i = 0; i < pageCount; i++) {
      const start = i * approxLen;
      const slice = fullText.slice(start, start + approxLen).trim();
      pages.push({ text: slice, headings: extractHeadings(slice) });
    }
  } else {
    pages = [{ text: fullText.trim(), headings: extractHeadings(fullText) }];
  }

  const needsOcr = (fullText.replace(/\s+/g, '').length < Math.max(40, pageCount * 50));
  return { fullText, pageCount, pages, needsOcr };
}

async function parseDocx(buffer) {
  const res = await mammoth.extractRawText({ buffer });
  const fullText = res.value || '';
  const pages = [{ text: fullText.trim(), headings: extractHeadings(fullText) }];
  return { fullText, pageCount: 1, pages, needsOcr: false, messages: res.messages };
}

async function parseTxt(buffer) {
  // Detect encoding and decode
  let text = '';
  try {
    if (buffer && buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
      text = buffer.toString('utf16le');
    } else if (buffer && buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
      const swapped = Buffer.allocUnsafe(buffer.length);
      for (let i = 0; i + 1 < buffer.length; i += 2) {
        swapped[i] = buffer[i + 1];
        swapped[i + 1] = buffer[i];
      }
      text = swapped.toString('utf16le');
    } else {
      text = buffer.toString('utf8');
      const nullCount = (text.match(/\u0000/g) || []).length;
      if (nullCount > 0) text = buffer.toString('utf16le');
    }
  } catch (e) {
    try { text = buffer.toString('utf8'); } catch (_) { text = ''; }
  }

  // Normalize: strip nulls and BOM
  text = String(text || '').replace(/\u0000/g, '').replace(/^\uFEFF/, '');

  const lines = text.split(/\r?\n/);
  const pageCount = Math.max(1, Math.ceil(lines.length / 50));
  const pages = [];
  const approx = Math.ceil(lines.length / pageCount) || lines.length;
  for (let i = 0; i < pageCount; i++) {
    const slice = lines.slice(i * approx, (i + 1) * approx).join('\n').trim();
    pages.push({ text: slice, headings: extractHeadings(slice) });
  }
  return { fullText: text, pageCount, pages, needsOcr: false };
}

async function parsePptx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files).filter((f) => f.startsWith('ppt/slides/slide') && f.endsWith('.xml'));
  slideFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const pages = [];
  for (let i = 0; i < slideFiles.length; i++) {
    const file = slideFiles[i];
    const content = await zip.files[file].async('string');
    const matches = [...content.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)];
    const texts = matches.map(m => m[1]).join(' ').replace(/\s+/g,' ').trim();
    pages.push({ text: texts, headings: extractHeadings(texts) });
  }
  const fullText = pages.map(p => p.text).join('\n\n');
  return { fullText, pageCount: pages.length, pages, needsOcr: false };
}

async function parseDocument(buffer, originalName) {
  const ext = (originalName && originalName.indexOf('.') !== -1) ? path.extname(originalName).toLowerCase() : '';
  try {
    if (ext === '.pdf') return await parsePdf(buffer);
    if (ext === '.docx') return await parseDocx(buffer);
    if (ext === '.txt') return await parseTxt(buffer);
    if (ext === '.pptx') return await parsePptx(buffer);
    try { return await parsePdf(buffer); } catch (_) {
      const txt = buffer.toString('utf8');
      return { fullText: txt, pageCount: 1, pages: [{ text: txt, headings: extractHeadings(txt) }], needsOcr: false };
    }
  } catch (err) {
    throw err;
  }
}

module.exports = { parseDocument };
