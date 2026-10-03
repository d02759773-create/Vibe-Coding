const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIR = path.join(__dirname, 'front-prototype');

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(DIR, reqPath === '/' ? 'index.html' : reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA / fallback to index.html
      fs.readFile(path.join(DIR, 'index.html'), (err2, fallback) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(fallback);
        }
      });
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
    };

    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server is running at http://127.0.0.1:${PORT}/`);
});
