import { content } from '../content.js';

const security = {
  'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
};
const json = (status, data, headers = {}) => new Response(JSON.stringify(data), { status, headers: { ...security, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
const allowedAssets = new Set(['/', '/index.html', '/style.css', '/app.js', '/favicon.svg']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/contact') {
        if (request.method !== 'POST') return json(405, { error: '请使用 POST 提交留言。' }, { Allow: 'POST' });
        const origin = request.headers.get('origin');
        if (origin && origin !== url.origin) return json(403, { error: '请求来源不被允许。' });
        if (!request.headers.get('content-type')?.startsWith('application/json')) return json(415, { error: '请使用 JSON 提交。' });
        if (Number(request.headers.get('content-length')) > 16384) return json(413, { error: '留言内容过长。' });
        const reader = request.body?.getReader();
        let size = 0; const chunks = [];
        if (reader) {
          while (true) {
            const { done, value } = await reader.read(); if (done) break;
            size += value.byteLength;
            if (size > 16384) { await reader.cancel(); return json(413, { error: '留言内容过长。' }); }
            chunks.push(value);
          }
        }
        const bytes = new Uint8Array(size); let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
        let body;
        try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { return json(400, { error: '提交内容格式不正确。' }); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) return json(422, { error: '请输入有效的留言信息。' });
        if (body.website) return json(200, { ok: true });
        const { name, email, message } = body;
        if (typeof name !== 'string' || !name.trim() || name.trim().length > 80 || typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof message !== 'string' || message.trim().length < 10 || message.length > 3000) return json(422, { error: '请填写姓名、有效邮箱，以及 10–3000 字的留言。' });
        if (!env.DB) return json(503, { error: '留言服务尚未配置，请稍后再试。' });
        // A single SQL statement makes the quota atomic across Worker instances.
        const now = Date.now(), window = Math.floor(now / 600000);
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${window}:${ip}`));
        const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
        const limit = await env.DB.prepare('INSERT INTO contact_limits (key, count, expires) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 WHERE count < 5 RETURNING count').bind(key, (window + 1) * 600000).first();
        if (!limit) return json(429, { error: '留言太频繁了，请稍后再试。' }, { 'Retry-After': String(Math.ceil(((window + 1) * 600000 - now) / 1000)) });
        const id = crypto.randomUUID();
        await env.DB.batch([
          env.DB.prepare('INSERT INTO messages (id, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, name.trim(), email.trim(), message.trim(), new Date().toISOString()),
          env.DB.prepare('DELETE FROM contact_limits WHERE expires < ?').bind(now)
        ]);
        return json(201, { ok: true, id });
      }
      if (!['GET', 'HEAD'].includes(request.method)) return json(405, { error: '不支持的请求方式。' }, { Allow: 'GET, HEAD' });
      if (url.pathname === '/api/content') {
        const response = json(200, content);
        response.headers.set('Cache-Control', 'public, max-age=60');
        return request.method === 'HEAD' ? new Response(null, response) : response;
      }
      if (url.pathname === '/api/health') return json(200, { status: 'ok', storage: env.DB ? 'd1' : 'unconfigured' });
      if (!allowedAssets.has(url.pathname) || !env.ASSETS) return json(404, { error: '页面不存在。' });
      const asset = await env.ASSETS.fetch(request);
      const response = new Response(asset.body, asset);
      for (const [name, value] of Object.entries(security)) response.headers.set(name, value);
      return response;
    } catch (error) {
      console.error('Worker request failed:', error.message);
      return json(500, { error: '暂时无法保存，请稍后重试。' });
    }
  }
};
