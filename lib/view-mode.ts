export function canSwitchView(user:any){return user?.owner===true&&user?.role==='Administrador'}
export function presentationUser(user:any,operational:boolean,units:string[]){
 return canSwitchView(user)&&operational?{...user,role:'Assistente',accessLevel:'Operacional',units:[...units]}:user;
}
export function presentationRecords(records:any[],user:any,operational:boolean){
 return operational?records.filter(t=>t.kind==='task'&&t.assigneeId===user?.id&&!t.deleted&&t.active!==false&&user.units.includes(t.unit)):records;
}
