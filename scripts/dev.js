// Starts the local API server (run_api_server.js) alongside `next dev`.
// next.config.js rewrites /api/:path* to http://localhost:3002/api/:path*,
// so the API server must be running on that port during development.
const { spawn } = require('child_process');
const path = require('path');

const API_PORT = process.env.API_PORT || 3002;
const apiEnv = Object.assign({}, process.env, { PORT: String(API_PORT) });

const apiProc = spawn(process.execPath, [path.join(__dirname, '..', 'run_api_server.js')], {
  stdio: 'inherit',
  env: apiEnv,
});

const nextBin = path.join(__dirname, '..', 'node_modules', '.bin', process.platform === 'win32' ? 'next.cmd' : 'next');
const nextProc = spawn(nextBin, ['dev'], { stdio: 'inherit', env: process.env, shell: process.platform === 'win32' });

function shutdown(code) {
  apiProc.kill();
  nextProc.kill();
  process.exit(code || 0);
}

apiProc.on('exit', (code) => { console.error(`[dev] local API server exited (code ${code})`); shutdown(code); });
nextProc.on('exit', (code) => shutdown(code));
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
