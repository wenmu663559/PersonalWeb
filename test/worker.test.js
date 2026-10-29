import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Worker persists messages in D1 and atomically limits concurrent submissions', async () => {
  const { Miniflare } = await import('miniflare');
  const { build } = await import('esbuild');
  const result = await build({ entryPoints: ['cloudflare/worker.js'], bundle: true, write: false, format: 'esm', platform: 'browser' });
  const mf = new Miniflare({ modules: true, script: result.outputFiles[0].text, d1Databases: ['DB'], compatibilityDate: '2026-08-01' });
  try {
    const db = await mf.getD1Database('DB');
    const schema = await readFile('migrations/0001_messages.sql', 'utf8');
    for (const sql of schema.split(';').filter(s => s.trim())) await db.prepare(sql).run();
    const post = (body, extra = {}) => mf.dispatchFetch('https://example.com/api/contact', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.1', ...extra }, body: JSON.stringify(body) });
    assert.equal((await post({}, { origin: 'https://evil.example' })).status, 403);
    assert.equal((await post({})).status, 422);
    const body = { name: 'Test', email: 'test@example.com', message: 'A real database integration test message.' };
    const responses = await Promise.all(Array.from({ length: 8 }, () => post(body)));
    assert.equal(responses.filter(r => r.status === 201).length, 5);
    assert.equal(responses.filter(r => r.status === 429).length, 3);
    const saved = await db.prepare('SELECT * FROM messages').all();
    assert.equal(saved.results.length, 5);
    assert.equal(saved.results[0].message, body.message);
    assert.equal((await mf.dispatchFetch('https://example.com/api/contact')).status, 405);
    assert.equal((await mf.dispatchFetch('https://example.com/data/messages.jsonl')).status, 404);
    assert.equal((await (await mf.dispatchFetch('https://example.com/api/content')).json()).profile.name, 'lijunwen');
  } finally { await mf.dispose(); }
});
