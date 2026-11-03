import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({channel:'msedge'});
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5174/?debug=1');
  await page.waitForFunction(()=>typeof window.__frog==='function');
  const results = await page.evaluate(async()=>{
    const {game} = await import(document.querySelector('script[src*="/src/main.ts"]').src);
    const world = game.scene.getScene('world');
    world.reset();
    world.matter.world.pause();
    const visit = x => {
      world.frog.setPosition(x,420);
      world.checkpoint={x,y:420};
      world.extendWorld();
      return {x, covered:world.land.some(b=>b.bounds.min.x<=x && b.bounds.max.x>=x), count:world.chunks.length};
    };
    const original=world.spikes.map(s=>[s.body.position.x,s.body.position.y]);
    const forward=visit(15650);
    const oldRemoved=!world.land.some(b=>b.bounds.min.x<=110 && b.bounds.max.x>=110);
    const back=[visit(8000),visit(4000),visit(110)];
    const restored=world.spikes.map(s=>[s.body.position.x,s.body.position.y]);
    visit(30000);
    world.checkpoint={x:110,y:420};
    world.respawn();
    const respawnCovered=world.land.some(b=>b.bounds.min.x<=110 && b.bounds.max.x>=110);
    world.matter.world.resume();
    return {forward,oldRemoved,back,original,restored,respawnCovered};
  });
  assert.ok(results.oldRemoved,'Regression actually recycles original terrain');
  assert.ok(results.back.every(x=>x.covered),'Backtracking restores every visited platform');
  assert.ok(results.back.every(x=>x.count<=10),'Terrain memory remains bounded');
  assert.deepEqual(results.restored,results.original,'Restored spike layout is identical');
  assert.ok(results.respawnCovered,'Respawn prepares terrain before physics resumes');
  await page.waitForFunction(()=>window.__frog().grounded);
  const falls=await page.evaluate(()=>window.__frog().falls);
  await page.waitForTimeout(1800);
  assert.equal(await page.evaluate(()=>window.__frog().falls),falls,'No repeated void fall after respawn');
  console.log('PASS: recycle, backward regeneration, identical layout, bounded memory and safe respawn');
} finally {await browser.close();}
