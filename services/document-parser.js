const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { getPath: getPdfWorkerPath } = require('pdf-parse/worker');
const { pathToFileURL } = require('url');

PDFParse.setWorker(pathToFileURL(getPdfWorkerPath()).href);
const mammoth = require('mammoth');
const JSZip = require('jszip');

function extractHeadings(text) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headings = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 3 && line.length < 120) {
      const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line);
      const looksLikeHeading = /[:\-]$/.test(line) || /^[A-Z][\w\s]{2,60}$/.test(line);
      if (isAllCaps || looksLikeHeading) headings.push(line);
    }
    if (headings.length >= 50) break;
  }
  return headings.slice(0, 50);
}

function normalizeDocumentResult({ fullText = '', pages = [], pageCount, metadata = {}, needsOcr = false, messages }) {
  const normalizedPages = Array.isArray(pages) && pages.length
    ? pages.map((page, index) => {
        const text = typeof page === 'string' ? page : (page && typeof page.text === 'string' ? page.text : '');
        return {
          pageNumber: page && typeof page.pageNumber === 'number' ? page.pageNumber : index + 1,
          text: String(text || '').trim(),
          headings: Array.isArray(page && page.headings) ? page.headings : extractHeadings(text),
        };
      })
    : (fullText ? [{ pageNumber: 1, text: String(fullText || '').trim(), headings: extractHeadings(fullText) }] : []);

  const normalizedText = String(fullText || normalizedPages.map((page) => page.text).join('\n\n')).trim();
  const headings = normalizedPages.flatMap((page) => page.headings || []).slice(0, 50);

  return {
    success: true,
    metadata: metadata || {},
    pageCount: Number(pageCount || normalizedPages.length || 0),
    pages: normalizedPages,
    text: normalizedText,
    headings,
    fullText: normalizedText,
    needsOcr: !!needsOcr,
    ...(messages !== undefined ? { messages } : {}),
  };
}

async function parsePdf(buffer) {
  const parser = new PDFParse({ data: buffer, verbosity: 0 });

  try {
    const [textResult, infoResult] = await Promise.all([
      parser.getText(),
      parser.getInfo().catch(() => ({})),
    ]);

    const fullText = String(textResult && textResult.text ? textResult.text : '').trim();
    const pages = Array.isArray(textResult && textResult.pages)
      ? textResult.pages.map((page, index) => ({
          pageNumber: Number(page && page.num ? page.num : index + 1),
          text: String(page && page.text ? page.text : '').trim(),
          headings: extractHeadings(page && page.text ? page.text : ''),
        }))
      : (fullText ? [{ pageNumber: 1, text: fullText, headings: extractHeadings(fullText) }] : []);

    const metadata = infoResult && typeof infoResult === 'object' ? { ...(infoResult.metadata || {}), ...(infoResult.info || {}) } : {};

    return normalizeDocumentResult({
      fullText,
      pages,
      pageCount: Number((textResult && textResult.total) || pages.length || 0),
      metadata,
      needsOcr: fullText.replace(/\s+/g, '').length === 0,
    });
  } catch (error) {
    throw new Error('pdf-parse error: ' + (error && error.message ? error.message : String(error)));
  } finally {
    if (parser && typeof parser.destroy === 'function') {
      await parser.destroy().catch(() => {});
    }
  }
}

async function parseDocx(buffer) {
  const res = await mammoth.extractRawText({ buffer });
  const fullText = String(res && res.value ? res.value : '').trim();
  const pages = [{ pageNumber: 1, text: fullText, headings: extractHeadings(fullText) }];
  return normalizeDocumentResult({
    fullText,
    pages,
    pageCount: 1,
    metadata: {},
    needsOcr: false,
    messages: res && res.messages ? res.messages : undefined,
  });
}

async function parseTxt(buffer) {
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

  text = String(text || '').replace(/\u0000/g, '').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/);
  const pageCount = Math.max(1, Math.ceil(lines.length / 50));
  const pages = [];
  const approx = Math.ceil(lines.length / pageCount) || lines.length;
  for (let i = 0; i < pageCount; i++) {
    const slice = lines.slice(i * approx, (i + 1) * approx).join('\n').trim();
    pages.push({ pageNumber: i + 1, text: slice, headings: extractHeadings(slice) });
  }
  return normalizeDocumentResult({ fullText: text, pages, pageCount, metadata: {}, needsOcr: false });
}

async function parsePptx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files).filter((file) => file.startsWith('ppt/slides/slide') && file.endsWith('.xml'));
  slideFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const pages = [];
  for (let i = 0; i < slideFiles.length; i++) {
    const file = slideFiles[i];
    const content = await zip.files[file].async('string');
    const matches = [...content.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)];
    const texts = matches.map((match) => match[1]).join(' ').replace(/\s+/g, ' ').trim();
    pages.push({ pageNumber: i + 1, text: texts, headings: extractHeadings(texts) });
  }
  const fullText = pages.map((page) => page.text).join('\n\n');
  return normalizeDocumentResult({ fullText, pages, pageCount: pages.length, metadata: {}, needsOcr: false });
}

async function parseDocument(buffer, originalName) {
  const ext = (originalName && originalName.indexOf('.') !== -1) ? path.extname(originalName).toLowerCase() : '';
  try {
    if (ext === '.pdf') return await parsePdf(buffer);
    if (ext === '.docx') return await parseDocx(buffer);
    if (ext === '.txt') return await parseTxt(buffer);
    if (ext === '.pptx') return await parsePptx(buffer);
    try {
      return await parsePdf(buffer);
    } catch (_) {
      const txt = buffer.toString('utf8');
      const pages = [{ pageNumber: 1, text: txt, headings: extractHeadings(txt) }];
      return normalizeDocumentResult({ fullText: txt, pages, pageCount: 1, metadata: {}, needsOcr: false });
    }
  } catch (err) {
    throw err;
  }
}

module.exports = { parseDocument };
