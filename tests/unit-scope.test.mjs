import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {unitScope,projectUnitRecord,UNIT_LABELS} from '../supabase/functions/pllugo-operacao/lib/unit-scope.ts';
import {compileSlaQuery} from '../supabase/functions/pllugo-operacao/lib/sla-query.ts';
const q=(table,extra={})=>({schema:'public',table,columns:'*',op:'select',filters:[],orders:[],...extra});
const scoped=(...units)=>unitScope({role:'Supervisor',units});
test('checked units define scope, including managers with all three; admin ignores checks',()=>{
 assert.deepEqual(scoped(UNIT_LABELS[0]).units,['maua']);assert.equal(scoped(...UNIT_LABELS).allUnits,true);assert.equal(scoped(...UNIT_LABELS).isAdmin,false);
 assert.deepEqual(unitScope({role:'Administrador',units:[]}).units,['maua','maua2','rbp']);assert.deepEqual(scoped('unknown').units,[]);
 const template={kind:'template',units:UNIT_LABELS,assigneeByUnit:Object.fromEntries(UNIT_LABELS.map((u,i)=>[u,'person'+i])),assignmentPlanByUnit:Object.fromEntries(UNIT_LABELS.map((u,i)=>[u,{private:'plan'+i}]))};
 const projected=projectUnitRecord(template,scoped(UNIT_LABELS[2]));assert.deepEqual(projected.units,[UNIT_LABELS[2]]);assert.deepEqual(Object.keys(projected.assigneeByUnit),[UNIT_LABELS[2]]);assert.ok(!JSON.stringify(projected).includes('person0'));assert.equal(projectUnitRecord(template,unitScope({role:'Administrador',units:[]})),template);
});
test('unit SQL isolates raw rows, totals, drivers with the same name, snapshots and status',async()=>{
 const db=new PGlite();try{
 await db.exec(`CREATE TABLE sla_days(date date,source text,total int,entregues int,pendentes int,problematicos int,sla numeric,sla_sameday numeric,desconsiderados int,desconsiderados_pedidos jsonb,by_unit jsonb,updated_at timestamptz);
 CREATE TABLE sla_drivers(date date,source text,driver_name text,total int,delivered int,pendentes int,problems int,sla numeric,occurrences jsonb,driver_id uuid,updated_at timestamptz);
 CREATE TABLE orders(id text,unit text);CREATE TABLE order_events(id text,unit text);CREATE TABLE operational_orders(id text,unit text);CREATE VIEW v_order_current_intelligence AS SELECT * FROM orders;
 CREATE TABLE tower_snapshots(date date,stamp text,drivers jsonb,created_at timestamptz);CREATE TABLE tower_status(date date,status jsonb,updated_at timestamptz);`);
 const unit=(total,delivered,secret)=>({total,entregues:delivered,pendentes:total-delivered,problematicos:0,sla_sameday:50,desconsiderados:1,desconsiderados_pedidos:[secret],drivers:[{name:'Same driver',total,delivered,pendentes:total-delivered,problems:0,occurrences:{[secret]:1}}]});
 await db.query(`INSERT INTO sla_days VALUES('2026-11-05','jt',999,999,0,0,100,100,3,'["GLOBAL SECRET"]',$1,now())`,[JSON.stringify({maua:unit(10,7,'MAU'),maua2:unit(20,11,'MAU2'),rbp:unit(30,21,'RBP')})]);
 for(const table of ['orders','order_events','operational_orders'])await db.exec(`INSERT INTO ${table} VALUES('M','maua'),('M2','maua2'),('R','rbp'),('UNKNOWN',null)`);
 await db.query(`INSERT INTO tower_snapshots VALUES('2026-11-05','14:00',$1,now())`,[JSON.stringify([{name:'M',unit:'maua'},{name:'M2',unit:'maua2'},{name:'R',unit:'rbp'},{name:'UNKNOWN'}])]);
 await db.exec(`INSERT INTO tower_status VALUES('2026-11-05','{"SECRET FOREIGN DRIVER":"critical"}',now())`);
 const run=async(table,scope,extra={})=>{const c=compileSlaQuery(q(table,extra),scope);return (await db.query(c.text,c.values)).rows};
 for(const [i,key] of ['maua','maua2','rbp'].entries()){
  const scope=scoped(UNIT_LABELS[i]),total=(i+1)*10;
  const day=(await run('sla_days',scope))[0];assert.equal(day.total,total);assert.deepEqual(Object.keys(day.by_unit),[key]);assert.equal(day.desconsiderados,1);assert.ok(!JSON.stringify(day).includes('GLOBAL SECRET'));
  assert.equal((await run('sla_drivers',scope))[0].total,total);
  for(const table of ['orders','order_events','operational_orders','v_order_current_intelligence']){const rows=await run(table,scope);assert.equal(rows.length,1);assert.equal(rows[0].unit,key)}
  assert.deepEqual((await run('tower_snapshots',scope))[0].drivers.map(d=>d.unit),[key]);assert.deepEqual((await run('tower_status',scope))[0].status,{});
  assert.equal((await run('orders',scope,{filters:[{column:'unit',op:'eq',value:key==='rbp'?'maua':'rbp'}],scope:{isAdmin:true},units:['maua','rbp']})).length,0);
 }
 const lightweight=await run('sla_days',scoped(UNIT_LABELS[0]),{summary:'monthly'});assert.deepEqual(lightweight[0].by_unit,{maua:{total:10,entregues:7}});assert.ok(!JSON.stringify(lightweight).includes('Same driver'));assert.equal(lightweight[0].total,10);
 const adminLight=await run('sla_days',unitScope({role:'Administrador',units:[]}),{summary:'monthly'});assert.deepEqual(Object.keys(adminLight[0].by_unit),['rbp','maua','maua2']);
 const multi=scoped(UNIT_LABELS[0],UNIT_LABELS[2]);assert.equal((await run('sla_days',multi))[0].total,40);assert.equal((await run('sla_drivers',multi)).reduce((sum,d)=>sum+d.total,0),40);
 assert.equal((await run('sla_days',scoped(...UNIT_LABELS)))[0].total,60);
 assert.equal((await run('sla_days',unitScope({role:'Administrador',units:[]})))[0].total,999);
 assert.deepEqual(await run('orders',scoped(UNIT_LABELS[0]),{columns:'id',filters:[{column:'id',op:'eq',value:'R'}]}),[]);
 await db.exec(`UPDATE sla_days SET by_unit=by_unit-'maua2'`);assert.deepEqual(await run('sla_days',scoped(UNIT_LABELS[1])),[]);assert.deepEqual(await run('sla_drivers',scoped(UNIT_LABELS[1])),[]);
 }finally{await db.close()}
});
test('nonadmin scope denies writes, Driver and robot APIs even when all units are checked',()=>{
 for(const scope of [scoped(UNIT_LABELS[0]),scoped(...UNIT_LABELS)]){
  for(const bad of [q('sla_days',{op:'upsert',rows:[{total:1}]}),q('robot_flow_status'),q('robot_login_requests'),q('drivers',{schema:'app'}),{schema:'public',rpc:'robot_request_jms_login',args:{target_flow_id:'x'}},q('driver_profiles')])assert.throws(()=>compileSlaQuery(bad,scope));
  assert.equal(compileSlaQuery({schema:'public',rpc:'is_robot_admin',args:{}},scope).text,'SELECT false AS value');
 }
 assert.throws(()=>compileSlaQuery(q('sla_days'),scoped()));
 assert.throws(()=>compileSlaQuery(q('orders',{summary:'monthly'}),scoped(UNIT_LABELS[0])));
 assert.throws(()=>compileSlaQuery(q('sla_days',{summary:'arbitrary'}),scoped(UNIT_LABELS[0])));
});
