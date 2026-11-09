const fieldKey=(value:string)=>value.trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');

export function missingActivityFields(task:any):string[]{
 const fields=new Set((task.fields||[]).map(fieldKey));
 const missing=new Map<string,string>();
 for(const activity of task.activities||[]){
  const title=String(activity?.title||'').trim();
  if(/^(Quantidade|Total)\b/i.test(title)&&!fields.has(fieldKey(title)))missing.set(fieldKey(title),title);
 }
 return [...missing.values()];
}

export function withActivityFields(task:any){
 return {...task,fields:[...(task.fields||[]),...missingActivityFields(task)]};
}
