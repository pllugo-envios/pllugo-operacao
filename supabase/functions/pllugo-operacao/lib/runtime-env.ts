import postgres from 'npm:postgres@3.4.7';
import { createDatabase } from './postgres-adapter.mjs';

let connection: ReturnType<typeof postgres> | undefined;
let slaConnection: ReturnType<typeof postgres> | undefined;
function slaSql(){
  // Heavy SLA reports have their own bounded pool; task execution does not
  // queue behind history/retention scans on the operation connection.
  if(!slaConnection){const url=Deno.env.get('SUPABASE_DB_URL');if(!url)throw Error('Banco não configurado.');slaConnection=postgres(url,{max:2,prepare:false,ssl:{rejectUnauthorized:true},idle_timeout:20,connect_timeout:10,types:{calendarDate:{to:1082,from:[1082],serialize:(value:string)=>value,parse:(value:string)=>value}}});}
  return slaConnection;
}
function sql() {
  if (!connection) {
    const url = Deno.env.get('SUPABASE_DB_URL');
    if (!url) throw new Error('Configure DATABASE_URL somente no servidor.');
    connection = postgres(url, { max: 1, prepare: false,
      ssl: { rejectUnauthorized: true }, idle_timeout: 20, connect_timeout: 10 });
  }
  return connection;
}
function storage() {
  const url = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key || new URL(url).protocol !== 'https:')
    throw new Error('Configure o Supabase Storage no servidor.');
  const bucket = 'operacao-evidencias';
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const address = (name: string) => `${url.replace(/\/$/, '')}/storage/v1/object/${bucket}/${name.split('/').map(encodeURIComponent).join('/')}`;
  function valid(name: string) {
    if (!/^(evidence\/[a-f0-9-]{36}|geocache\/-?[\d.]+,-?[\d.]+)$/.test(name))
      throw new Error('Chave de arquivo inválida.');
  }
  async function metadata(name: string) {
    valid(name);
    const rows = await sql().unsafe('SELECT content_type,custom_metadata FROM operacao.blobs WHERE key=$1', [name]);
    const row = rows[0];
    if (row && (!row.custom_metadata || typeof row.custom_metadata !== 'object' || Array.isArray(row.custom_metadata)))
      throw new Error('Metadados do arquivo inválidos.');
    return row;
  }
  return {
    async put(name: string, body: ArrayBuffer | string, options: any = {}) {
      valid(name);
      const contentType = options.httpMetadata?.contentType || (typeof body === 'string' ? 'application/json' : 'application/octet-stream');
      const response = await fetch(address(name), { method: 'POST', headers: { ...headers,
        'Content-Type': contentType, 'x-upsert': 'true' }, body, cache: 'no-store', signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error('Não foi possível salvar o arquivo.');
      await response.body?.cancel();
      // Never expose the service key or the upstream response body to visitors.
      await sql().unsafe('INSERT INTO operacao.blobs(key,content_type,custom_metadata) VALUES($1,$2,$3::jsonb) ON CONFLICT(key) DO UPDATE SET content_type=excluded.content_type,custom_metadata=excluded.custom_metadata',
        [name, contentType, sql().json(options.customMetadata || {})]);
    },
    async get(name: string) {
      const meta = await metadata(name);
      if (!meta) return null;
      const response = await fetch(address(name), { headers, cache: 'no-store', signal: AbortSignal.timeout(30000) });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Não foi possível carregar o arquivo.');
      return { body: response.body, httpMetadata: { contentType: meta.content_type }, customMetadata: meta.custom_metadata };
    },
    async head(name: string) {
      const meta = await metadata(name);
      if (!meta) return null;
      const response = await fetch(address(name), { headers: { ...headers, Range: 'bytes=0-0' }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
      await response.body?.cancel();
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Não foi possível verificar o arquivo.');
      return { httpMetadata: { contentType: meta.content_type }, customMetadata: meta.custom_metadata };
    },
  };
}
export const env = {
  async slaIdentity(user:{id:string,email:string,owner?:boolean}){
    // Only the owner's existing, Supabase-verified login delegates an Auth identity.
    // Internal managed accounts get a separate namespace, never an email-based
    // impersonation of a privileged Driver/robot account.
    if(user.owner){const rows=await sql().unsafe("SELECT id,email FROM auth.users WHERE lower(email)=lower($1) AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL AND (banned_until IS NULL OR banned_until<now()) LIMIT 1",[user.email]);
      if(rows[0])return {...rows[0],authId:rows[0].id};return null;
    }
    const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('pllugo-operacao:sla:'+user.id)));bytes[6]=(bytes[6]&15)|80;bytes[8]=(bytes[8]&63)|128;
    const h=Array.from(bytes.slice(0,16),b=>b.toString(16).padStart(2,'0')).join('');
    return {id:`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`,email:user.email,authId:null};
  },
  async slaExecute(identity:{id:string,email:string},query:{text:string,values:any[],requiresRobot?:boolean}){
    return slaSql().begin(async tx=>{
      await tx.unsafe("SELECT set_config('request.jwt.claims',$1,true),set_config('request.jwt.claim.sub',$2,true)",[JSON.stringify({sub:identity.id,email:identity.email,role:'authenticated'}),identity.id]);
      await tx.unsafe("SET LOCAL ROLE authenticated");
      await tx.unsafe("SET LOCAL statement_timeout = '20s'");
      if(query.requiresRobot){const check=await tx.unsafe('SELECT public.is_robot_admin() AS allowed');if(check[0]?.allowed!==true)throw Error('Acesso ao robô não permitido.');}
      return await tx.unsafe(query.text,query.values);
    });
  },
  async verifyPassword(email:string,password:string){
    try{const url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_ANON_KEY')!;
      const response=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(10000)});
      if(!response.ok){await response.body?.cancel();return false}
      const data=await response.json();return !!data.user?.email_confirmed_at&&data.user.email.toLowerCase()===email;
    }catch{return false}
  },
  get DB() { return createDatabase(sql()); },
  get BUCKET() { return storage(); },
};
