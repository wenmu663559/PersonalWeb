import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const url = process.env.GAME_URL || 'http://127.0.0.1:3002/game/?debug=1';
const snapshot = () => page.evaluate(() => window.__frog());
try {
  await page.goto(url);
  await page.waitForFunction(() => typeof window.__frog === 'function');
  await page.locator('#play').click();
  await page.waitForFunction(() => window.__frog().grounded);
  await page.keyboard.down('Space');
  await page.waitForTimeout(500);
  assert.ok((await snapshot()).charge > .2, 'Space charges when grounded');
  await page.locator('#pause').click();
  const paused = await snapshot();
  assert.ok(paused.paused && !paused.held, 'Pause cancels charge');
  await page.waitForTimeout(250);
  assert.equal((await snapshot()).x, paused.x, 'Pause freezes physics');
  await page.keyboard.up('Space');
  await page.locator('#pause').click();
  await page.keyboard.press('r');
  await page.waitForFunction(() => window.__frog().grounded);
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/game-desktop.png' });
  let sawRecoil = false;
  for (let jump = 0; jump < 18; jump++) {
    await page.waitForFunction(() => window.__frog().grounded, {}, {timeout:12000});
    const resting = await snapshot();
    assert.equal(resting.vx, 0);
    assert.equal(resting.rotation, 0);
    await page.keyboard.down('Space');
    await page.waitForTimeout([1550,1050,1300][jump%3]);
    await page.keyboard.up('Space');
    for(let i=0;i<15;i++) {
      await page.waitForTimeout(100);
      const state=await snapshot();
      if(state.hits && state.vx<0) sawRecoil=true;
      assert.equal(state.rotation,0);
    }
  }
  const result=await snapshot();
  console.log('ENDLESS',result,'recoil',sawRecoil);
  assert.ok(result.running && !result.won);
  assert.ok(result.maxCombo>=2,'Different spikes produce chained knockback');
  assert.ok(result.spikes>=15,'Dense spike groups are generated');
  assert.ok(sawRecoil,'Spike knocks player backward');
  assert.ok(await page.evaluate(()=>localStorage.getItem('frog-endless-best')));
  await page.screenshot({path:'artifacts/game-endless.png'});
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mobile.on('pageerror', error => errors.push(error.message));
  await mobile.goto(url);
  await mobile.waitForFunction(() => typeof window.__frog === 'function');
  await mobile.locator('#play').tap();
  await mobile.waitForFunction(() => window.__frog().grounded);
  const box = await mobile.locator('canvas').boundingBox();
  const cdp = await mobile.context().newCDPSession(mobile);
  const touch = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touch] });
  await mobile.waitForTimeout(200);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await mobile.waitForTimeout(50);
  assert.equal(await mobile.evaluate(() => window.__frog().held), false, 'Touch cancellation clears charge');
  assert.equal(await mobile.evaluate(() => window.__frog().jumps), 0, 'Cancelled touch does not launch');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touch] });
  await mobile.waitForTimeout(700);
  assert.ok(await mobile.evaluate(() => window.__frog().held), 'Touch holds charge');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await mobile.waitForTimeout(100);
  assert.equal(await mobile.evaluate(() => window.__frog().jumps), 1, 'Touch release jumps');
  await mobile.locator('#pause').tap();
  await mobile.screenshot({ path: 'artifacts/game-mobile.png' });
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No mobile overflow');
  assert.deepEqual(errors, [], 'No runtime errors');
  console.log('Endless generation, recoil, no sliding/rotation, persistence and mobile touch passed.');
} catch (error) {
  console.error('Failure snapshot', await snapshot());
  await page.screenshot({ path: 'artifacts/game-failure.png' });
  throw error;
} finally {
  await browser.close();
}
