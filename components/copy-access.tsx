import {dismissBackdrop} from '../lib/dismiss-backdrop';
import {useState} from 'react';
import {createPortal} from 'react-dom';
import {Copy,X} from 'lucide-react';
import {accessMessage} from '../lib/access-message';
type Props={person:{name:string,email:string,mustChange?:boolean},temporary?:string,onGenerate:()=>Promise<string>};
export default function CopyAccess({person,temporary,onGenerate}:Props){
 const [open,setOpen]=useState(false),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[copied,setCopied]=useState(false);
 async function copy(value:string){
   setMessage(value);
   try{await navigator.clipboard.writeText(value);setCopied(true);setOpen(true)}
   catch{setCopied(false);setOpen(true)}
 }
 async function generate(){setBusy(true);setError('');try{const password=await onGenerate();await copy(accessMessage(person,password))}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 function begin(){setError('');setCopied(false);setMessage('');if(temporary&&person.mustChange!==false)void copy(accessMessage(person,temporary));else setOpen(true)}
 return <><button type="button" onClick={begin}><Copy size={14}/>Copiar acesso</button>{open&&createPortal(<div className="overlay secretlayer" onClick={e=>dismissBackdrop(e,()=>setOpen(false),!busy)}><section className="modal credentialmodal" role="dialog" aria-modal="true" aria-labelledby="share-access-title"><div className="modalhead"><h2 id="share-access-title">{message?'Acesso para WhatsApp':'Preparar acesso'}</h2><button type="button" disabled={busy} aria-label="Fechar mensagem de acesso" onClick={()=>setOpen(false)}><X/></button></div>
 {message?<><p role="status">{copied?'Mensagem copiada! Cole na conversa do colaborador no WhatsApp.':'Selecione e copie a mensagem abaixo para enviar ao colaborador.'}</p><textarea className="accessmessage" aria-label="Mensagem de primeiro acesso" readOnly value={message} onFocus={e=>e.currentTarget.select()}/><button type="button" className="primary" onClick={()=>copy(message)}>{copied?'Copiar novamente':'Copiar mensagem'}</button></>:<><p>Preparar a mensagem para <strong>{person.name}</strong>?</p><div className="notice">Uma nova senha provisória será gerada e substituirá a senha atual. Os acessos anteriores serão encerrados e o colaborador deverá criar uma nova senha no próximo login.</div>{error&&<p role="alert" className="error">{error}</p>}<div className="modalactions"><button type="button" disabled={busy} onClick={()=>setOpen(false)}>Cancelar</button><button type="button" disabled={busy} className="primary" onClick={generate}>{busy?'Preparando…':'Gerar senha e copiar'}</button></div></>}
 </section></div>,document.body)}</>;
}
