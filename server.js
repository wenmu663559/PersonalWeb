import { createServer } from 'node:http';
import { readFile, mkdir, appendFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { content } from './content.js';

const root = dirname(fileURLToPath(import.meta.url));
const assets = new Map([['/', ['index.html', 'text/html']], ['/style.css', ['style.css', 'text/css']], ['/app.js', ['app.js', 'text/javascript']], ['/favicon.svg', ['favicon.svg', 'image/svg+xml']]]);
const contentBody = JSON.stringify(content);
const etag = '"' + createHash('sha256').update(contentBody).digest('hex').slice(0, 20) + '"';

export function createApp({ dataDir = join(root, 'data'), rateLimit = 5 } = {}) {
  const attempts = new Map();
  let writeQueue = Promise.resolve();
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (path === '/api/contact') {
        if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(405, { error: '请使用 POST 提交留言。' }); }
        if (req.headers.origin) {
          let origin;
          try { origin = new URL(req.headers.origin); } catch { return json(403, { error: '无效的请求来源。' }); }
          if (!['http:', 'https:'].includes(origin.protocol) || origin.host !== req.headers.host) return json(403, { error: '请求来源不被允许。' });
        }
        const now = Date.now();
        for (const [key, entry] of attempts) if (entry.expires <= now) attempts.delete(key);
        const ip = req.socket.remoteAddress;
        const entry = attempts.get(ip) || { count: 0, expires: now + 600000 };
        if (entry.count >= rateLimit) { res.setHeader('Retry-After', Math.ceil((entry.expires - now) / 1000)); return json(429, { error: '留言太频繁了，请稍后再试。' }); }
        entry.count++; attempts.set(ip, entry);
        if (!req.headers['content-type']?.startsWith('application/json')) return json(415, { error: '请使用 JSON 提交。' });
        const chunks = []; let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 16384) { json(413, { error: '留言内容过长。' }); return; }
          chunks.push(chunk);
        }
        let body;
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return json(400, { error: '提交内容格式不正确。' }); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) return json(422, { error: '请输入有效的留言信息。' });
        if (body.website) return json(200, { ok: true }); // Honeypot: do not persist bot submissions.
        const { name, email, message } = body;
        if (typeof name !== 'string' || !name.trim() || name.trim().length > 80 || typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof message !== 'string' || message.trim().length < 10 || message.length > 3000) return json(422, { error: '请填写姓名、有效邮箱，以及 10–3000 字的留言。' });
        const record = { id: randomUUID(), name: name.trim(), email: email.trim(), message: message.trim(), createdAt: new Date().toISOString() };
        const write = writeQueue.then(async () => { await mkdir(dataDir, { recursive: true }); await appendFile(join(dataDir, 'messages.jsonl'), JSON.stringify(record) + '\n', { encoding: 'utf8', mode: 0o600 }); });
        writeQueue = write.catch(() => {});
        await write;
        return json(201, { ok: true, id: record.id });
      }
      if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return json(405, { error: '不支持的请求方式。' }); }
      if (path === '/api/content') {
        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        if (req.headers['if-none-match'] === etag) { res.writeHead(304); return res.end(); }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(req.method === 'HEAD' ? undefined : contentBody);
      }
      if (path === '/api/health') return json(200, { status: 'ok' });
      const asset = assets.get(path);
      if (!asset) return json(404, { error: '页面不存在。' });
      const data = await readFile(join(root, 'public', asset[0]));
      res.writeHead(200, { 'Content-Type': `${asset[1]}; charset=utf-8`, 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) {
      console.error('Request failed:', error.message);
      if (!res.headersSent) json(500, { error: '暂时无法保存，请稍后重试。' });
      else res.end();
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, process.env.HOST || '127.0.0.1', () => console.log(`FORM studio → http://localhost:${port}`));
}
