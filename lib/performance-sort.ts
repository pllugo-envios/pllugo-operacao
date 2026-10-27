export type PerformanceKey='completion'|'done'|'overdue'|'onTime';
export type PerformanceDirection='asc'|'desc';

type Row={name:string,id:string,mine:any[],r:{done:any[],overdue:any[]},known:any[],onTime:number};
export function sortPerformance<T extends Row>(rows:T[],key:PerformanceKey='completion',direction:PerformanceDirection='desc'):T[]{
 const ratio=(row:T)=>row.mine.length?row.r.done.length/row.mine.length:0;
 const value=(row:T)=>!row.mine.length?null:key==='completion'?ratio(row):key==='done'?row.r.done.length:key==='overdue'?row.r.overdue.length:row.known.length?row.onTime/row.known.length:null;
 const factor=direction==='desc'?-1:1;
 return [...rows].sort((a,b)=>{const x=value(a),y=value(b);if(x===null&&y!==null)return 1;if(y===null&&x!==null)return -1;
 const primary=x!==null&&y!==null?(x-y)*factor:0;
 const workload=x!==null&&y!==null&&(key==='completion'||key==='done')?((key==='completion'?a.r.done.length-b.r.done.length:ratio(a)-ratio(b))||a.mine.length-b.mine.length)*factor:0;
 return primary||workload||a.name.localeCompare(b.name,'pt-BR')||a.id.localeCompare(b.id)});
}
