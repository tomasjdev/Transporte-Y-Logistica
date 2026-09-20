-- supabase/migrations/20260920103511_inventario.sql

create table public.inventario_productos (
  id uuid primary key default gen_random_uuid(),
  codigo_interno text not null unique,
  nombre text not null,
  categoria text,
  unidad_medida text not null,
  stock_inicial numeric(12,2) not null default 0,
  stock_minimo numeric(12,2) not null default 0,
  stock_actual numeric(12,2) not null default 0,
  estado text not null default 'OK' check (estado in ('OK', 'Bajo', 'Agotado')),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table public.inventario_movimientos (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.inventario_productos(id),
  unidad_vehiculo_id uuid references public.bitacora_camiones(id),
  responsable_id uuid not null references public.profiles(id),
  tipo_movimiento text not null check (tipo_movimiento in ('entrada', 'salida')),
  cantidad numeric(12,2) not null check (cantidad > 0),
  motivo text,
  observaciones text,
  creado_en timestamptz not null default now()
);

-- Recompute stock_actual/estado on the parent product whenever a movimiento
-- is inserted. Movimientos are never updated or deleted (an audit trail, per
-- "esta hoja se llena automáticamente. NO modificar manualmente" in the
-- source Excel) so insert is the only case that needs to trigger.
create function public.recalcular_stock_producto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
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
  where p.id = new.producto_id
  group by p.stock_inicial, p.stock_minimo;

  update public.inventario_productos
  set
    stock_actual = v_stock,
    estado = case
      when v_stock <= 0 then 'Agotado'
      when v_stock <= v_minimo then 'Bajo'
      else 'OK'
    end
  where id = new.producto_id;

  return new;
end;
$$;

create trigger trg_recalcular_stock
  after insert on public.inventario_movimientos
  for each row execute function public.recalcular_stock_producto();

alter table public.inventario_productos enable row level security;
alter table public.inventario_movimientos enable row level security;

-- Every authenticated user can see the product catalog (they need it to
-- pick a product when registering a movimiento).
create policy "inventario_productos_select" on public.inventario_productos for select to authenticated using (true);

-- Only gerencia/admin manage the product catalog itself.
create policy "inventario_productos_write_manager" on public.inventario_productos for all to authenticated
  using (private.current_user_role() in ('gerencia', 'admin'))
  with check (private.current_user_role() in ('gerencia', 'admin'));

-- Movimientos: everyone sees the full history (it's operational data, not
-- sensitive like a salary); operador can only insert 'salida' rows for
-- themselves, gerencia/admin can insert either type for anyone.
create policy "inventario_movimientos_select" on public.inventario_movimientos for select to authenticated using (true);

create policy "inventario_movimientos_insert_operador"
  on public.inventario_movimientos for insert to authenticated
  with check (
    (private.current_user_role() = 'operador' and tipo_movimiento = 'salida' and responsable_id = auth.uid())
    or private.current_user_role() in ('gerencia', 'admin')
  );

-- This project's Supabase instance revokes default table privileges from
-- authenticated on every new table (see
-- 20260920100600_grant_bitacora_table_privileges.sql for the same issue on
-- Task 5's tables). RLS alone is not enough: without an explicit GRANT,
-- Postgres rejects the query at the privilege check before RLS is ever
-- consulted. Grant the base table privileges that RLS is meant to further
-- restrict.
grant select, insert, update on public.inventario_productos to authenticated;
grant select, insert on public.inventario_movimientos to authenticated;
