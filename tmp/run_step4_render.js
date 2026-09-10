require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const moviePath = 'tmp/converted_one_scene.json';
const endpoint = 'https://api.json2video.com/v2/movies';
const apiKey = process.env.JSON2VIDEO_API_KEY;
function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !/api.?key|authorization|token|secret|password/i.test(key)).map(([key, item]) => [key, sanitize(item)]));
  return value;
}


async function main() {
  if (!apiKey) {
    throw new Error('JSON2VIDEO_API_KEY is not configured');
  }

  const source = JSON.parse(fs.readFileSync(moviePath, 'utf8'));
  const movie = JSON.parse(JSON.stringify(source));

  if (movie.scenes && movie.scenes[0]) {
    delete movie.scenes[0].name;
    delete movie.scenes[0].background;
    for (const e of movie.scenes[0].elements || []) {
      if (e && e.position && typeof e.position === 'object') {
        const x = e.position.x;
        const y = e.position.y;
        e.position = 'custom';
        e.x = Math.round(x);
        e.y = Math.round(y);
      }
    }
  }

  const imageElements = (movie.scenes || []).flatMap((scene) => scene.elements || [])
    .filter((element) => element.type === 'image');
  for (const element of imageElements) {
    if (Object.prototype.hasOwnProperty.call(element, 'source')) {
      element.src = element.source;
      delete element.source;
    }
  }
  if (imageElements[0]) {
    imageElements[0].src = 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1600&q=80';
  }

  const videoElements = (movie.scenes || []).flatMap((scene) => scene.elements || [])
    .filter((element) => element.type === 'video');
  for (const element of videoElements) {
    if (Object.prototype.hasOwnProperty.call(element, 'source')) {
      element.src = element.source;
      delete element.source;
    }
  }
  for (const scene of movie.scenes || []) {
    if (Object.prototype.hasOwnProperty.call(scene, 'audio')) {
      delete scene.audio;
    }
  }

  for (const element of movie.scenes?.[0]?.elements || []) {
    if (element.type === 'text' && element.style && typeof element.style === 'object') {
      const sourceStyle = element.style;
      const settings = {};
      const cssNames = {
        fontSize: 'font-size',
        fontWeight: 'font-weight',
        color: 'color',
        align: 'text-align',
        family: 'font-family',
        lineHeight: 'line-height',
        maxWidth: 'max-width',
      };
      for (const [sourceName, cssName] of Object.entries(cssNames)) {
        if (sourceStyle[sourceName] !== undefined) {
          const value = sourceStyle[sourceName];
          if (sourceName === 'fontSize' || sourceName === 'maxWidth') {
            settings[cssName] = typeof value === 'number' ? `${value}px` : String(value);
          } else {
            settings[cssName] = sourceName === 'family' ? String(value).split(',')[0].trim() : String(value);
          }
        }
      }
      if (sourceStyle.shadow && typeof sourceStyle.shadow === 'object') {
        const shadow = sourceStyle.shadow;
        const alpha = shadow.alpha === undefined ? 1 : shadow.alpha;
        const color = String(shadow.color || '#000000');
        const blur = Number(shadow.blur || 0);
        const rgbaColor = /^#[0-9a-f]{6}$/i.test(color)
          ? `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${alpha})`
          : color;
        settings['text-shadow'] = `0 0 ${blur}px ${rgbaColor}`;
      }
      element.style = '001';
      element.settings = settings;
    }
  }

  console.log('NAME_PRESENT:' + Boolean(movie.scenes?.[0]?.name));
  console.log('TOP_LEVEL_DURATION_PRESENT:' + Object.prototype.hasOwnProperty.call(movie, 'duration'));
  console.log('SCENE_DURATION:' + (movie.scenes?.[0]?.duration ?? 'NONE'));
  console.log('VERSION_PRESENT:' + Object.prototype.hasOwnProperty.call(movie, 'version'));
  console.log('BACKGROUND_PRESENT:' + Boolean(movie.scenes?.[0]?.background));
  console.log('POSITION_TYPE:' + typeof movie.scenes?.[0]?.elements?.[0]?.position);
  console.log('POSITION:' + (movie.scenes?.[0]?.elements?.[0]?.position || 'NONE'));
  console.log('X:' + (movie.scenes?.[0]?.elements?.[0]?.x ?? 'NONE'));
  console.log('Y:' + (movie.scenes?.[0]?.elements?.[0]?.y ?? 'NONE'));
  console.log('X_TYPE:' + typeof movie.scenes?.[0]?.elements?.[0]?.x);
  console.log('Y_TYPE:' + typeof movie.scenes?.[0]?.elements?.[0]?.y);
  let objectStyleCount = 0;
  (movie.scenes?.[0]?.elements || []).forEach((element, index) => {
    if (element.style && typeof element.style === 'object') objectStyleCount += 1;
    if (element.type === 'text') {
      console.log(`ELEMENT_${index}_STYLE_TYPE:${typeof element.style}`);
      console.log(`ELEMENT_${index}_STYLE:${JSON.stringify(element.style ?? null, null, 2)}`);
      console.log(`ELEMENT_${index}_SETTINGS:${JSON.stringify(element.settings ?? null, null, 2)}`);
    }
  });
  console.log('OBJECT_STYLE_COUNT:' + objectStyleCount);
  console.log('IMAGE_ELEMENTS:' + imageElements.length);
  console.log('IMAGE_0_SRC:' + (imageElements[0]?.src || 'NONE'));
  console.log('IMAGE_0_SOURCE_PRESENT:' + Object.prototype.hasOwnProperty.call(imageElements[0] || {}, 'source'));
  console.log('ALL_IMAGES_HAVE_SRC_NO_SOURCE:' + (imageElements.every((element) => typeof element.src === 'string' && !Object.prototype.hasOwnProperty.call(element, 'source'))));  console.log('VIDEO_ELEMENTS:' + videoElements.length);
  console.log('VIDEO_0_SRC:' + (videoElements[0]?.src || 'NONE'));
  console.log('VIDEO_0_SOURCE_PRESENT:' + Object.prototype.hasOwnProperty.call(videoElements[0] || {}, 'source'));
  console.log('ALL_VIDEOS_HAVE_SRC_NO_SOURCE:' + videoElements.every((element) => typeof element.src === 'string' && !Object.prototype.hasOwnProperty.call(element, 'source')));

  let response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(movie)
  });

  let body = await response.json().catch(() => null);

  const project =
    body &&
    typeof body.project === 'string' &&
    body.project.trim()
      ? body.project.trim()
      : null;

  console.log('SUBMIT_STATUS:' + response.status);
  console.log('SUBMIT_SUCCESS:' + (body?.success === true));
  console.log('PROJECT_ID:' + (project || 'NONE'));

  if (
    response.status !== 200 ||
    body?.success !== true ||
    !project
  ) {
    console.log('STEP 4: FAIL');
    console.log('Project ID: NONE');
    console.log('Final render status: submission-error');
    console.log('Final MP4 URL: NONE');
    console.log(
      'Error: ' +
      JSON.stringify({
        status: response.status,
        success: body?.success === true,
        project,
        message: body?.message,
        error: body?.error
      })
    );
    return;
  }

  for (let attempt = 1; attempt <= 360; attempt++) {
    response = await fetch(
      'https://api.json2video.com/v2/movies?project=' +
        encodeURIComponent(project),
      {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json'
        }
      }
    );

    body = await response.json().catch(() => ({}));

    const renderMovie =
      body.movie ||
      (body.data && body.data.movie) ||
      {};

    console.log('POLL_' + attempt + '_RESPONSE:');
    console.log(JSON.stringify(sanitize(body), null, 2));

    const status = String(
      renderMovie.status || ''
    ).toLowerCase();

    console.log(
      'POLL_' +
        attempt +
        '_STATUS:' +
        response.status +
        ' STATE:' +
        (status || 'unknown')
    );

    if (
      ['done', 'completed', 'finished'].includes(status)
    ) {
      const url =
        renderMovie.url ||
        renderMovie.videoUrl ||
        renderMovie.output ||
        renderMovie.movieUrl ||
        null;

      console.log(
        'STEP 4: ' + (url ? 'PASS' : 'FAIL')
      );
      console.log('Project ID: ' + project);
      console.log(
        'Final render status: ' + status
      );
      console.log(
        'Final MP4 URL: ' + (url || 'NONE')
      );
      console.log(
        'Error: ' +
          (url
            ? 'NONE'
            : 'Completed without an MP4 URL')
      );
      return;
    }

    if (
      ['error', 'failed', 'timeout', 'timedout'].includes(
        status
      )
    ) {
      console.log('STEP 4: FAIL');
      console.log('Project ID: ' + project);
      console.log(
        'Final render status: ' + status
      );
      console.log('Final MP4 URL: NONE');
      console.log(
        'Error: ' +
          (renderMovie.message ||
            renderMovie.error ||
            body.message ||
            body.error ||
            'Render error')
      );
      return;
    }

    await new Promise(resolve =>
      setTimeout(resolve, 5000)
    );
  }

  console.log('STEP 4: FAIL');
  console.log('Project ID: ' + project);
  console.log('Final render status: timeout');
  console.log('Final MP4 URL: NONE');
  console.log('Error: Poll timeout');
}

main().catch(error => {
  console.log('STEP 4: FAIL');
  console.log('Project ID: NONE');
  console.log('Final render status: error');
  console.log('Final MP4 URL: NONE');
  console.log('Error: ' + error.message);
  process.exitCode = 1;
});

















