export function personalTasks(records:any[],user:any,date:string){
 return records.filter(t=>t.kind==='task'&&!t.deleted&&t.active!==false&&t.assigneeId===user.id&&user.units.includes(t.unit)&&t.date===date).sort((a,b)=>String(a.time).localeCompare(String(b.time))||(a.order||0)-(b.order||0));
}
export function personalSummary(tasks:any[],time:string){
 const completed=tasks.filter(t=>t.status==='done').length;
 return {total:tasks.length,completed,pending:tasks.length-completed,overdue:tasks.filter(t=>t.status!=='done'&&t.time<time).length,percent:tasks.length?Math.round(completed/tasks.length*100):0};
}
const minutes=(time:string)=>{const [h,m]=String(time).split(':').map(Number);return h*60+m};
export function dueSoon(task:any,time:string){return task.status!=='done'&&minutes(task.time)>=minutes(time)&&minutes(task.time)<=minutes(time)+60}
export function personalInsights(tasks:any[],time:string){
 const pending=tasks.filter(t=>t.status!=='done');
 const remaining=pending.filter(t=>t.time>=time).map(t=>t.time).sort();
 const clients=[...new Set(tasks.map(t=>t.client))].sort().map(client=>({client,...personalSummary(tasks.filter(t=>t.client===client),time)}));
 const periods=[{name:'Manhã',start:0,end:12},{name:'Tarde',start:12,end:18},{name:'Noite',start:18,end:24}].map(period=>({...period,...personalSummary(tasks.filter(t=>minutes(t.time)>=period.start*60&&minutes(t.time)<period.end*60),time)}));
 return {dueSoon:pending.filter(t=>dueSoon(t,time)).length,nextDeadline:remaining[0]||null,photosRemaining:pending.reduce((n,t)=>n+Math.max(0,(t.minPhotos||0)-(t.photos||[]).length),0),clients,periods};
}
