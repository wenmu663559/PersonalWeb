import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge'});
try {
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:5174/?debug=1');
 await page.waitForFunction(()=>typeof window.__frog==='function');
 await page.locator('#sound').click();
 await page.locator('#play').click();
 const command=fn=>page.evaluate(async op=>{
   const m=await import(document.querySelector('script[src*="/src/main.ts"]').src);
   if(op==='hit') await m.laugh.hit();
   return m.laugh.playing;
 },fn);
 assert.ok(await command('hit'));
 await page.waitForTimeout(2000);
 assert.ok(await command('state'),'First hit still playing before 3 seconds');
 await command('hit');
 await page.waitForTimeout(2000);
 assert.ok(await command('state'),'Second hit extends the original playback');
 await page.waitForTimeout(1300);
 assert.equal(await command('state'),false,'Stops 3 seconds after final hit');
 await command('hit');await page.locator('#pause').click();
 assert.equal(await command('state'),false,'Pause stops laughter');
 await page.locator('#pause').click();await command('hit');
 await page.locator('#sound').click();
 assert.equal(await command('state'),false,'Mute stops immediately');
 assert.equal(await command('hit'),false,'Muted impacts stay silent');
 console.log('PASS: decoded audio plays, 3-second minimum, hit extension, pause and mute');
} finally {await browser.close();}
