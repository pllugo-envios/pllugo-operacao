import {useRef,useState} from 'react';
import {ImagePlus} from 'lucide-react';
import {transferImages} from '../lib/evidence-input';
export default function EvidenceInput({busy,onFiles}:{busy:boolean,onFiles:(files:File[])=>void}){
 const [dragging,setDragging]=useState(false);const depth=useRef(0);
 return <div className={'evidenceinput'+(dragging?' dragging':'')+(busy?' disabled':'')} role="group" aria-label="Adicionar imagens de evidência" tabIndex={0}
 onDragEnter={e=>{e.preventDefault();depth.current++;if(!busy)setDragging(true)}}
 onDragLeave={e=>{e.preventDefault();depth.current=Math.max(0,depth.current-1);if(!depth.current)setDragging(false)}}
 onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect=busy?'none':'copy'}}
 onDrop={e=>{e.preventDefault();e.stopPropagation();depth.current=0;setDragging(false);if(!busy)onFiles(transferImages(e.dataTransfer))}}>
 <ImagePlus size={25}/><strong>{busy?'Enviando imagens…':'Cole ou arraste suas imagens aqui'}</strong>
 <p>Clique nesta área e use Ctrl+V (⌘V no Mac), ou arraste arquivos de imagem.</p>
 <label className="gallerybutton">Selecionar imagens<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={e=>{onFiles(Array.from(e.target.files||[]));e.target.value=''}}/></label>
 <small>JPG, PNG ou WebP · até 8 MB por imagem</small>
 </div>;
}
