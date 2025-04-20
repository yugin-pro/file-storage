import https from 'https';
import fs from 'fs';
import path from 'path';

const PORT = 3000;
const BASE_DIR = path.join(process.cwd(), 'cloud');

// Load SSL certificate and private key
const options = {
    key:  fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert'),
};

const server = https.createServer(options, (req, res) => {
    const filePath = path.join(BASE_DIR, decodeURIComponent(req.url || '/'));
    const safePath = path.normalize(filePath).startsWith(BASE_DIR) ? filePath : BASE_DIR;

    fs.stat(safePath, (err, stats) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        if (stats.isDirectory()) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden');
            return;
        }

        const ext = path.extname(safePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.txt': 'text/plain',
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const readStream = fs.createReadStream(safePath);
        readStream.pipe(res);
        readStream.on('error', () => {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
        });
    });
});

server.listen(PORT, () => {
    console.log(`HTTPS Server is running on https://localhost:${PORT}`);
});
