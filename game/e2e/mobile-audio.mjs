import {chromium,devices} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'msedge'});
try {
 for(const mode of ['missing','throws','prefixed']) {
  const p=await b.newPage({...devices['iPhone 13']});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(mode=>{
    if(mode==='prefixed') window.webkitAudioContext=window.AudioContext;
    else window.webkitAudioContext=undefined;
    window.AudioContext=mode==='throws'? class {constructor(){throw new Error('Audio restricted');}}:undefined;
  },mode);
  await p.goto('http://127.0.0.1:5174/?debug=1');
  await p.waitForFunction(()=>typeof window.__frog==='function');
  await p.locator('#play').tap();
  await p.waitForFunction(()=>window.__frog().grounded);
  assert.equal(await p.locator('#overlay').isVisible(),false);
  const session=await p.context().newCDPSession(p);
  const box=await p.locator('canvas').boundingBox();
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
  await p.waitForTimeout(400);
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await p.waitForFunction(()=>window.__frog().jumps===1);
  await p.locator('#pause').tap();
  assert.ok(await p.evaluate(()=>window.__frog().paused));
  await p.locator('#restart').tap();
  assert.equal(await p.evaluate(()=>window.__frog().jumps),0);
  assert.deepEqual(errors,[]);
  await p.close();
  console.log('PASS mobile audio compatibility:',mode);
 }
}finally{await b.close();}
