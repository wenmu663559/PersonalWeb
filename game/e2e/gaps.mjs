import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge'});
try {
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:5174/?debug=1');
 await page.waitForFunction(()=>typeof window.__frog==='function');
 const edge=await page.evaluate(async()=>{
  const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);
  const s=game.scene.getScene('world');s.reset();s.matter.world.pause();
  s.frog.setPosition(733,460).setVelocity(-.3,.6);s.update(0,16);
  return s.frog.body.velocity.y;
 });
 assert.ok(edge>0,'Side/corner contact must not run the landing brake');
 for (const x of [743,757]) {
  await page.evaluate(async x=>{
   const {game}=await import(document.querySelector('script[src*="/src/main.ts"]').src);
   const s=game.scene.getScene('world');s.reset();s.frog.setPosition(x,500).setVelocity(x<750?-6:6,0);s.matter.world.resume();
  },x);
  await page.waitForFunction(()=>window.__frog().falls>0,{}, {timeout:2500});
  await page.waitForFunction(()=>window.__frog().grounded,{}, {timeout:2500});
  const rest=await page.evaluate(()=>window.__frog());assert.equal(rest.vx,0);assert.equal(rest.rotation,0);
 }
 console.log('PASS: corners do not brake, both gap walls fall freely, landing still stops');
}finally{await browser.close();}
