import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {includeAnjun} from '../scripts/build-sla-anjun.mjs';
import {monthlySummary} from '../lib/monthly-summary.ts';
const html=includeAnjun(await readFile('modules/sla/source.html','utf8'));
const code=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).sort((a,b)=>b.length-a.length)[0];
const tree=ts.createSourceFile('sla.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const names=['mergePllugo','sourceForDay','operationalSourceForDay','aggregate','driversForCarrier','historyForUnit','baseSourceMatches','bmSourceLabel','carrierClass'];
const scope={round1:n=>Math.round(n*10)/10,normalizeDriverName:s=>s.toLowerCase(),displayDriverName:s=>s,extractOccurrenceMap:()=>({}),state:{carrier:'anjun',unit:'all'},DASH_DATA:{history:[]}};
vm.createContext(scope);vm.runInContext(tree.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)).map(n=>n.getText(tree)).join('\n'),scope);
const source=(total,delivered)=>({total,entregues:delivered,pendentes:total-delivered,problematicos:0,sla:100*delivered/total,drivers:[{name:'Mesmo nome',total,delivered,pendentes:total-delivered,problems:0}]});
test('J&T counts available operational drivers until closed SLA arrives, without adding both sources',()=>{
 const jt=source(100,40),closed=source(90,85),today={date:'2026-11-13',jt};
 assert.equal(scope.driversForCarrier('jt_real',[today]).length,1);
 assert.equal(scope.driversForCarrier('pllugo',[today])[0].total,100);
 const complete={...today,jt_real:closed};
 assert.equal(scope.driversForCarrier('jt_real',[complete])[0].total,90);
 assert.equal(scope.driversForCarrier('jt_real',[complete],{operationalJt:true})[0].total,100);
 const other={date:'2026-11-12',jt:source(20,10)};
 assert.equal(scope.driversForCarrier('jt_real',[today,other]).length,1);
 assert.equal(scope.driversForCarrier('jt_real',[today,other])[0].total,120);
 assert.equal(scope.driversForCarrier('jt_real',[]).length,0);
});
test('Anjun is isolated in SLA/operation/driver filters and included once in Pllugo totals',()=>{
 const jt=source(100,80),imile=source(50,40),anjun=source(25,20),day={date:'2026-11-06',jt,jt_real:jt,imile,anjun};day.pllugo=scope.mergePllugo(jt,imile,anjun);
 assert.equal(day.pllugo.total,175);assert.equal(day.pllugo.entregues,140);assert.equal(scope.sourceForDay(day,'anjun'),anjun);assert.equal(scope.operationalSourceForDay(day,'anjun'),anjun);
 assert.equal(scope.aggregate([day],'anjun').total,25);assert.equal(scope.aggregate([day],'jt_real').total,100);
 const drivers=scope.driversForCarrier('anjun',[day]);assert.equal(drivers.length,1);assert.equal(drivers[0].carrier,'Anjun');assert.equal(drivers[0].total,25);
 assert.equal(scope.driversForCarrier('pllugo',[day])[0].total,175);
 assert.equal(scope.baseSourceMatches({source:'anjun'}),true);assert.equal(scope.baseSourceMatches({source:'jt'}),false);assert.equal(scope.bmSourceLabel('anjun'),'Anjun');assert.equal(scope.carrierClass('Anjun'),'anjun');
});
test('unit and monthly summaries include Anjun without inheriting another unit or duplicating J&T',()=>{
 const a=source(25,20),j=source(100,80);scope.DASH_DATA.history=[{date:'2026-11-06',jt:j,jt_real:j,anjun:{...a,by_unit:{maua2:a}}}];
 assert.equal(scope.historyForUnit('maua2')[0].anjun.total,25);assert.equal(scope.historyForUnit('rbp').length,0);
 const result=monthlySummary([{date:'2026-11-06',source:'jt',by_unit:{maua2:source(100,60)}},{date:'2026-11-06',source:'jt_real',by_unit:{maua2:j}},{date:'2026-11-06',source:'anjun',by_unit:{maua2:a}}],'2026-11');
 assert.equal(result.volume,125);assert.equal(result.delivered,100);assert.deepEqual(result.sources,['J&T','Anjun']);assert.equal(result.units.length,1);
 assert.ok(html.includes('Aguardando dados da Anjun'));assert.ok(html.includes("state.carrier==='anjun'&&!filteredHistory().some(day=>day.anjun)"));
});
test('channel schema accepts Anjun and preserves existing data and duplicate protection',async()=>{
 const db=new PGlite();try{
 await db.exec("CREATE TABLE sla_days(date date,source text CONSTRAINT sla_days_source_check CHECK(source IN ('jt','imile','jt_real')),PRIMARY KEY(date,source));CREATE TABLE sla_drivers(date date,source text CONSTRAINT sla_drivers_source_check CHECK(source IN ('jt','imile','jt_real')),driver_name text,PRIMARY KEY(date,source,driver_name));INSERT INTO sla_days VALUES('2026-11-06','jt');");
 await assert.rejects(db.query("INSERT INTO sla_days VALUES('2026-11-06','anjun')"),/check constraint/);
 const migration=await readFile('scripts/sql/enable-anjun-sla.sql','utf8');await db.transaction(tx=>tx.exec(migration));
 await db.exec("INSERT INTO sla_days VALUES('2026-11-06','anjun');INSERT INTO sla_drivers VALUES('2026-11-06','anjun','Teste');");
 assert.equal((await db.query('SELECT count(*)::int n FROM sla_days')).rows[0].n,2);await assert.rejects(db.query("INSERT INTO sla_days VALUES('2026-11-06','anjun')"),/duplicate key/);
 }finally{await db.close()}
});
