import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

test('storage round-trips structured evidence metadata and rejects malformed rows', async()=>{
  const originalFetch=globalThis.fetch, originalDeno=globalThis.Deno;
  let row;
  const sql={json:value=>({value,jsonParameter:true}),unsafe:async(query,values)=>{
    if(query.startsWith('INSERT')){
      // postgres.js serializes JSONB parameters; passing a JSON string encodes it twice.
      assert.equal(values[2].jsonParameter,true);
      row={content_type:values[1],custom_metadata:JSON.parse(JSON.stringify(values[2].value))};
      return [];
    }
    return row?[row]:[];
  }};
  globalThis.__storageSql=sql;
  globalThis.Deno={env:{get:name=>({SUPABASE_DB_URL:'postgres://fixture',SUPABASE_URL:'https://fixture.test',SUPABASE_SERVICE_ROLE_KEY:'fixture'})[name]}};
  globalThis.fetch=async()=>new Response(new Uint8Array([1,2,3]));
  try{
    let source=await readFile(new URL('../supabase/functions/pllugo-operacao/lib/runtime-env.ts',import.meta.url),'utf8');
    source=source.replace("import postgres from 'npm:postgres@3.4.7';",'const postgres=()=>globalThis.__storageSql;')
      .replace("import { createDatabase } from './postgres-adapter.mjs';",'const createDatabase=x=>x;');
    const javascript=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
    const {env}=await import('data:text/javascript;base64,'+Buffer.from(javascript).toString('base64'));
    const key='evidence/11111111-1111-4111-8111-111111111111';
    const metadata={evidence:JSON.stringify({taskId:'task-fixture',source:'camera'}),sha256:'a'.repeat(64)};
    await env.BUCKET.put(key,new ArrayBuffer(3),{httpMetadata:{contentType:'image/jpeg'},customMetadata:metadata});
    assert.deepEqual((await env.BUCKET.get(key)).customMetadata,metadata);
    assert.deepEqual((await env.BUCKET.head(key)).customMetadata,metadata);
    const cacheKey='geocache-v2/-23.66700,-46.46000';
    await env.BUCKET.put(cacheKey,JSON.stringify({address:'Endereço de teste'}));
    assert.ok(await env.BUCKET.get(cacheKey));
    assert.ok(await env.BUCKET.get('geocache/-23.6670,-46.4600'));
    for(const invalid of ['geocache-v3/-23,-46','geocache-v2/../../secret','geocache-v2/-23,-46/extra','other/-23,-46'])await assert.rejects(env.BUCKET.get(invalid),/Chave de arquivo inválida/);
    row.custom_metadata=JSON.stringify(metadata);
    await assert.rejects(env.BUCKET.get(key),/Metadados/);
  }finally{
    globalThis.fetch=originalFetch;globalThis.Deno=originalDeno;delete globalThis.__storageSql;
  }
});
