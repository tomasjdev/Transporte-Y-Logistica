-- supabase/migrations/20260920113456_fix_inicializar_stock_producto_search_path.sql
--
-- Not explicitly named among the 14 final-review fixes (only its EXECUTE
-- grant was, in Fix 8), but get_advisors still flags
-- inicializar_stock_producto with a mutable search_path — the same class
-- of issue already fixed elsewhere in this review (guardar_viaje,
-- calcular_liquidacion, obtener_parametros_liquidacion). Pinning it here
-- for consistency; trivial and harmless since EXECUTE on this function is
-- already revoked from public/anon/authenticated (Fix 8), so this closes
-- the advisory cleanly rather than leaving it dangling.
create or replace function public.inicializar_stock_producto()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.stock_actual := new.stock_inicial;
  new.estado := case
    when new.stock_inicial <= 0 then 'Agotado'
    when new.stock_inicial <= new.stock_minimo then 'Bajo'
    else 'OK'
  end;
  return new;
end;
$$;
