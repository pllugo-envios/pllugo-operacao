import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
test('every Edge Function TypeScript module parses before deployment',async()=>{
 async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const path=join(dir,item.name);if(item.isDirectory())await walk(path);else if(path.endsWith('.ts')){const parsed=ts.createSourceFile(path,await readFile(path,'utf8'),ts.ScriptTarget.Latest,true);assert.deepEqual(parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')),[],path)}}}
 await walk('supabase/functions/pllugo-operacao');
});
