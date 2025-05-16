
// Example usage with a simple HTTP server
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import {createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const server = http.createServer(handleRequest);

const PORT = 3020;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const BASIC_AUTH_USER = 'aladdin';
const BASIC_AUTH_PASS = 'opensesame';

function parseBasicAuth(header) {
  if (!header || !header.startsWith('Basic ')) return null;
  const base64 = header.slice(6);
  const decoded = Buffer.from(base64, 'base64').toString();
  const [user, pass] = decoded.split(':');
  return { user, pass };
}

async function handleRequest(req, res) {
  // Basic Auth validation
  const authHeader = req.headers['authorization'];
  const credentials = parseBasicAuth(authHeader);
  if (
    !credentials ||
    credentials.user !== BASIC_AUTH_USER ||
    credentials.pass !== BASIC_AUTH_PASS
  ) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="File Storage"' });
    res.end('Authentication required');
    return;
  }

  const urlPath = new URL(req.url, `http://${req.headers.host}`).pathname;
  const sanitizedPath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join('/home/dm/Projects/on-premis-dwh', sanitizedPath);

  const directory = path.dirname(filePath);
  try {
    await fs.access(directory);
  } catch (err) {
    await fs.mkdir(directory, { recursive: true });
  }

  if (req.method === 'POST') {
    const writeStream = createWriteStream(filePath);
    try {
      await pipeline(req, writeStream);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('File written successfully');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error writing file');
    }
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
  }
}