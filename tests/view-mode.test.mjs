import test from 'node:test';
import assert from 'node:assert/strict';
import {canSwitchView,presentationUser,presentationRecords} from '../lib/view-mode.ts';
import {canSla} from '../lib/app-modules.ts';
test('owner can preview operational screens without changing the authenticated account',()=>{
 const account={id:'owner-renato',owner:true,role:'Administrador',accessLevel:'Administrador',units:['U1']};
 const user=presentationUser(account,true,['U1','U2']);
 assert.equal(canSwitchView(account),true);assert.equal(user.id,account.id);assert.equal(user.role,'Assistente');assert.equal(canSla(user),false);
 assert.equal(account.role,'Administrador');assert.deepEqual(account.units,['U1']);assert.equal(presentationUser(account,false,[]),account);
 const own={kind:'task',assigneeId:account.id,unit:'U2'};
 assert.deepEqual(presentationRecords([own,{...own,assigneeId:'other'},{...own,unit:'U3'},{kind:'template'},{...own,deleted:true}],user,true),[own]);
});
test('ordinary operational and management users cannot activate a presentation switch',()=>{
 for(const user of [{role:'Assistente'},{role:'Supervisor'},{role:'Administrador',owner:false},null]){
  assert.equal(canSwitchView(user),false);assert.equal(presentationUser(user,true,['U1']),user);
 }
});
