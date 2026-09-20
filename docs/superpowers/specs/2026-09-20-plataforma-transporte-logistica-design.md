# Plataforma de Transporte y Logística — Diseño

Fecha: 2026-09-20

## Objetivo

Construir una aplicación web desde cero que reemplace dos procesos que hoy
viven en Excel:

- `Bitacora_Viaje_Automatizada.xlsx` — captura de viajes de transporte de
  carga, cálculo automático de la liquidación del operador y boleta impresa.
- `Inventario_Transporte_FINAL.xlsx` — control de inventario de
  productos/refacciones, con entradas y salidas registradas por movimiento.

Es un proyecto nuevo, sin reutilizar código de intentos anteriores. Repo:
`tomasjdev/Transporte-Y-Logistica` (GitHub). Backend: proyecto Supabase
`Transporte&LogisticaWeb` (`trjwhprjaciqkdjozqis`), ya creado y vacío.

El criterio rector para ambos módulos es **fidelidad a los Excel de origen**:
donde haya ambigüedad, mandan las fórmulas y estructura reales de las hojas.

## Stack técnico

- **Frontend**: React 19 + Vite + TypeScript, `react-router-dom` para rutas,
  `@supabase/supabase-js` como cliente.
- **Backend**: Supabase (Postgres + Auth + RLS). La lógica de negocio
  (liquidación de bitácora, stock de inventario) vive en funciones SQL y
  triggers, no en el frontend, para que exista una sola fuente de verdad.
- **Despliegue**: Vercel, conectado al repo de GitHub, auto-deploy en push a
  `main`.

### Estructura de carpetas

```
src/
  pages/
    auth/            (Login)
    bitacora/         (CapturaViaje, ListaViajes, Boleta, Catalogos)
    inventario/       (Productos, RegistroMovimiento, Movimientos)
    Dashboard.tsx
    UserManagement.tsx
  components/         (Layout, Sidebar, ProtectedRoute, etc.)
  contexts/           (AuthContext)
  lib/                (supabaseClient, helpers de cálculo del lado cliente)
  types/               (tipos generados/alineados al esquema)
supabase/
  migrations/
  functions/           (si se necesita alguna Edge Function, p.ej. alta de
                         usuarios con service role)
docs/superpowers/specs/  (este documento y los siguientes)
```

## Roles y permisos

Autenticación por Supabase Auth (email/password). Tabla `profiles` guarda el
`rol` de cada usuario; todas las políticas RLS consultan ese rol — el permiso
real vive en la base de datos, nunca solo en la interfaz.

- **Operador**
  - Bitácora: crea y edita sus propios viajes mientras estén en `borrador`;
    consulta sus viajes ya `liquidado` (sin poder editarlos). No ve viajes de
    otros operadores (revelan sueldos ajenos).
  - Inventario: registra movimientos de **salida** de material para su propia
    unidad. No ve costos ni administra el catálogo de productos.
- **Gerencia**
  - Bitácora: ve, edita y liquida los viajes de todos los operadores. No
    administra catálogos ni precios.
  - Inventario: ve todos los movimientos y existencias, registra entradas y
    salidas, recibe alertas de stock bajo/agotado.
- **Administrador**
  - Todo lo de Gerencia, más: administra catálogos (camiones, pesos,
    rendimientos, estados, componentes, config de precios) y gestiona usuarios
    y sus roles.

## Módulo Bitácora de Viajes

### Reglas de negocio

Fórmulas transcritas de las celdas reales de la hoja `CAPTURA`:

| Resultado | Fórmula |
|---|---|
| Kilómetros recorridos | `km_llegada − km_salida` |
| Total litros / Total combustible $ | suma de litros / montos de las recargas |
| Total casetas | suma de los montos de las 26 casetas |
| Total gastos extra | suma de los montos de gastos extra |
| Efectivo gastado | `total_casetas + total_gastos_extra` (el combustible **no** entra aquí) |
| Rendimiento aplicado | tabla `bitacora_rendimientos`, por categoría de peso y tipo de viaje |
| Litros teóricos | `si rendimiento_aplicado > 0 entonces km_recorridos ÷ rendimiento_aplicado, si no 0` |
| Litros devueltos (ahorro) | `si (teóricos − reales) > 0 entonces floor(teóricos − reales), si no 0` |
| Rendimiento real | `si litros_reales > 0 entonces km_recorridos ÷ litros_reales, si no 0` |
| Comisión | `total_fletes × %comisión_por_peso` |
| Balance efectivo ("Sobró") | `gastos_depositados − efectivo_gastado` |
| Ajuste por rendimiento | ver abajo |
| **Sueldo final** | `comisión − balance_efectivo + ajuste_rendimiento` |

