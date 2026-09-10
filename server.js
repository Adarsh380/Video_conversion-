const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 3002;
const API_SCRIPT = path.join(__dirname, 'run_api_server.js');

function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8'
  };
  return map[ext] || 'application/octet-stream';
}

// Start local API server if available, explicitly set PORT for it
if (fs.existsSync(API_SCRIPT)) {
  try {
    const child = spawn(process.execPath, [API_SCRIPT], { stdio: 'inherit', env: Object.assign({}, process.env, { PORT: String(API_PORT) }), detached: false });
    child.on('error', (err) => console.error('[server] failed to start API script:', err));
  } catch (err) {
    console.warn('[server] could not spawn API script:', err.message || err);
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  // Proxy /api/* to local API server
  if (url.pathname.startsWith('/api/')) {
    const options = {
      hostname: '127.0.0.1',
      port: API_PORT,
      path: url.pathname + url.search,
      method: req.method,
      headers: req.headers,
    };
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });
    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad Gateway: ' + (err.message || String(err)));
    });
    req.pipe(proxyReq, { end: true });
    return;
  }

  // Serve static files from current directory
  let filePath = path.join(__dirname, url.pathname.replace(/^\//, ''));
  if (url.pathname === '/' || url.pathname === '') filePath = path.join(__dirname, 'index.html');
  if (!filePath.startsWith(path.join(__dirname))) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not Found'); return; }
    }
    const stream = fs.createReadStream(filePath);
    res.writeHead(200, { 'Content-Type': contentTypeFor(filePath) });
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
  console.log(`Proxying /api to http://localhost:${API_PORT}`);
});

server.on('error', (err) => {
  console.error('[server] error:', err);
  process.exit(1);
});

