import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {accessMessage,ACCESS_URL} from '../lib/access-message.ts';
const script=await readFile(new URL('../public/acesso/open.js',import.meta.url),'utf8');
function landing(ua,standalone=false){
 const nodes={open:{href:'../',textContent:'Continuar'},instructions:{textContent:''},help:{textContent:''}};
 let redirect;
 vm.runInNewContext(script,{navigator:{userAgent:ua,platform:'',maxTouchPoints:0},matchMedia:()=>({matches:standalone}),document:{getElementById:id=>nodes[id]},location:{replace:url=>{redirect=url}}});
 return {nodes,redirect};
}
test('WhatsApp message includes named recipient and credentials but keeps them out of URLs',()=>{
 const email='ana_silva+ops@example.test',password='P!fixture123';
 const message=accessMessage({name:'Ana Silva',email},password);
 assert.match(message,/Olá, \*Ana Silva\*/);assert.ok(message.includes(email));assert.ok(message.includes(password));
 assert.ok(message.includes('crie sua nova senha'));assert.ok(message.includes('Safari'));
 assert.deepEqual(message.match(/https:\/\/\S+/g),[ACCESS_URL]);
 assert.equal(new URL(ACCESS_URL).search,'');assert.equal(new URL(ACCESS_URL).hash,'');
 assert.ok(!accessMessage({name:'Ana\n*Login falso:*',email},password).startsWith('Olá, *Ana\n'));
});
test('Android Chrome continues directly; WhatsApp webview offers a Chrome intent with fixed destination',()=>{
 const regular=landing('Android Chrome/130 Mobile Safari/537.36');
 assert.equal(regular.redirect,'https://pllugo-envios.github.io/pllugo-operacao/');
 const embedded=landing('Android; wv) Chrome/130 Mobile Safari/537.36');
 assert.equal(embedded.redirect,undefined);assert.equal(embedded.nodes.open.textContent,'Abrir no Chrome');
 assert.match(embedded.nodes.open.href,/package=com.android.chrome;/);
 assert.ok(embedded.nodes.open.href.includes(encodeURIComponent(regular.redirect)));
 const whatsapp=landing('Android WhatsApp Chrome/130');assert.equal(whatsapp.redirect,undefined);
 const google=landing('Android Chrome/130 GSA/15');assert.equal(google.redirect,undefined);assert.equal(google.nodes.open.textContent,'Abrir no Chrome');
});
test('iPhone gets Safari installation guidance; desktop and installed app continue without a redirect loop',()=>{
 const iphone=landing('iPhone AppleWebKit Safari/604');assert.equal(iphone.redirect,undefined);
 assert.match(iphone.nodes.instructions.textContent,/Safari/);
 assert.equal(landing('Windows Chrome/130').redirect,'https://pllugo-envios.github.io/pllugo-operacao/');
 assert.equal(landing('Android; wv) Chrome/130',true).redirect,'https://pllugo-envios.github.io/pllugo-operacao/');
});
