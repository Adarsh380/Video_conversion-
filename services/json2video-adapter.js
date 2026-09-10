const fs = require('fs');
const path = require('path');

function ensureTmp() { const dir = path.join(process.cwd(), 'tmp'); try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {} return dir; }

function logWarning(warn) {
  try {
    ensureTmp();
    fs.appendFileSync(path.join(process.cwd(), 'tmp', 'adapter_warnings.log'), JSON.stringify({ ts: new Date().toISOString(), warn }) + '\n');
  } catch (e) {}
}

function writeWarnings(warnings) {
  try {
    ensureTmp();
    fs.writeFileSync(path.join(process.cwd(), 'tmp', 'adapter_warnings.json'), JSON.stringify(warnings, null, 2) + '\n', 'utf8');
  } catch (e) {}
}
function normalizePosition(position) {
  if (position && typeof position === 'object') {
    return { position: 'custom', x: Math.round(Number(position.x)), y: Math.round(Number(position.y)) };
  }
  return { position: typeof position === 'string' ? position : 'center-center' };
}

function convertTextStyle(style) {
  if (!style || typeof style !== 'object') return { style: style || '001' };
  const settings = {};
  const names = { fontSize: 'font-size', fontWeight: 'font-weight', color: 'color', align: 'text-align', family: 'font-family', lineHeight: 'line-height', maxWidth: 'max-width' };
  for (const [sourceName, cssName] of Object.entries(names)) {
    if (style[sourceName] !== undefined) {
      const value = style[sourceName];
      if (sourceName === 'fontSize' || sourceName === 'maxWidth') settings[cssName] = typeof value === 'number' ? `${value}px` : String(value);
      else settings[cssName] = sourceName === 'family' ? String(value).split(',')[0].trim() : String(value);
    }
  }
  if (style.shadow && typeof style.shadow === 'object') {
    const shadow = style.shadow;
    const color = String(shadow.color || '#000000');
    const alpha = shadow.alpha === undefined ? 1 : shadow.alpha;
    const blur = Number(shadow.blur || 0);
    const rgba = /^#[0-9a-f]{6}$/i.test(color) ? `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${alpha})` : color;
    settings['text-shadow'] = `0 0 ${blur}px ${rgba}`;
  }
  return { style: '001', settings };
}

function convertLayer(layer, sceneIndex, layerIndex, warnings) {
  if (!layer || !layer.type) {
    const w = `missing-type at scene ${sceneIndex} layer ${layerIndex}`;
    warnings.push(w); logWarning(w); return { type: 'unsupported', note: 'missing type', original: layer };
  }
  const t = String(layer.type).toLowerCase();
  switch (t) {
    case 'image': {
      const placement = normalizePosition(layer.position);
      return {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1600&q=80',
        opacity: layer.opacity == null ? 1 : layer.opacity,
        fit: layer.fit || layer.objectFit || 'cover',
        size: layer.size || null,
        ...placement,
      };
    }
    case 'video': {
      const placement = normalizePosition(layer.position);
      return {
        type: 'video',
        src: layer.source || layer.url || layer.src || null,
        opacity: layer.opacity == null ? 1 : layer.opacity,
        fit: layer.fit || 'cover',
        size: layer.size || null,
        start: layer.start != null ? layer.start : 0,
        end: layer.end != null ? layer.end : undefined,
        ...placement,
      };
    }
    case 'text': {
      const placement = normalizePosition(layer.position);
      const textStyle = convertTextStyle(layer.style);
      return {
        type: 'text',
        text: layer.text || layer.content || '',
        animation: layer.animation || null,
        ...textStyle,
        ...placement,
      };
    }
    case 'audio':
      return {
        type: 'audio',
        source: layer.source || layer.url || null,
        volume: layer.volume != null ? layer.volume : 1,
        start: layer.start != null ? layer.start : 0,
        end: layer.end != null ? layer.end : null,
      };
    case 'narration':
    case 'voice':
    case 'tts':
      // Map to a voice element if provider supports it
      return {
        type: 'voice',
        text: layer.text || layer.script || '',
        voice: layer.voice || layer.voiceName || null,
        start: layer.start != null ? layer.start : 0,
        end: layer.end != null ? layer.end : null,
      };
    default:
      const w = `unsupported layer type '${layer.type}' at scene ${sceneIndex} layer ${layerIndex}`;
      warnings.push(w); logWarning(w);
      return { type: 'unsupported', note: w, original: layer };
  }
}

function convertCustomMovieToJSON2Video(customMovie) {
  const warnings = [];
  if (!customMovie || !Array.isArray(customMovie.scenes)) {
    const w = 'Invalid customMovie: missing scenes array';
    warnings.push(w); logWarning(w);
    throw new Error(w);
  }

  const out = { scenes: [] };
  const root = {
    resolution: customMovie.resolution,
    width: customMovie.width,
    height: customMovie.height,
    quality: customMovie.quality,
    cache: customMovie.cache,
    variables: customMovie.variables,
    client_data: customMovie.client_data || customMovie['client-data'],
  };
  if (typeof root.resolution === 'string' && /^\d+x\d+$/.test(root.resolution)) {
    const [width, height] = root.resolution.split('x').map(Number);
    root.resolution = width === 1920 && height === 1080 ? 'full-hd' : 'custom';
    if (root.width == null) root.width = width;
    if (root.height == null) root.height = height;
  }
  const resolutions = ['sd', 'hd', 'full-hd', 'squared', 'instagram-story', 'instagram-feed', 'twitter-landscape', 'twitter-portrait', 'custom'];
  if (!resolutions.includes(root.resolution)) delete root.resolution;
  Object.entries(root).forEach(([key, value]) => {
    if (value !== undefined && value !== null) out[key] = value;
  });

  const supportedRoot = new Set(['scenes', 'resolution', 'width', 'height', 'quality', 'cache', 'variables', 'client_data']);
  Object.keys(customMovie).filter((key) => !supportedRoot.has(key)).forEach((key) => {
    const warning = `Removed unsupported top-level property: ${key}`;
    warnings.push(warning);
    logWarning(warning);
  });

  customMovie.scenes.forEach((scene, si) => {
    const sceneOut = {
      id: scene.id || `scene_${si+1}`,
      duration: scene.duration || scene.seconds || 6,
      transition: scene.transition || null,
      elements: [],
    };

    if (!Array.isArray(scene.layers)) {
      const w = `Scene ${si+1} has no layers array`; warnings.push(w); logWarning(w);
    } else {
      scene.layers.forEach((layer, li) => {
        const el = convertLayer(layer, si+1, li+1, warnings);
        sceneOut.elements.push(el);
      });
    }

    out.scenes.push(sceneOut);
  });

  writeWarnings(warnings);
  return { movie: out, warnings };
}

module.exports = { convertCustomMovieToJSON2Video };



