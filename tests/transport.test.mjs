import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/pllugo-operacao/handler.ts';
const origin='https://pllugo-envios.github.io';
const url='https://example.supabase.co/functions/v1/pllugo-operacao/api/auth';
test('rejects unapproved origins before touching the application',async()=>{
  let calls=0;
  const handler=createHandler({'/api/auth':{POST:async()=>{calls++;return Response.json({})}}});
  assert.equal((await handler(new Request(url,{method:'POST',headers:{origin:'https://untrusted.test'}}))).status,403);
  assert.equal(calls,0);
});
test('preflight allows only the required API headers',async()=>{
  const response=await createHandler({})(new Request(url,{method:'OPTIONS',headers:{origin}}));
  assert.equal(response.status,204);
  assert.equal(response.headers.get('access-control-allow-origin'),origin);
  assert.equal(response.headers.get('access-control-allow-credentials'),null);
});
test('only a well-formed bearer token becomes a backend cookie; owner spoofing is removed',async()=>{
  const token='a'.repeat(64);let seen;
  const handler=createHandler({'/api/auth':{GET:async req=>{seen=req;return Response.json({user:null})}}});
  await handler(new Request(url,{headers:{origin,authorization:'Bearer '+token,cookie:'pllugo_session=forged','oai-authenticated-user-email':'owner@example.test','cf-connecting-ip':'127.0.0.1'}}));
  assert.equal(seen.headers.get('cookie'),'pllugo_session='+token);
  assert.equal(seen.headers.get('oai-authenticated-user-email'),null);
  assert.equal(seen.headers.get('cf-connecting-ip'),null);
  await handler(new Request(url,{headers:{authorization:'Bearer bad',cookie:'pllugo_session=forged'}}));
  assert.equal(seen.headers.get('cookie'),null);
});
test('only auth POST can expose a new session; Set-Cookie is never forwarded',async()=>{
  const token='b'.repeat(64);
  const result=()=>new Response('ok',{headers:{'Set-Cookie':`pllugo_session=${token}; Path=/; HttpOnly; Secure`}});
  const handler=createHandler({'/api/auth':{POST:async()=>result()},'/api/data':{GET:async()=>result()}});
  const response=await handler(new Request(url,{method:'POST',headers:{origin}}));
  assert.equal(response.headers.get('set-cookie'),null);
  assert.equal(response.headers.get('x-pllugo-session'),token);
  const data=await handler(new Request(url.replace('/api/auth','/api/data')));
  assert.equal(data.headers.get('x-pllugo-session'),null);
});
test('rejects oversized payloads without invoking a handler',async()=>{
  let called=false;
  const handler=createHandler({'/api/auth':{POST:async()=>{called=true;return Response.json({})}}});
  const response=await handler(new Request(url,{method:'POST',body:'x'.repeat(1024*1024+1)}));
  assert.equal(response.status,413);assert.equal(called,false);
});
