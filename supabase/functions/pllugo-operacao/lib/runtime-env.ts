import postgres from 'npm:postgres@3.4.7';
import { createDatabase } from './postgres-adapter.mjs';

let connection: ReturnType<typeof postgres> | undefined;
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
