export const UNIT_KEYS:Record<string,string>={'Mauá • Unidade 1':'maua','Mauá • Unidade 2':'maua2','Ribeirão Pires':'rbp'};
export const UNIT_LABELS=Object.keys(UNIT_KEYS);
export type UnitScope={isAdmin:boolean;allUnits:boolean;units:string[];labels:string[]};
export function unitScope(user:{role:string,units:string[]}):UnitScope {
 const isAdmin=user.role==='Administrador';
 const labels=isAdmin?UNIT_LABELS:UNIT_LABELS.filter(label=>user.units?.includes(label));
 return {isAdmin,allUnits:isAdmin||labels.length===UNIT_LABELS.length,units:labels.map(label=>UNIT_KEYS[label]),labels};
}
export function projectUnitRecord(record:any,scope:UnitScope){
 if(scope.isAdmin||record.kind!=='template')return record;
 const units=(record.units||UNIT_LABELS).filter((u:string)=>scope.labels.includes(u));
 const result={...record,units};
 for(const key of ['assigneeByUnit','assignmentPlanByUnit'])if(result[key])result[key]=Object.fromEntries(Object.entries(result[key]).filter(([unit])=>units.includes(unit)));
 return result;
}
