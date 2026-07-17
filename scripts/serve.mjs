import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const types = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'], ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'], ['.md', 'text/markdown; charset=utf-8'],
  ['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.svg', 'image/svg+xml']
]);

function safePath(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const candidate = resolve(root, `.${decoded === '/' ? '/index.html' : decoded}`);
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) throw new Error('Path escapes site root');
  return candidate;
}

async function openSafePath(root, realRoot, urlPath) {
  let candidate = safePath(root, urlPath);
  if ((await stat(candidate)).isDirectory()) candidate = resolve(candidate, 'index.html');
  const realCandidate = await realpath(candidate);
  if (realCandidate !== realRoot && !realCandidate.startsWith(`${realRoot}${sep}`)) {
    throw new Error('Path escapes site root through a filesystem link');
  }
  return realCandidate;
}

export async function startServer({ root = defaultRoot, port = Number(process.env.PORT || 4173) } = {}) {
  const realRoot = await realpath(root);
  const server = createServer(async (request, response) => {
    try {
      const path = await openSafePath(root, realRoot, request.url || '/');
      const body = await readFile(path);
      response.writeHead(200, {
        'Content-Type': types.get(extname(path).toLowerCase()) || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      });
      response.end(body);
    } catch (error) {
      const status = String(error.message).includes('escapes') ? 400 : 404;
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(status === 400 ? 'Bad request' : 'Not found');
    }
  });
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolveListen);
  });
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  await startServer({ port });
  console.log(`SHOWCASE_SERVER http://127.0.0.1:${port}`);
}
