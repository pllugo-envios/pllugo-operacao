import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=(await readFile(new URL('../lib/duplicate-activity.ts',import.meta.url),'utf8')).replace("'./assignment-plan'",JSON.stringify(new URL('../lib/assignment-plan.ts',import.meta.url).href));
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {duplicateActivity}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
test('duplicate keeps configuration but has independent identity, dates and execution',()=>{
 const source={id:'original',kind:'template',title:'Devolução',client:'iMile',units:['U1','U2'],time:'18:00',recurrence:'weekdays',days:[1,5],fields:['Total'],activities:[{id:'a',title:'Conferir'}],active:false,assigneeByUnit:{U1:'owner'},assignmentPlanByUnit:{U1:{baseAssigneeId:'owner',transfers:[],substitutions:[{assigneeId:'temporary',from:'2026-01-01',until:'2026-12-31'}]}},updated:'old',editor:'activity',status:'done',answers:{Total:'7'},photos:['private'],completedAt:'yesterday',history:[{action:'Concluiu'}]};
 const copy=duplicateActivity(source,'new','U1','2026-10-27',['U1']);
 assert.equal(copy.id,'new');assert.equal(copy.duplicateOf,'original');assert.equal(copy.title,'Devolução (cópia)');assert.deepEqual(copy.units,['U1']);assert.equal(copy.assigneeByUnit.U1,'owner');assert.equal(copy.updated,undefined);assert.equal(copy.editor,undefined);assert.equal(copy.completedAt,undefined);assert.equal(copy.status,'pending');assert.deepEqual(copy.answers,{});assert.deepEqual(copy.photos,[]);assert.deepEqual(copy.history,[]);assert.equal(copy.startDate,'2026-10-27');assert.equal(copy.active,false);copy.fields.push('Outro');assert.deepEqual(source.fields,['Total']);
 const once=duplicateActivity({...source,kind:'task',unit:'U1',templateId:'template'},'new-once','U1','2026-10-28',['U1']);assert.equal(once.recurrence,'once');assert.equal(once.templateId,undefined);assert.equal(once.date,'2026-10-28');
});
