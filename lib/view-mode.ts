export function canSwitchView(user:any){return user?.owner===true&&user?.role==='Administrador'}
export function operationalUsers(users:any[]){
 return users.filter(user=>user.active===true&&(user.accessLevel?user.accessLevel==='Operacional':['Assistente','Auxiliar','Operacional'].includes(user.role))).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
}
export function presentationUser(user:any,operational:boolean,units:string[],selected?:any){
 if(!canSwitchView(user)||!operational)return user;
 const target=selected&&operationalUsers([selected]).length?selected:null;
 return target?{id:target.id,name:target.name,email:target.email,active:true,role:'Assistente',accessLevel:'Operacional',units:target.units.filter((unit:string)=>units.includes(unit)),owner:false,mustChange:user.mustChange}:{...user,role:'Assistente',accessLevel:'Operacional',units:[...units]};
}
export function presentationRecords(records:any[],user:any,operational:boolean){
 return operational?records.filter(t=>t.kind==='task'&&t.assigneeId===user?.id&&!t.deleted&&t.active!==false&&user.units.includes(t.unit)):records;
}
