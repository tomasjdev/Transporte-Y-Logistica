-- supabase/tests/calcular_liquidacion.test.sql
--
-- Task 6's four `assert`-based SQL test blocks for
-- public.calcular_liquidacion / public.obtener_parametros_liquidacion
-- (see supabase/migrations/20260920093954_bitacora_calculo.sql), committed
-- here (final whole-branch review Fix 6) so they are not lost to history —
-- they previously existed only as one-off `execute_sql` calls recorded in
-- .superpowers/sdd/2026-09-20-plataforma-transporte-logistica/task-6-brief.md
-- and task-6-report.md, never as a file in the repo.
--
-- These are meant to be run MANUALLY, one `do $$ ... end $$;` block at a
-- time, via `mcp__claude_ai_Supabase__execute_sql` against the project
-- (or `psql`/the Supabase CLI against a local/linked database). There is
-- no automated CI/pgTAP runner wired up yet for this project — that would
-- be a good follow-up, but is out of scope here. Each block raises a
-- Postgres exception (via `assert`) on the first failing expectation and
-- otherwise emits `NOTICE: test N ok`; "no error" is the pass signal.

-- Test 1 — ahorro branch (dif > 0)
do $$
declare r record;
begin
  select * into r from public.calcular_liquidacion(
    1000, 1500, 100, 1000, 200, 50000, 2000, 4.5, 0.15, 16, 28
  );
  assert r.km_recorridos = 500, 'km_recorridos';
  assert r.litros_teoricos = 500.0/4.5, 'litros_teoricos';
  assert r.litros_devueltos = 11, 'litros_devueltos';
  assert r.efectivo_gastado = 1200, 'efectivo_gastado';
  assert r.balance_efectivo = 800, 'balance_efectivo';
  assert r.comision_monto = 7500, 'comision_monto';
  assert r.ajuste_rendimiento = 176, 'ajuste_rendimiento';
  assert r.sueldo_final = 6876, 'sueldo_final';
  raise notice 'test 1 ok';
end $$;

-- Test 2 — penalizacion branch (dif < 0, gasolina)
do $$
declare r record;
begin
  select * into r from public.calcular_liquidacion(
    0, 600, 140, 500, 0, 30000, 1000, 5.0, 0.16, 16, 23
  );
  assert r.km_recorridos = 600, 'km_recorridos';
  assert r.litros_teoricos = 120, 'litros_teoricos';
  assert r.litros_devueltos = 0, 'litros_devueltos';
  assert r.efectivo_gastado = 500, 'efectivo_gastado';
  assert r.balance_efectivo = 500, 'balance_efectivo';
  assert r.comision_monto = 4800, 'comision_monto';
  assert r.ajuste_rendimiento = -460, 'ajuste_rendimiento';
  assert r.sueldo_final = 3840, 'sueldo_final';
  raise notice 'test 2 ok';
end $$;

-- Test 3 — no difference (dif = 0)
do $$
declare r record;
begin
  select * into r from public.calcular_liquidacion(
    0, 100, 10, 50, 10, 2000, 100, 10.0, 0.18, 16, 23
  );
  assert r.km_recorridos = 100, 'km_recorridos';
  assert r.litros_teoricos = 10, 'litros_teoricos';
  assert r.litros_devueltos = 0, 'litros_devueltos';
  assert r.ajuste_rendimiento = 0, 'ajuste_rendimiento';
  assert r.efectivo_gastado = 60, 'efectivo_gastado';
  assert r.balance_efectivo = 40, 'balance_efectivo';
  assert r.comision_monto = 360, 'comision_monto';
  assert r.sueldo_final = 320, 'sueldo_final';
  raise notice 'test 3 ok';
end $$;

-- Test 4 — catalog lookup matches the seeded data from Task 4
do $$
declare r record;
begin
  select * into r from public.obtener_parametros_liquidacion('10 Ton', 'Sencillo', 'Diesel');
  assert r.rendimiento_aplicado = 4.5, 'rendimiento_aplicado';
  assert r.comision_porcentaje = 0.15, 'comision_porcentaje';
  assert r.precio_litro_ahorro = 16, 'precio_litro_ahorro';
  assert r.precio_penalizacion = 28, 'precio_penalizacion';
  raise notice 'test 4 ok';
end $$;
