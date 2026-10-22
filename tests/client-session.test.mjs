import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../lib/client-api.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
function storage(){const map=new Map();return {map,getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)}}
async function fixture(run){
  const old={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch};
  const local=storage(),session=storage();
  globalThis.window={localStorage:local,sessionStorage:session};
  globalThis.document={baseURI:'https://pllugo-envios.github.io/pllugo-operacao/'};
  const calls=[];let response=new Response('{}',{headers:{'X-Pllugo-Session':'a'.repeat(64)}});
  globalThis.fetch=async(url,options)=>{calls.push({url,options});return response.clone()};
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64')+'#'+crypto.randomUUID());
  try{await run({api,local,session,calls,reply:r=>response=r})}finally{Object.assign(globalThis,old)}
}
test('default session is temporary; bearer is never placed in URLs',()=>fixture(async({api,local,session,calls})=>{
  await api.api('/api/auth',{method:'POST'});
  assert.equal(local.map.size,0);assert.equal(session.map.size,1);
  await api.api('/api/photo?key=evidence%2Fphoto');
  assert.equal(calls[1].options.headers.get('authorization'),'Bearer '+'a'.repeat(64));
  assert.ok(!calls[1].url.includes('a'.repeat(64)));
  assert.equal(calls[1].options.credentials,'omit');
  assert.equal(api.asset('/icons/pllugo-192.png'),'https://pllugo-envios.github.io/pllugo-operacao/icons/pllugo-192.png');
}));
test('remembering requires opt-in and authorization failures clear saved access',()=>fixture(async({api,local,session,reply})=>{
  api.setRememberSession(true);await api.api('/api/auth',{method:'POST'});
  assert.equal(local.map.size,1);assert.equal(session.map.size,0);
  reply(new Response('{}',{status:401}));await api.api('/api/data');
  assert.equal(local.map.size,0);assert.equal(session.map.size,0);
}));
test('blocked storage does not break login or in-memory access',()=>fixture(async({api,calls})=>{
  for(const name of ['sessionStorage','localStorage'])window[name]={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}};
  await api.api('/api/auth',{method:'POST'});await api.api('/api/users');
  assert.equal(calls[1].options.headers.get('authorization'),'Bearer '+'a'.repeat(64));
}));
test('refuses unrelated network destinations',()=>fixture(async({api,calls})=>{
  await assert.rejects(api.api('https://untrusted.test/api/auth'),/inválido/);
  assert.equal(calls.length,0);
}));

test('every deployed API route passes client validation and keeps session transport',()=>fixture(async({api,calls})=>{
  const routes=await readFile(new URL('../supabase/functions/pllugo-operacao/index.ts',import.meta.url),'utf8');
  const paths=[...routes.matchAll(/["'](\/api\/[a-z]+)["']\s*:/g)].map(match=>match[1]);
  assert.ok(paths.includes('/api/dashboard'));assert.ok(paths.includes('/api/create'));
  await api.api('/api/auth',{method:'POST'});
  for(const path of paths){
    await api.api(path+'?date=2026-10-21',{method:path==='/api/create'?'POST':'GET'});
    const call=calls.at(-1);
    assert.equal(call.url,'https://dfaoyjlzxnbephvcgkfz.supabase.co/functions/v1/pllugo-operacao'+path+'?date=2026-10-21');
    assert.equal(call.options.headers.get('authorization'),'Bearer '+'a'.repeat(64));
  }
  for(const path of ['/api/dashboard/extra','/api/createevil','//untrusted.test/api/data'])await assert.rejects(api.api(path),/inválido/);
}));
