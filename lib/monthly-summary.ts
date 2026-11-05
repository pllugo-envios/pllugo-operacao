export function currentMonth(now=new Date()){
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(now);
 return {today,start:today.slice(0,7)+'-01',key:today.slice(0,7),label:new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',month:'long',year:'numeric'}).format(now)};
}
export function monthlySummary(rows:any[],month:string){
 const days=new Map<string,Record<string,any>>();
 for(const row of rows){if(!row.date?.startsWith(month+'-')||!['jt','jt_real','imile'].includes(row.source))continue;const sources=days.get(row.date)||{};sources[row.source]=row;days.set(row.date,sources)}
 const total={volume:0,delivered:0,days:days.size,rate:0,updatedAt:null as string|null,units:[] as any[],sources:[] as string[],provisional:false};
 const units=new Map<string,any>(),sources=new Set<string>();
 function add(target:any,row:any){target.volume+=Number(row.total)||0;target.delivered+=Number(row.entregues)||0}
 function record(row:any){sources.add(row.source==='imile'?'iMile':'J&T');if(row.source==='jt')total.provisional=true;if(row.updated_at&&(!total.updatedAt||row.updated_at>total.updatedAt))total.updatedAt=row.updated_at}
 for(const day of days.values()){
  let hasUnits=false;
  for(const key of ['maua','maua2','rbp']){
   const jtSource=day.jt_real?.by_unit?.[key]?day.jt_real:day.jt,entries=[jtSource,day.imile].filter(row=>row?.by_unit?.[key]);
   if(!entries.length)continue;hasUnits=true;const unit=units.get(key)||{key,volume:0,delivered:0,days:0,rate:0};unit.days++;
   for(const row of entries){add(unit,row.by_unit[key]);add(total,row.by_unit[key]);record(row)}units.set(key,unit);
  }
  // Older reports without a unit breakdown are available only to administrators.
  if(!hasUnits)for(const row of [day.jt_real||day.jt,day.imile].filter(Boolean)){add(total,row);record(row)}
 }
 total.rate=total.volume?total.delivered/total.volume*100:0;
 total.units=[...units.values()].map(u=>({...u,rate:u.volume?u.delivered/u.volume*100:0}));total.sources=[...sources];return total;
}

export function dailySummary(rows:any[],date:string){return monthlySummary(rows.filter(row=>row.date?.slice(0,10)===date),date.slice(0,7))}
