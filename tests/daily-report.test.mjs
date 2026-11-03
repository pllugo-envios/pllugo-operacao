import test from 'node:test';
import assert from 'node:assert/strict';
import {baseReport} from '../lib/base-report.ts';
import {dailyReportFields} from '../lib/daily-report.ts';
test('standard daily report answers every carrier question and shares all organization photos with each client',()=>{
 const unit='Mauá • Unidade 1',date='2026-11-03',base={kind:'task',unit,date,active:true,time:'12:00',status:'done'};
 const records=[{...base,id:'op',client:'Anjun',title:'Relatório diário operacional',fields:dailyReportFields,answers:Object.fromEntries(dailyReportFields.map(f=>[f,f==='Quantidade de backlog'?'0':'Exemplo'])),photos:['inventory-system','inventory-floor'],photoInstructions:['Sistema inventário','Piso inventário']},{...base,id:'tot',client:'Anjun',title:'Total Recebido / Expedido',fields:['Total de pedidos recebidos','Total de pedidos expedidos'],answers:{'Total de pedidos recebidos':'100','Total de pedidos expedidos':'100'}},...['FUNDOS','CORREDORES','AREA DE RECEBIMENTO E RETORNOS'].map((title,i)=>({...base,id:'org'+i,client:'Pllugo',title:'ORGANIZAÇÃO - '+title,minPhotos:1,photos:Array.from({length:i===1?15:1},(_,n)=>'photo-'+i+'-'+n)}))];
 const report=baseReport(records,unit,date,'Anjun',date,'13:00');assert.equal(report.standard.length,1);assert.equal(report.standard[0].rows.length,15);assert.ok(report.standard[0].rows.every(r=>r.value!=='Não informado'));assert.equal(report.photos.length,17);assert.equal(report.areas.length,4);assert.ok(report.areas.every(a=>a.status==='Concluída com fotos'));assert.equal(report.photos.filter(p=>p.kind==='organization').length,17);assert.equal(report.photos.filter(p=>p.kind==='inventory').length,0);
 const other=baseReport(records,unit,date,'iMile',date,'13:00');assert.equal(other.photos.length,17);assert.ok(other.standard[0].rows.every(r=>r.value==='Não informado'));
});

test('external carriers receive only required areas; Pllugo retains all organization areas',()=>{
 const unit='Mauá • Unidade 1',date='2026-11-03';
 const areas=['CORREDORES','AREA DOS FUNDOS','AREA DE RECEBIMENTO E RETORNOS','CARRINHOS','AREA EXTERNA','DEVOLUÇÃO'];
 const rows=areas.map((area,i)=>({kind:'task',id:String(i),unit,date,status:'done',client:'Pllugo',title:'ORGANIZAÇÃO - '+area,photos:['photo'+i]}));
 for(const client of ['J&T','iMile','Anjun'])assert.deepEqual(baseReport(rows,unit,date,client,date,'12:00').photos.map(p=>p.key),['photo0','photo1','photo2']);
 assert.equal(baseReport(rows,unit,date,'Pllugo',date,'12:00').photos.length,6);assert.equal(baseReport(rows,unit,date,'Todos',date,'12:00').photos.length,6);
});
