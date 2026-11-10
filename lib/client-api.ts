import {validMobilePath} from './mobile-control';
const ENDPOINT='https://dfaoyjlzxnbephvcgkfz.supabase.co/functions/v1/pllugo-operacao';
const KEY='pllugo-operacao-session-v1';
let session:string|null=null,remember=false,loaded=false,expires=0;
function load(){
  if(loaded)return;loaded=true;try{remember=window.localStorage.getItem(KEY+'-remember')==='1'}catch{}
  for(const name of ['sessionStorage','localStorage'] as const){
    try{const raw=window[name].getItem(KEY);if(!raw)continue;const value=JSON.parse(raw);
      if(typeof value.token==='string'&&/^[a-f0-9]{64}$/.test(value.token)&&value.expires>Date.now()){
        session=value.token;expires=value.expires;remember=name==='localStorage';return;
      }window[name].removeItem(KEY);
    }catch{}
  }
}
function save(token:string|null,fresh=false){
  session=token;if(fresh)expires=Date.now()+(remember?30*86400000:43200000);
  for(const name of ['localStorage','sessionStorage'] as const)try{window[name].removeItem(KEY)}catch{}
  if(token)try{window[remember?'localStorage':'sessionStorage'].setItem(KEY,JSON.stringify({token,expires}))}catch{}
}
export function setRememberSession(value:boolean){load();remember=value;try{if(value)window.localStorage.setItem(KEY+'-remember','1');else window.localStorage.removeItem(KEY+'-remember')}catch{}save(session)}
export function isRemembered(){load();return remember}
export function asset(path:string){return new URL(path.replace(/^\//,''),document.baseURI).href}
const mobileDevice=crypto.randomUUID();
export async function mobileControlApi(path:string,body:any,signal:AbortSignal,device=mobileDevice){
  if(!validMobilePath(path))throw Error('Controle inválido.');load();
  if(!session)return new Response(JSON.stringify({error:'Entre novamente no app Operação.'}),{status:401,headers:{'Content-Type':'application/json'}});
  return fetch('https://pllugo-robo-production.up.railway.app/api/mobile-jms'+path,{
    method:body===undefined?'GET':'POST',body:body===undefined?undefined:JSON.stringify(body),
    headers:{Authorization:'Bearer '+session,'Content-Type':'application/json','X-Control-ID':device},
    credentials:'omit',cache:'no-store',signal:AbortSignal.any([signal,AbortSignal.timeout(30000)])});
}
export async function api(path:string,options:RequestInit={}){
  if(!/^\/api\/(auth|data|users|assign|photo|geocode|dashboard|create|edit|sla)(\?|$)/.test(path))throw Error('Endereço de serviço inválido.');
  load();
  const headers=new Headers(options.headers);
  if(session)headers.set('Authorization',`Bearer ${session}`);
  const response=await fetch(ENDPOINT+path,{...options,headers,credentials:'omit',cache:'no-store'});
  const next=response.headers.get('x-pllugo-session');
  if(next!==null){if(next===''||/^[a-f0-9]{64}$/.test(next))save(next||null,true)}
  if(response.status===401)save(null);
  return response;
}
