import test from 'node:test';
import assert from 'node:assert/strict';
import {missingActivityFields,withActivityFields} from '../lib/activity-fields.ts';

test('quantity instructions require answer fields and conversion preserves the activity configuration',()=>{
 const task={fields:[],activities:[{id:'run',title:'Realizar a atividade'},{id:'open',title:'Quantidade total de pedidos em aberto'},{id:'resolved',title:'Quantidade de pedidos resolvidos '}],answers:{Outro:'valor'},minPhotos:1};
 assert.deepEqual(missingActivityFields(task),['Quantidade total de pedidos em aberto','Quantidade de pedidos resolvidos']);
 const fixed=withActivityFields(task);
 assert.deepEqual(fixed.activities,task.activities);assert.deepEqual(fixed.answers,task.answers);assert.equal(fixed.minPhotos,1);
 assert.deepEqual(missingActivityFields(fixed),[]);assert.deepEqual(withActivityFields(fixed),fixed);
});

test('does not duplicate existing questions or turn action instructions into fields',()=>{
 const task={fields:[' Total de pedidos  '],activities:[{title:'TOTAL DE PEDIDOS'},{title:'Quantidade de volumes '},{title:'quantidade de volumes'},{title:'Conferir a quantidade no sistema'}]};
 assert.deepEqual(missingActivityFields(task),['quantidade de volumes']);
 assert.deepEqual(missingActivityFields({}),[]);
});
