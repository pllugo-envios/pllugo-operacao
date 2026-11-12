(() => {
'use strict';
const VERSION='20261112-validation-import';
const API='https://pllugo-robo-production.up.railway.app/api/mobile-jms';
let closeCurrent=()=>{};
window.PllugoMobileLogin={version:VERSION,close:()=>closeCurrent(),open};
function installStyle(){
 const previous=document.getElementById('pmj-style');if(previous?.dataset.version===VERSION)return;previous?.remove();
 const style=document.createElement('style');style.id='pmj-style';style.dataset.version=VERSION;style.textContent=`
 .pmj{position:fixed;inset:0;z-index:10000;box-sizing:border-box;background:#f6f7fa;color:#20232c;font:14px/1.45 system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px);height:100dvh}
 .pmj *{box-sizing:border-box}.pmj button,.pmj input{font:inherit}.pmj button{border:1px solid #e3e5eb;background:white;color:#353a46;border-radius:12px;min-height:44px;padding:9px 14px;font-weight:650;cursor:pointer}.pmj button:disabled{opacity:.5;cursor:default}
 .pmj .pmj-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;background:white;border-bottom:1px solid #e8eaf0}.pmj .eyebrow{color:#ef4050;letter-spacing:.1em;font-size:10px;font-weight:800;text-transform:uppercase}.pmj h2{font-size:19px;line-height:1.25;margin:3px 0 0;letter-spacing:-.4px}.pmj .close{width:44px;padding:0;font-size:23px;border-radius:50%;background:#f6f7fa}
 .pmj .connection{display:flex;align-items:center;gap:9px;padding:11px 18px;font-size:12px;color:#657080;min-height:43px}.pmj .dot{width:8px;height:8px;border-radius:50%;background:#e8a634;flex-shrink:0}.pmj[data-state=connected] .dot{background:#22ad7b}.pmj[data-state=error] .dot{background:#ee4657}.pmj[data-state=error] .connection{color:#b72e40}
 .pmj .toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 14px 12px}.pmj .mode{flex:1;font-size:12px}.pmj .mode.active{color:#c72d42;border-color:#f2bdc6;background:#fff1f3}.pmj .focus{font-size:12px}.pmj .zoom-wrap{display:flex;align-items:center;gap:4px}.pmj .zoom-wrap button{padding:4px;width:36px;min-height:40px;font-size:19px}.pmj .zoom{width:70px;accent-color:#ee4657}.pmj .viewport{margin:0 12px;flex:1;min-height:160px;overflow:auto;border:1px solid #e0e4ec;border-radius:16px;background:repeating-conic-gradient(#edf0f5 0% 25%,#f2f4f8 0% 50%) 50%/20px 20px;overscroll-behavior:contain}.pmj .screen{display:block;width:100%;max-width:none;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}.pmj .screen[data-ready="false"]{visibility:hidden}.pmj canvas.screen{height:auto;-webkit-user-drag:none}.pmj .modes{display:flex;flex:1}.pmj .modes button{font-size:12px;padding:9px 10px}.pmj .modes .mode{border-radius:12px 0 0 12px}.pmj .modes .pan{border-radius:0 12px 12px 0}.pmj .modes .active{color:#c72d42;border-color:#f2bdc6;background:#fff1f3}.pmj .zoom{display:none}
 .pmj .hint{margin:10px 18px;color:#677182;font-size:12px}.pmj .pmj-footer{padding:0 14px 14px;background:#f6f7fa}.pmj .retry{display:none;width:100%;background:#ee4657;color:white;border:0;margin-bottom:10px}.pmj[data-state=error] .retry{display:block}.pmj details{border:1px solid #e3e5eb;border-radius:12px;background:white;padding:12px}.pmj summary{cursor:pointer;font-size:12px;font-weight:650}.pmj form{display:flex;gap:8px;margin-top:12px}.pmj .code{min-width:0;flex:1;border:1px solid #dce0e7;border-radius:10px;padding:10px;background:#fff}.pmj .send{background:#ee4657;color:white;border:0}.pmj small{display:block;color:#727b89;font-size:11px;margin-top:8px}
 .pmj[data-state=done] .dot{background:#22ad7b}.pmj[data-confirmed=false] .dot{background:#e8a634}.pmj[data-confirmed=false] .outcome-icon{background:#edf0f5;color:#657080}.pmj[data-state=done] .toolbar,.pmj[data-state=done] .viewport,.pmj[data-state=done] .hint,.pmj[data-state=done] .pmj-footer{display:none}.pmj .outcome{display:none}.pmj[data-state=done] .outcome{display:flex;flex:1;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:28px;gap:16px}.pmj .outcome-icon{width:64px;height:64px;display:grid;place-items:center;border-radius:50%;background:#e7f7ef;color:#168b61;font-size:30px}.pmj .outcome h3{font-size:21px;margin:0}.pmj .outcome p{font-size:14px;color:#6c7685;line-height:1.7;max-width:340px;margin:0}.pmj .outcome button{margin-top:10px;background:#ee4657;color:white;border:0;padding:14px 24px}
 @media(max-width:350px){.pmj .toolbar{flex-wrap:wrap}.pmj .zoom{width:60px}.pmj h2{font-size:17px}}
 `;document.head.appendChild(style);
}
async function open({client,flow,isAllowed=()=>true,onClose=()=>{},getRunStatus=async()=>null,transport=null}) {
 await closeCurrent();installStyle();
 const modal=document.createElement('div');modal.className='pmj';modal.dataset.state='connecting';
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Validação J&T pelo celular');
 modal.innerHTML=`<div class="pmj-head"><div><div class="eyebrow">Validação de acesso · J&T</div><h2 class="pmj-unit"></h2></div><button class="close" type="button" aria-label="Fechar validação">×</button></div><div class="connection"><span class="dot"></span><span class="pmj-status" role="status">Conectando à sua sessão…</span></div><div class="toolbar"><button class="mode active" type="button">Arrastar desafio</button><button class="focus" type="button">Tela inteira</button><div class="zoom-wrap"><button class="less" type="button" aria-label="Diminuir imagem">−</button><input class="zoom" aria-label="Zoom" type="range" min="1" max="3" step="0.25" value="1"><button class="more" type="button" aria-label="Ampliar imagem">+</button></div></div><div class="viewport"><canvas class="screen" role="img" aria-label="Sessão remota para validação manual" data-ready="false"></canvas></div><p class="hint">Arraste o desafio na imagem. Para reposicionar a tela ampliada, toque em “Arrastar desafio” e mude para “Mover tela”.</p><section class="outcome" aria-live="polite"><div class="outcome-icon" aria-hidden="true">✓</div><h3>Validação encerrada</h3><p class="outcome-message"></p><button class="back" type="button">Voltar ao painel</button></section><div class="pmj-footer"><button class="retry" type="button">Reconectar à mesma sessão</button><details><summary>O sistema pediu código por e-mail?</summary><form><input class="code" inputmode="numeric" autocomplete="off" maxlength="10" placeholder="Código recebido" aria-label="Código do e-mail"><button class="send" type="submit">Inserir</button></form><small>Toque primeiro no campo de código da imagem. Insira o código aqui e confirme na própria sessão.</small></details></div>`;
 modal.querySelector('.pmj-unit').textContent=flow==='jms-sla-motorista-rbp'?'Ribeirão Pires':'Mauá';
 document.body.append(modal);const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
 const img=modal.querySelector('.screen');
 const status=modal.querySelector('.pmj-status'),zoom=modal.querySelector('.zoom');
 const device=crypto.randomUUID();let id,closed=false,stopped=false,pointer=null,events=[],sending=false,pan=false,gesture=false,gesturePending=false,receivedFrame=false;
 let frameTimer,inputTimer,lastPoint,lastHeartbeat=0,rect=null,gestureRect=null,full=false,frameFailures=0,epoch=0,leaving=Promise.resolve(),holdSending=false,lastHold=0,lastHoldAck=0;
 const setStatus=(state,message)=>{modal.dataset.state=state;status.textContent=message;};
 const headers=async()=>{const result=await client.auth.getSession();if(!result.data?.session?.access_token)throw new Error('Entre novamente no dashboard.');return {Authorization:'Bearer '+result.data.session.access_token,'X-Control-ID':device,'Content-Type':'application/json'};};
 async function request(path,body){
  if(!isAllowed())throw new Error('Acesso encerrado. Entre novamente.');const send=transport||window.pllugoMobileTransport;
  const r=send?await send(path,body):await fetch(API+path,{method:body===undefined?'GET':'POST',headers:await headers(),body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(30000)});
  if(!r.ok){const data=await r.json().catch(()=>({}));throw Object.assign(new Error(data.error||'Conexão interrompida. Toque em Reconectar.'),{status:r.status});}return r;
 }
 async function leave(){if(id)try{await request('/'+id+'/leave',{});}catch{}}
 function finish(){if(closed)return leaving;closed=true;epoch++;clearTimeout(frameTimer);clearInterval(inputTimer);events=[];leaving=leave();modal.remove();document.body.style.overflow=previousOverflow;window.removeEventListener('pagehide',finish);document.removeEventListener('visibilitychange',visibility);onClose();return leaving;}
 modal.querySelector('.back').onclick=finish;
 closeCurrent=finish;
 function completed(){const reused=receivedFrame?'':'O JMS confirmou o acesso automaticamente. Não foi necessário resolver CAPTCHA nesta verificação. ';stop(reused+'A solicitação foi concluída. Confira o horário da última importação no Motor de dados. A programação automática permanece ativa.',true,'Acesso validado');}
 async function validationEnded(){let result=null;try{result=await getRunStatus()}catch{}if(closed)return;if(result==='completed'){completed();return}if(result==='error'||result==='needs_attention'){stop('A execução não concluiu. Volte ao painel para consultar o status e iniciar outra tentativa.');return}stop('A sessão de validação encerrou. Volte ao painel para acompanhar o resultado da execução.',true);}

 function stop(message,done=false,title='Validação encerrada'){stopped=true;epoch++;gesture=false;gesturePending=false;pointer=null;setStatus(done?'done':'error',done?title:message);if(done){modal.dataset.confirmed=String(title==='Acesso validado');modal.querySelector('.outcome-icon').textContent=title==='Acesso validado'?'✓':'i';modal.querySelector('.outcome h3').textContent=title;modal.querySelector('.outcome-message').textContent=message;}img.style.pointerEvents='none';clearTimeout(frameTimer);clearInterval(inputTimer);events=[];leaving=leave();}
 async function flush(){
  if(sending||!events.length||closed||stopped||!id)return;sending=true;const batch=events.splice(0,24),current=epoch;
  try{await request('/'+id+'/input',{events:batch});if(current===epoch&&!gesture&&!events.some(e=>e.type==='down')&&batch.some(e=>e.type==='up'||e.type==='cancel'))gesturePending=false;}
  catch(error){if(current===epoch&&!closed){if(error.status===410)await validationEnded();else stop('O gesto foi interrompido. Toque em Reconectar para continuar sem repetir o login.');}}
  finally{sending=false;if(events.some(e=>e.type!=='move')&&!closed&&!stopped)void flush();}
 }
 async function hold(){
  if(holdSending||!gesture||closed||stopped)return;
  holdSending=true;lastHold=Date.now();const current=epoch;
  try{await request('/'+id+'/hold',{});if(current===epoch)lastHoldAck=Date.now();}
  catch(error){if(current===epoch&&gesture&&[401,403,409,410].includes(error.status)){if(error.status===410)await validationEnded();else stop('O controle foi encerrado. Levante o dedo e reconecte.');}}
  finally{if(current===epoch)holdSending=false;}
 }
 function enqueue(e){
  if(closed||stopped||!id)return;
  // A posição mais recente substitui movimentos ainda não enviados; os limites do gesto permanecem na fila.
  if(e.type==='move'&&events.at(-1)?.type==='move')events[events.length-1]=e;
  else if(e.type!=='cancel'||events.at(-1)?.type!=='cancel')events.push(e);
  if(e.type!=='move')void flush();
 }
 function point(event,type){const r=img.getBoundingClientRect(),view=gestureRect||rect;const nx=Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),ny=Math.max(0,Math.min(1,(event.clientY-r.top)/r.height));lastPoint={type,x:view?(view.x+nx*view.width)/view.viewportWidth:nx,y:view?(view.y+ny*view.height)/view.viewportHeight:ny};lastHeartbeat=Date.now();return lastPoint;}
 for(const name of ['contextmenu','selectstart','dragstart'])img.addEventListener(name,e=>{e.preventDefault();e.stopPropagation();});
 img.addEventListener('touchstart',e=>{if(!pan)e.preventDefault();},{passive:false});
 img.addEventListener('touchmove',e=>{if(!pan)e.preventDefault();},{passive:false});
 img.addEventListener('pointerdown',e=>{if(pan||pointer!==null||stopped||!id||img.dataset.ready!=='true')return;e.preventDefault();if(gesturePending){setStatus('connecting','Concluindo o gesto anterior…');return;}gesturePending=true;pointer=e.pointerId;gesture=true;lastHoldAck=Date.now();gestureRect=rect;img.setPointerCapture(pointer);enqueue(point(e,'down'));void hold();});
 img.addEventListener('pointermove',e=>{if(e.pointerId===pointer&&!pan){e.preventDefault();enqueue(point(e,'move'));}});
 function release(e){if(e.pointerId!==pointer)return;e.preventDefault();enqueue(e.type==='pointerup'?point(e,'up'):{type:'cancel'});pointer=null;gesture=false;gestureRect=null;}
 img.addEventListener('pointerup',release);img.addEventListener('pointercancel',release);img.addEventListener('lostpointercapture',()=>{if(pointer!==null){pointer=null;gesture=false;gestureRect=null;enqueue({type:'cancel'});}});
 const visibility=()=>{if(document.hidden){pointer=null;gesture=false;gestureRect=null;enqueue({type:'cancel'});void flush();}};
 document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',finish);modal.querySelector('.close').onclick=finish;
 const mode=modal.querySelector('.mode'),modes=document.createElement('div'),move=document.createElement('button');modes.className='modes';mode.before(modes);modes.append(mode,move);mode.textContent='Arrastar';move.textContent='Mover';move.type='button';move.className='pan';
 function setPan(value){enqueue({type:'cancel'});pointer=null;gesture=false;gestureRect=null;pan=value;img.style.touchAction=pan?'auto':'none';mode.classList.toggle('active',!pan);move.classList.toggle('active',pan);mode.setAttribute('aria-pressed',String(!pan));move.setAttribute('aria-pressed',String(pan));modal.querySelector('.hint').textContent=pan?'Modo mover: posicione a imagem. Depois toque em Arrastar para resolver o desafio.':'Modo arrastar: segure a alça do desafio e mova o dedo. Para posicionar a imagem ampliada, toque em Mover.';}
 mode.onclick=()=>setPan(false);move.onclick=()=>setPan(true);setPan(false);
 const resize=value=>{if(gesture)return;zoom.value=String(Math.max(1,Math.min(3,value)));img.style.width=(100*Number(zoom.value))+'%';};
 zoom.oninput=()=>resize(Number(zoom.value));modal.querySelector('.less').onclick=()=>resize(Number(zoom.value)-.25);modal.querySelector('.more').onclick=()=>resize(Number(zoom.value)+.25);
 modal.querySelector('.focus').onclick=e=>{if(gesture||stopped)return;full=!full;e.target.textContent=full?'Focar validação':'Tela inteira';resize(1);};
 modal.querySelector('form').onsubmit=e=>{e.preventDefault();const input=modal.querySelector('.code'),value=input.value.trim();input.value='';if(!/^\d{4,10}$/.test(value)){status.textContent='Informe o código numérico recebido por e-mail.';return;}enqueue({type:'code',value});};
 async function frame(current){
  if(closed||stopped||current!==epoch)return;if(!isAllowed()){finish();return;}
  if(!document.hidden)try{
   const response=await request('/'+id+'/frame/'+(full?'full':'focus')),blob=await response.blob();if(closed||stopped||current!==epoch)return;
   let nextRect=null;try{nextRect=JSON.parse(response.headers.get('X-Control-Rect'));if(!nextRect?.viewportWidth)nextRect=null;}catch{}
   if(!gesture||JSON.stringify(nextRect)===JSON.stringify(gestureRect)){
    const bitmap=await createImageBitmap(blob);
    if(closed||stopped||current!==epoch){bitmap.close();return;}
    rect=nextRect;if(img.width!==bitmap.width)img.width=bitmap.width;if(img.height!==bitmap.height)img.height=bitmap.height;
    img.getContext('2d').drawImage(bitmap,0,0);bitmap.close();img.dataset.ready='true';receivedFrame=true;
   }
   frameFailures=0;setStatus('connected','Conectado · resolva o desafio na imagem');
  }catch(error){
   if(closed||stopped||current!==epoch)return;if(error.status===410){await validationEnded();return;}
   if([401,403,409].includes(error.status)||++frameFailures>3){stop(error.message||'Não foi possível atualizar a imagem. Toque em Reconectar.');return;}
   setStatus('connecting','Recuperando a conexão…');frameTimer=setTimeout(()=>void frame(current),1000*frameFailures);return;
  }
  frameTimer=setTimeout(()=>void frame(current),700);
 }
 async function connect(){
  if(closed||sending)return;stopped=false;gesturePending=false;holdSending=false;lastHold=0;frameFailures=0;events=[];id=null;rect=null;gestureRect=null;const current=++epoch;clearTimeout(frameTimer);clearInterval(inputTimer);img.style.pointerEvents='none';setStatus('connecting','Conectando à sua sessão…');
  try{
   await leaving;if(closed||current!==epoch)return;
   const deadline=Date.now()+120000;let claimFailures=0;
   while(!closed&&current===epoch&&Date.now()<deadline){
    try{const response=await request('/claim',{flow});id=(await response.json()).id;break;}
    catch(error){
     if(error.status!==425){if((!error.status||[429,500,502,503,504].includes(error.status))&&claimFailures++<2&&Date.now()<deadline-3000){setStatus('connecting','Recuperando a validação do acesso…');await new Promise(r=>setTimeout(r,1500));continue;}throw error;}
     const run=await getRunStatus();if(closed||current!==epoch)return;if(run==='completed'){completed();return;}if(run==='error'||run==='needs_attention')throw new Error('A execução terminou. Feche esta tela e inicie novamente pelo painel.');setStatus('connecting','Aguardando o sistema mostrar a validação…');await new Promise(r=>setTimeout(r,1500));
    }
   }
   if(closed||current!==epoch){void leave();return;}if(!id)throw new Error('A validação não abriu. Consulte o painel.');img.style.pointerEvents='';inputTimer=setInterval(()=>{
    if(gesture){if(Date.now()-lastHoldAck>18000){stop('A conexão foi interrompida. Levante o dedo e reconecte.');return;}if(Date.now()-lastHold>1000)void hold();}
    if(gesture&&lastPoint&&Date.now()-lastHeartbeat>500){lastHeartbeat=Date.now();enqueue({...lastPoint,type:'move'});}void flush();
   },120);void frame(current);
  }catch(error){if(!closed&&current===epoch)stop(error.message);}
 }
 modal.querySelector('.retry').onclick=()=>void connect();await connect();
}
})();
