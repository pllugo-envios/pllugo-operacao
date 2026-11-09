import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('repair adds quantity fields to templates and open tasks, preserving conclusions and execution data',async()=>{
 const db=new PGlite();try{
 await db.exec('create schema operacao;create table operacao.records(id text primary key,kind text,body text,updated text);');
 const base={title:'PEDIDOS RETIDOS',fields:[],activities:[{id:'run',title:'Realizar a atividade'},{id:'open',title:'Quantidade total de pedidos em aberto'},{id:'resolved',title:'Quantidade de pedidos resolvidos '}],answers:{Outro:'mantido'},photos:['evidence/fixture'],assigneeId:'colaborador-fixture',history:[{action:'Salvou andamento'}],updated:'2026-11-09T10:00:00.000Z'};
 const rows=[{...base,id:'template',kind:'template'},{...base,id:'open',kind:'task',status:'pending'},{...base,id:'done',kind:'task',status:'done',completedAt:'2026-11-08T15:00:00Z'}];
 for(const r of rows)await db.query('insert into operacao.records values($1,$2,$3,$4)',[r.id,r.kind,JSON.stringify(r),r.updated]);
 const sql=await readFile(new URL('../scripts/sql/task-quantity-fields-20261109.sql',import.meta.url),'utf8');
 assert.equal((await db.query(sql)).rows.length,2);assert.equal((await db.query(sql)).rows.length,0);
 const repaired=JSON.parse((await db.query("select body from operacao.records where id='open'")).rows[0].body);
 assert.deepEqual(repaired.fields,['Quantidade total de pedidos em aberto','Quantidade de pedidos resolvidos']);
 for(const key of ['answers','photos','assigneeId','activities','status'])assert.deepEqual(repaired[key],rows[1][key]);
 assert.equal(repaired.history.length,2);
 assert.equal((await db.query("select body from operacao.records where id='done'")).rows[0].body,JSON.stringify(rows[2]));
 }finally{await db.close();}
});
