const JSON5 = require('json5');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const schemaPath = path.join(__dirname, 'sessions.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

function sanitize(str) {
  let s = String(str || '');
  s = s.replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2028\u2029]/g, '\n')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/;\s*$/g, '')
    .replace(/,\s*([}\]])/g, '$1')
    .trim();
  return s;
}

function parseLenient(raw) {
  const clean = sanitize(raw);
  try { return JSON.parse(clean); } catch (_) {}
  try { return JSON5.parse(clean); } catch (_) {}
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const sub = clean.slice(start, end + 1);
    try { return JSON.parse(sub); } catch (_) {}
    try { return JSON5.parse(sub); } catch (_) {}
  }
  throw new Error('Unable to parse JSON');
}

function scenesToSessions(data) {
  if (Array.isArray(data.sessions)) return data;
  const scenes = Array.isArray(data.scenes) ? data.scenes : [];
  if (!scenes.length) return data;
  const sessions = scenes.map((s, i) => ({
    title: s.title || `Session ${i + 1}`,
    text: s.narration || s.on_screen_text || s.summary || '',
    context: data.rawText || s.context || '',
    duration: Number(s.durationSeconds || s.duration || 10),
    visualKeywords: Array.isArray(s.visual_keywords) ? s.visual_keywords : [],
    textPlacement: { x: 'center', y: '70%' },
    audioVolume: 1,
    voice: s.voice || undefined,
  }));
  return { sessions };
}

function normalizeAndValidate(raw) {
  const parsed = scenesToSessions(parseLenient(raw));
  const valid = validate(parsed);
  if (!valid) {
    const errors = validate.errors.map((e) => ({
      path: e.instancePath || e.schemaPath,
      message: e.message,
    }));
    const err = new Error('JSON validation failed');
    err.details = errors;
    throw err;
  }
  return parsed;
}

module.exports = { normalizeAndValidate };
