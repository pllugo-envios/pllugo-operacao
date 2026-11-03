import test from 'node:test';
import assert from 'node:assert/strict';
import {baseReport,reportSection} from '../lib/base-report.ts';
const unit='Mauá • Unidade 1',date='2026-11-03';
const task=(id,title,client='iMile',extra={})=>({kind:'task',id,title,client,unit,date,time:'12:00',status:'done',fields:[],answers:{},...extra});
test('daily base summary isolates unit/date/client and flags actual backlog without inventing completion',()=>{
 const rows=[task('totals','Total Recebido / Expedido','iMile',{fields:['Total de pedidos recebidos','Total de pedidos expedidos'],answers:{'Total de pedidos recebidos':'100','Total de pedidos expedidos':'90'}}),task('floor','Piso Limpo','iMile',{fields:['Quantidade de pedidos no piso'],answers:{'Quantidade de pedidos no piso':'10'},photos:['evidence/photo']}),task('late','ORGANIZAÇÃO - CORREDORES','J&T',{status:'pending'}),task('other','Piso Limpo','Pllugo',{unit:'Outra'}),task('old','Piso Limpo','Anjun',{date:'2026-11-02'}),task('unrelated','Solicitar acesso')];
 const general=baseReport(rows,unit,date,'Todos',date,'13:00');assert.equal(general.total,3);assert.equal(general.done,2);assert.equal(general.overdue,1);assert.equal(general.hasPending,true);assert.equal(general.photos.length,1);assert.equal(general.groups.find(g=>g.id==='dispatch').tasks.length,1);
 const client=baseReport(rows,unit,date,'iMile',date,'13:00');assert.equal(client.total,2);assert.equal(client.overdue,0);assert.equal(client.status,'Requer atenção');assert.equal(client.tasks[0].details.at(-1).value,'10');
 assert.equal(baseReport([],unit,date,'Todos',date,'13:00').status,'Sem registros relevantes');assert.equal(reportSection(task('1','ORGANIZAÇÃO - AREA EXTERNA')),'order');
 const zero=baseReport([task('0','Piso Limpo','Anjun',{fields:['Quantidade de pedidos no piso'],answers:{'Quantidade de pedidos no piso':'0'}})],unit,date,'Anjun',date,'13:00');assert.equal(zero.hasPending,false);assert.equal(zero.status,'Rotinas principais concluídas');
});
