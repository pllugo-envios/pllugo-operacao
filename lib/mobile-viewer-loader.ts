import {asset} from './client-api';
let pending:Promise<void>|null=null;
export function loadCurrentMobileViewer(){
 if(pending)return pending;
 pending=(async()=>{
  await (window as any).PllugoMobileLogin?.close();
  await new Promise<void>((resolve,reject)=>{
   const script=document.createElement('script');let settled=false;
   const finish=(error?:Error)=>{if(settled)return;settled=true;clearTimeout(timer);script.remove();error?reject(error):resolve()};
   const timer=setTimeout(()=>finish(Error('Não foi possível atualizar a tela de validação. Tente novamente.')),15000);
   script.src=asset('/modules/sla/assets/mobile-jms.js')+'?v='+crypto.randomUUID();script.async=true;script.charset='utf-8';
   script.onload=()=>finish();script.onerror=()=>finish(Error('Não foi possível carregar a validação. Verifique sua conexão.'));
   document.head.append(script);
  });
 })().finally(()=>{pending=null});
 return pending;
}
