import test from 'node:test';
import assert from 'node:assert/strict';
import {summaryReport,REPORT_OPTIONS} from '../lib/summary-report.ts';
const unit='Mauá • Unidade 1',date='2026-11-03',base={kind:'task',unit,date,active:true,time:'12:00'};
test('management covers every task/client, separates pending from overdue and excludes people without tasks',()=>{
 const records=[{...base,id:'1',title:'A',client:'J&T',status:'done',assigneeId:'a',assignee:'Ana'},{...base,id:'2',title:'B',client:'Anjun',status:'pending',assigneeId:'a',assignee:'Ana',time:'18:00'},{...base,id:'3',title:'C',client:'Pllugo',status:'pending',assigneeId:'b',assignee:'Bia'},{...base,id:'4',title:'D',client:'iMile',status:'pending',assigneeId:''},{...base,id:'removed',deleted:true,status:'pending',assigneeId:'x'},{kind:'person',id:'no-tasks',name:'Sem tarefas'},{...base,id:'other',unit:'Outra',status:'pending'},{...base,id:'old',date:'2026-11-02',status:'pending'}];
 const r=summaryReport(records,unit,date,'management',date,'13:00'),m=r.management;
 assert.equal(m.total,4);assert.equal(m.done,1);assert.equal(m.pending,3);assert.equal(m.overdue,2);assert.equal(m.unassigned,1);assert.equal(m.people.length,2);assert.equal(m.peoplePending,2);assert.equal(m.clients.length,4);assert.equal(m.people.find(p=>p.id==='a').pending,1);assert.equal(m.people.find(p=>p.id==='a').overdue,0);assert.equal(m.done+m.pending,m.total);assert.equal(r.photos.length,0);
});
test('organization contains only Pllugo organization tasks and all their evidence',()=>{
 const records=[{...base,id:'org1',title:'ORGANIZAÇÃO - CORREDORES',client:'Pllugo',status:'done',photos:['p1','p2']},{...base,id:'org2',title:'ORGANIZAÇÃO - FUNDOS',client:'Pllugo',status:'pending',photos:['p3']},{...base,id:'external',title:'Piso Limpo',client:'iMile',status:'done',photos:['p4']},{...base,id:'op',title:'Relatório diário operacional',client:'Pllugo',status:'done',photos:['inventory']}];
 const r=summaryReport(records,unit,date,'organization',date,'13:00');assert.equal(r.organization.total,2);assert.equal(r.organization.done,1);assert.equal(r.organization.pending,1);assert.deepEqual(r.photos.map(p=>p.key),['p1','p2','p3']);
 assert.deepEqual(REPORT_OPTIONS.map(o=>o[0]),['J&T','iMile','Anjun','organization','management']);
});
