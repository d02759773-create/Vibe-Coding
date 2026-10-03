const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = path.resolve(__dirname, 'front-prototype');
const SERVER_TAG = 'vibe-static-2';

/** 避免 URL 中文编码问题，对外使用 /inventory/ 访问进销存目录 */
function mapPublicPath(relativePath) {
  if (relativePath === 'inventory' || relativePath.startsWith('inventory/')) {
    return `进销存${relativePath.slice('inventory'.length)}`;
  }
  return relativePath;
}

function resolveFilePath(reqUrl) {
  let reqPath;
  try {
    reqPath = decodeURIComponent(reqUrl.split('?')[0]);
  } catch {
    return null;
  }

  if (reqPath === '/') {
    return path.join(ROOT, 'index.html');
  }

  const relative = mapPublicPath(reqPath.replace(/^\/+/, ''));
  const filePath = path.resolve(ROOT, relative);

  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    return null;
  }

  return filePath;
}

const server = http.createServer((req, res) => {
  const filePath = resolveFilePath(req.url);
  if (!filePath) {
    res.writeHead(400, {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Static-Server': SERVER_TAG,
    });
    res.end('Bad Request');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Static-Server': SERVER_TAG,
      });
      res.end(`404 Not Found\n${filePath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
    };

    const headers = {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'X-Static-Server': SERVER_TAG,
    };
    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server is running at http://127.0.0.1:${PORT}/ (${SERVER_TAG})`);
  console.log(`进销存入口: http://127.0.0.1:${PORT}/inventory/dist/index.html`);
});
