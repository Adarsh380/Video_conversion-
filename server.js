// Minimal static server for localhost:400
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 400;
const PROXY_PORT = 4000;
const ROOT = path.resolve(__dirname);

const REMOTE_HOST = 'localhost';
const REMOTE_PORT = 4000;
const REMOTE_PATH = '/video-converter.html';

const PROXY_PREFIX = '/vc4000';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    ...headers
  });
  if (body && body.pipe) return body.pipe(res);
  res.end(body);
}

function tryFile(filePath) {
  return new Promise((resolve) => {
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) return resolve(null);
      resolve(filePath);
    });
  });
}

function syncVideoConverter() {
  const dest = path.join(ROOT, 'video-converter.html');
  const tmp = dest + '.tmp';
  try {
    const req = http.request({ hostname: REMOTE_HOST, port: REMOTE_PORT, path: REMOTE_PATH, method: 'GET' }, (resp) => {
      if ((resp.statusCode || 200) >= 400) {
        console.warn('Sync failed with status', resp.statusCode);
        return;
      }
      const ws = fs.createWriteStream(tmp);
      resp.pipe(ws);
      ws.on('finish', () => {
        fs.rename(tmp, dest, (err) => {
          if (err) console.warn('Rename failed:', err);
          else console.log('Synced video-converter.html from port', REMOTE_PORT);
        });
      });
    });
    req.on('error', (e) => console.warn('Sync error:', e.message));
    req.end();
  } catch (e) {
    console.warn('Sync exception:', e.message);
  }
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url);
  let pathname = decodeURIComponent(parsed.pathname || '/');
  const queryStr = parsed.query || '';

  // Proxy video-converter.html from localhost:4000 only when ?proxy=1 is present
  if (pathname === '/video-converter.html' && /(^|&)proxy=1(&|$)/.test(queryStr)) {
    try {
      const proxyReq = http.request({ hostname: 'localhost', port: PROXY_PORT, path: '/video-converter.html', method: 'GET' }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res);
      });
      proxyReq.on('error', async () => {
        const fallback = path.join(ROOT, 'video-converter.html');
        if (fs.existsSync(fallback)) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          fs.createReadStream(fallback).pipe(res);
        } else {
          res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Bad Gateway: Unable to proxy video-converter.html');
        }
      });
      proxyReq.end();
      return;
    } catch (e) {
      const fallback = path.join(ROOT, 'video-converter.html');
      if (fs.existsSync(fallback)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(fallback).pipe(res);
      } else {
        res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Bad Gateway: Proxy failed');
      }
      return;
    }
  }

  // Generic proxy: /vc4000/* -> http://localhost:4000/*
  if (pathname.startsWith(PROXY_PREFIX + '/')) {
    const targetPath = pathname.slice(PROXY_PREFIX.length) + (parsed.search || '');
    const proxyReq = http.request({ hostname: 'localhost', port: 4000, path: targetPath, method: req.method, headers: req.headers }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Proxy error: ' + err.message);
    });
    if (req.method !== 'GET' && req.method !== 'HEAD') req.pipe(proxyReq); else proxyReq.end();
    return;
  }

  // Manual sync endpoint
  if (pathname === '/sync/video-converter') {
    syncVideoConverter();
    res.writeHead(204, { 'Cache-Control': 'no-store' });
    return res.end();
  }

  // Default to index.html for root or directories
  let fsPath = path.join(ROOT, pathname);
  if (pathname.endsWith('/')) fsPath = path.join(fsPath, 'index.html');

  // If the path is a directory without trailing slash, try index.html
  try {
    const stat = fs.existsSync(fsPath) && fs.statSync(fsPath);
    if (stat && stat.isDirectory()) fsPath = path.join(fsPath, 'index.html');
  } catch {}

  // Fallback: if file not found and no extension, try adding .html
  let file = await tryFile(fsPath);
  if (!file && !path.extname(fsPath)) file = await tryFile(fsPath + '.html');

  if (!file) {
    return send(res, 404, 'Not Found');
  }

  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';

  try {
    const stream = fs.createReadStream(file);
    return send(res, 200, stream, { 'Content-Type': type });
  } catch (e) {
    return send(res, 500, 'Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}/index.html`);
  // Sync remote page at startup
  syncVideoConverter();
});