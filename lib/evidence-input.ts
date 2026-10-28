export const evidenceTypes=['image/jpeg','image/png','image/webp'];
export function transferImages(data:{items?:ArrayLike<{kind:string,getAsFile:()=>File|null}>;files?:ArrayLike<File>}):File[]{
 const items=Array.from(data.items||[]).filter(i=>i.kind==='file').map(i=>i.getAsFile()).filter((f):f is File=>!!f);
 return items.length?items:Array.from(data.files||[]);
}
export function evidenceError(files:File[],existing:number):string{
 if(!files.length)return 'Cole ou arraste um arquivo de imagem.';
 if(files.some(f=>!evidenceTypes.includes(f.type)))return 'Envie imagens JPG, PNG ou WebP.';
 if(files.some(f=>f.size>8*1024*1024))return 'Cada imagem pode ter até 8 MB.';
 if(files.length+existing>20)return 'O limite é de 20 fotos por tarefa.';
 return '';
}
