import {env} from './runtime-env.ts';
export const UNITS=['Mauá • Unidade 1','Mauá • Unidade 2','Ribeirão Pires'];
export type User={id:string,email:string,name:string,role:string,accessLevel?:string,units:string[],mustChange:boolean,owner?:boolean,active?:boolean};
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export const db=()=>env.DB!;
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date());
export function json(value:any,status=200){return Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}})}
export function failure(e:any){return new Response(e instanceof HttpError?e.message:'Não foi possível concluir a operação.',{status:e instanceof HttpError?e.status:500,headers:{'Cache-Control':'no-store'}})}
export function sameOrigin(req:Request){const o=req.headers.get('origin');if(o&&o!==new URL(req.url).origin)throw new HttpError(403,'Origem não autorizada.');}
export function manager(u:User){return ['Administrador','Supervisor','Líder de base'].includes(u.role)}
export function canUnit(u:User,unit:string){return u.role==='Administrador'||u.units.includes(unit)}
export function admin(u:User){if(u.role!=='Administrador')throw new HttpError(403,'Somente administradores podem executar esta ação.');}
export const LEVELS=['Operacional','Gestão','Administrador'];
export function inferLevel(role:string){return role==='Administrador'?'Administrador':['Supervisor','Líder de base'].includes(role)?'Gestão':'Operacional'}
export function sanitize(u:any):User{const accessLevel=u.access_level||inferLevel(u.role);return {id:u.id,email:u.email,name:u.name,accessLevel,role:accessLevel==='Administrador'?'Administrador':accessLevel==='Gestão'?'Supervisor':'Assistente',units:JSON.parse(u.units),mustChange:u.must_change==='1',active:u.active==='1',owner:u.id==='owner-renato'}}
export function cookies(req:Request){return Object.fromEntries((req.headers.get('cookie')||'').split(';').map(x=>{const i=x.indexOf('=');return i<0?[x.trim(),'']:[x.slice(0,i).trim(),x.slice(i+1)]}))}
export const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
export async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('')}
export async function passwordHash(p:string,salt:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(p),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256);return Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join('')}
export function equal(a:string,b:string){let result=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)result|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return result===0}
// The Supabase endpoint does not trust ChatGPT identity headers.
export function ownerRequest(_req:Request){return false}
export async function current(req:Request,allowChange=false):Promise<User>{const c=cookies(req);let u:User|null=null;if(c.pllugo_session){const s:any=await db().prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>? AND u.active=\'1\'').bind(await hash(c.pllugo_session),new Date().toISOString()).first();if(s)u=sanitize(s);}else if(c.pllugo_signed_out!=='1'&&ownerRequest(req)){const email=req.headers.get('oai-authenticated-user-email')!.toLowerCase();await db().prepare("INSERT OR IGNORE INTO users(id,email,name,role,units,must_change,active) VALUES('owner-renato',?,'Renato','Administrador',?,'0','1')").bind(email,JSON.stringify(UNITS)).run();const row:any=await db().prepare("SELECT * FROM users WHERE id='owner-renato'").first();u=sanitize(row)}if(!u)throw new HttpError(401,'Entre com seu acesso para continuar.');if(u.mustChange&&!allowChange)throw new HttpError(428,'Troque a senha provisória para continuar.');return u}
export function sessionCookie(req:Request,value:string,maxAge=43200){return `pllugo_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${new URL(req.url).protocol==='https:'?'; Secure':''}`}
export async function record(id:string){const r:any=await db().prepare('SELECT body FROM records WHERE id=?').bind(id).first();return r?JSON.parse(r.body):null}
export async function put(x:any){x.updated=new Date().toISOString();await db().prepare('INSERT INTO records(id,kind,body,updated) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body,updated=excluded.updated').bind(x.id,x.kind,JSON.stringify(x),x.updated).run();return x}
export function taskAccess(u:User,t:any){return t?.kind==='task'&&!t.deleted&&canUnit(u,t.unit)&&(manager(u)||t.assigneeId===u.id)}
export async function putOpen(x:any){const expected=x.updated;x.updated=new Date().toISOString();const r=await db().prepare("UPDATE records SET body=?,updated=? WHERE id=? AND updated=? AND json_extract(body,'$.status') != 'done'").bind(JSON.stringify(x),x.updated,x.id,expected).run();if(r.meta.changes)return x;const fresh=await record(x.id);if(fresh?.status==='done')return fresh;throw new HttpError(409,'Uma atividade mudou em outro acesso. Atualize antes de tentar novamente.');}
