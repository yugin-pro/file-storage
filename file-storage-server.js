
// Example usage with a simple HTTP server
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const server = http.createServer(handleRequest);

const PORT = 3020;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


async function handleRequest(req, res) {
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
  } else if (req.method === 'GET') {
    try {
      const readStream = createReadStream(filePath);
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      await pipeline(readStream, res);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
    }
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
  }
}