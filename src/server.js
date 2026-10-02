// On-demand local dashboard for the shared memory. Binds to 127.0.0.1 only and exits
// when the "Apagar" button calls POST /api/shutdown (or Ctrl+C).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT, PKG } from './paths.js';
import * as mem from './memory.js';

function openBrowser(url) {
  const [cmd, args] =
    process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', url]]
    : process.platform === 'darwin' ? ['open', [url]]
    : ['xdg-open', [url]];
  spawn(cmd, args, { detached: true, stdio: 'ignore', windowsVerbatimArguments: process.platform === 'win32' }).unref();
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}

export function startServer({ port = 47821, open = false } = {}) {
  mem.getDb();
  const html = fs.readFileSync(path.join(ROOT, 'src', 'dashboard.html'), 'utf8').replace('{{version}}', PKG.version);

  const server = http.createServer((req, res) => {
    // Reject requests whose Host is not local (DNS-rebinding protection).
    const host = (req.headers.host || '').split(':')[0];
    if (!['127.0.0.1', 'localhost'].includes(host)) return send(res, 403, { error: 'forbidden' });
    // Mutations need a custom header, which a cross-site form/page cannot send without CORS.
    if (req.method !== 'GET' && req.headers['x-dc-skills'] !== '1') return send(res, 403, { error: 'forbidden' });

    const url = new URL(req.url, `http://${req.headers.host}`);
    const q = Object.fromEntries(url.searchParams);
    const project = q.project || null;
    const limit = Math.min(Number(q.limit) || 100, 500);

    try {
      if (req.method === 'GET' && url.pathname === '/') return send(res, 200, html, 'text/html; charset=utf-8');
      if (req.method === 'GET' && url.pathname === '/api/stats') return send(res, 200, mem.stats());
      if (req.method === 'GET' && url.pathname === '/api/projects') return send(res, 200, mem.listProjects());
      if (req.method === 'GET' && url.pathname === '/api/memories') {
        const rows = q.q ? mem.searchMemories({ query: q.q, project, limit }) : mem.recentMemories({ project, limit });
        return send(res, 200, rows);
      }
      if (req.method === 'GET' && url.pathname === '/api/events') return send(res, 200, mem.listEvents({ project, limit }));
      if (req.method === 'GET' && url.pathname === '/api/requests') return send(res, 200, mem.listSkillRequests({ status: null }));
      const del = url.pathname.match(/^\/api\/memories\/(\d+)$/);
      if (req.method === 'DELETE' && del) return send(res, 200, { ok: mem.deleteMemory(Number(del[1])) });
      if (req.method === 'POST' && url.pathname === '/api/shutdown') {
        send(res, 200, { ok: true });
        console.log('Dashboard apagado desde el navegador.');
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(0), 500).unref();
        return;
      }
      return send(res, 404, { error: 'not found' });
    } catch (err) {
      return send(res, 500, { error: err.message });
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') reject(new Error(`El puerto ${port} está ocupado. Usa --port <otro> (¿ya hay un dashboard abierto?).`));
      else reject(err);
    });
    server.listen(port, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${port}`;
      console.log(`DC Skills dashboard en ${url}  (Ctrl+C o el botón "Apagar" para cerrarlo)`);
      if (open) openBrowser(url);
      resolve(server);
    });
  });
}