Ajuste por rendimiento, siendo `dif = litros_teóricos − litros_reales`:

- `dif > 0`: `floor(dif) × precio_litro_ahorro` — **suma** al sueldo.
- `dif < 0`: `−floor(abs(dif)) × penalización` — **resta** del sueldo, donde la
  penalización es `23` si `tipo_combustible = 'Gasolina'` y `28` en cualquier
  otro caso (diesel).
- `dif = 0`: `0`.

Notas de fidelidad:

- El tipo de combustible se captura por viaje (Gasolina/Diesel); no se deduce
  del peso.
- El tipo de viaje se compara textualmente: `Sencillo` usa la tabla de
  rendimiento sencillo; cualquier otro valor usa la de redondo.
- `floor` se aplica siempre sobre un valor positivo (en la rama negativa se
  toma el valor absoluto antes), equivalente a truncar.
- Un viaje puede tener varios fletes; la comisión se calcula sobre la suma de
  todos.

### Modelo de datos

**`bitacora_viajes`** (cabecera)

- Identificación: `id`, `folio` (correlativo visible), `estatus` (`borrador` |
  `liquidado`).
- Datos generales: `operador_id` → `profiles`, `fecha`, `camion_id`, `placas`
  (copiada al momento del viaje, no solo referenciada — si la unidad cambia de
  placas después, la bitácora vieja conserva las de ese día), `peso_categoria`,
  `destino_estado`, `empresa_carga`, `tipo_viaje`, `tipo_combustible`,
  `km_salida`, `km_llegada`, `gastos_depositados`, `observaciones`.
- Parámetros congelados al liquidar: `rendimiento_aplicado`,
  `comision_porcentaje`, `precio_litro_ahorro`, `precio_penalizacion`.
- Resultados calculados: `km_recorridos`, `total_litros`, `total_combustible`,
  `total_casetas`, `total_gastos_extra`, `efectivo_gastado`, `litros_teoricos`,
  `litros_devueltos`, `rendimiento_real`, `total_fletes`, `comision_monto`,
  `balance_efectivo`, `ajuste_rendimiento`, `sueldo_final`.
- Auditoría: `creado_por`, `creado_en`, `liquidado_en`.

**Tablas hijas** (todas con `viaje_id`, borrado en cascada):

- `bitacora_fletes` — `descripcion`, `monto`.
- `bitacora_recargas` — `orden`, `lugar`, `litros`, `monto`, `es_relleno_final`.
- `bitacora_casetas` — `numero` (1 a 26), `monto`.
- `bitacora_gastos_extra` — `concepto`, `monto`.
- `bitacora_inventario_unidad` — `componente`, `estado` (`OK` | `Falta` |
  `Malo`) — checklist de accesorios del camión, no confundir con el módulo de
  Inventario de productos.

**Catálogos administrables**

- `bitacora_camiones` — `numero`, `placas`, `activo`. 25 unidades del Excel.
- `bitacora_pesos` — `categoria`, `orden`, `comision_porcentaje`. 7 categorías.
- `bitacora_rendimientos` — `peso_categoria`, `tipo_viaje`, `km_por_litro`. 14
  filas (7 pesos × 2 tipos de viaje; incluye 25 y 30 Ton sencillo en 2.5).
- `bitacora_estados` — `nombre`, `clave`. Los 32 estados de México.
- `bitacora_componentes` — `nombre`, `orden`. Los 14 ítems del checklist.
- `bitacora_config` — `clave`, `valor`, `descripcion`. Contiene
  `precio_litro_ahorro = 16`, `penalizacion_gasolina = 23`,
  `penalizacion_diesel = 28` — editable sin tocar código.

