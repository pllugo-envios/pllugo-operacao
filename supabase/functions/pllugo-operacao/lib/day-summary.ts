export function daySummary(tasks:any[],date:string,today:string,time:string){
 const ordered=[...tasks].sort((a,b)=>String(a.time||'23:59').localeCompare(String(b.time||'23:59'))||(a.sourceOrder||a.order||99)-(b.sourceOrder||b.order||99)||String(a.client).localeCompare(String(b.client))||String(a.title).localeCompare(String(b.title)));
 const isDue=(t:any)=>date<today||(date===today&&String(t.time||'23:59')<=time);
 const done=ordered.filter(t=>t.status==='done'),due=ordered.filter(isDue),overdue=due.filter(t=>t.status!=='done'),dueDone=due.filter(t=>t.status==='done');
 const upcoming=ordered.filter(t=>t.status!=='done'&&!isDue(t));
 const slots=Array.from(new Set(ordered.map(t=>t.time||'Sem horário'))).map(hour=>({hour,tasks:ordered.filter(t=>(t.time||'Sem horário')===hour)}));
 return {ordered,done,due,overdue,dueDone,upcoming,slots,percent:tasks.length?Math.round(done.length/tasks.length*100):0,expected:tasks.length?Math.round(due.length/tasks.length*100):0};
}
