import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'dist');
const port = Number(process.env.PORT ?? 8080);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function resolvePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const requested = join(root, safePath);
  if (existsSync(requested) && statSync(requested).isFile()) return requested;
  return join(root, 'index.html');
}

createServer((request, response) => {
  const filePath = resolvePath(request.url ?? '/');
  const extension = extname(filePath);
  response.setHeader('Content-Type', contentTypes[extension] ?? 'application/octet-stream');
  createReadStream(filePath)
    .on('error', () => {
      response.writeHead(404);
      response.end('No encontrado');
    })
    .pipe(response);
}).listen(port, () => {
  console.log(`MilMecanic frontend listening on ${port}`);
});
