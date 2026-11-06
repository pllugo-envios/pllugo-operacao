import test from 'node:test';
import assert from 'node:assert/strict';
import {CLIENTS,clientLogo,clientSlug} from '../lib/clients.ts';
import {createBrandMarkup} from '../lib/brand-markup.ts';
const catalog=Object.fromEntries(CLIENTS.map(name=>[name,{slug:clientSlug(name),logo:clientLogo(name)}]));
const brand=createBrandMarkup(catalog);
test('SLA identities use the existing client assets and retain accessible and copyable company names',()=>{
 for(const name of CLIENTS){const html=brand(name);assert.ok(html.includes('src="'+clientLogo(name)+'"'));assert.ok(html.includes('alt="'+name.replace('&','&amp;')+'"'));assert.ok(html.includes('sla-clientname'));}
 assert.equal(brand('jt_real'),brand('J&T'));assert.equal(brand('imile'),brand('iMile'));assert.equal(brand('pllugo'),brand('Pllugo'));
});
test('unknown labels remain escaped text; HTML and attributes cannot be injected',()=>{
 assert.equal(brand('<img src=x onerror=alert(1)>'),'&lt;img src=x onerror=alert(1)&gt;');assert.equal(brand('Mauá'),'Mauá');assert.equal(brand(null),'');
 const bad=createBrandMarkup({'Brand':{slug:'x" onclick="alert(1)',logo:'x" onerror="alert(1)'}})('Brand');assert.ok(!bad.includes('" onclick='));assert.ok(!bad.includes('" onerror='));
});
