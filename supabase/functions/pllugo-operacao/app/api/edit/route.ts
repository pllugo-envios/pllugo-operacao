import {current,db,json,failure,HttpError,sameOrigin,manager,canUnit,record,today} from '../../../lib/access.ts';
import {validTemplate,validateAssignee} from '../data/route.ts';
import {assignmentAt,planAssignment,validDay} from '../../../lib/assignment-plan.ts';
import {taskTitle} from '../../../lib/task-groups.ts';
export async function POST(req:Request){try{
 sameOrigin(req);const u=await current(req),x:any=await req.json();
 if(!manager(u))throw new HttpError(403,'Sem permissão para editar atividades.');
 if(!Array.isArray(x.ids)||!x.ids.length||x.ids.length>2||new Set(x.ids).size!==x.ids.length)throw new HttpError(400,'Selecione um ou dois clientes.');
 const old:any[]=[];for(const id of x.ids){const t=await record(id);if(!t||t.deleted||!['task','template'].includes(t.kind))throw new HttpError(404,'Atividade não encontrada.');if(t.status==='done')throw new HttpError(409,'O histórico concluído não pode ser editado.');if(t.templateId)throw new HttpError(400,'Edite a rotina de origem.');if((t.kind==='template'?t.units:[t.unit]).some((unit:string)=>!canUnit(u,unit)))throw new HttpError(403,'Unidade não autorizada.');old.push(t);}
 const first=old[0];if(old.some(t=>t.kind!==first.kind||taskTitle(t.title)!==taskTitle(first.title)||t.category!==first.category||t.time!==first.time||t.date!==first.date)||new Set(old.map(t=>t.client)).size!==old.length)throw new HttpError(400,'Selecione clientes da mesma atividade.');
 const recurring=first.kind==='template',units=recurring?x.units:[first.unit];
 validTemplate({...x,client:first.client,units,recurrence:recurring?x.recurrence:'once'},u);
 if(!validDay(recurring?x.startDate:x.date))throw new HttpError(400,'Informe uma data válida.');
 if(x.changeAssignment&&(!canUnit(u,x.assignmentUnit)||!units.includes(x.assignmentUnit)))throw new HttpError(403,'Unidade da atribuição inválida.');
 const name=x.changeAssignment?await validateAssignee(x.editAssigneeId||'',x.assignmentUnit):'';
 const now=new Date().toISOString(),writes:any[]=[],checks:any[]=[];
 for(const t of old.sort((a,b)=>a.id.localeCompare(b.id))){let next={...t,title:String(x.title).trim(),description:String(x.description||''),category:x.category,time:x.time,fields:x.fields,minPhotos:x.minPhotos,activities:x.activities,photoInstructions:x.photoInstructions,order:Number(x.order)||0,active:x.active!==false,...(recurring?{units,recurrence:x.recurrence,days:x.days||[],startDate:x.startDate}:{date:x.date}),updated:now,updatedBy:u.id};
 if(x.changeAssignment){next=planAssignment(next,x.assignmentUnit,x.editAssigneeId||'','fixed',recurring?today():(next.date<today()?next.date:today()),undefined,u.id);if(!recurring)next={...next,...assignmentAt(next,t.unit,next.date),assignee:name};}
 next.history=[...(t.history||[]),{at:now,actor:u.name,actorId:u.id,action:'Editou configuração da atividade',clients:old.map(v=>v.client)}];
 checks.push(db().prepare('SELECT 1 / CASE WHEN EXISTS(SELECT 1 FROM records WHERE id=? AND updated=? FOR UPDATE) THEN 1 ELSE 0 END AS ok').bind(t.id,t.updated));
 writes.push(db().prepare('UPDATE records SET body=?,updated=? WHERE id=? AND updated=?').bind(JSON.stringify(next),now,t.id,t.updated));}
 try{await db().batch([...checks,...writes])}catch{throw new HttpError(409,'A atividade mudou em outro acesso. Atualize antes de salvar.');}
 return json({count:old.length,kind:first.kind});
}catch(e){return failure(e)}}
