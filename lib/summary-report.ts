import {daySummary} from './day-summary.ts';
import {sortPerformance} from './performance-sort.ts';
import {baseReport,reportSection} from './base-report.ts';
export const REPORT_OPTIONS=[['J&T','J&T'],['iMile','iMile'],['Anjun','Anjun'],['organization','Resumo Geral - Organização / Limpeza'],['management','Resumo Geral - Gerencial']] as const;
function totals(tasks:any[],date:string,today:string,time:string){const s=daySummary(tasks,date,today,time);return {total:tasks.length,done:s.done.length,pending:tasks.length-s.done.length,overdue:s.overdue.length,percent:s.percent,unassigned:tasks.filter(t=>!t.assigneeId&&t.status!=='done').length};}
export function summaryReport(records:any[],unit:string,date:string,selection:string,today:string,time:string){
 const mode=selection==='management'?'management':selection==='organization'?'organization':'client';
 const all=records.filter(t=>t.kind==='task'&&!t.deleted&&t.active!==false&&t.unit===unit&&t.date===date);
 const organizationTasks=all.filter(t=>t.client==='Pllugo'&&reportSection(t)==='order');
 const base=baseReport(mode==='organization'?organizationTasks:records,unit,date,mode==='client'?selection:mode==='organization'?'Pllugo':'Todos',today,time);
 const population=mode==='organization'?organizationTasks:all;
 const metrics=totals(population,date,today,time);
 const people=sortPerformance([...new Set(all.filter(t=>t.assigneeId).map(t=>t.assigneeId))].map(id=>{const mine=all.filter(t=>t.assigneeId===id),r=daySummary(mine,date,today,time),known=r.done.filter(t=>t.completedAt&&!Number.isNaN(Date.parse(t.completedAt))),onTime=known.filter(t=>Date.parse(t.completedAt)<=Date.parse(date+'T'+(t.time||'23:59')+':00-03:00')).length;return {id,name:mine[0]?.assignee||'Colaborador',mine,r,known,onTime,...totals(mine,date,today,time)}}),'completion','desc');
 const clients=[...new Set(all.map(t=>t.client||'Não definido'))].map(client=>({name:client,...totals(all.filter(t=>(t.client||'Não definido')===client),date,today,time)}));
 const categories=[...new Set(all.map(t=>t.category||'Sem grupo'))].map(name=>({name,...totals(all.filter(t=>(t.category||'Sem grupo')===name),date,today,time)}));
 const lateIds=new Set(daySummary(all,date,today,time).overdue.map(t=>t.id));
 return {...base,mode,label:REPORT_OPTIONS.find(([value])=>value===selection)?.[1]||selection,
 photos:mode==='management'?[]:mode==='organization'?base.photos.filter(p=>p.kind==='organization'&&p.client==='Pllugo'):base.photos,
 management:mode==='management'?{...metrics,people,clients,categories,peoplePending:people.filter(p=>p.pending>0).length,pendingTasks:all.filter(t=>t.status!=='done').map(t=>({...t,late:lateIds.has(t.id)}))}:null,
 organization:mode==='organization'?{...metrics,photos:base.photos.filter(p=>p.kind==='organization'&&p.client==='Pllugo').length,tasks:organizationTasks.map(t=>({...t,late:lateIds.has(t.id)}))}:null};
}
