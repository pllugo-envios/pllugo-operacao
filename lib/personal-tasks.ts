export function personalTasks(records:any[],user:any,date:string){
 return records.filter(t=>t.kind==='task'&&!t.deleted&&t.active!==false&&t.assigneeId===user.id&&user.units.includes(t.unit)&&t.date===date).sort((a,b)=>String(a.time).localeCompare(String(b.time))||(a.order||0)-(b.order||0));
}
export function personalSummary(tasks:any[],time:string){
 const completed=tasks.filter(t=>t.status==='done').length;
 return {total:tasks.length,completed,pending:tasks.length-completed,overdue:tasks.filter(t=>t.status!=='done'&&t.time<time).length,percent:tasks.length?Math.round(completed/tasks.length*100):0};
}
