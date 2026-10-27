import test from 'node:test';
import assert from 'node:assert/strict';
import {registryCodesField,registryCodes} from '../lib/order-status.ts';
test('uses the configured ID field as the linked registry without duplicating entry',()=>{
 const t={fields:['Total de pedidos não localizados','ID dos pedidos'],answers:{'ID dos pedidos':' A123\nB456 \n'}};
 assert.equal(registryCodesField(t),'ID dos pedidos');assert.deepEqual(registryCodes(t),['A123','B456']);
 assert.deepEqual(registryCodes({...t,answers:{'ID dos pedidos':''},orders:[]}),[]);
 assert.deepEqual(registryCodes({...t,orders:[{code:'C789'}]}),['C789']);
 assert.equal(registryCodesField({fields:['Observação']}),'');
 assert.deepEqual(registryCodes({orders:[{code:' A '},{code:''}]}),['A']);
});
