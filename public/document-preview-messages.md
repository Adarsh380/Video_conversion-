# Iframe Message Contract
The parent embeds `/document-preview.html` and accepts same-origin messages only when `source` is `document-preview-iframe`.

Events: `iframe-ready`, `conversion-started`, `conversion-complete`, `movie-ready`, `render-response`, `preview-error`, `preview-state`, and `preview-playback`.

`movie-ready` contains the exact generated `movie` and diagnostics. `preview-state` contains `sceneIndex`, `position`, and `totalDuration`. `preview-playback` contains `playing`. The iframe uses the existing relative `/api/*` routes and never receives or exposes API credentials.