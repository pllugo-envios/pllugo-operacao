-- Corrige apenas definições e tarefas abertas. Não altera respostas, fotos, responsáveis ou conclusões.
with candidates as (
 select r.id,r.kind,r.body::jsonb doc,r.updated,
  (select jsonb_agg(label order by first_position) from (
   select btrim(a.item->>'title') label,min(a.position) first_position
   from jsonb_array_elements(coalesce(r.body::jsonb->'activities','[]')) with ordinality a(item,position)
   where btrim(a.item->>'title') ~* '^(Quantidade|Total)\y'
    and not exists(select 1 from jsonb_array_elements_text(coalesce(r.body::jsonb->'fields','[]'))f where lower(btrim(f))=lower(btrim(a.item->>'title')))
   group by btrim(a.item->>'title')
  )missing) additions
 from operacao.records r
 where r.kind in ('template','task') and coalesce((r.body::jsonb->>'deleted')::boolean,false)=false
  and (r.kind='template' or r.body::jsonb->>'status'<>'done')
),stamp as(select to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') value)
update operacao.records r set body=(c.doc||jsonb_build_object('fields',coalesce(c.doc->'fields','[]')||c.additions,'updated',s.value)
 ||case when r.kind='task' then jsonb_build_object('history',coalesce(c.doc->'history','[]')||jsonb_build_array(jsonb_build_object('at',s.value,'actor','Sistema','action','Habilitou campos de quantidade da atividade'))) else '{}'::jsonb end)::text,updated=s.value
from candidates c cross join stamp s
where r.id=c.id and r.updated=c.updated and c.additions is not null
returning r.id,r.kind,r.body::jsonb->'fields' fields;
