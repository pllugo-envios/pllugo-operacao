import {assignmentAt} from './assignment-plan';
export function duplicateActivity(source:any,id:string,unit:string,date:string,allowedUnits:string[]){
 const recurring=source.kind==='template',units=recurring?(source.units||[unit]).filter((u:string)=>allowedUnits.includes(u)):[unit];
 const configuration:any={};for(const key of ['description','category','time','fields','minPhotos','activities','photoInstructions','order','days'])if(source[key]!==undefined)configuration[key]=structuredClone(source[key]);
 return {...configuration,id,duplicateOf:source.id,kind:recurring?'template':'task',title:source.title+' (cópia)',client:source.client,clients:[source.client],unit,units,date,startDate:date,recurrence:recurring?source.recurrence:'once',active:source.active!==false,assigneeByUnit:Object.fromEntries(units.map((u:string)=>[u,assignmentAt(source,u,date).fixedAssigneeId||''])),assigneeId:assignmentAt(source,unit,date).fixedAssigneeId||'',status:'pending',answers:{},photos:[],orders:[],history:[]};
}
