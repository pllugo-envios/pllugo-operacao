import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {compileSlaQuery,slaResult} from '../supabase/functions/pllugo-operacao/lib/sla-query.ts';
import {SLA_VIEWS,canSla,isSlaView} from '../lib/app-modules.ts';
const query=(table,extra={})=>({schema:'public',table,op:'select',columns:'*',filters:[],orders:[],limit:1000,offset:0,...extra});
test('SLA module is available to managers/admins and only registered views are restored',()=>{
 assert.equal(canSla({role:'Supervisor'}),true);assert.equal(canSla({role:'Administrador'}),true);assert.equal(canSla({role:'Assistente'}),false);assert.equal(isSlaView('SLA:unknown'),false);assert.equal(SLA_VIEWS.length,5);
});
test('query gateway rejects arbitrary SQL, unrelated schemas, unsafe mutations and unbounded pages',()=>{
 for(const q of [query('users'),query('users',{schema:'operacao'}),query('sla_days',{columns:'id; DROP TABLE public.sla_days'}),query('sla_days',{limit:1001}),query('sla_days',{orders:[{column:'date;select 1'}]}),query('sla_days',{filters:[{column:'date',op:'or',value:'true'}]}),query('sla_days',{op:'delete'}),query('sla_drivers',{op:'delete',filters:[{column:'date',op:'gte',value:'1900-01-01'}]}),{schema:'public',rpc:'arbitrary_sql',args:{}},query('orders',{op:'update',rows:[{unit:'x'}]})])assert.throws(()=>compileSlaQuery(q));
 const c=compileSlaQuery(query('orders',{filters:[{column:'order_key',op:'eq',value:"x'; DROP TABLE orders;--"}]}));assert.ok(!c.text.includes('DROP TABLE'));assert.ok(c.values.includes("x'; DROP TABLE orders;--"));
});
test('actual generated SLA statements execute with RLS and do not leak claims between transactions',async()=>{
 const db=new PGlite();try{
 await db.exec(`CREATE ROLE authenticated;CREATE TABLE public.sla_days(date date,source text,total integer,by_unit jsonb,PRIMARY KEY(date,source));ALTER TABLE sla_days ENABLE ROW LEVEL SECURITY;GRANT SELECT,INSERT,UPDATE ON sla_days TO authenticated;CREATE POLICY user_scope ON sla_days USING(source=current_setting('request.jwt.claim.sub',true)) WITH CHECK(source=current_setting('request.jwt.claim.sub',true));INSERT INTO sla_days VALUES('2026-11-04','u1',10,null),('2026-11-04','u2',99,null);`);
 const run=async(actor,q)=>{const c=compileSlaQuery(q);return db.transaction(async tx=>{await tx.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[actor]);await tx.exec('SET LOCAL ROLE authenticated');return slaResult((await tx.query(c.text,c.values)).rows,c)})};
 const one=await run('u1',query('sla_days',{filters:[{column:'date',op:'gte',value:'2026-11-01'}],orders:[{column:'date'}]}));assert.equal(one.data.length,1);assert.equal(one.data[0].total,10);
 const two=await run('u2',query('sla_days',{single:'required'}));assert.equal(two.data.total,99);
 const write=query('sla_days',{op:'upsert',rows:[{date:'2026-11-04',source:'u1',total:14,by_unit:{maua:14}}],conflict:'date,source',returning:true,columns:'date,source,total,by_unit'});
 assert.equal((await run('u1',write)).data[0].total,14);await assert.rejects(()=>run('u2',write),/row-level security/);
 assert.equal((await db.query("SELECT current_user role,current_setting('request.jwt.claim.sub',true) actor")).rows[0].role,'postgres');
 assert.equal(slaResult([], {single:'optional'}).data,null);assert.ok(slaResult([], {single:'required'}).error);
 }finally{await db.close()}
});
test('imports retain app actor audit and cannot spoof another Auth account',()=>{
 const c=compileSlaQuery(query('import_batches',{op:'insert',rows:[{source:'jt',imported_by:'spoof',metadata:{report:'daily'}}],returning:true,columns:'id',actorId:null,operacaoActor:'internal-1'}));const body=JSON.parse(c.values.at(-1));assert.equal(body[0].imported_by,null);assert.equal(body[0].metadata.operacao_actor,'internal-1');assert.equal(body[0].metadata.report,'daily');
 const rpc=compileSlaQuery({schema:'app',rpc:'create_announcement',args:{p_titulo:'Aviso',p_corpo:'Mensagem',p_base_ids:[],p_driver_ids:[]}});assert.ok(rpc.text.includes('ARRAY[]::uuid[]'));assert.equal(rpc.scalar,true);
});
