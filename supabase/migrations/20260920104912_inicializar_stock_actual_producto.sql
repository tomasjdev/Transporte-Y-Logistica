-- supabase/migrations/20260920104912_inicializar_stock_actual_producto.sql
--
-- A newly created product had no movimientos yet, so trg_recalcular_stock
-- (which fires on inventario_movimientos insert) never ran for it, leaving
-- stock_actual at its column default of 0 instead of stock_inicial. This
-- trigger mirrors recalcular_stock_producto()'s estado logic, but runs
-- BEFORE INSERT on inventario_productos itself so a fresh product's
-- stock_actual/estado are correct from creation, before any movimiento.
-- Discovered via Task 14 browser verification: a product created with
-- stock_inicial=10 displayed stock_actual=0 until its first movimiento.
create function public.inicializar_stock_producto()
returns trigger
language plpgsql
security invoker
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

create trigger trg_inicializar_stock
  before insert on public.inventario_productos
  for each row execute function public.inicializar_stock_producto();
