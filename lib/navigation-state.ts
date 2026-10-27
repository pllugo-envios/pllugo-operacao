const prefix='pllugo-operacao-navigation-v1:';
const keys=['view','unit','date','filter','client','category','person','managementTab','search','overviewMode','overviewSort'] as const;
const text=(value:any,fallback:string)=>typeof value==='string'&&value.length<=160?value:fallback;
export function readNavigation(user:any,units:string[],today:string){
 const manager=['Administrador','Supervisor','Líder de base'].includes(user.role),allowed=user.role==='Administrador'?units:units.filter(u=>(user.units||[]).includes(u));let value:any={};
 try{value=JSON.parse(window.sessionStorage.getItem(prefix+user.id)||'{}')||{}}catch{}
 const views=['Início','Minhas tarefas',...(manager?['Visão geral','Gerenciar atividades','Equipe','Qualidade & SLA']:[])];
 const validDate=typeof value.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value.date)&&!Number.isNaN(Date.parse(value.date+'T12:00:00Z'))&&new Date(value.date+'T12:00:00Z').toISOString().slice(0,10)===value.date;
 return {view:views.includes(value.view)?value.view:'Início',unit:allowed.includes(value.unit)?value.unit:allowed[0]||units[0],date:validDate?value.date:today,filter:['Todas','Pendentes','Concluídas','Atrasadas'].includes(value.filter)?value.filter:'Todas',client:['Todos','J&T','iMile'].includes(value.client)?value.client:'Todos',category:text(value.category,'Todos os grupos'),person:text(value.person,'Todos'),managementTab:['day','routines','once'].includes(value.managementTab)?value.managementTab:'day',search:text(value.search,''),overviewMode:value.overviewMode==='people'?'people':'schedule',overviewSort:{key:['completion','done','overdue','onTime'].includes(value.overviewSort?.key)?value.overviewSort.key:'completion',direction:value.overviewSort?.direction==='asc'?'asc' as const:'desc' as const}};
}
export function saveNavigation(userId:string,value:any){try{window.sessionStorage.setItem(prefix+userId,JSON.stringify(Object.fromEntries(keys.map(key=>[key,value[key]]))))}catch{}}
export function clearNavigation(userId:string){try{window.sessionStorage.removeItem(prefix+userId)}catch{}}
