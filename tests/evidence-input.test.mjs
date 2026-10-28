import test from 'node:test';
import assert from 'node:assert/strict';
import {transferImages,evidenceError} from '../lib/evidence-input.ts';
const png=new File(['image'],'pasted.png',{type:'image/png'});
test('clipboard items and dragged files use the same upload input without duplicates',()=>{
 assert.deepEqual(transferImages({items:[{kind:'file',getAsFile:()=>png}],files:[png]}),[png]);
 assert.deepEqual(transferImages({items:[],files:[png]}),[png]);
 assert.deepEqual(transferImages({items:[{kind:'string',getAsFile:()=>null}],files:[]}),[]);
 assert.equal(evidenceError([png],19),'');assert.match(evidenceError([png],20),/20 fotos/);
 assert.match(evidenceError([new File(['x'],'a.pdf',{type:'application/pdf'})],0),/JPG/);
 assert.match(evidenceError([{type:'image/png',size:8*1024*1024+1}],0),/8 MB/);
});
