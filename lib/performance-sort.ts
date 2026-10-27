export type PerformanceKey='completion'|'done'|'overdue'|'onTime';
export type PerformanceDirection='asc'|'desc';
type Row={name:string,id:string,mine:any[],r:{done:any[],overdue:any[]},known:any[],onTime:number};
export function sortPerformance<T extends Row>(rows:T[],key:PerformanceKey='completion',direction:PerformanceDirection='desc'):T[]{
 const value=(row:T)=>!row.mine.length?null:key==='completion'?row.r.done.length/row.mine.length:key==='done'?row.r.done.length:key==='overdue'?row.r.overdue.length:row.known.length?row.onTime/row.known.length:null;
 return [...rows].sort((a,b)=>{const x=value(a),y=value(b);if(x===null&&y!==null)return 1;if(y===null&&x!==null)return -1;return (x!==null&&y!==null?(x-y)*(direction==='desc'?-1:1):0)||a.name.localeCompare(b.name,'pt-BR')||a.id.localeCompare(b.id)});
}
