-- supabase/migrations/20260920092739_bitacora_catalogos.sql

create table public.bitacora_camiones (
  id uuid primary key default gen_random_uuid(),
  numero integer not null unique,
  placas text,
  activo boolean not null default true
);

create table public.bitacora_pesos (
  id uuid primary key default gen_random_uuid(),
  categoria text not null unique,
  orden integer not null unique,
  comision_porcentaje numeric(5,4) not null
);

create table public.bitacora_rendimientos (
  id uuid primary key default gen_random_uuid(),
  peso_categoria text not null references public.bitacora_pesos(categoria),
  tipo_viaje text not null check (tipo_viaje in ('Sencillo', 'Redondo')),
  km_por_litro numeric(6,2) not null,
  unique (peso_categoria, tipo_viaje)
);

create table public.bitacora_estados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  clave text not null unique
);

create table public.bitacora_componentes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden integer not null unique
);

create table public.bitacora_config (
  clave text primary key,
  valor numeric not null,
  descripcion text
);

alter table public.bitacora_camiones enable row level security;
alter table public.bitacora_pesos enable row level security;
alter table public.bitacora_rendimientos enable row level security;
alter table public.bitacora_estados enable row level security;
alter table public.bitacora_componentes enable row level security;
alter table public.bitacora_config enable row level security;

-- Every authenticated user can read the catalogs (needed to fill the trip form).
create policy "bitacora_camiones_select" on public.bitacora_camiones for select to authenticated using (true);
create policy "bitacora_pesos_select" on public.bitacora_pesos for select to authenticated using (true);
create policy "bitacora_rendimientos_select" on public.bitacora_rendimientos for select to authenticated using (true);
create policy "bitacora_estados_select" on public.bitacora_estados for select to authenticated using (true);
create policy "bitacora_componentes_select" on public.bitacora_componentes for select to authenticated using (true);
create policy "bitacora_config_select" on public.bitacora_config for select to authenticated using (true);

-- Only admin writes catalogs.
create policy "bitacora_camiones_write_admin" on public.bitacora_camiones for all to authenticated
  using (private.current_user_role() = 'admin') with check (private.current_user_role() = 'admin');
create policy "bitacora_pesos_write_admin" on public.bitacora_pesos for all to authenticated
  using (private.current_user_role() = 'admin') with check (private.current_user_role() = 'admin');
create policy "bitacora_rendimientos_write_admin" on public.bitacora_rendimientos for all to authenticated
  using (private.current_user_role() = 'admin') with check (private.current_user_role() = 'admin');
create policy "bitacora_estados_write_admin" on public.bitacora_estados for all to authenticated
  using (private.current_user_role() = 'admin') with check (private.current_user_role() = 'admin');
create policy "bitacora_componentes_write_admin" on public.bitacora_componentes for all to authenticated
  using (private.current_user_role() = 'admin') with check (private.current_user_role() = 'admin');
create policy "bitacora_config_write_admin" on public.bitacora_config for all to authenticated
  using (private.current_user_role() = 'admin') with check (private.current_user_role() = 'admin');

-- Seed: 25 camiones (PARAMETROS!B15:C39).
insert into public.bitacora_camiones (numero, placas) values
  (1, '59-AU-5X'), (2, null), (3, 'JX-88-230'), (4, '63-AU-4X'), (5, '13-BD-9V'),
  (6, '51-AZ-5A'), (7, null), (8, '86-BK-2H'), (9, 'JC-9925-B'), (10, null),
  (11, 'HW-9300-A'), (12, '56-BK-2T'), (13, null), (14, null), (15, '08-AS-5W'),
  (16, '03-AU-2P'), (17, '69-AU-5R'), (18, '51-3E-A7'), (19, '93-BC-5R'), (20, '66-AP-1Z'),
  (21, '29-BD-5V'), (22, '70-BL-6W'), (23, '47-BL-4X'), (24, '61-BH-1L'), (25, '51-AJ-5T');

-- Seed: 7 categorías de peso + comisión (PARAMETROS!H5:I11).
insert into public.bitacora_pesos (categoria, orden, comision_porcentaje) values
  ('1 Ton', 1, 0.18), ('3 Ton', 2, 0.16), ('5 Ton', 3, 0.16), ('10 Ton', 4, 0.15),
  ('25 Ton', 5, 0.15), ('30 Ton', 6, 0.15), ('Más de 30 Ton', 7, 0.15);

-- Seed: rendimientos sencillo (PARAMETROS!B5:C11) y redondo (PARAMETROS!E5:F11).
insert into public.bitacora_rendimientos (peso_categoria, tipo_viaje, km_por_litro) values
  ('1 Ton', 'Sencillo', 10.0), ('3 Ton', 'Sencillo', 5.3), ('5 Ton', 'Sencillo', 5.0),
  ('10 Ton', 'Sencillo', 4.5), ('25 Ton', 'Sencillo', 2.5), ('30 Ton', 'Sencillo', 2.5),
  ('Más de 30 Ton', 'Sencillo', 2.2),
  ('1 Ton', 'Redondo', 10.0), ('3 Ton', 'Redondo', 5.0), ('5 Ton', 'Redondo', 5.0),
  ('10 Ton', 'Redondo', 4.0), ('25 Ton', 'Redondo', 2.5), ('30 Ton', 'Redondo', 2.5),
  ('Más de 30 Ton', 'Redondo', 2.2);

-- Seed: 32 estados (Diccionario!A2:B33).
insert into public.bitacora_estados (nombre, clave) values
  ('Aguascalientes','AGS'), ('Baja California','BC'), ('Baja California Sur','BCS'),
  ('Campeche','CAMP'), ('Chiapas','CHIS'), ('Chihuahua','CHIH'), ('Ciudad de México','CDMX'),
  ('Coahuila','COAH'), ('Colima','COL'), ('Durango','DGO'), ('Estado de México','MEX'),
  ('Guanajuato','GTO'), ('Guerrero','GRO'), ('Hidalgo','HGO'), ('Jalisco','JAL'),
  ('Michoacán','MICH'), ('Morelos','MOR'), ('Nayarit','NAY'), ('Nuevo León','NL'),
  ('Oaxaca','OAX'), ('Puebla','PUE'), ('Querétaro','QRO'), ('Quintana Roo','QROO'),
  ('San Luis Potosí','SLP'), ('Sinaloa','SIN'), ('Sonora','SON'), ('Tabasco','TAB'),
  ('Tamaulipas','TAMPS'), ('Tlaxcala','TLAX'), ('Veracruz','VER'), ('Yucatán','YUC'),
  ('Zacatecas','ZAC');

-- Seed: 14 componentes del checklist (CAPTURA!B13:B19 y E13:E19).
insert into public.bitacora_componentes (nombre, orden) values
  ('Tapón de gas', 1), ('Extinguidor', 2), ('Radio', 3), ('Herramienta', 4), ('Lona', 5),
  ('Llanta de refacción', 6), ('Verificación', 7), ('Calcomanías', 8), ('Redilas', 9),
  ('Fajas', 10), ('Sogas', 11), ('Tarjeta de circulación', 12), ('Varillas', 13),
  ('Carta porte', 14);

-- Seed: constantes de la fórmula (CAPTURA!H48: 16, 23, 28).
insert into public.bitacora_config (clave, valor, descripcion) values
  ('precio_litro_ahorro', 16, 'Pago por litro ahorrado (rendimiento real mejor al teórico)'),
  ('penalizacion_gasolina', 23, 'Descuento por litro de más consumido, unidades de gasolina'),
  ('penalizacion_diesel', 28, 'Descuento por litro de más consumido, unidades de diesel');
