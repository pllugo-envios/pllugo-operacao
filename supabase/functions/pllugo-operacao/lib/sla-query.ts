// Allowlisted compatibility layer. Every statement runs as authenticated with
// the existing SLA identity and RLS, never as service_role.
const reads:Record<string,string[]>={public:['sla_days','sla_drivers','tower_snapshots','tower_status','orders','order_events','operational_orders','v_order_current_intelligence','driver_interventions','driver_profiles','robot_flow_status','robot_login_requests'],app:['bases','drivers','announcements','unmatched_aliases','tickets','ticket_events','alerts']};
const writes:Record<string,string[]>={sla_days:['upsert'],sla_drivers:['upsert','delete'],tower_snapshots:['upsert'],tower_status:['upsert'],orders:['upsert'],order_events:['upsert'],operational_orders:['upsert'],import_batches:['insert','update'],driver_interventions:['insert']};
const rpcs:Record<string,{args:Record<string,string>,scalar?:boolean}>={
 'public.is_robot_admin':{args:{},scalar:true},'public.robot_request_jms_login':{args:{target_flow_id:'text'},scalar:true},
 'app.torre_metrics':{args:{}},'app.create_announcement':{args:{p_titulo:'text',p_corpo:'text',p_base_ids:'uuid[]',p_driver_ids:'uuid[]',p_prioridade:'text',p_expires_at:'timestamptz'},scalar:true},
 'app.announcement_read_status':{args:{p_announcement_id:'uuid'}},'app.link_alias':{args:{p_unmatched_id:'uuid',p_driver_id:'uuid'},scalar:true},'app.staff_respond_ticket':{args:{p_ticket_id:'uuid',p_mensagem:'text',p_novo_status:'text'},scalar:true}
};
export class SlaQueryError extends Error{}
const fail=()=>{throw new SlaQueryError('Solicitação SLA inválida ou não permitida.')};
function ident(s:any){if(typeof s!=='string'||!/^[a-z][a-z0-9_]{0,62}$/.test(s))return fail();return '"'+s+'"'}
export function compileSlaQuery(q:any){
 if(!q||!['public','app'].includes(q.schema))return fail();const values:any[]=[];
 const param=(v:any)=>{if(v!==null&&!['string','number','boolean'].includes(typeof v))return fail();if(typeof v==='string'&&v.length>100000)return fail();values.push(v);return '$'+values.length};
 if(q.rpc){const spec=rpcs[q.schema+'.'+q.rpc];if(!spec||!q.args||Array.isArray(q.args)||Object.keys(q.args).length>8)return fail();const args=Object.entries(q.args).map(([name,value])=>{const type=spec.args[name];if(!type)return fail();if(type==='uuid[]'){if(!Array.isArray(value)||value.length>100||value.some(v=>typeof v!=='string'||!/^[a-f0-9-]{36}$/i.test(v)))return fail();return ident(name)+' => ARRAY['+value.map(v=>param(v)+'::uuid').join(',')+']::uuid[]'}return ident(name)+' => '+param(value)+'::'+type});return {text:`SELECT ${spec.scalar?'':'* FROM '}${ident(q.schema)}.${ident(q.rpc)}(${args.join(',')})${spec.scalar?' AS value':''}`,values,scalar:!!spec.scalar,single:null,requiresRobot:q.rpc==='robot_request_jms_login'};}
 const op=q.op||'select',table=ident(q.schema)+'.'+ident(q.table),alias='t';
 if(op==='select'?!reads[q.schema]?.includes(q.table):q.schema!=='public'||!writes[q.table]?.includes(op))return fail();
 const select=(s:any)=>{if(s==='*')return 't.*';if(typeof s!=='string'||s.length>1200)return fail();return s.split(/,(?![^()]*\))/).map(c=>{if(c==='drivers(full_name)'&&q.schema==='app'&&['tickets','alerts'].includes(q.table))return '(SELECT jsonb_build_object(\'full_name\',d.full_name) FROM app.drivers d WHERE d.id=t.driver_id) AS drivers';return alias+'.'+ident(c)}).join(',')};
 if(!Array.isArray(q.filters)||q.filters.length>20||!Array.isArray(q.orders)||q.orders.length>5)return fail();
 const where=q.filters.map((f:any)=>{const c=alias+'.'+ident(f.column),operators:Record<string,string>={eq:'=',neq:'<>',gte:'>=',lte:'<=',gt:'>',lt:'<',like:'LIKE'};if(f.op==='is'){if(f.value!==null&&typeof f.value!=='boolean')return fail();return c+' IS '+(f.value===null?'NULL':f.value?'TRUE':'FALSE')}if(f.op==='in'){if(!Array.isArray(f.value)||!f.value.length||f.value.length>500)return fail();return c+' IN ('+f.value.map(param).join(',')+')'}if(!operators[f.op])return fail();return c+' '+operators[f.op]+' '+param(f.value)}).join(' AND ');
 const filter=where?' WHERE '+where:'';
 let text:string;
 if(op==='select'){
  const limit=q.limit??1000,offset=q.offset??0;if(!Number.isInteger(limit)||limit<1||limit>1000||!Number.isInteger(offset)||offset<0||offset>500000)return fail();
  const orders=q.orders.map((o:any)=>alias+'.'+ident(o.column)+(o.ascending===false?' DESC':' ASC')+(o.nullsFirst===true?' NULLS FIRST':' NULLS LAST'));
  text=`SELECT ${select(q.columns||'*')} FROM ${table} t${filter}${orders.length?' ORDER BY '+orders.join(','):''} LIMIT ${limit} OFFSET ${offset}`;
 }else if(op==='delete'){
  // Importer's replacement of one exact driver/day, never the legacy bulk reset.
  if(q.filters.length!==3||!['date','source','driver_name'].every(c=>q.filters.some((f:any)=>f.column===c&&f.op==='eq'&&typeof f.value==='string'&&f.value)))return fail();
  text=`DELETE FROM ${table} t${filter}`;
 }else{
  if(!Array.isArray(q.rows)||!q.rows.length||q.rows.length>1000)return fail();
  const columns=[...new Set<string>(q.rows.flatMap((r:any)=>{if(!r||typeof r!=='object'||Array.isArray(r))return fail();return Object.keys(r)}))];if(!columns.length||columns.length>80)return fail();columns.forEach(ident);
  if(q.table==='driver_interventions'&&q.rows.some((r:any)=>r.actor_user_id!==undefined))q.rows=q.rows.map((r:any)=>({...r,actor_user_id:q.actorId,actor_name_snapshot:q.actorEmail}));
  if(q.table==='import_batches')q.rows=q.rows.map((r:any)=>({...r,...(op==='insert'?{imported_by:q.actorId,metadata:{...(r.metadata||{}),operacao_actor:q.operacaoActor}}:{})}));
  const finalColumns=[...new Set([...columns,...(q.table==='import_batches'&&op==='insert'?['imported_by','metadata']:[])])];
  values.push(JSON.stringify(q.rows));const body='$'+values.length;
  if(op==='update'){
   if(q.rows.length!==1||q.filters.length!==1||q.filters[0].column!=='id'||q.filters[0].op!=='eq')return fail();
   text=`UPDATE ${table} t SET ${finalColumns.map(c=>ident(c)+'=r.'+ident(c)).join(',')} FROM jsonb_populate_recordset(NULL::${table},${body}::jsonb) r${filter}`;
  }else{
   text=`INSERT INTO ${table} AS t (${finalColumns.map(ident).join(',')}) SELECT ${finalColumns.map(ident).join(',')} FROM jsonb_populate_recordset(NULL::${table},${body}::jsonb)`;
   if(op==='upsert'){if(typeof q.conflict!=='string')return fail();const conflict=q.conflict.split(',');conflict.forEach(ident);if(!conflict.length||conflict.some((c:string)=>!finalColumns.includes(c)))return fail();const changed=finalColumns.filter(c=>!conflict.includes(c));text+=' ON CONFLICT ('+conflict.map(ident).join(',')+') '+(changed.length?'DO UPDATE SET '+changed.map(c=>ident(c)+'=EXCLUDED.'+ident(c)).join(','):'DO NOTHING');}
  }
  if(q.returning)text+=' RETURNING '+select(q.columns||'*');
 }
 if(q.single&&!['required','optional'].includes(q.single))return fail();
 return {text,values,scalar:false,single:q.single||null,requiresRobot:q.table.startsWith('robot_')};
}
export function slaResult(rows:any[],compiled:any){if(compiled.scalar)return {data:rows[0]?.value??null,error:null};if(compiled.single){if(rows.length>1||(!rows.length&&compiled.single==='required'))return {data:null,error:{message:'Registro não encontrado ou resultado ambíguo.'}};return {data:rows[0]||null,error:null}}return {data:rows,error:null}}
