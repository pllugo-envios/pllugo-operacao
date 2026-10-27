import {db,record,putOpen} from './access.ts';
import {assignmentAt} from './assignment-plan.ts';
export async function syncAssignment(task:any,provided?:any){
 if(task.kind!=='task'||task.status==='done'||task.deleted)return task;
 const source=task.templateId?(provided||await record(task.templateId)):task;if(!source)return task;
 if(source.deleted)return putOpen({...task,deleted:true,deletedAt:source.deletedAt||new Date().toISOString(),deletedBy:source.deletedBy,deletedWithTemplate:source.id});
 let next={...task},changed=false;
 if(task.templateId){
  for(const key of ['title','description','category','time','fields','minPhotos','activities','photoInstructions','order','active','recurrence','days','startDate','originalDetail','special','parentTemplateId','registryCountField','registryCodesField']){
   if(JSON.stringify(task[key])!==JSON.stringify(source[key])){changed=true;if(source[key]===undefined)delete next[key];else next[key]=source[key];}
  }
  if(changed)next.history=[...(task.history||[]),{at:new Date().toISOString(),actor:'Sistema',action:'Atualizou configuração da rotina'}];
 }
 const plan=source.assignmentPlanByUnit?.[task.unit];
 if(plan&&task.date>=plan.managedFrom){const values=assignmentAt(source,task.unit,task.date);
  if(task.assigneeId!==values.assigneeId||task.fixedAssigneeId!==values.fixedAssigneeId||task.assignmentMode!==values.assignmentMode||task.assignmentUntil!==values.assignmentUntil){
   const p:any=values.assigneeId?await db().prepare('SELECT name FROM users WHERE id=?').bind(values.assigneeId).first():null;
   next={...next,...values,assignee:p?.name||''};changed=true;
   if(task.assigneeId!==values.assigneeId)next.history=[...(next.history||[]),{at:new Date().toISOString(),actor:'Sistema',action:values.assignmentMode==='temporary'?'Aplicou substituição temporária':'Aplicou responsável fixo'}];
  }
 }
 return changed?putOpen(next):task;
}
