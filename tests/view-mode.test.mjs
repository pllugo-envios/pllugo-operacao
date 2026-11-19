import test from 'node:test';
import assert from 'node:assert/strict';
import {canSwitchView,presentationUser,presentationRecords,operationalUsers} from '../lib/view-mode.ts';
import {canSla} from '../lib/app-modules.ts';
test('owner can preview operational screens without changing the authenticated account',()=>{
 const account={id:'owner-renato',owner:true,role:'Administrador',accessLevel:'Administrador',units:['U1']};
 const user=presentationUser(account,true,['U1','U2']);
 assert.equal(canSwitchView(account),true);assert.equal(user.id,account.id);assert.equal(user.role,'Assistente');assert.equal(canSla(user),false);
 assert.equal(account.role,'Administrador');assert.deepEqual(account.units,['U1']);assert.equal(presentationUser(account,false,[]),account);
 const own={kind:'task',assigneeId:account.id,unit:'U2'};
 assert.deepEqual(presentationRecords([own,{...own,assigneeId:'other'},{...own,unit:'U3'},{kind:'template'},{...own,deleted:true}],user,true),[own]);
});
test('selecting a worker scopes the preview to their identity and checked units without impersonating authentication',()=>{
 const account={id:'renato',name:'Renato',owner:true,role:'Administrador',mustChange:false};
 const worker={id:'allan',name:'Allan',email:'allan@example.test',active:true,accessLevel:'Operacional',role:'Assistente',units:['U2','unknown'],mustChange:true};
 const projected=presentationUser(account,true,['U1','U2'],worker);
 assert.equal(projected.id,'allan');assert.equal(projected.name,'Allan');assert.deepEqual(projected.units,['U2']);assert.equal(projected.mustChange,false);assert.equal(projected.owner,false);assert.equal(canSla(projected),false);
 const task={kind:'task',assigneeId:'allan',unit:'U2'};
 assert.deepEqual(presentationRecords([task,{...task,assigneeId:'renato'},{...task,unit:'U1'}],projected,true),[task]);
 assert.equal(account.id,'renato');assert.equal(account.role,'Administrador');assert.equal(presentationUser(account,false,['U1','U2'],worker),account);
 for(const invalid of [{...worker,active:false},{...worker,accessLevel:'Gestão'},{...worker,accessLevel:'Administrador'}])assert.equal(presentationUser(account,true,['U1'],invalid).id,'renato');
 assert.equal(presentationUser(worker,true,['U1'],worker),worker);
});
test('worker selector contains only active operational profiles in name order',()=>{
 const worker={active:true,role:'Assistente',accessLevel:'Operacional',units:['U1']};
 const rows=operationalUsers([{...worker,name:'Breno'},{...worker,name:'Allan'},{...worker,name:'Inactive',active:false},{...worker,name:'Manager',accessLevel:'Gestão'},{...worker,name:'Admin',accessLevel:'Administrador'}]);
 assert.deepEqual(rows.map(p=>p.name),['Allan','Breno']);
});
test('ordinary operational and management users cannot activate a presentation switch',()=>{
 for(const user of [{role:'Assistente'},{role:'Supervisor'},{role:'Administrador',owner:false},null]){
  assert.equal(canSwitchView(user),false);assert.equal(presentationUser(user,true,['U1']),user);
 }
});
