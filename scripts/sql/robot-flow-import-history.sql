create or replace view public.robot_flow_status with (security_invoker = true) as
select f.id,f.system,f.name,f.description,f.schedule_kind,f.schedule,f.enabled,
 r.id as run_id,r.status,r.started_at,r.finished_at,r.message,r.error,r.screenshot_path,r.live_view_url,
 imported.finished_at as last_import_at,
 (imported.started_at at time zone 'America/Sao_Paulo')::date as last_report_date
from public.robot_flows f
left join lateral (select rr.* from public.robot_runs rr where rr.flow_id=f.id order by rr.started_at desc limit 1) r on true
left join lateral (
 select rr.finished_at,rr.started_at from public.robot_runs rr
 where rr.flow_id=f.id and rr.status='completed' and rr.output_path is not null
 and rr.message like '%Dados importados no dashboard.%'
 order by rr.finished_at desc limit 1
) imported on true;
