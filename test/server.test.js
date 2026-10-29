import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('content, contact persistence, validation and security over real HTTP', async () => {
  const { createApp } = await import('../server.js');
  const dataDir = await mkdtemp(join(tmpdir(), 'form-test-'));
  const server = createApp({ dataDir, rateLimit: 3 });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (body, headers = {}) => fetch(`${base}/api/contact`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  try {
    const content = await fetch(`${base}/api/content`);
    assert.equal(content.status, 200);
    assert.equal((await content.json()).projects.length, 3);
    const invalid = await post({ name: 'A', email: 'bad', message: 'hello world' });
    assert.equal(invalid.status, 422);
    const foreign = await post({}, { origin: 'https://untrusted.example' });
    assert.equal(foreign.status, 403);
    const valid = { name: '测试访客', email: 'test@example.com', message: '想一起做一个新的创意项目。' };
    const saved = await post(valid);
    assert.equal(saved.status, 201);
    assert.ok((await saved.json()).id);
    const records = (await readFile(join(dataDir, 'messages.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
    assert.equal(records.length, 1);
    assert.equal(records[0].message, valid.message);
    assert.equal((await fetch(`${base}/data/messages.jsonl`)).status, 404);
    assert.equal((await fetch(`${base}/api/contact`)).status, 405);
    assert.equal((await post(valid)).status, 201);
    assert.equal((await post(valid)).status, 429);
    const bad = await fetch(`${base}/api/contact`, { method: 'POST', headers: { 'content-type': 'application/json', 'origin': base }, body: '{bad' });
    assert.equal(bad.status, 429);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  }
});

test('malformed JSON, oversized payloads, honeypot and cache semantics', async () => {
  const { createApp } = await import('../server.js');
  const dataDir = await mkdtemp(join(tmpdir(), 'form-boundary-'));
  const server = createApp({ dataDir, rateLimit: 20 });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const postRaw = (body, type = 'application/json') => fetch(`${base}/api/contact`, { method: 'POST', headers: { 'content-type': type }, body });
  try {
    assert.equal((await postRaw('{invalid')).status, 400);
    assert.equal((await postRaw('null')).status, 422);
    assert.equal((await postRaw('{}', 'text/plain')).status, 415);
    assert.equal((await postRaw(JSON.stringify({ message: 'x'.repeat(17000) }))).status, 413);
    assert.equal((await postRaw(JSON.stringify({ website: 'bot.example' }))).status, 200);
    await assert.rejects(readFile(join(dataDir, 'messages.jsonl')), { code: 'ENOENT' });
    const initial = await fetch(`${base}/api/content`);
    assert.ok(initial.headers.get('etag'));
    assert.equal((await fetch(`${base}/api/content`, { headers: { 'if-none-match': initial.headers.get('etag') } })).status, 304);
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.equal((await fetch(`${base}/server.js`)).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  }
});
