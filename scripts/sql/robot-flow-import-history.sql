create or replace view public.robot_flow_status with (security_invoker = true) as
select f.id,f.system,f.name,f.description,f.schedule_kind,f.schedule,f.enabled,
 r.id as run_id,r.status,r.started_at,r.finished_at,r.message,r.error,r.screenshot_path,r.live_view_url,
 imported.finished_at as last_import_at, batch.report_date as last_report_date
from public.robot_flows f
left join lateral (select rr.* from public.robot_runs rr where rr.flow_id=f.id order by rr.started_at desc limit 1) r on true
left join lateral (
 select rr.finished_at,rr.output_path from public.robot_runs rr
 where rr.flow_id=f.id and rr.status='completed' and rr.output_path is not null
 and rr.message like '%Dados importados no dashboard.%'
 order by rr.finished_at desc limit 1
) imported on true
left join lateral (
 select b.report_date from public.import_batches b where b.status='success'
 and (b.filename=regexp_replace(imported.output_path,'^.*/','') or b.imported_at<=imported.finished_at)
 and b.filename like case f.id
 when 'imile-ofd-maua' then 'ofd-imile-maua-%'
 when 'imile-ofd-rbp' then 'ofd-imile-rbp-%' when 'imile-ofd-maua2' then 'ofd-imile-maua2-%'
 when 'jms-sla-motorista' then 'sla-motorista-maua-%'
 when 'jms-sla-motorista-rbp' then 'sla-motorista-rbp-%'
 else null end
 order by (b.filename=regexp_replace(imported.output_path,'^.*/','')) desc,b.imported_at desc limit 1
) batch on true;
