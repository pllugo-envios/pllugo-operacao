import {useEffect,useRef,useState} from 'react';
import {asset,api,mobileControlApi} from '../lib/client-api';
import {forwardMobileControl} from '../lib/mobile-control';
import {loadCurrentMobileViewer} from '../lib/mobile-viewer-loader';
import {slaLabel,isSlaView} from '../lib/app-modules';
export default function SlaModule({view,onExpired,onNavigate}:{view:string,onExpired:()=>void,onNavigate:(view:string)=>void}){
 const bootDeadline=useRef<ReturnType<typeof setTimeout>|null>(null),frame=useRef<HTMLIFrameElement>(null),current=useRef(view),expired=useRef(onExpired),navigate=useRef(onNavigate),channel=useRef(crypto.randomUUID());
 const [identity,setIdentity]=useState<any>(null),[html,setHtml]=useState(''),[ready,setReady]=useState(false),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 current.current=view;expired.current=onExpired;navigate.current=onNavigate;
 useEffect(()=>{
  const abort=new AbortController();setError('');setIdentity(null);setHtml('');setReady(false);
  window.fetch(asset('/modules/sla/index.html')+'?v=20261105-unit-scope',{signal:abort.signal,cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Não foi possível carregar o módulo SLA.');return r.text()}).then(text=>setHtml(text.replace('<head>','<head><base href="'+new URL(asset('/modules/sla/'),document.baseURI).href+'"><meta name="pllugo-channel" content="'+channel.current+'">'))).catch(e=>{if(e.name!=='AbortError')setError(e.message)});
  api('/api/sla',{signal:abort.signal}).then(async r=>{if(r.status===401)expired.current();if(!r.ok)throw Error(await r.text());return r.json()}).then(setIdentity).catch(e=>{if(e.name!=='AbortError')setError(e.message)});
  bootDeadline.current=setTimeout(()=>setError('O módulo demorou a abrir. Tente novamente.'),30000);
  return()=>{abort.abort();if(bootDeadline.current)clearTimeout(bootDeadline.current)};
 },[revision]);
 useEffect(()=>{if(ready){setError('');if(bootDeadline.current)clearTimeout(bootDeadline.current)}},[ready]);
 useEffect(()=>{
  if(!identity)return;const abort=new AbortController();let active=0;
  const receive=async(event:MessageEvent)=>{
   const m=event.data;if(event.source!==frame.current?.contentWindow||event.origin!=='null'||m?.channel!==channel.current)return;
   const target=frame.current!.contentWindow!;
   if(m.type==='pllugo-sla-view'){if(isSlaView(m.view)&&m.view!==current.current)navigate.current(m.view);return}
   if(m.type==='pllugo-sla-ready'){target.postMessage({type:'pllugo-sla-init',channel:channel.current,user:identity.user,scope:identity.scope,view:current.current},'*');setReady(true);return}
   if(m.type!=='pllugo-sla-request'||!Number.isSafeInteger(m.id)||active>=8)return;active++;
   try{
    if(m.payload?.mobileOpen){
      const flow=m.payload.mobileOpen.flow;
      if(!['jms-sla-motorista','jms-sla-motorista-rbp'].includes(flow))throw Error('Unidade inválida.');
      const started=Date.now(),device=crypto.randomUUID();
      await loadCurrentMobileViewer();if(abort.signal.aborted)return;
      await (window as any).PllugoMobileLogin.open({flow,isAllowed:()=>!abort.signal.aborted,onClose:()=>{if(!abort.signal.aborted)target.postMessage({type:'pllugo-sla-mobile-closed',channel:channel.current},'*')},
        transport:(path:string,body:any)=>mobileControlApi(path,body,abort.signal,device),getRunStatus:async()=>{
          const r=await api('/api/sla',{method:'POST',signal:abort.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({schema:'public',table:'robot_flow_status',op:'select',columns:'status,started_at,finished_at',filters:[{column:'id',op:'eq',value:flow}],orders:[],limit:1,offset:0,single:'required'})});
          if(!r.ok)return null;const value=await r.json();
          return Date.parse(value.data?.finished_at||value.data?.started_at)>=started-2000?value.data?.status:null;
        }});
      if(!abort.signal.aborted)target.postMessage({type:'pllugo-sla-result',channel:channel.current,id:m.id,result:{data:true,error:null}},'*');
      return;
    }
    if(m.payload?.mobileControl){
      const result=await forwardMobileControl(m.payload.mobileControl,(path,body)=>mobileControlApi(path,body,abort.signal));
      if(!abort.signal.aborted)target.postMessage({type:'pllugo-sla-result',channel:channel.current,id:m.id,result},'*');
      return;
    }
    const r=await api('/api/sla',{method:'POST',signal:abort.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify(m.payload)});
    if(r.status===401){expired.current();return}
    const result=r.ok?await r.json():{data:null,error:{message:await r.text()}};
    if(!abort.signal.aborted)target.postMessage({type:'pllugo-sla-result',channel:channel.current,id:m.id,result},'*');
   }catch{if(!abort.signal.aborted)target.postMessage({type:'pllugo-sla-result',channel:channel.current,id:m.id,result:{data:null,error:{message:'Falha de conexão. Atualize o módulo.'}}},'*')}finally{active--}
  };
  addEventListener('message',receive);return()=>{(window as any).PllugoMobileLogin?.close();abort.abort();removeEventListener('message',receive)};
 },[identity]);
 useEffect(()=>{if(ready)frame.current?.contentWindow?.postMessage({type:'pllugo-sla-navigate',channel:channel.current,view},'*')},[view,ready]);
 return <section className="slamodule"><div className="slamodulehead"><div><span className="eyebrow">OPERAÇÃO SLA</span><h1>{slaLabel(view)}</h1></div></div>{error?<div role="alert" className="error">{error}<button onClick={()=>setRevision(n=>n+1)}>Tentar novamente</button></div>:<>{!ready&&<p role="status">Carregando Operação SLA…</p>}{identity&&html&&<iframe ref={frame} key={revision} title="Operação SLA" srcDoc={html} sandbox="allow-scripts allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox" allow="clipboard-write" referrerPolicy="strict-origin"/>}</>}</section>
}
