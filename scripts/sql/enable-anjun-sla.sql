-- Additive channel registration only: no data, policies or keys are changed.
SET LOCAL lock_timeout = '3s';
ALTER TABLE public.sla_days DROP CONSTRAINT sla_days_source_check;
ALTER TABLE public.sla_days ADD CONSTRAINT sla_days_source_check
  CHECK (source IN ('jt','imile','jt_real','anjun')) NOT VALID;
ALTER TABLE public.sla_days VALIDATE CONSTRAINT sla_days_source_check;
ALTER TABLE public.sla_drivers DROP CONSTRAINT sla_drivers_source_check;
ALTER TABLE public.sla_drivers ADD CONSTRAINT sla_drivers_source_check
  CHECK (source IN ('jt','imile','jt_real','anjun')) NOT VALID;
ALTER TABLE public.sla_drivers VALIDATE CONSTRAINT sla_drivers_source_check;