Las migraciones siembran los catálogos con los valores exactos del Excel.

### Cálculo

La liquidación se implementa **una sola vez**, como función SQL pura
(`immutable`, `security invoker`) que recibe los insumos y devuelve los
resultados. No accede a tablas, así que no necesita privilegios especiales.

Se usa en dos momentos:

1. **Vista previa en vivo**: mientras el usuario captura, el frontend la llama
   por RPC con los valores en pantalla, igual que el Excel recalculaba al
   vuelo.
2. **Al guardar**: un trigger recalcula desde las filas reales y persiste los
   resultados en el viaje.

**Congelado de parámetros**: un viaje en `borrador` toma los parámetros
vigentes del catálogo en cada recálculo. Al pasar a `liquidado`, los
parámetros aplicados quedan copiados en el viaje; a partir de ahí el
recálculo usa esa copia. Así, correcciones posteriores a rendimientos o
precios no alteran viajes ya pagados.

## Módulo Inventario de Transporte

Replica el patrón "columnas manuales vs. columnas calculadas" del Excel
`Inventario_Transporte_FINAL.xlsx`.

### Modelo de datos

**`inventario_productos`**

- `id`, `codigo_interno` (único), `nombre`, `categoria`, `unidad_medida`,
  `stock_inicial`, `stock_minimo`, `activo`.
- `stock_actual` y `estado` (`OK` | `Bajo` | `Agotado`) son **calculados**, no
  capturados manualmente: se derivan de `stock_inicial + entradas − salidas`
  y de la comparación contra `stock_minimo` (igual que las columnas grises que
  el Excel marcaba como "NO editar").

**`inventario_movimientos`** (equivale a la hoja `Registros`)

- `id`, `producto_id` → `inventario_productos`, `unidad_vehiculo_id` →
  `bitacora_camiones` (comparte catálogo de unidades con el otro módulo),
  `responsable_id` → `profiles`, `tipo_movimiento` (`entrada` | `salida`),
  `cantidad`, `motivo`, `observaciones`, `creado_en`.

`stock_actual` se recalcula automáticamente vía trigger en cada inserción de
movimiento, para que el stock mostrado nunca se desincronice del real.

## Páginas / UX

- **Login** — email/password.
- **Dashboard** — resumen según rol: operador ve sus viajes recientes y el
  stock que gestiona; gerencia/admin ven totales generales y alertas de stock
  bajo.
- **Bitácora**
  - Captura de viaje: formulario multi-sección (datos generales, checklist de
    unidad, recargas/casetas, gastos extra), con vista previa de liquidación
    en vivo — equivalente al panel `CAPTURA`.
  - Lista de viajes, con filtros por operador/estatus/fecha.
  - Boleta imprimible — equivalente a la hoja `BOLETA`.
  - Catálogos (solo admin): camiones, pesos/rendimientos, estados,
    componentes, config de precios.
- **Inventario**
  - Catálogo de productos con stock actual y alertas de stock bajo/agotado.
  - Registro de movimiento (entrada/salida) — formulario simple, equivalente a
    la hoja `Registros`.
  - Historial de movimientos, con filtros por producto/unidad/fecha.
- **Usuarios** (solo admin) — alta/edición de usuarios y su rol.

## Fuera de alcance (esta primera versión)

- Reportes/analítica avanzada más allá del dashboard básico.
- Notificaciones push o por correo (p. ej. alertas de stock bajo por email).
- App móvil nativa; la web debe ser usable en móvil pero no es una PWA en esta
  fase.
- Integración con GPS/telemetría de las unidades.

## Testing

- Pruebas de las funciones SQL de liquidación (casos con ahorro, con
  penalización, y con diferencia cero) contra los ejemplos reales del
  `HISTORIAL` del Excel, para verificar que el sueldo final calculado coincide.
- Pruebas de RLS: cada rol solo puede ver/editar lo que le corresponde.
- Pruebas del cálculo de `stock_actual` en Inventario ante entradas y salidas
  sucesivas.
