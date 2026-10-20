import test from 'node:test';
import assert from 'node:assert/strict';
import {createInstallController} from '../lib/install-controller.mjs';
function browser(installed=false){
  const target=new EventTarget(),mode=new EventTarget();
  mode.matches=installed;target.matchMedia=()=>mode;target.navigator={};
  return {target,mode};
}
function offer(target,outcome='dismissed'){
  const event=new Event('beforeinstallprompt',{cancelable:true});let calls=0;
  event.prompt=async()=>{calls++};event.userChoice=Promise.resolve({outcome});
  target.dispatchEvent(event);assert.equal(event.defaultPrevented,true);
  return ()=>calls;
}
test('captures install offer before UI subscribes and preserves it across login remounts',()=>{
  const {target}=browser();const controller=createInstallController(target);
  offer(target);const original=controller.getSnapshot().prompt;
  const unsubscribe=controller.subscribe(()=>{});unsubscribe();
  controller.subscribe(()=>{});
  assert.equal(controller.getSnapshot().prompt,original);
});
test('dismissed browser prompt is consumed once; a new offer becomes usable',async()=>{
  const {target}=browser();const controller=createInstallController(target);
  const calls=offer(target);await controller.install();await controller.install();
  assert.equal(calls(),1);assert.equal(controller.getSnapshot().installed,false);
  assert.equal(controller.getSnapshot().prompt,null);
  assert.match(controller.getSnapshot().error,/menu/);
  const retry=offer(target);await controller.install();assert.equal(retry(),1);
});
test('browser installation confirms success without opening login; only standalone opens access',async()=>{
  const {target}=browser();const controller=createInstallController(target);
  offer(target,'accepted');await controller.install();
  assert.equal(controller.getSnapshot().installed,false);
  target.dispatchEvent(new Event('appinstalled'));
  assert.equal(controller.getSnapshot().installed,true);
  assert.equal(controller.getSnapshot().standalone,false);
});
test('standalone app opens directly and display-mode changes are detected',()=>{
  const {target}=browser(true);assert.equal(createInstallController(target).getSnapshot().installed,true);
  const second=browser();const controller=createInstallController(second.target);
  const change=new Event('change');change.matches=true;second.mode.dispatchEvent(change);
  assert.equal(controller.getSnapshot().installed,true);
  assert.equal(controller.getSnapshot().standalone,true);
});
