import test from 'node:test';
import assert from 'node:assert/strict';
import {forwardMobileControl,validMobilePath} from '../lib/mobile-control.ts';

test('ponte do controle aceita só rotas fixas e nunca encaminha URLs ou outros serviços',async()=>{
 for(const path of ['https://evil.test','//evil.test','/api/execute/jms','/../config','/claim?token=x','/123/frame'])assert.equal(validMobilePath(path),false);
 assert.equal(validMobilePath('/claim'),true);assert.equal(validMobilePath('/00000000-0000-0000-0000-000000000000/frame'),true);
 let calls=0;await assert.rejects(forwardMobileControl({path:'https://evil.test'},async()=>{calls++;}));assert.equal(calls,0);
 const value=await forwardMobileControl({path:'/claim',body:{flow:'jms-sla-motorista'}},async()=>Response.json({id:'run'}));
 assert.equal(value.mobileResponse.status,200);assert.deepEqual(JSON.parse(new TextDecoder().decode(value.mobileResponse.body)),{id:'run'});
});
test('imagem atravessa sandbox sem credencial; resposta inválida ou excessiva é bloqueada',async()=>{
 const path='/00000000-0000-0000-0000-000000000000/frame';
 const result=await forwardMobileControl({path},async()=>new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'image/jpeg'}}));
 assert.deepEqual([...new Uint8Array(result.mobileResponse.body)],[1,2,3]);
 assert.ok(!JSON.stringify(result).includes('Authorization'));
 await assert.rejects(forwardMobileControl({path,body:{}},async()=>Response.json({})));
 await assert.rejects(forwardMobileControl({path},async()=>new Response('<html>erro</html>',{headers:{'Content-Type':'text/html'}})));
 await assert.rejects(forwardMobileControl({path},async()=>new Response(new Uint8Array(2*1024*1024+1),{headers:{'Content-Type':'image/jpeg'}})));
});
