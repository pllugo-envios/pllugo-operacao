import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraFrame} from '../lib/camera-preview.ts';
test('live stamp stays aligned with the whole photo in portrait and landscape viewports',()=>{
 for(const [w,h,vw,vh] of [[390,650,960,1280],[1120,570,1280,960],[740,360,960,1280],[350,500,1280,720]]){
  const rect=cameraFrame(w,h,vw,vh);assert.ok(rect);
  assert.ok(Math.abs(rect.width/rect.height-vw/vh)<1e-9);
  assert.ok(rect.left>=0&&rect.top>=0&&rect.width<=w&&rect.height<=h);
  assert.ok(Math.abs(rect.left*2+rect.width-w)<1e-9);assert.ok(Math.abs(rect.top*2+rect.height-h)<1e-9);
 }
 for(const args of [[0,10,10,10],[10,10,0,10],[-1,2,3,4],[NaN,1,1,1]])assert.equal(cameraFrame(...args),null);
});
