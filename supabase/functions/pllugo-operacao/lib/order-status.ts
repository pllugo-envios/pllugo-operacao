export const orderStatus=(status:any)=>status==='awaiting'?'pending':status==='resolved'?'delivered':(['assigned','delivered','pending','loss'].includes(status)?status:'pending');
export const nextOrderDay=(date:string)=>new Date(Date.parse(date+'T12:00:00Z')+86400000).toISOString().slice(0,10);
export const registryCountField=(task:any)=>task.registryCountField||(task.fields||[]).find((field:string)=>/^(Total|Quantidade) de pedidos/i.test(field))||'Total de pedidos não localizados';

export const registryCodesField=(task:any):string=>task.registryCodesField||(task.fields||[]).find((field:string)=>/^(ids?|c[oó]digos?)\b/i.test(field.trim()))||'';
export function registryCodes(task:any):string[]{const field=registryCodesField(task),orders=task.orders||[];return (orders.length?orders.map((o:any)=>String(o.code||'')):String(task.answers?.[field]||'').split('\n')).map((code:string)=>code.trim()).filter(Boolean);}
