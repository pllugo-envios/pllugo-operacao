const ENDPOINT='https://dfaoyjlzxnbephvcgkfz.supabase.co/functions/v1/pllugo-operacao';
const KEY='pllugo-operacao-session-v1';
let session:string|null=null,remember=false,loaded=false;
function load(){
  if(loaded)return;loaded=true;
  for(const name of ['sessionStorage','localStorage'] as const){
    try{const raw=window[name].getItem(KEY);if(!raw)continue;const value=JSON.parse(raw);
      if(typeof value.token==='string'&&/^[a-f0-9]{64}$/.test(value.token)&&value.expires>Date.now()){
        session=value.token;remember=name==='localStorage';return;
      }window[name].removeItem(KEY);
    }catch{}
  }
}
function save(token:string|null){
  session=token;
  for(const name of ['localStorage','sessionStorage'] as const)try{window[name].removeItem(KEY)}catch{}
  if(token)try{window[remember?'localStorage':'sessionStorage'].setItem(KEY,JSON.stringify({token,expires:Date.now()+43200000}))}catch{}
}
export function setRememberSession(value:boolean){load();remember=value;save(session)}
export function isRemembered(){load();return remember}
export function asset(path:string){return new URL(path.replace(/^\//,''),document.baseURI).href}
export async function api(path:string,options:RequestInit={}){
  if(!/^\/api\/(auth|data|users|assign|photo|geocode|dashboard|create|edit)(\?|$)/.test(path))throw Error('Endereço de serviço inválido.');
  load();
  const headers=new Headers(options.headers);
  if(session)headers.set('Authorization',`Bearer ${session}`);
  const response=await fetch(ENDPOINT+path,{...options,headers,credentials:'omit',cache:'no-store'});
  const next=response.headers.get('x-pllugo-session');
  if(next!==null){if(next===''||/^[a-f0-9]{64}$/.test(next))save(next||null)}
  if(response.status===401)save(null);
  return response;
}
