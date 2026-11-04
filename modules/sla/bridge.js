// Sandboxed module: session tokens and database credentials stay in the host.
(() => {
 const hostOrigin=new URL(document.referrer).origin,channel=document.querySelector('meta[name=pllugo-channel]')?.content||location.hash.slice(1),pending=new Map();let seq=0,identity=null,readyResolve,currentSelected=null;
 const ready=new Promise(resolve=>{readyResolve=resolve});
 const queue=[];let active=0;
 function pump(){while(active<4&&queue.length){active++;queue.shift()()}}
 function request(payload){return ready.then(()=>new Promise(resolve=>{queue.push(()=>{const id=++seq;let settled=false;const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);pending.delete(id);active--;resolve(value);pump()},timer=setTimeout(()=>finish({data:null,error:{message:'O serviço demorou a responder. Tente novamente.'}}),45000);pending.set(id,finish);parent.postMessage({type:'pllugo-sla-request',channel,id,payload},hostOrigin)});pump()}))}
 addEventListener('message',event=>{if(event.source!==parent||event.origin!==hostOrigin||event.data?.channel!==channel)return;const m=event.data;if(m.type==='pllugo-sla-init'){identity=m.user;readyResolve();if(typeof selectMode==='function')navigate(m.view)}if(m.type==='pllugo-sla-result'){pending.get(m.id)?.(m.result);pending.delete(m.id)}if(m.type==='pllugo-sla-navigate')navigate(m.view)});
 function navigate(view){const mode=String(view||'SLA:geral').replace('SLA:','');if(mode===currentSelected)return;currentSelected=mode;const driver=mode==='driver';document.body.classList.toggle('driver-only',driver);if(!driver&&typeof selectMode==='function')selectMode(mode);if(driver&&typeof window.pllugoDriverInit==='function')window.pllugoDriverInit();window.scrollTo(0,0)}
 class Query {
  constructor(schema,table){this.q={schema,table,op:'select',columns:'*',filters:[],orders:[],limit:1000,offset:0}}
  select(columns='*'){this.q.columns=columns;this.q.returning=true;return this}
  range(from,to){this.q.offset=from;this.q.limit=to-from+1;return this}
  limit(limit){this.q.limit=limit;return this}
  order(column,options={}){this.q.orders.push({column,...options});return this}
  filter(column,op,value){this.q.filters.push({column,op,value});return this}
  eq(c,v){return this.filter(c,'eq',v)} neq(c,v){return this.filter(c,'neq',v)} gte(c,v){return this.filter(c,'gte',v)} lte(c,v){return this.filter(c,'lte',v)} gt(c,v){return this.filter(c,'gt',v)} lt(c,v){return this.filter(c,'lt',v)} in(c,v){return this.filter(c,'in',v)} is(c,v){return this.filter(c,'is',v)} like(c,v){return this.filter(c,'like',v)}
  insert(rows){this.q.op='insert';this.q.rows=Array.isArray(rows)?rows:[rows];return this}
  upsert(rows,options={}){this.insert(rows);this.q.op='upsert';this.q.conflict=options.onConflict;return this}
  update(row){this.q.op='update';this.q.rows=[row];return this}
  delete(){this.q.op='delete';return this}
  single(){this.q.single='required';return this} maybeSingle(){this.q.single='optional';return this}
  then(resolve,reject){return request(this.q).then(resolve,reject)}
 }
 const schema=name=>({from:table=>new Query(name,table),rpc:(rpc,args={})=>request({schema:name,rpc,args})});
 window.pllugoSlaClient={...schema('public'),schema,auth:{getSession:async()=>{await ready;return {data:{session:{user:identity}}}},getUser:async()=>{await ready;return {data:{user:identity}}},onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({error:null}),signInWithPassword:async()=>({error:{message:'Entre pelo app Pllugo.'}})}};
 window.pllugoSlaReady=ready;
 window.pllugoSlaSelected=mode=>{currentSelected=mode;parent.postMessage({type:'pllugo-sla-view',channel,view:'SLA:'+mode},hostOrigin)};
 const announce=()=>parent.postMessage({type:'pllugo-sla-ready',channel},hostOrigin);announce();const timer=setInterval(announce,300);ready.then(()=>clearInterval(timer));
})();
