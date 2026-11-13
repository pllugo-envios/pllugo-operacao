import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const source=await readFile('modules/sla/source.html','utf8');
const start=source.indexOf('function robotImportInfo('),end=source.indexOf('async function refreshRobotPanel()',start);
const scope={Intl,Date};vm.runInNewContext(source.slice(start,end),scope);
test('última importação permanece visível quando a tentativa seguinte falha ou é só login',()=>{
 for(const status of ['error','running','completed']){
  const info=scope.robotImportInfo({status,last_import_at:'2026-11-07T02:41:47Z',last_report_date:'2026-11-06',started_at:'2026-11-07T13:12:00Z',message:'Acesso validado;'});
  assert.match(info.imported,/06\/11\/2026.*23:41/);assert.equal(info.report,'Dados de 06/11/2026');assert.match(info.attempt,/07\/11\/2026.*10:12/);
 }
});
test('sem importação não transforma validação de login em atualização dos dados',()=>{
 const info=scope.robotImportInfo({started_at:'2026-11-07T13:12:00Z',message:'Acesso validado;'});
 assert.equal(info.imported,'Nenhuma importação confirmada');assert.equal(info.report,'');
 assert.equal(scope.robotImportInfo({last_import_at:'invalid',last_report_date:'<script>'}).report,'');
 assert.equal(scope.robotImportInfo({last_report_date:'2026-11-06T00:00:00.000Z'}).report,'Dados de 06/11/2026');
});
test('importação manual abre o seletor só com perfil admin e acesso ao motor',()=>{
 const start=source.indexOf('function robotManualImport()'),end=source.indexOf("document.getElementById('robot-import-manual')",start);
 for(const isAdmin of [true,false])for(const robotHasAccess of [true,false]){
  let clicks=0;const panel={style:{display:'block'}};
  const scope={robotHasAccess,window:{pllugoSlaScope:{isAdmin}},$:selector=>selector==='#upload-input'?{click(){clicks++}}:panel};
  vm.runInNewContext(source.slice(start,end),scope);scope.robotManualImport();assert.equal(clicks,Number(isAdmin&&robotHasAccess));
 }
});
test('view mantém a importação anterior após erro, dry-run e validação de login',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create table robot_flows(id text,system text,name text,description text,schedule_kind text,schedule jsonb,enabled boolean);
   create table robot_runs(id text,flow_id text,status text,started_at timestamptz,finished_at timestamptz,message text,error text,screenshot_path text,live_view_url text,output_path text);
   create table import_batches(filename text,status text,imported_at timestamptz,report_date date);
   insert into import_batches values('ofd-imile-maua-test.xlsx','success','2026-11-07T02:40Z','2026-11-06');
   insert into robot_flows values('test','imile','Teste','','daily_at','{}',true);
   insert into robot_runs values('import','test','completed','2026-11-07T02:40Z','2026-11-07T02:41Z','Dados importados no dashboard.',null,null,null,'file.xlsx');
   insert into robot_runs values('failed','test','error','2026-11-07T02:55Z','2026-11-07T03:00Z',null,'failure',null,null,null);
   insert into robot_runs values('dry','test','completed','2026-11-07T12:00Z','2026-11-07T12:01Z','Dados analisados em dry-run; dashboard não atualizado.',null,null,null,'dry.xlsx');
   insert into robot_runs values('login','test','completed','2026-11-07T13:00Z','2026-11-07T13:01Z','Acesso validado;',null,null,null,null);`);
  await db.exec("update robot_flows set id='imile-ofd-maua';update robot_runs set flow_id='imile-ofd-maua';update robot_runs set output_path='robot-reports/imile-ofd-maua/ofd-imile-maua-test.xlsx' where id='import';");
  const ddl=await readFile('scripts/sql/robot-flow-import-history.sql','utf8');await db.exec(ddl);await db.exec(ddl);
  const row=(await db.query('select * from robot_flow_status')).rows[0];assert.equal(row.run_id,'login');
  assert.equal(new Date(row.last_import_at).toISOString(),'2026-11-07T02:41:00.000Z');assert.equal(new Date(row.last_report_date).toISOString().slice(0,10),'2026-11-06');
  await db.exec("update robot_flows set id='imile-ofd-maua2';update robot_runs set flow_id='imile-ofd-maua2';update import_batches set filename='ofd-imile-maua2-test.xlsx',imported_at='2026-11-07T02:41:01Z';update robot_runs set output_path='robot-reports/imile-ofd-maua2/ofd-imile-maua2-test.xlsx' where id='import';");
  const pmu=(await db.query('select * from robot_flow_status')).rows[0];assert.equal(new Date(pmu.last_report_date).toISOString().slice(0,10),'2026-11-06');assert.equal(pmu.run_id,'login');
 }finally{await db.close();}
});
