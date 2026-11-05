import type {UnitScope} from './unit-scope.ts';
export function scopedSlaSource(table:string,scope:UnitScope,param:(value:any)=>string){
 const units=scope.units;
 if(!units.length||units.some(u=>!['maua','maua2','rbp'].includes(u)))throw Error('Unidade não autorizada.');
 // Keep the wire parameter as text; postgres.js otherwise serializes JSON again.
 const keys=param(JSON.stringify(units))+'::text::jsonb';
 const matches=(column:string)=>`${keys} ? ${column}`;
 if(['orders','order_events','operational_orders','v_order_current_intelligence','driver_interventions'].includes(table))return `(SELECT * FROM public."${table}" s WHERE ${matches('s.unit')})`;
 if(table==='sla_days')return `(SELECT d.date,d.source,s.total,s.entregues,s.pendentes,s.problematicos,
   CASE WHEN s.total>0 THEN round(100.0*s.entregues/s.total,1) ELSE 0 END AS sla,
   s.sla_sameday,s.desconsiderados,COALESCE((SELECT jsonb_agg(p) FROM jsonb_each(s.by_unit) u CROSS JOIN LATERAL jsonb_array_elements(COALESCE(u.value->'desconsiderados_pedidos','[]'::jsonb)) p),'[]'::jsonb) AS desconsiderados_pedidos,
   s.by_unit,d.updated_at FROM public.sla_days d CROSS JOIN LATERAL (
    SELECT jsonb_object_agg(u.key,u.value) AS by_unit,
      COALESCE(sum((u.value->>'total')::integer),0)::integer AS total,
      COALESCE(sum((u.value->>'entregues')::integer),0)::integer AS entregues,
      COALESCE(sum((u.value->>'pendentes')::integer),0)::integer AS pendentes,
      COALESCE(sum((u.value->>'problematicos')::integer),0)::integer AS problematicos,
      COALESCE(sum((u.value->>'desconsiderados')::integer),0)::integer AS desconsiderados,
      round(sum((u.value->>'total')::numeric*(u.value->>'sla_sameday')::numeric)/NULLIF(sum((u.value->>'total')::numeric) FILTER(WHERE u.value->>'sla_sameday' IS NOT NULL),0),1) AS sla_sameday
    FROM jsonb_each(COALESCE(d.by_unit,'{}'::jsonb)) u WHERE ${matches('u.key')}
   ) s WHERE s.by_unit IS NOT NULL)`;
 if(table==='sla_drivers')return `(SELECT d.date,d.source,x->>'name' AS driver_name,
   COALESCE((x->>'total')::integer,0) AS total,COALESCE((x->>'delivered')::integer,0) AS delivered,
   COALESCE((x->>'pendentes')::integer,0) AS pendentes,COALESCE((x->>'problems')::integer,0) AS problems,
   CASE WHEN COALESCE((x->>'total')::numeric,0)>0 THEN round(100.0*COALESCE((x->>'delivered')::numeric,0)/(x->>'total')::numeric,1) ELSE 0 END AS sla,
   COALESCE(x->'occurrences','{}'::jsonb) AS occurrences,NULL::uuid AS driver_id,d.updated_at
   FROM public.sla_days d CROSS JOIN LATERAL jsonb_each(COALESCE(d.by_unit,'{}'::jsonb)) u
   CROSS JOIN LATERAL jsonb_array_elements(COALESCE(u.value->'drivers','[]'::jsonb)) x
   WHERE ${matches('u.key')} AND COALESCE(x->>'name','')<>'')`;
 if(table==='tower_snapshots')return `(SELECT s.date,s.stamp,s.created_at,f.drivers FROM public.tower_snapshots s CROSS JOIN LATERAL (
   SELECT jsonb_agg(d) AS drivers FROM jsonb_array_elements(COALESCE(s.drivers,'[]'::jsonb)) d WHERE ${matches("(d->>'unit')")}
   ) f WHERE f.drivers IS NOT NULL)`;
 if(table==='tower_status')return `(SELECT s.date,'{}'::jsonb AS status,s.updated_at FROM public.tower_status s WHERE EXISTS(
   SELECT 1 FROM public.sla_days d CROSS JOIN LATERAL jsonb_each(COALESCE(d.by_unit,'{}'::jsonb)) u WHERE d.date=s.date AND ${matches('u.key')}))`;
 throw Error('Consulta não disponível para este nível de acesso.');
}
