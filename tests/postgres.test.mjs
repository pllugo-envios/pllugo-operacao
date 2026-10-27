import {PGlite} from '@electric-sql/pglite';
import ts from 'typescript';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,readdir,rm} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createDatabase,translate} from '../supabase/functions/pllugo-operacao/lib/postgres-adapter.mjs';

const edgeMode=true;
const repository=process.cwd();
const root=resolve('supabase/functions/pllugo-operacao');
const pg=new PGlite();
await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA storage;
CREATE TABLE storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
CREATE TABLE storage.objects(id text,bucket_id text); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`);
await pg.exec(await readFile(resolve('supabase/migrations/202610200001_operacao.sql'),'utf8'));
const execute=async(query,values=[])=>{const result=await pg.query(query,values);return Object.assign(result.rows,{count:result.affectedRows??result.rows.length})};
const client={unsafe:execute,begin:fn=>pg.transaction(tx=>fn({unsafe:async(q,v)=>{const r=await tx.query(q,v);return Object.assign(r.rows,{count:r.affectedRows??r.rows.length})}}))};
const database=createDatabase(client);

// Compile every actual server-authored SQL string against PostgreSQL, including
// statements on error/reset/geocoding paths that the functional suite may miss.
const apiFiles=(await readdir(join(root,'app/api'))).map(name=>`app/api/${name}/route.ts`);
let validated=0;
for(const file of ['lib/access.ts','lib/routines.ts','lib/assignment-sync.ts',...apiFiles]){
  const source=ts.createSourceFile(file,await readFile(join(root,file),'utf8'),ts.ScriptTarget.Latest,true);
  function visit(node){
    if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&node.expression.name?.text==='prepare'&&node.arguments.length===1&&ts.isStringLiteral(node.arguments[0])){
      const statement=node.arguments[0].text;
      const count=statement.split('?').length-1;
      queries.push(translate(statement,Array(count).fill(null)));
    }
    ts.forEachChild(node,visit);
  }
  const queries=[];visit(source);
  for(const query of queries){await pg.query('EXPLAIN '+query.text,query.values);validated++;}
}
await pg.exec("GRANT USAGE ON SCHEMA storage TO authenticated; GRANT SELECT ON storage.objects TO authenticated; CREATE POLICY legacy_wide_read ON storage.objects FOR SELECT TO authenticated USING(true); INSERT INTO storage.objects VALUES('private','operacao-evidencias'),('legacy','legacy-bucket'); SET ROLE authenticated;");
assert.deepEqual((await pg.query('SELECT id FROM storage.objects')).rows,[{id:'legacy'}]);
await assert.rejects(pg.query('SELECT * FROM operacao.users'),/permission denied/);
await pg.exec('RESET ROLE');
console.log(`PASS: ${validated} server SQL statements compile against PostgreSQL.`);

// Reuse the original behavior suite against PostgreSQL rather than SQLite.
let suite=await readFile(resolve('tests/fixtures/access.mjs.txt'),'utf8');
suite=suite.replace("import {DatabaseSync} from 'node:sqlite';\n",'');
suite=suite.replace("import ts from 'typescript';",`import ts from ${JSON.stringify(pathToFileURL(resolve('node_modules/typescript/lib/typescript.js')).href)};`);
suite=suite.replace("const sqlite=new DatabaseSync(':memory:');",'const sqlite=globalThis.__postgresFixture;');
suite=suite.replace(/^for\(const filename.*$/m,'');
suite=suite.replace(/function statement\(sql,args=\[\]\)\{.*?\n/,'');
suite=suite.replace("DB:{prepare:sql=>statement(sql),async batch(statements){sqlite.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());sqlite.exec('COMMIT');return r}catch(e){sqlite.exec('ROLLBACK');throw e}}}",'DB:sqlite.database');
suite=suite.replace("source=source.replace(/import \\{env\\} from 'cloudflare:workers';/g,'const env=globalThis.__pllugoTestEnv;')",
  "source=source.replace(/import \\{env\\} from '[^']*runtime-env(?:\\.ts)?';/g,'const env=globalThis.__pllugoTestEnv;')");
if(edgeMode){
  suite=suite.replace(JSON.stringify("import source from './source-routines.json';"),JSON.stringify("import source from './source-routines.json' with {type:'json'};"));
  suite=suite.replace("dirname(file),p).slice", "dirname(file),p.replace(/\\.ts$/,'')).slice");
  suite=suite.replace("PLLUGO_OWNER_EMAIL:'owner@example.test',DB:","verifyPassword:async()=>false,PLLUGO_OWNER_EMAIL:'owner@example.test',DB:");
  suite=suite.replaceAll("await readFile('public/icons/pllugo-192.png')",`await readFile(${JSON.stringify(resolve('public/icons/pllugo-192.png'))})`);
}
suite=suite.replace("owner={'oai-authenticated-user-email':'owner@example.test'}", "owner={cookie:'pllugo_session='+sqlite.ownerToken}");
suite=suite.replace('try{\nconst own=',`try{\nassert.equal((await auth.GET(req('/api/auth',null,{'oai-authenticated-user-email':'owner@example.test'}))).status,401);\nconst own=`);
suite=suite.replace('sqlite.prepare("SELECT COUNT(*) as n FROM records WHERE kind=\'task\'").get().n',
  'Number((await sqlite.pg.query("SELECT COUNT(*) as n FROM operacao.records WHERE kind=\'task\'")).rows[0].n)');
suite=suite.replace('sqlite.close();','');
suite=suite.replace(/sqlite\.prepare\(("(?:[^"\\]|\\.)*")\)\.get\(([^)]*)\)\.n/g,
  (_,query,args)=>`Number((await sqlite.database.prepare(${query}).bind(${args}).first()).n)`);
// Simulate another writer after the route has read the revision, before its
// transaction starts. The actual API must reject the entire assignment batch.
suite=suite.replace("console.log('PASS: atribuição fixa via tarefa",`const assignmentBefore=await access.record(rotation.id);
const originalBatch=sqlite.database.batch;
let changedRevision=false;
sqlite.database.batch=async statements=>{
 if(!changedRevision){changedRevision=true;await sqlite.pg.query("UPDATE operacao.records SET updated=$1,body=jsonb_set(body::jsonb,'{updated}',to_jsonb($1::text))::text WHERE id=$2",['concurrent-revision',rotation.id]);}
 return originalBatch(statements);
};
try{
 const conflict=await assign.POST(req('/api/assign',{ids:[rotation.id],unit:U[0],assigneeId:a.id,mode:'fixed',from:d3},lh));
 assert.equal(conflict.status,409);
 assert.deepEqual((await access.record(rotation.id)).assignmentPlanByUnit,assignmentBefore.assignmentPlanByUnit);
}finally{sqlite.database.batch=originalBatch;}
console.log('PASS: atribuição concorrente recusada sem sobrescrever o plano existente.');
console.log('PASS: atribuição fixa via tarefa`);

const ownerToken='a'.repeat(64);
const ownerHash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ownerToken))).toString('hex');
await pg.query("INSERT INTO operacao.users(id,email,name,role,access_level,units,must_change,active) VALUES('owner-renato','owner@example.test','Owner','Administrador','Administrador',$1,'0','1')",[JSON.stringify(['Mauá • Unidade 1','Mauá • Unidade 2','Ribeirão Pires'])]);
await pg.query('INSERT INTO operacao.sessions(token,user_id,expires) VALUES($1,$2,$3)',[ownerHash,'owner-renato',new Date(Date.now()+3600000).toISOString()]);
globalThis.__postgresFixture={database,pg,ownerToken};
const fixtureDir=await mkdtemp(join(repository,'tests/.generated-'));
const fixturePath=join(fixtureDir,'functional.mjs');
await writeFile(fixturePath,suite);
const originalDirectory=process.cwd();
process.chdir(root);
try{await import(pathToFileURL(fixturePath).href)}finally{process.chdir(originalDirectory);delete globalThis.__postgresFixture;await pg.close();if(!fixtureDir.startsWith(join(repository,'tests','.generated-')))throw Error('Invalid fixture path');await rm(fixtureDir,{recursive:true,force:true})}
