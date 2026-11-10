import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
const compiled=(await build({entryPoints:['lib/client-api.ts'],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022'})).outputFiles[0].text;

test('controle móvel usa sessão privada do app só em header para destino fixo e bloqueia outros caminhos',()=>fixture(async({api,calls,reply})=>{
 await api.api('/api/auth',{method:'POST'});reply(Response.json({id:'sessao'}));
 await api.mobileControlApi('/claim',{flow:'jms-sla-motorista'},new AbortController().signal);
 const request=calls.at(-1);assert.equal(request.url,'https://pllugo-robo-production.up.railway.app/api/mobile-jms/claim');
 assert.equal(request.options.headers.Authorization,'Bearer '+'a'.repeat(64));
 assert.match(request.options.headers['X-Control-ID'],/^[a-f0-9-]{36}$/);
 assert.ok(!request.url.includes('a'.repeat(64)));assert.ok(!request.options.body.includes('a'.repeat(64)));
 await assert.rejects(api.mobileControlApi('https://evil.test',{},new AbortController().signal));
 reply(new Response('{}',{status:401}));await api.api('/api/data');
 const before=calls.length;assert.equal((await api.mobileControlApi('/claim',{},new AbortController().signal)).status,401);assert.equal(calls.length,before);
}));
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
  assert.equal(local.map.has('pllugo-operacao-session-v1'),true);assert.equal(session.map.size,0);
  reply(new Response('{}',{status:401}));await api.api('/api/data');
  assert.equal(local.map.has('pllugo-operacao-session-v1'),false);assert.equal(session.map.size,0);
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

test('indisponibilidade503 preserva o acesso salvo em vez de encerrar a sessão',()=>fixture(async({api,local,reply,calls})=>{api.setRememberSession(true);await api.api('/api/auth',{method:'POST'});reply(new Response('Servidor indisponível',{status:503}));await api.api('/api/auth');assert.equal(local.map.has('pllugo-operacao-session-v1'),true);assert.equal(calls.at(-1).options.headers.get('authorization'),'Bearer '+'a'.repeat(64));}));

test('acesso lembrado dura30dias e reabre com a mesma sessão sem armazenar senha',()=>fixture(async({api,local,session,calls,reply})=>{api.setRememberSession(true);await api.api('/api/auth',{method:'POST'});const saved=JSON.parse(local.getItem('pllugo-operacao-session-v1'));assert.ok(saved.expires>Date.now()+29*86400000);assert.deepEqual(Object.keys(saved).sort(),['expires','token']);session.map.clear();const reopened=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64')+'#'+crypto.randomUUID());assert.equal(reopened.isRemembered(),true);reply(Response.json({user:{id:'test'}}));await reopened.api('/api/auth');assert.equal(calls.at(-1).options.headers.get('authorization'),'Bearer '+'a'.repeat(64));assert.equal(JSON.parse(local.getItem('pllugo-operacao-session-v1')).expires,saved.expires);}));
