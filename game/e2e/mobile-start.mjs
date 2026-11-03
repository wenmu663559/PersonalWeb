import {chromium,devices} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge'});
try {
 const page=await browser.newPage({...devices['Pixel 5']});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let release;const gate=new Promise(resolve=>release=resolve);
 await page.route('**/assets/*.png',async route=>{await gate;await route.continue();});
 await page.goto('http://localhost:3002/game/?debug=1',{waitUntil:'domcontentloaded'});
 await page.locator('#play').tap();
 assert.ok(await page.evaluate(()=>window.frogStartRequested),'Early mobile tap is remembered');
 assert.equal(await page.evaluate(()=>window.frogReady),false);
 assert.ok((await page.locator('#boot-status').textContent()).includes('自动开始'));
 release();
 await page.waitForFunction(()=>window.__frog?.().grounded);
 assert.equal(await page.locator('#overlay').isVisible(),false);
 assert.ok(await page.evaluate(()=>window.__frog().running));
 assert.deepEqual(errors,[]);
 console.log('PASS: mobile touch before asset loading automatically starts after loading');
 await page.close();
 const blocked=await browser.newPage({...devices['Pixel 5']});
 await blocked.route('**/assets/*.js',r=>r.abort());
 await blocked.goto('http://localhost:3002/game/',{waitUntil:'domcontentloaded'});
 await blocked.locator('#play').tap();
 assert.ok(await blocked.evaluate(()=>window.frogStartRequested));
 await blocked.locator('#retry').waitFor({state:'visible',timeout:18000});
 assert.ok((await blocked.locator('#boot-status').textContent()).includes('QQ'));
 console.log('PASS: failed script loading shows actionable feedback instead of silent button');
}finally{await browser.close();}
