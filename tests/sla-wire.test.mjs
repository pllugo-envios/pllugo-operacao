import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import postgres from 'postgres';
import {PGlite} from '@electric-sql/pglite';
import {compileSlaQuery} from '../supabase/functions/pllugo-operacao/lib/sla-query.ts';

// Use the production driver's real Parse/Describe/Bind sequence. PGlite's
// query() alone does not apply postgres.js's server-inferred serializers.
async function wireDatabase(run){
 const pg=new PGlite();await pg.waitReady;
 await pg.exec("CREATE TABLE orders(unit text);INSERT INTO orders VALUES('maua'),('maua2'),('rbp'),('unassigned');");
 const sockets=new Set(),server=net.createServer(socket=>{
  sockets.add(socket);socket.on('close',()=>sockets.delete(socket));let startup=true,buffer=Buffer.alloc(0),pending=[],chain=Promise.resolve();
  socket.on('data',chunk=>{buffer=Buffer.concat([buffer,chunk]);while(buffer.length>=(startup?4:5)){
   const size=startup?buffer.readInt32BE(0):buffer.readInt32BE(1)+1;if(buffer.length<size)break;
   const frame=buffer.subarray(0,size);buffer=buffer.subarray(size);
   if(startup){startup=false;socket.write(Buffer.from('5200000008000000005a0000000549','hex'));continue}
   const tag=String.fromCharCode(frame[0]);if(tag==='X'){socket.end();continue}pending.push(frame);
   if(tag==='H'||tag==='S'||tag==='Q'){const bytes=Buffer.concat(pending);pending=[];chain=chain.then(async()=>{const result=await pg.execProtocolRaw(bytes);socket.write(Buffer.from(result))}).catch(error=>socket.destroy(error))}
  }});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const sql=postgres({host:'127.0.0.1',port:server.address().port,database:'test',username:'test',ssl:false,max:1,prepare:false,fetch_types:false,connect_timeout:3,onnotice:()=>{}});
 try{await run(sql)}finally{await sql.end({timeout:1});for(const socket of sockets)socket.destroy();await new Promise(resolve=>server.close(resolve));await pg.close()}
}
const read={schema:'public',table:'orders',op:'select',columns:'unit',filters:[],orders:[{column:'unit'}],limit:1000,offset:0};
test('production driver preserves checked units instead of encoding the JSON text a second time',async()=>wireDatabase(async sql=>{
 const scope={isAdmin:false,allUnits:true,units:['maua','maua2','rbp'],labels:[]};const compiled=compileSlaQuery(read,scope);
 const broken=compiled.text.replace('::text::jsonb','::jsonb');
 assert.equal((await sql.unsafe(broken,compiled.values)).length,0,'reproduces the former empty manager response');
 assert.deepEqual((await sql.unsafe(compiled.text,compiled.values)).map(row=>row.unit),['maua','maua2','rbp']);
 const single=compileSlaQuery(read,{...scope,allUnits:false,units:['rbp']});assert.deepEqual((await sql.unsafe(single.text,single.values)).map(row=>row.unit),['rbp']);
 const foreign=compileSlaQuery({...read,filters:[{column:'unit',op:'eq',value:'maua'}]},{...scope,units:['rbp']});assert.equal((await sql.unsafe(foreign.text,foreign.values)).length,0);
}));
