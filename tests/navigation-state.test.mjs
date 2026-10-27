import test from 'node:test';
import assert from 'node:assert/strict';
import {readNavigation,saveNavigation,clearNavigation} from '../lib/navigation-state.ts';
import {dismissBackdrop} from '../lib/dismiss-backdrop.ts';
const units=['U1','U2'],admin={id:'admin',role:'Administrador',units},worker={id:'worker',role:'Assistente',units:['U1']};
function fixture(run){const prior=globalThis.window,map=new Map();globalThis.window={sessionStorage:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}};try{run(map)}finally{globalThis.window=prior}}
test('restores the current screen, filters, tabs and sorting after a refresh without storing form data',()=>fixture(map=>{
 const state={view:'Visão geral',unit:'U2',date:'2026-10-27',filter:'Concluídas',client:'iMile',category:'MONITORAMENTO',person:'person-1',managementTab:'routines',search:'Pendências',overviewMode:'people',overviewSort:{key:'onTime',direction:'asc'}};
 saveNavigation(admin.id,{...state,password:'never-store',photos:['never-store'],answers:{private:'never-store'}});
 assert.deepEqual(readNavigation(admin,units,'2026-10-28'),state);assert.ok(![...map.values()][0].includes('never-store'));
 assert.equal(readNavigation(worker,units,'2026-10-28').view,'Início');clearNavigation(admin.id);assert.equal(readNavigation(admin,units,'2026-10-28').date,'2026-10-28');
}));
test('restored navigation respects current access and handles invalid or blocked storage',()=>fixture(()=>{
 saveNavigation(worker.id,{view:'Equipe',unit:'U2',date:'2026-02-31',overviewSort:{key:'invalid',direction:'invalid'}});
 const state=readNavigation(worker,units,'2026-10-27');assert.equal(state.view,'Início');assert.equal(state.unit,'U1');assert.equal(state.date,'2026-10-27');assert.deepEqual(state.overviewSort,{key:'completion',direction:'desc'});
 window.sessionStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}};
 assert.equal(readNavigation(admin,units,'2026-10-27').view,'Início');assert.doesNotThrow(()=>saveNavigation(admin.id,state));assert.doesNotThrow(()=>clearNavigation(admin.id));
}));
test('only the outside area dismisses a dialog; inner controls and active uploads do not',()=>{
 const outer={},inner={};let closed=0;const close=()=>closed++;
 dismissBackdrop({target:inner,currentTarget:outer},close);assert.equal(closed,0);
 dismissBackdrop({target:outer,currentTarget:outer},close,false);assert.equal(closed,0);
 dismissBackdrop({target:outer,currentTarget:outer},close);assert.equal(closed,1);
});
