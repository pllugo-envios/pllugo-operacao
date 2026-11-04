import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {buildSla} from '../scripts/build-sla.mjs';
test('embedded SLA preserves executable screens, has no second client session and loads spreadsheets on demand',async()=>{
 await buildSla();const html=await readFile('public/modules/sla/index.html','utf8');
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())assert.doesNotThrow(()=>new vm.Script(m[1]));
 assert.ok(html.includes('const sb=window.pllugoSlaClient'));assert.ok(!html.includes('createClient('));assert.ok(!html.includes('cdn.jsdelivr.net'));
 assert.ok(!html.includes('id="btn-clear-data"'));assert.ok(!html.includes('<script src="vendor/xlsx'));assert.ok(html.includes('async function exportBaseRows'));
 assert.ok(!html.includes('id="btn-update-dash"'));assert.ok(!html.includes('id="btn-sound-alerts"'));assert.ok(html.includes('id="robot-panel-close"'));
});
test('sandbox bridge checks parent/origin/channel, queues queries and never receives an access token',async()=>{
 const sent=[],listeners={};const parent={postMessage:m=>sent.push(m)};
 const scope={URL,Map,Promise,setTimeout,clearTimeout,setInterval,clearInterval,document:{referrer:'https://pllugo-envios.github.io/pllugo-operacao/',querySelector:()=>({content:'channel-1'}),body:{classList:{toggle(){}}}},location:{hash:''},parent,addEventListener:(name,fn)=>listeners[name]=fn,scrollTo(){}};scope.window=scope;
 vm.runInNewContext(await readFile('modules/sla/bridge.js','utf8'),scope);
 listeners.message({source:parent,origin:'https://unrelated.test',data:{type:'pllugo-sla-init',channel:'channel-1',user:{id:'bad'}}});
 listeners.message({source:parent,origin:'https://pllugo-envios.github.io',data:{type:'pllugo-sla-init',channel:'channel-1',user:{id:'good',email:'manager@example.test'}}});
 assert.equal((await scope.pllugoSlaClient.auth.getUser()).data.user.id,'good');
 const jobs=Array.from({length:10},()=>Promise.resolve(scope.pllugoSlaClient.from('sla_days').select('date').limit(1)));
 await new Promise(setImmediate);assert.equal(sent.filter(x=>x.type==='pllugo-sla-request').length,4);
 const answered=new Set();while(answered.size<10){for(const request of sent.filter(x=>x.type==='pllugo-sla-request'&&!answered.has(x.id))){answered.add(request.id);listeners.message({source:parent,origin:'https://pllugo-envios.github.io',data:{type:'pllugo-sla-result',channel:'channel-1',id:request.id,result:{data:[],error:null}}})}await new Promise(setImmediate)}
 await Promise.all(jobs);assert.ok(!JSON.stringify(sent).includes('Bearer'));
});
