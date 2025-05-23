
// Example usage with a simple HTTP server
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import {createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import conf from './app.conf.js';

const server = http.createServer(handleRequest);

server.listen(conf.PORT);

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
    credentials.user !== conf.BASIC_AUTH_USER ||
    credentials.pass !== conf.BASIC_AUTH_PASS
  ) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="File Storage"' });
    res.end('Authentication required');
    return;
  }

  const urlPath = new URL(req.url, `http://${req.headers.host}`).pathname;
  const sanitizedPath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(conf.CLOUD, sanitizedPath);

  const directory = path.dirname(filePath);
  try {
    await fs.access(directory);
  } catch (err) {
    await fs.mkdir(directory, { recursive: true });
    logger(err);
  }

  if (req.method === 'POST') {
    const writeStream = createWriteStream(filePath);
    try {
      await pipeline(req, writeStream);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('File written successfully');
      logger(`File written: ${filePath}`);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error writing file');
      logger(err);
    }
    console.log('transfered');
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
     logger(`Method not allowed: ${req.headers}`);
  }
}

function logger(message) {
  const logFile = path.join(conf.CLOUD, 'server.log');
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFile(logFile, logMessage).catch(err => {
    console.error('Failed to write log:', err);
  });
}