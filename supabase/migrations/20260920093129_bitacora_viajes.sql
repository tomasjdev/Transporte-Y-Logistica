-- supabase/migrations/20260920100200_bitacora_viajes.sql

create table public.bitacora_viajes (
  id uuid primary key default gen_random_uuid(),
  folio serial unique,
  estatus text not null default 'borrador' check (estatus in ('borrador', 'liquidado')),

  operador_id uuid not null references public.profiles(id),
  fecha date not null default current_date,
  camion_id uuid not null references public.bitacora_camiones(id),
  placas text,
  peso_categoria text not null references public.bitacora_pesos(categoria),
  destino_estado text references public.bitacora_estados(nombre),
  empresa_carga text,
  tipo_viaje text not null check (tipo_viaje in ('Sencillo', 'Redondo')),
  tipo_combustible text not null check (tipo_combustible in ('Gasolina', 'Diesel')),
  km_salida integer not null default 0,
  km_llegada integer not null default 0,
  gastos_depositados numeric(12,2) not null default 0,
  observaciones text,

  rendimiento_aplicado numeric(6,2),
  comision_porcentaje numeric(5,4),
  precio_litro_ahorro numeric(10,2),
  precio_penalizacion numeric(10,2),

  km_recorridos integer not null default 0,
  total_litros numeric(12,2) not null default 0,
  total_combustible numeric(12,2) not null default 0,
  total_casetas numeric(12,2) not null default 0,
  total_gastos_extra numeric(12,2) not null default 0,
  efectivo_gastado numeric(12,2) not null default 0,
  litros_teoricos numeric(12,2) not null default 0,
  litros_devueltos numeric(12,2) not null default 0,
  rendimiento_real numeric(12,4) not null default 0,
  total_fletes numeric(12,2) not null default 0,
  comision_monto numeric(12,2) not null default 0,
  balance_efectivo numeric(12,2) not null default 0,
  ajuste_rendimiento numeric(12,2) not null default 0,
  sueldo_final numeric(12,2) not null default 0,

  creado_por uuid not null references public.profiles(id),
  creado_en timestamptz not null default now(),
  liquidado_en timestamptz,

  check (km_llegada >= km_salida)
);

create table public.bitacora_fletes (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references public.bitacora_viajes(id) on delete cascade,
  descripcion text,
  monto numeric(12,2) not null default 0
);

create table public.bitacora_recargas (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references public.bitacora_viajes(id) on delete cascade,
  orden integer not null default 1,
  lugar text,
  litros numeric(10,2) not null default 0,
  monto numeric(12,2) not null default 0,
  es_relleno_final boolean not null default false
);

create table public.bitacora_casetas (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references public.bitacora_viajes(id) on delete cascade,
  numero integer not null check (numero between 1 and 26),
  monto numeric(12,2) not null default 0,
  unique (viaje_id, numero)
);

create table public.bitacora_gastos_extra (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references public.bitacora_viajes(id) on delete cascade,
  concepto text not null,
  monto numeric(12,2) not null default 0
);

create table public.bitacora_inventario_unidad (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references public.bitacora_viajes(id) on delete cascade,
  componente text not null,
  estado text not null default 'OK' check (estado in ('OK', 'Falta', 'Malo'))
);

alter table public.bitacora_viajes enable row level security;
alter table public.bitacora_fletes enable row level security;
alter table public.bitacora_recargas enable row level security;
alter table public.bitacora_casetas enable row level security;
alter table public.bitacora_gastos_extra enable row level security;
alter table public.bitacora_inventario_unidad enable row level security;

-- bitacora_viajes: operador sees/edits own borrador rows and reads own
-- liquidado rows; gerencia/admin see and edit everything.
create policy "viajes_select_own_or_manager"
  on public.bitacora_viajes for select to authenticated
  using (
    operador_id = auth.uid()
    or private.current_user_role() in ('gerencia', 'admin')
  );

create policy "viajes_insert_own"
  on public.bitacora_viajes for insert to authenticated
  with check (
    operador_id = auth.uid()
    or private.current_user_role() in ('gerencia', 'admin')
  );

create policy "viajes_update_own_borrador_or_manager"
  on public.bitacora_viajes for update to authenticated
  using (
    (operador_id = auth.uid() and estatus = 'borrador')
    or private.current_user_role() in ('gerencia', 'admin')
  );

create policy "viajes_delete_manager"
  on public.bitacora_viajes for delete to authenticated
  using (private.current_user_role() in ('gerencia', 'admin'));

-- Child tables: visibility follows the parent viaje. Direct writes to child
-- tables are restricted to the same rule as updating the parent, since the
-- settlement RPC (Task 6) is the normal write path and runs as the caller.
create policy "fletes_all_follows_viaje" on public.bitacora_fletes for all to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and (v.operador_id = auth.uid() or private.current_user_role() in ('gerencia','admin'))
  ))
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "recargas_all_follows_viaje" on public.bitacora_recargas for all to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and (v.operador_id = auth.uid() or private.current_user_role() in ('gerencia','admin'))
  ))
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "casetas_all_follows_viaje" on public.bitacora_casetas for all to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and (v.operador_id = auth.uid() or private.current_user_role() in ('gerencia','admin'))
  ))
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "gastos_extra_all_follows_viaje" on public.bitacora_gastos_extra for all to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and (v.operador_id = auth.uid() or private.current_user_role() in ('gerencia','admin'))
  ))
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "inventario_unidad_all_follows_viaje" on public.bitacora_inventario_unidad for all to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and (v.operador_id = auth.uid() or private.current_user_role() in ('gerencia','admin'))
  ))
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));
