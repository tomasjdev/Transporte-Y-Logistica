-- supabase/migrations/20260921061624_allow_delete_inventario_movimientos.sql
--
-- Products already support "delete" via the existing activo column (grant
-- and RLS for it already exist) — the frontend just soft-deletes by
-- setting activo=false, no schema change needed there.
--
-- Movimientos never had a DELETE policy or grant (they were designed as an
-- append-only audit trail per the source Excel's "NO modificar
-- manualmente"). Adding real delete support now, restricted to
-- gerencia/admin only (operadores must not be able to erase their own
-- movement history), and extending the stock-recalculation trigger to
-- also fire on DELETE so stock_actual/estado stay correct after a
-- movimiento is removed.

create policy "inventario_movimientos_delete_manager"
  on public.inventario_movimientos for delete to authenticated
  using (private.current_user_role() in ('gerencia', 'admin'));

grant delete on public.inventario_movimientos to authenticated;

create or replace function public.recalcular_stock_producto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto_id uuid := coalesce(new.producto_id, old.producto_id);
  v_stock numeric;
  v_minimo numeric;
begin
  select
    p.stock_inicial + coalesce(sum(case when m.tipo_movimiento = 'entrada' then m.cantidad else 0 end), 0)
      - coalesce(sum(case when m.tipo_movimiento = 'salida' then m.cantidad else 0 end), 0),
    p.stock_minimo
  into v_stock, v_minimo
  from public.inventario_productos p
  left join public.inventario_movimientos m on m.producto_id = p.id
  where p.id = v_producto_id
  group by p.stock_inicial, p.stock_minimo;

  update public.inventario_productos
  set
    stock_actual = v_stock,
    estado = case
      when v_stock <= 0 then 'Agotado'
      when v_stock <= v_minimo then 'Bajo'
      else 'OK'
    end
  where id = v_producto_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_recalcular_stock on public.inventario_movimientos;
create trigger trg_recalcular_stock
  after insert or delete on public.inventario_movimientos
  for each row execute function public.recalcular_stock_producto();
