import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const buildRoot = path.join(projectRoot, 'dist');
const sourceRoot = path.join(projectRoot, 'public');
const production = process.env.NODE_ENV === 'production';
const hasBuild = existsSync(path.join(buildRoot, 'index.html'));
const root = production && hasBuild ? buildRoot : sourceRoot;

if (!existsSync(path.join(root, 'index.html'))) {
  console.error(
    'Website files missing. Include public/index.html in the deployment and run npm run build.'
  );
  process.exit(1);
}
if (production && !hasBuild) {
  console.warn('dist/index.html is missing; serving public/. Run npm run build to generate dist/.');
}
const portFlagIndex = process.argv.indexOf('--port');
const requestedPort =
  process.env.PORT ?? (portFlagIndex === -1 ? 3000 : process.argv[portFlagIndex + 1]);
const port = Number(requestedPort);

if (requestedPort === '' || !Number.isInteger(port) || port < 0 || port > 65535) {
  console.error('Invalid port. Use an integer from 0 to 65535 with PORT or --port.');
  process.exit(1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif'
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let file = decodeURIComponent(url.pathname);
    if (file === '/') file = '/index.html';
    const target = path.resolve(root, '.' + file);
    if (!target.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    const body = await readFile(target);
    res.writeHead(200, {
      'Content-Type': types[path.extname(target)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.on('error', (error) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? `Port ${port} is already in use. Choose another port with PORT or --port.`
      : `Unable to start the server: ${error.message}`
  );
  process.exit(1);
});

server.listen(port, '0.0.0.0', () => {
  const runningPort = server.address().port;
  console.log(`Portfolio server running on port ${runningPort}`);
  console.log(`Serving website files from: ${root}`);
  console.log(`Local: http://localhost:${runningPort}`);
});
