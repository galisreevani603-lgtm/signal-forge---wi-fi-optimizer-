import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const root = process.argv.includes('--dist') ? resolve(projectRoot, 'dist') : projectRoot;
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png' };
const server = createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end('Bad request'); return; }
  const requested = pathname === '/' ? '/index.html' : pathname;
  const file = resolve(root, `.${requested}`);
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
  try {
    if (!statSync(file).isFile()) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache' });
    createReadStream(file).pipe(res);
  } catch { res.writeHead(404).end('Not found'); }
});
const port = Number(process.env.PORT) || 4173;
server.listen(port, '0.0.0.0', () => console.log(`SignalForge ready at http://localhost:${port}`));
