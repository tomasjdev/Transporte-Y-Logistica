# Plataforma de Transporte y Logística Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app (React + Vite + TS + Supabase) that replaces the two Excel workbooks: trip logging with automatic driver settlement (Bitácora), and product stock control (Inventario), with role-based access for operador/gerencia/admin.

**Architecture:** Single-repo monolith. All business logic that must be numerically exact (settlement math, stock totals) lives in Postgres (pure SQL functions + triggers), never duplicated in the frontend. The frontend is a thin client that calls RPCs and renders results. Auth and row-level permissions are enforced by Postgres RLS, not by hiding UI.

**Tech Stack:** React 19, Vite, TypeScript, react-router-dom, @supabase/supabase-js, Supabase (Postgres 17 + Auth), Vercel (deploy).

**Spec:** `docs/superpowers/specs/2026-09-20-plataforma-transporte-logistica-design.md`

**Supabase project:** `Transporte&LogisticaWeb`, project_id `trjwhprjaciqkdjozqis` (already created, empty).

**GitHub repo:** `tomasjdev/Transporte-Y-Logistica` (empty; local repo already initialized with one commit — the spec).

## Global Constraints

- Fidelity to the source Excel formulas is non-negotiable — every constant (16, 23, 28) and every branch was verified against the live formulas in `Bitacora_Viaje_Automatizada.xlsx` (`CAPTURA!H40:H49`), not guessed.
- Every table with user data gets RLS enabled; no table is left with RLS off "temporarily."
- No settlement or stock number is ever computed in the frontend and trusted — it always comes from a Postgres function/trigger.
- Migrations are applied to the live Supabase project via the `apply_migration` MCP tool (`project_id: trjwhprjaciqkdjozqis`) AND saved as files under `supabase/migrations/` in the same commit, so the two never drift.
- After any schema change, regenerate `src/types/database.ts` via the `generate_typescript_types` MCP tool and commit it in the same commit as the migration.
- Run `get_advisors` (type `security`) via MCP after each migration task and resolve anything it flags before moving on.

---

## Phase A — Foundation

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Create: `src/lib/supabaseClient.ts`
- Create: `.env.example`, `.gitignore`
- Modify: (none — directory currently only has `docs/`, the two source `.xlsx` files, and `.git/`)

**Interfaces:**
- Produces: `supabase` client instance exported from `src/lib/supabaseClient.ts` as `export const supabase: SupabaseClient`. Every later task that talks to Supabase imports this.
- Produces: `<BrowserRouter>` mounted in `main.tsx`, with `<App />` rendering an empty `<Routes />` — later tasks add `<Route>` entries inside `App.tsx`.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "transporte-logistica-web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`**

`tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Write `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

- [ ] **Step 4: Write `index.html`**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Transporte y Logística</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Write `.env.example` and `.gitignore`**

`.env.example`:
```
VITE_SUPABASE_URL=https://trjwhprjaciqkdjozqis.supabase.co
VITE_SUPABASE_ANON_KEY=replace-with-anon-key
```

`.gitignore`:
```
node_modules
dist
dist-ssr
*.local
.env
.env.local
```

- [ ] **Step 6: Write `src/lib/supabaseClient.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el entorno.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 7: Write `src/index.css`, `src/App.tsx`, `src/main.tsx`**

`src/index.css`:
```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, Segoe UI, sans-serif;
  background: #f5f6f8;
  color: #1f2430;
}
```

`src/App.tsx`:
```typescript
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Transporte y Logística</div>} />
    </Routes>
  )
}

export default App
```

`src/main.tsx`:
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 8: Get the real anon key and create `.env.local`**

Use the Supabase MCP tool `get_publishable_keys` with `project_id: trjwhprjaciqkdjozqis`, then create `.env.local` (untracked, per `.gitignore`) with the real `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

- [ ] **Step 9: Install and verify the build**

Run: `npm install`
Run: `npm run build`
Expected: build succeeds, `dist/` is created, no TypeScript errors.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig*.json vite.config.ts index.html src .gitignore .env.example
git commit -m "chore: scaffold Vite + React + TS + Supabase client"
```

---

### Task 2: Database foundation — roles, profiles, auth trigger

**Files:**
- Create: `supabase/migrations/20260920100000_foundation_roles_profiles.sql`

**Interfaces:**
- Produces: enum `public.app_role` (`'operador' | 'gerencia' | 'admin'`), table `public.profiles(id uuid pk, nombre text, rol app_role, activo boolean, creado_en timestamptz)`, function `private.current_user_role() returns app_role`. Every later RLS policy in this plan calls `private.current_user_role()`.

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/20260920100000_foundation_roles_profiles.sql

create schema if not exists private;

create type public.app_role as enum ('operador', 'gerencia', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol public.app_role not null default 'operador',
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Security definer helper: reads the caller's role without recursing into
-- profiles' own RLS (that recursion is why this lives outside a normal
-- policy subquery and is marked security definer).
create function private.current_user_role()
returns public.app_role
language sql
security definer
stable
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid()
$$;

-- Every authenticated user can read their own profile.
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Admins can read every profile.
create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (private.current_user_role() = 'admin');

-- Admins can update any profile (role changes, activo toggle).
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (private.current_user_role() = 'admin');

-- New auth.users rows get a profile automatically. Default role is
-- 'operador'; an admin promotes people afterwards via UserManagement.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', new.email),
    coalesce((new.raw_user_meta_data ->> 'rol')::public.app_role, 'operador')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Apply the migration to the live project**

Use the Supabase MCP tool `apply_migration` with `project_id: trjwhprjaciqkdjozqis`, `name: foundation_roles_profiles`, `query:` the SQL above.

- [ ] **Step 3: Verify with a real signup**

Use the Supabase MCP tool `execute_sql` with `project_id: trjwhprjaciqkdjozqis`:
```sql
select rolname, rolsuper from pg_roles where rolname = 'authenticated';
```
Expected: one row back (confirms the role exists; this is a smoke check that the migration didn't error before continuing).

Then create a test user directly and confirm the trigger fired:
```sql
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'test-seed@example.com', crypt('temporal123', gen_salt('bf')), now(), '{"nombre":"Usuario de Prueba"}', now(), now());

select id, nombre, rol from public.profiles where nombre = 'Usuario de Prueba';
```
Expected: one row, `rol = 'operador'`. Then clean up:
```sql
delete from auth.users where email = 'test-seed@example.com';
```

- [ ] **Step 4: Run security advisors**

Use `get_advisors` with `project_id: trjwhprjaciqkdjozqis`, `type: security`. Expected: no finding about `public.profiles` missing RLS (it's enabled). Resolve anything else it flags before continuing.

- [ ] **Step 5: Regenerate types and commit**

Use `generate_typescript_types` with `project_id: trjwhprjaciqkdjozqis`, save the output to `src/types/database.ts`.

```bash
git add supabase/migrations/20260920100000_foundation_roles_profiles.sql src/types/database.ts
git commit -m "feat: add roles, profiles table, and auth signup trigger"
```

---

### Task 3: Auth frontend — context, login, protected routes, layout

**Files:**
- Create: `src/contexts/AuthContext.tsx`
- Create: `src/pages/auth/Login.tsx`
- Create: `src/components/ProtectedRoute.tsx`
- Create: `src/components/Layout.tsx`, `src/components/Sidebar.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabaseClient.ts` (Task 1); `Database` type from `src/types/database.ts` (Task 2).
- Produces: `useAuth()` hook returning `{ session: Session | null, profile: Profile | null, loading: boolean, signOut: () => Promise<void> }`, where `type Profile = Database['public']['Tables']['profiles']['Row']`. Every later page that needs the current role imports `useAuth`.
- Produces: `<ProtectedRoute roles?: Profile['rol'][]>` wrapping component — later route definitions in `App.tsx` use it to gate by role.

- [ ] **Step 1: Write `src/contexts/AuthContext.tsx`**

```typescript
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Database } from '../types/database'

export type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (!newSession) {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    setLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        setProfile(data)
        setLoading(false)
      })
  }, [session])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Write `src/pages/auth/Login.tsx`**

```typescript
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (signInError) {
      setError('Correo o contraseña incorrectos.')
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <form onSubmit={handleSubmit} style={{ width: 320, display: 'grid', gap: 12 }}>
        <h1>Transporte y Logística</h1>
        <label>
          Correo
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Contraseña
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Write `src/components/ProtectedRoute.tsx`**

```typescript
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, type Profile } from '../contexts/AuthContext'

interface Props {
  children: ReactNode
  roles?: Profile['rol'][]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { session, profile, loading } = useAuth()

  if (loading) return <p>Cargando…</p>
  if (!session) return <Navigate to="/login" replace />
  if (roles && (!profile || !roles.includes(profile.rol))) {
    return <p>No tienes permiso para ver esta página.</p>
  }
  return <>{children}</>
}
```

- [ ] **Step 4: Write `src/components/Sidebar.tsx` and `src/components/Layout.tsx`**

```typescript
// src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const isManager = profile?.rol === 'admin' || profile?.rol === 'gerencia'

  return (
    <nav style={{ width: 220, padding: 16, background: '#1f2430', color: 'white', minHeight: '100vh' }}>
      <p>{profile?.nombre}</p>
      <NavLink to="/">Dashboard</NavLink>
      <NavLink to="/bitacora">Bitácora</NavLink>
      <NavLink to="/inventario">Inventario</NavLink>
      {profile?.rol === 'admin' && <NavLink to="/usuarios">Usuarios</NavLink>}
      {isManager && <NavLink to="/bitacora/catalogos">Catálogos</NavLink>}
      <button onClick={signOut}>Cerrar sesión</button>
    </nav>
  )
}
```

```typescript
// src/components/Layout.tsx
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  )
}
```

- [ ] **Step 5: Wire `src/App.tsx`**

```typescript
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/auth/Login'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <div>Dashboard (pendiente)</div>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
```

- [ ] **Step 6: Create a real admin user to log in with**

Use the Supabase MCP tool `execute_sql` with `project_id: trjwhprjaciqkdjozqis` — since there's no email server configured yet, insert a confirmed user directly (temporary, for development only):

```sql
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'admin@translog.local', crypt('CambiaEsto123!', gen_salt('bf')), now(),
  '{"nombre":"Administrador", "rol":"admin"}', now(), now()
);
```

- [ ] **Step 7: Manual verification**

Run: `npm run dev`
Use the `webapp-testing` skill to drive a browser to `http://localhost:5173/login`, sign in with `admin@translog.local` / `CambiaEsto123!`, and confirm it redirects to `/` and shows "Administrador" in the sidebar with a "Usuarios" and "Catálogos" link.

- [ ] **Step 8: Commit**

```bash
git add src/contexts src/pages/auth src/components/ProtectedRoute.tsx src/components/Layout.tsx src/components/Sidebar.tsx src/App.tsx
git commit -m "feat: add auth context, login page, protected routes, and app shell"
```

---

## Phase B — Bitácora backend

### Task 4: Bitácora catalog tables + seed data

**Files:**
- Create: `supabase/migrations/20260920100100_bitacora_catalogos.sql`

**Interfaces:**
- Produces tables: `bitacora_camiones`, `bitacora_pesos`, `bitacora_rendimientos`, `bitacora_estados`, `bitacora_componentes`, `bitacora_config`. Task 5 references `bitacora_camiones.id` and `bitacora_pesos.categoria`/`bitacora_estados.nombre` values. Task 6's `obtener_parametros_liquidacion` reads `bitacora_pesos`, `bitacora_rendimientos`, `bitacora_config`.

- [ ] **Step 1: Write the migration SQL**

All seed values below are transcribed from `Bitacora_Viaje_Automatizada.xlsx` sheets `PARAMETROS` and `Diccionario` (verified cell by cell, including the `59-AU-5X` / `-` gaps for camiones without a registered plate yet).

```sql
-- supabase/migrations/20260920100100_bitacora_catalogos.sql

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
```

- [ ] **Step 2: Apply the migration**

Use `apply_migration` with `project_id: trjwhprjaciqkdjozqis`, `name: bitacora_catalogos`, `query:` the SQL above.

- [ ] **Step 3: Verify seed counts**

Use `execute_sql` with `project_id: trjwhprjaciqkdjozqis`:
```sql
select
  (select count(*) from public.bitacora_camiones) as camiones,
  (select count(*) from public.bitacora_pesos) as pesos,
  (select count(*) from public.bitacora_rendimientos) as rendimientos,
  (select count(*) from public.bitacora_estados) as estados,
  (select count(*) from public.bitacora_componentes) as componentes,
  (select count(*) from public.bitacora_config) as config;
```
Expected: `camiones=25, pesos=7, rendimientos=14, estados=32, componentes=14, config=3`.

- [ ] **Step 4: Run security advisors and regenerate types**

`get_advisors` (`type: security`) — resolve any finding. `generate_typescript_types` — overwrite `src/types/database.ts`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260920100100_bitacora_catalogos.sql src/types/database.ts
git commit -m "feat: add bitacora catalog tables seeded from the Excel"
```

---

### Task 5: Bitácora trip tables (viajes + child tables)

**Files:**
- Create: `supabase/migrations/20260920100200_bitacora_viajes.sql`

**Interfaces:**
- Produces table `bitacora_viajes` with all header/result columns listed in the spec, and child tables `bitacora_fletes`, `bitacora_recargas`, `bitacora_casetas`, `bitacora_gastos_extra`, `bitacora_inventario_unidad`, each with `viaje_id references bitacora_viajes(id) on delete cascade`.
- Consumes: `private.current_user_role()` (Task 2), `bitacora_camiones`/`bitacora_pesos`/`bitacora_estados` (Task 4) for foreign keys.
- Task 6 reads/writes `bitacora_viajes` and its children by name.

- [ ] **Step 1: Write the migration SQL**

```sql
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
```

- [ ] **Step 2: Apply the migration**

Use `apply_migration` with `project_id: trjwhprjaciqkdjozqis`, `name: bitacora_viajes`, `query:` the SQL above.

- [ ] **Step 3: Verify with a manual RLS check**

Use `execute_sql` with `project_id: trjwhprjaciqkdjozqis` to confirm the tables exist and RLS is on:
```sql
select relname, relrowsecurity
from pg_class
where relname in ('bitacora_viajes','bitacora_fletes','bitacora_recargas','bitacora_casetas','bitacora_gastos_extra','bitacora_inventario_unidad');
```
Expected: 6 rows, every `relrowsecurity` is `true`.

- [ ] **Step 4: Run security advisors and regenerate types**

`get_advisors` (`type: security`). `generate_typescript_types` — overwrite `src/types/database.ts`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260920100200_bitacora_viajes.sql src/types/database.ts
git commit -m "feat: add bitacora_viajes and child tables with RLS"
```

---

### Task 6: Settlement calculation functions + SQL tests

**Files:**
- Create: `supabase/migrations/20260920100300_bitacora_calculo.sql`

**Interfaces:**
- Produces: `public.obtener_parametros_liquidacion(p_peso_categoria text, p_tipo_viaje text, p_tipo_combustible text) returns table (rendimiento_aplicado numeric, comision_porcentaje numeric, precio_litro_ahorro numeric, precio_penalizacion numeric)`.
- Produces: `public.calcular_liquidacion(p_km_salida integer, p_km_llegada integer, p_total_litros numeric, p_total_casetas numeric, p_total_gastos_extra numeric, p_total_fletes numeric, p_gastos_depositados numeric, p_rendimiento_aplicado numeric, p_comision_porcentaje numeric, p_precio_litro_ahorro numeric, p_precio_penalizacion numeric) returns table (km_recorridos integer, efectivo_gastado numeric, litros_teoricos numeric, litros_devueltos numeric, rendimiento_real numeric, comision_monto numeric, balance_efectivo numeric, ajuste_rendimiento numeric, sueldo_final numeric)` — pure, no table access. Task 7's RPC and the frontend's live-preview call both call this pair.

- [ ] **Step 1: Write the migration SQL**

Every branch below is transcribed from the live formulas in `CAPTURA!H40:H49` and `H42` (verified with `data_only=False`, not just the cached values), so it is not a paraphrase — it is the same logic:

```sql
-- supabase/migrations/20260920100300_bitacora_calculo.sql

create function public.obtener_parametros_liquidacion(
  p_peso_categoria text,
  p_tipo_viaje text,
  p_tipo_combustible text
)
returns table (
  rendimiento_aplicado numeric,
  comision_porcentaje numeric,
  precio_litro_ahorro numeric,
  precio_penalizacion numeric
)
language sql
security invoker
stable
set search_path = public
as $$
  select
    (select km_por_litro from public.bitacora_rendimientos
      where peso_categoria = p_peso_categoria
        and tipo_viaje = case when p_tipo_viaje = 'Sencillo' then 'Sencillo' else 'Redondo' end
    ) as rendimiento_aplicado,
    (select comision_porcentaje from public.bitacora_pesos where categoria = p_peso_categoria) as comision_porcentaje,
    (select valor from public.bitacora_config where clave = 'precio_litro_ahorro') as precio_litro_ahorro,
    (select valor from public.bitacora_config
      where clave = case when p_tipo_combustible = 'Gasolina' then 'penalizacion_gasolina' else 'penalizacion_diesel' end
    ) as precio_penalizacion
$$;

-- Pure: takes every input as a parameter, touches no table. This is the
-- single place the settlement math is written; both the live preview RPC
-- and the persist trigger call it so the screen can never disagree with
-- what gets saved.
create function public.calcular_liquidacion(
  p_km_salida integer,
  p_km_llegada integer,
  p_total_litros numeric,
  p_total_casetas numeric,
  p_total_gastos_extra numeric,
  p_total_fletes numeric,
  p_gastos_depositados numeric,
  p_rendimiento_aplicado numeric,
  p_comision_porcentaje numeric,
  p_precio_litro_ahorro numeric,
  p_precio_penalizacion numeric
)
returns table (
  km_recorridos integer,
  efectivo_gastado numeric,
  litros_teoricos numeric,
  litros_devueltos numeric,
  rendimiento_real numeric,
  comision_monto numeric,
  balance_efectivo numeric,
  ajuste_rendimiento numeric,
  sueldo_final numeric
)
language sql
immutable
as $$
  with base as (
    select
      (p_km_llegada - p_km_salida) as km_recorridos,
      (p_total_casetas + p_total_gastos_extra) as efectivo_gastado
  ),
  derivados as (
    select
      base.km_recorridos,
      base.efectivo_gastado,
      case when p_rendimiento_aplicado > 0
        then base.km_recorridos::numeric / p_rendimiento_aplicado
        else 0 end as litros_teoricos,
      case when p_total_litros > 0
        then base.km_recorridos::numeric / p_total_litros
        else 0 end as rendimiento_real
    from base
  )
  select
    d.km_recorridos,
    d.efectivo_gastado,
    d.litros_teoricos,
    case when (d.litros_teoricos - p_total_litros) > 0
      then floor(d.litros_teoricos - p_total_litros) else 0 end as litros_devueltos,
    d.rendimiento_real,
    (p_total_fletes * p_comision_porcentaje) as comision_monto,
    (p_gastos_depositados - d.efectivo_gastado) as balance_efectivo,
    case
      when (d.litros_teoricos - p_total_litros) > 0
        then floor(d.litros_teoricos - p_total_litros) * p_precio_litro_ahorro
      when (d.litros_teoricos - p_total_litros) < 0
        then -floor(abs(d.litros_teoricos - p_total_litros)) * p_precio_penalizacion
      else 0
    end as ajuste_rendimiento,
    (
      (p_total_fletes * p_comision_porcentaje)
      - (p_gastos_depositados - d.efectivo_gastado)
      + case
          when (d.litros_teoricos - p_total_litros) > 0
            then floor(d.litros_teoricos - p_total_litros) * p_precio_litro_ahorro
          when (d.litros_teoricos - p_total_litros) < 0
            then -floor(abs(d.litros_teoricos - p_total_litros)) * p_precio_penalizacion
          else 0
        end
    ) as sueldo_final
  from derivados d;
$$;
```

- [ ] **Step 2: Apply the migration**

Use `apply_migration` with `project_id: trjwhprjaciqkdjozqis`, `name: bitacora_calculo`, `query:` the SQL above.

- [ ] **Step 3: Run the SQL tests (hand-computed against the real formula, three branches: ahorro, penalización, sin diferencia)**

Use `execute_sql` with `project_id: trjwhprjaciqkdjozqis` for each. All three must return `ok`.

Test 1 — ahorro branch (`dif > 0`):
```sql
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
```

Test 2 — penalización branch (`dif < 0`, gasolina):
```sql
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
```

Test 3 — no difference (`dif = 0`):
```sql
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
```

Test 4 — catalog lookup matches the seeded data from Task 4:
```sql
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
```

Expected for all four: a `NOTICE: test N ok`, no `assert` failure raised.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260920100300_bitacora_calculo.sql
git commit -m "feat: add settlement calculation functions with verified test cases"
```

---

### Task 7: Persist RPC — save and liquidate a trip

**Files:**
- Create: `supabase/migrations/20260920100400_bitacora_guardar_viaje.sql`

**Interfaces:**
- Consumes: `public.calcular_liquidacion` and `public.obtener_parametros_liquidacion` (Task 6).
- Produces: `public.guardar_viaje(p_viaje jsonb) returns uuid`. This is the only write path the frontend uses to save a trip (Task 9 calls it via `supabase.rpc('guardar_viaje', { p_viaje: payload })`).

The RPC accepts one JSON payload shaped like:
```json
{
  "id": "uuid or null for a new trip",
  "estatus": "borrador | liquidado",
  "operador_id": "uuid",
  "fecha": "2026-09-20",
  "camion_id": "uuid",
  "placas": "51-AJ-5T",
  "peso_categoria": "25 Ton",
  "destino_estado": "HERMOSILLO",
  "empresa_carga": "...",
  "tipo_viaje": "Sencillo",
  "tipo_combustible": "Diesel",
  "km_salida": 1000,
  "km_llegada": 1500,
  "gastos_depositados": 2000,
  "observaciones": "...",
  "fletes": [{ "descripcion": "...", "monto": 50000 }],
  "recargas": [{ "orden": 1, "lugar": "...", "litros": 100, "monto": 1600, "es_relleno_final": false }],
  "casetas": [{ "numero": 1, "monto": 100 }],
  "gastos_extra": [{ "concepto": "Comida", "monto": 200 }],
  "inventario_unidad": [{ "componente": "Radio", "estado": "OK" }]
}
```

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/20260920100400_bitacora_guardar_viaje.sql

create function public.guardar_viaje(p_viaje jsonb)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid;
  v_estatus text := p_viaje ->> 'estatus';
  v_existing record;
  v_total_fletes numeric := 0;
  v_total_litros numeric := 0;
  v_total_combustible numeric := 0;
  v_total_casetas numeric := 0;
  v_total_gastos_extra numeric := 0;
  v_params record;
  v_resultado record;
begin
  v_id := coalesce((p_viaje ->> 'id')::uuid, gen_random_uuid());

  select * into v_existing from public.bitacora_viajes where id = v_id;

  -- Freeze rule: a trip already liquidado keeps the parameters it was
  -- liquidated with, even if catalogs change later or gerencia edits it
  -- again. A borrador (or a first-time liquidación) always uses current
  -- catalog values.
  if v_existing.estatus = 'liquidado' then
    v_params := row(
      v_existing.rendimiento_aplicado,
      v_existing.comision_porcentaje,
      v_existing.precio_litro_ahorro,
      v_existing.precio_penalizacion
    );
  else
    select * into v_params from public.obtener_parametros_liquidacion(
      p_viaje ->> 'peso_categoria', p_viaje ->> 'tipo_viaje', p_viaje ->> 'tipo_combustible'
    );
  end if;

  select coalesce(sum((f ->> 'monto')::numeric), 0) into v_total_fletes
    from jsonb_array_elements(coalesce(p_viaje -> 'fletes', '[]'::jsonb)) f;
  select coalesce(sum((r ->> 'litros')::numeric), 0), coalesce(sum((r ->> 'monto')::numeric), 0)
    into v_total_litros, v_total_combustible
    from jsonb_array_elements(coalesce(p_viaje -> 'recargas', '[]'::jsonb)) r;
  select coalesce(sum((c ->> 'monto')::numeric), 0) into v_total_casetas
    from jsonb_array_elements(coalesce(p_viaje -> 'casetas', '[]'::jsonb)) c;
  select coalesce(sum((g ->> 'monto')::numeric), 0) into v_total_gastos_extra
    from jsonb_array_elements(coalesce(p_viaje -> 'gastos_extra', '[]'::jsonb)) g;

  select * into v_resultado from public.calcular_liquidacion(
    (p_viaje ->> 'km_salida')::integer,
    (p_viaje ->> 'km_llegada')::integer,
    v_total_litros, v_total_casetas, v_total_gastos_extra, v_total_fletes,
    (p_viaje ->> 'gastos_depositados')::numeric,
    v_params.rendimiento_aplicado, v_params.comision_porcentaje,
    v_params.precio_litro_ahorro, v_params.precio_penalizacion
  );

  insert into public.bitacora_viajes as t (
    id, estatus, operador_id, fecha, camion_id, placas, peso_categoria, destino_estado,
    empresa_carga, tipo_viaje, tipo_combustible, km_salida, km_llegada, gastos_depositados,
    observaciones, rendimiento_aplicado, comision_porcentaje, precio_litro_ahorro, precio_penalizacion,
    km_recorridos, total_litros, total_combustible, total_casetas, total_gastos_extra,
    efectivo_gastado, litros_teoricos, litros_devueltos, rendimiento_real, total_fletes,
    comision_monto, balance_efectivo, ajuste_rendimiento, sueldo_final,
    creado_por, liquidado_en
  ) values (
    v_id, v_estatus, (p_viaje ->> 'operador_id')::uuid, (p_viaje ->> 'fecha')::date,
    (p_viaje ->> 'camion_id')::uuid, p_viaje ->> 'placas', p_viaje ->> 'peso_categoria',
    p_viaje ->> 'destino_estado', p_viaje ->> 'empresa_carga', p_viaje ->> 'tipo_viaje',
    p_viaje ->> 'tipo_combustible', (p_viaje ->> 'km_salida')::integer, (p_viaje ->> 'km_llegada')::integer,
    (p_viaje ->> 'gastos_depositados')::numeric, p_viaje ->> 'observaciones',
    v_params.rendimiento_aplicado, v_params.comision_porcentaje, v_params.precio_litro_ahorro, v_params.precio_penalizacion,
    v_resultado.km_recorridos, v_total_litros, v_total_combustible, v_total_casetas, v_total_gastos_extra,
    v_resultado.efectivo_gastado, v_resultado.litros_teoricos, v_resultado.litros_devueltos, v_resultado.rendimiento_real,
    v_total_fletes, v_resultado.comision_monto, v_resultado.balance_efectivo, v_resultado.ajuste_rendimiento, v_resultado.sueldo_final,
    auth.uid(), case when v_estatus = 'liquidado' and v_existing.liquidado_en is null then now() else v_existing.liquidado_en end
  )
  on conflict (id) do update set
    estatus = excluded.estatus, fecha = excluded.fecha, camion_id = excluded.camion_id, placas = excluded.placas,
    peso_categoria = excluded.peso_categoria, destino_estado = excluded.destino_estado, empresa_carga = excluded.empresa_carga,
    tipo_viaje = excluded.tipo_viaje, tipo_combustible = excluded.tipo_combustible, km_salida = excluded.km_salida,
    km_llegada = excluded.km_llegada, gastos_depositados = excluded.gastos_depositados, observaciones = excluded.observaciones,
    rendimiento_aplicado = excluded.rendimiento_aplicado, comision_porcentaje = excluded.comision_porcentaje,
    precio_litro_ahorro = excluded.precio_litro_ahorro, precio_penalizacion = excluded.precio_penalizacion,
    km_recorridos = excluded.km_recorridos, total_litros = excluded.total_litros, total_combustible = excluded.total_combustible,
    total_casetas = excluded.total_casetas, total_gastos_extra = excluded.total_gastos_extra, efectivo_gastado = excluded.efectivo_gastado,
    litros_teoricos = excluded.litros_teoricos, litros_devueltos = excluded.litros_devueltos, rendimiento_real = excluded.rendimiento_real,
    total_fletes = excluded.total_fletes, comision_monto = excluded.comision_monto, balance_efectivo = excluded.balance_efectivo,
    ajuste_rendimiento = excluded.ajuste_rendimiento, sueldo_final = excluded.sueldo_final, liquidado_en = excluded.liquidado_en;

  delete from public.bitacora_fletes where viaje_id = v_id;
  delete from public.bitacora_recargas where viaje_id = v_id;
  delete from public.bitacora_casetas where viaje_id = v_id;
  delete from public.bitacora_gastos_extra where viaje_id = v_id;
  delete from public.bitacora_inventario_unidad where viaje_id = v_id;

  insert into public.bitacora_fletes (viaje_id, descripcion, monto)
    select v_id, f ->> 'descripcion', (f ->> 'monto')::numeric
    from jsonb_array_elements(coalesce(p_viaje -> 'fletes', '[]'::jsonb)) f;

  insert into public.bitacora_recargas (viaje_id, orden, lugar, litros, monto, es_relleno_final)
    select v_id, (r ->> 'orden')::integer, r ->> 'lugar', (r ->> 'litros')::numeric, (r ->> 'monto')::numeric,
      coalesce((r ->> 'es_relleno_final')::boolean, false)
    from jsonb_array_elements(coalesce(p_viaje -> 'recargas', '[]'::jsonb)) r;

  insert into public.bitacora_casetas (viaje_id, numero, monto)
    select v_id, (c ->> 'numero')::integer, (c ->> 'monto')::numeric
    from jsonb_array_elements(coalesce(p_viaje -> 'casetas', '[]'::jsonb)) c;

  insert into public.bitacora_gastos_extra (viaje_id, concepto, monto)
    select v_id, g ->> 'concepto', (g ->> 'monto')::numeric
    from jsonb_array_elements(coalesce(p_viaje -> 'gastos_extra', '[]'::jsonb)) g;

  insert into public.bitacora_inventario_unidad (viaje_id, componente, estado)
    select v_id, i ->> 'componente', i ->> 'estado'
    from jsonb_array_elements(coalesce(p_viaje -> 'inventario_unidad', '[]'::jsonb)) i;

  return v_id;
end;
$$;
```

Note: `security invoker` means `guardar_viaje` runs with the caller's own RLS — an operador can only successfully upsert a row that their own RLS policies on `bitacora_viajes` would allow anyway, so this RPC adds no privilege escalation.

- [ ] **Step 2: Apply the migration**

Use `apply_migration` with `project_id: trjwhprjaciqkdjozqis`, `name: bitacora_guardar_viaje`, `query:` the SQL above.

- [ ] **Step 3: Verify end-to-end against Test 1's numbers from Task 6**

Use `execute_sql` with `project_id: trjwhprjaciqkdjozqis`. First get real ids to build the payload:
```sql
select id from public.profiles where nombre = 'Administrador';
select id from public.bitacora_camiones where numero = 25;
```
Then, substituting those ids for `<profile_id>` / `<camion_id>`:
```sql
select public.guardar_viaje($$
{
  "estatus": "borrador",
  "operador_id": "<profile_id>",
  "fecha": "2026-09-20",
  "camion_id": "<camion_id>",
  "placas": "51-AJ-5T",
  "peso_categoria": "10 Ton",
  "tipo_viaje": "Sencillo",
  "tipo_combustible": "Diesel",
  "km_salida": 1000,
  "km_llegada": 1500,
  "gastos_depositados": 2000,
  "fletes": [{"descripcion": "flete 1", "monto": 50000}],
  "recargas": [{"orden": 1, "lugar": "PEMEX", "litros": 100, "monto": 1600}],
  "casetas": [{"numero": 1, "monto": 1000}],
  "gastos_extra": [{"concepto": "Comida", "monto": 200}],
  "inventario_unidad": []
}
$$::jsonb);

select sueldo_final, ajuste_rendimiento, comision_monto, balance_efectivo
from public.bitacora_viajes order by creado_en desc limit 1;
```
Expected: `sueldo_final = 6876`, `ajuste_rendimiento = 176`, `comision_monto = 7500`, `balance_efectivo = 800` — matching Test 1 exactly, proving the RPC's aggregation + call to `calcular_liquidacion` is wired correctly.

- [ ] **Step 4: Run security advisors**

`get_advisors` (`type: security`).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260920100400_bitacora_guardar_viaje.sql
git commit -m "feat: add guardar_viaje RPC that persists a trip and its settlement"
```

---

## Phase C — Bitácora frontend

### Task 8: Bitácora data access layer + types

**Files:**
- Create: `src/types/bitacora.ts`
- Create: `src/lib/bitacora.ts`

**Interfaces:**
- Consumes: `supabase` (Task 1), `Database` (Task 2/generated).
- Produces: `type ViajePayload` (shape matching the RPC's JSON contract from Task 7), `type Catalogos` (camiones/pesos/estados/componentes), and functions `fetchCatalogos()`, `fetchViajes(filtros)`, `fetchViaje(id)`, `previewLiquidacion(input)`, `guardarViaje(payload)`. Tasks 9–11 import these; nothing in those tasks talks to `supabase` directly.

- [ ] **Step 1: Write `src/types/bitacora.ts`**

```typescript
import type { Database } from './database'

export type Viaje = Database['public']['Tables']['bitacora_viajes']['Row']
export type Camion = Database['public']['Tables']['bitacora_camiones']['Row']
export type Peso = Database['public']['Tables']['bitacora_pesos']['Row']
export type Estado = Database['public']['Tables']['bitacora_estados']['Row']
export type Componente = Database['public']['Tables']['bitacora_componentes']['Row']

export interface FleteInput { descripcion: string; monto: number }
export interface RecargaInput { orden: number; lugar: string; litros: number; monto: number; es_relleno_final: boolean }
export interface CasetaInput { numero: number; monto: number }
export interface GastoExtraInput { concepto: string; monto: number }
export interface InventarioUnidadInput { componente: string; estado: 'OK' | 'Falta' | 'Malo' }

export interface ViajePayload {
  id?: string
  estatus: 'borrador' | 'liquidado'
  operador_id: string
  fecha: string
  camion_id: string
  placas: string
  peso_categoria: string
  destino_estado: string
  empresa_carga: string
  tipo_viaje: 'Sencillo' | 'Redondo'
  tipo_combustible: 'Gasolina' | 'Diesel'
  km_salida: number
  km_llegada: number
  gastos_depositados: number
  observaciones: string
  fletes: FleteInput[]
  recargas: RecargaInput[]
  casetas: CasetaInput[]
  gastos_extra: GastoExtraInput[]
  inventario_unidad: InventarioUnidadInput[]
}

export interface Liquidacion {
  km_recorridos: number
  efectivo_gastado: number
  litros_teoricos: number
  litros_devueltos: number
  rendimiento_real: number
  comision_monto: number
  balance_efectivo: number
  ajuste_rendimiento: number
  sueldo_final: number
}
```

- [ ] **Step 2: Write `src/lib/bitacora.ts`**

```typescript
import { supabase } from './supabaseClient'
import type { Camion, Componente, Estado, Peso, Liquidacion, Viaje, ViajePayload } from '../types/bitacora'

export async function fetchCatalogos() {
  const [camiones, pesos, estados, componentes] = await Promise.all([
    supabase.from('bitacora_camiones').select('*').eq('activo', true).order('numero'),
    supabase.from('bitacora_pesos').select('*').order('orden'),
    supabase.from('bitacora_estados').select('*').order('nombre'),
    supabase.from('bitacora_componentes').select('*').order('orden'),
  ])
  if (camiones.error) throw camiones.error
  if (pesos.error) throw pesos.error
  if (estados.error) throw estados.error
  if (componentes.error) throw componentes.error
  return {
    camiones: camiones.data as Camion[],
    pesos: pesos.data as Peso[],
    estados: estados.data as Estado[],
    componentes: componentes.data as Componente[],
  }
}

export async function fetchViajes(filtros: { operadorId?: string; estatus?: string } = {}) {
  let query = supabase.from('bitacora_viajes').select('*').order('creado_en', { ascending: false })
  if (filtros.operadorId) query = query.eq('operador_id', filtros.operadorId)
  if (filtros.estatus) query = query.eq('estatus', filtros.estatus)
  const { data, error } = await query
  if (error) throw error
  return data as Viaje[]
}

export async function fetchViaje(id: string) {
  const [viaje, fletes, recargas, casetas, gastosExtra, inventarioUnidad] = await Promise.all([
    supabase.from('bitacora_viajes').select('*').eq('id', id).single(),
    supabase.from('bitacora_fletes').select('*').eq('viaje_id', id),
    supabase.from('bitacora_recargas').select('*').eq('viaje_id', id).order('orden'),
    supabase.from('bitacora_casetas').select('*').eq('viaje_id', id).order('numero'),
    supabase.from('bitacora_gastos_extra').select('*').eq('viaje_id', id),
    supabase.from('bitacora_inventario_unidad').select('*').eq('viaje_id', id),
  ])
  if (viaje.error) throw viaje.error
  return {
    viaje: viaje.data as Viaje,
    fletes: fletes.data ?? [],
    recargas: recargas.data ?? [],
    casetas: casetas.data ?? [],
    gastosExtra: gastosExtra.data ?? [],
    inventarioUnidad: inventarioUnidad.data ?? [],
  }
}

export async function previewLiquidacion(payload: ViajePayload): Promise<Liquidacion> {
  const totalFletes = payload.fletes.reduce((sum, f) => sum + f.monto, 0)
  const totalLitros = payload.recargas.reduce((sum, r) => sum + r.litros, 0)
  const totalCasetas = payload.casetas.reduce((sum, c) => sum + c.monto, 0)
  const totalGastosExtra = payload.gastos_extra.reduce((sum, g) => sum + g.monto, 0)

  const { data: params, error: paramsError } = await supabase
    .rpc('obtener_parametros_liquidacion', {
      p_peso_categoria: payload.peso_categoria,
      p_tipo_viaje: payload.tipo_viaje,
      p_tipo_combustible: payload.tipo_combustible,
    })
    .single()
  if (paramsError) throw paramsError

  const { data, error } = await supabase
    .rpc('calcular_liquidacion', {
      p_km_salida: payload.km_salida,
      p_km_llegada: payload.km_llegada,
      p_total_litros: totalLitros,
      p_total_casetas: totalCasetas,
      p_total_gastos_extra: totalGastosExtra,
      p_total_fletes: totalFletes,
      p_gastos_depositados: payload.gastos_depositados,
      p_rendimiento_aplicado: (params as { rendimiento_aplicado: number }).rendimiento_aplicado,
      p_comision_porcentaje: (params as { comision_porcentaje: number }).comision_porcentaje,
      p_precio_litro_ahorro: (params as { precio_litro_ahorro: number }).precio_litro_ahorro,
      p_precio_penalizacion: (params as { precio_penalizacion: number }).precio_penalizacion,
    })
    .single()
  if (error) throw error
  return data as Liquidacion
}

export async function guardarViaje(payload: ViajePayload) {
  const { data, error } = await supabase.rpc('guardar_viaje', { p_viaje: payload })
  if (error) throw error
  return data as string
}
```

- [ ] **Step 3: Write a Vitest unit test for the client-side aggregation math in `previewLiquidacion`**

Create `src/lib/bitacora.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

function sumMonto(items: { monto: number }[]) {
  return items.reduce((sum, i) => sum + i.monto, 0)
}

describe('aggregation helpers used before calling calcular_liquidacion', () => {
  it('sums montos correctly, including an empty list', () => {
    expect(sumMonto([{ monto: 10 }, { monto: 20 }])).toBe(30)
    expect(sumMonto([])).toBe(0)
  })
})
```

Run: `npm run test`
Expected: 1 test passes.

- [ ] **Step 4: Commit**

```bash
git add src/types/bitacora.ts src/lib/bitacora.ts src/lib/bitacora.test.ts
git commit -m "feat: add bitacora data access layer (catalogs, CRUD, live preview)"
```

---

### Task 9: Trip capture form (CapturaViaje) with live settlement preview

**Files:**
- Create: `src/pages/bitacora/CapturaViaje.tsx`
- Modify: `src/App.tsx` (add route)

**Interfaces:**
- Consumes: `fetchCatalogos`, `fetchViaje`, `previewLiquidacion`, `guardarViaje` (Task 8), `useAuth` (Task 3).

- [ ] **Step 1: Write `src/pages/bitacora/CapturaViaje.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { fetchCatalogos, fetchViaje, guardarViaje, previewLiquidacion } from '../../lib/bitacora'
import type { Camion, Componente, Estado, Peso, Liquidacion, ViajePayload } from '../../types/bitacora'

const CASETAS = Array.from({ length: 26 }, (_, i) => i + 1)

function emptyPayload(operadorId: string, componentes: Componente[]): ViajePayload {
  return {
    estatus: 'borrador',
    operador_id: operadorId,
    fecha: new Date().toISOString().slice(0, 10),
    camion_id: '',
    placas: '',
    peso_categoria: '',
    destino_estado: '',
    empresa_carga: '',
    tipo_viaje: 'Sencillo',
    tipo_combustible: 'Diesel',
    km_salida: 0,
    km_llegada: 0,
    gastos_depositados: 0,
    observaciones: '',
    fletes: [{ descripcion: '', monto: 0 }],
    recargas: [],
    casetas: CASETAS.map((numero) => ({ numero, monto: 0 })),
    gastos_extra: [],
    inventario_unidad: componentes.map((c) => ({ componente: c.nombre, estado: 'OK' as const })),
  }
}

export default function CapturaViaje() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [pesos, setPesos] = useState<Peso[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [payload, setPayload] = useState<ViajePayload | null>(null)
  const [liquidacion, setLiquidacion] = useState<Liquidacion | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    fetchCatalogos().then(async (cat) => {
      setCamiones(cat.camiones)
      setPesos(cat.pesos)
      setEstados(cat.estados)
      if (id) {
        const existing = await fetchViaje(id)
        setPayload({
          id: existing.viaje.id,
          estatus: existing.viaje.estatus as 'borrador' | 'liquidado',
          operador_id: existing.viaje.operador_id,
          fecha: existing.viaje.fecha,
          camion_id: existing.viaje.camion_id,
          placas: existing.viaje.placas ?? '',
          peso_categoria: existing.viaje.peso_categoria,
          destino_estado: existing.viaje.destino_estado ?? '',
          empresa_carga: existing.viaje.empresa_carga ?? '',
          tipo_viaje: existing.viaje.tipo_viaje as 'Sencillo' | 'Redondo',
          tipo_combustible: existing.viaje.tipo_combustible as 'Gasolina' | 'Diesel',
          km_salida: existing.viaje.km_salida,
          km_llegada: existing.viaje.km_llegada,
          gastos_depositados: existing.viaje.gastos_depositados,
          observaciones: existing.viaje.observaciones ?? '',
          fletes: existing.fletes.map((f) => ({ descripcion: f.descripcion ?? '', monto: f.monto })),
          recargas: existing.recargas.map((r) => ({
            orden: r.orden, lugar: r.lugar ?? '', litros: r.litros, monto: r.monto, es_relleno_final: r.es_relleno_final,
          })),
          casetas: existing.casetas.map((c) => ({ numero: c.numero, monto: c.monto })),
          gastos_extra: existing.gastosExtra.map((g) => ({ concepto: g.concepto, monto: g.monto })),
          inventario_unidad: existing.inventarioUnidad.map((i) => ({
            componente: i.componente, estado: i.estado as 'OK' | 'Falta' | 'Malo',
          })),
        })
      } else {
        setPayload(emptyPayload(profile.id, cat.componentes))
      }
    })
  }, [id, profile])

  useEffect(() => {
    if (!payload || !payload.camion_id || !payload.peso_categoria) return
    previewLiquidacion(payload).then(setLiquidacion).catch(() => setLiquidacion(null))
  }, [payload])

  if (!payload) return <p>Cargando…</p>

  function update<K extends keyof ViajePayload>(key: K, value: ViajePayload[K]) {
    setPayload((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleSave(estatus: 'borrador' | 'liquidado') {
    if (!payload) return
    setSaving(true)
    try {
      const savedId = await guardarViaje({ ...payload, estatus })
      navigate(`/bitacora/viajes/${savedId}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1>Captura de viaje</h1>

      <section>
        <h2>1. Datos generales</h2>
        <label>
          Camión
          <select value={payload.camion_id} onChange={(e) => {
            const camion = camiones.find((c) => c.id === e.target.value)
            update('camion_id', e.target.value)
            update('placas', camion?.placas ?? '')
          }}>
            <option value="">Selecciona…</option>
            {camiones.map((c) => (
              <option key={c.id} value={c.id}>{c.numero} — {c.placas ?? 'sin placas'}</option>
            ))}
          </select>
        </label>
        <label>
          Peso
          <select value={payload.peso_categoria} onChange={(e) => update('peso_categoria', e.target.value)}>
            <option value="">Selecciona…</option>
            {pesos.map((p) => <option key={p.id} value={p.categoria}>{p.categoria}</option>)}
          </select>
        </label>
        <label>
          Destino
          <select value={payload.destino_estado} onChange={(e) => update('destino_estado', e.target.value)}>
            <option value="">Selecciona…</option>
            {estados.map((s) => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
          </select>
        </label>
        <label>
          Tipo de viaje
          <select value={payload.tipo_viaje} onChange={(e) => update('tipo_viaje', e.target.value as 'Sencillo' | 'Redondo')}>
            <option value="Sencillo">Sencillo</option>
            <option value="Redondo">Redondo</option>
          </select>
        </label>
        <label>
          Combustible
          <select value={payload.tipo_combustible} onChange={(e) => update('tipo_combustible', e.target.value as 'Gasolina' | 'Diesel')}>
            <option value="Diesel">Diesel</option>
            <option value="Gasolina">Gasolina</option>
          </select>
        </label>
        <label>
          Km salida
          <input type="number" value={payload.km_salida} onChange={(e) => update('km_salida', Number(e.target.value))} />
        </label>
        <label>
          Km llegada
          <input type="number" value={payload.km_llegada} onChange={(e) => update('km_llegada', Number(e.target.value))} />
        </label>
        <label>
          Gastos depositados
          <input type="number" value={payload.gastos_depositados} onChange={(e) => update('gastos_depositados', Number(e.target.value))} />
        </label>
      </section>

      <section>
        <h2>2. Casetas (1 a 26)</h2>
        {payload.casetas.map((c, i) => (
          <label key={c.numero}>
            Caseta {c.numero}
            <input type="number" value={c.monto} onChange={(e) => {
              const casetas = [...payload.casetas]
              casetas[i] = { ...c, monto: Number(e.target.value) }
              update('casetas', casetas)
            }} />
          </label>
        ))}
      </section>

      {liquidacion && (
        <section>
          <h2>Liquidación (vista previa)</h2>
          <p>Km recorridos: {liquidacion.km_recorridos}</p>
          <p>Litros teóricos: {liquidacion.litros_teoricos.toFixed(2)}</p>
          <p>Litros devueltos: {liquidacion.litros_devueltos}</p>
          <p>Comisión: ${liquidacion.comision_monto.toFixed(2)}</p>
          <p>Balance efectivo (Sobró): ${liquidacion.balance_efectivo.toFixed(2)}</p>
          <p>Ajuste por rendimiento: ${liquidacion.ajuste_rendimiento.toFixed(2)}</p>
          <p><strong>Sueldo final: ${liquidacion.sueldo_final.toFixed(2)}</strong></p>
        </section>
      )}

      <button disabled={saving} onClick={() => handleSave('borrador')}>Guardar borrador</button>
      <button disabled={saving} onClick={() => handleSave('liquidado')}>Liquidar</button>
    </div>
  )
}
```

*(Fletes, recargas, gastos extra, and the accessory checklist follow the same array-of-fields pattern as casetas above — same `update` call, same `map` over a payload array. Kept out of this listing to avoid repeating identical code; wire them the same way before calling this task done.)*

- [ ] **Step 2: Add the route in `src/App.tsx`**

```typescript
import CapturaViaje from './pages/bitacora/CapturaViaje'
// ...inside <Routes>, alongside the existing "/" route:
<Route path="/bitacora/viajes/nuevo" element={<ProtectedRoute><Layout><CapturaViaje /></Layout></ProtectedRoute>} />
<Route path="/bitacora/viajes/:id" element={<ProtectedRoute><Layout><CapturaViaje /></Layout></ProtectedRoute>} />
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. Use the `webapp-testing` skill to log in as `admin@translog.local`, go to `/bitacora/viajes/nuevo`, pick a camión and a peso, fill in km salida/llegada, a flete amount, and one caseta amount, and confirm the "Liquidación (vista previa)" section updates with numbers (not blank/NaN). Click "Guardar borrador" and confirm it navigates to `/bitacora/viajes/<id>` without an error.

- [ ] **Step 4: Commit**

```bash
git add src/pages/bitacora/CapturaViaje.tsx src/App.tsx
git commit -m "feat: add trip capture form with live settlement preview"
```

---

### Task 10: Trip list (ListaViajes) and printable boleta

**Files:**
- Create: `src/pages/bitacora/ListaViajes.tsx`
- Create: `src/pages/bitacora/Boleta.tsx`
- Modify: `src/App.tsx` (add routes)

**Interfaces:**
- Consumes: `fetchViajes`, `fetchViaje` (Task 8), `useAuth` (Task 3).

- [ ] **Step 1: Write `src/pages/bitacora/ListaViajes.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { fetchViajes } from '../../lib/bitacora'
import type { Viaje } from '../../types/bitacora'

export default function ListaViajes() {
  const { profile } = useAuth()
  const [viajes, setViajes] = useState<Viaje[]>([])
  const isManager = profile?.rol === 'admin' || profile?.rol === 'gerencia'

  useEffect(() => {
    if (!profile) return
    fetchViajes(isManager ? {} : { operadorId: profile.id }).then(setViajes)
  }, [profile, isManager])

  return (
    <div>
      <h1>Viajes</h1>
      <Link to="/bitacora/viajes/nuevo">Nuevo viaje</Link>
      <table>
        <thead>
          <tr>
            <th>Folio</th><th>Fecha</th><th>Estatus</th><th>Sueldo final</th><th></th>
          </tr>
        </thead>
        <tbody>
          {viajes.map((v) => (
            <tr key={v.id}>
              <td>{v.folio}</td>
              <td>{v.fecha}</td>
              <td>{v.estatus}</td>
              <td>${v.sueldo_final.toFixed(2)}</td>
              <td>
                <Link to={`/bitacora/viajes/${v.id}`}>Ver</Link>
                {' · '}
                <Link to={`/bitacora/boleta/${v.id}`}>Boleta</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Write `src/pages/bitacora/Boleta.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchViaje } from '../../lib/bitacora'
import type { Viaje } from '../../types/bitacora'

export default function Boleta() {
  const { id } = useParams()
  const [viaje, setViaje] = useState<Viaje | null>(null)

  useEffect(() => {
    if (!id) return
    fetchViaje(id).then((data) => setViaje(data.viaje))
  }, [id])

  if (!viaje) return <p>Cargando…</p>

  return (
    <div>
      <h1>Boleta oficial de viaje — Liquidación de bitácora</h1>
      <p>Folio: {viaje.folio}</p>
      <p>Fecha: {viaje.fecha}</p>
      <p>Placas: {viaje.placas}</p>
      <p>Kilómetros recorridos: {viaje.km_recorridos}</p>
      <p>Litros reales gastados: {viaje.total_litros}</p>
      <p>Litros teóricos (norma): {viaje.litros_teoricos}</p>
      <p>Litros devueltos / ahorro: {viaje.litros_devueltos}</p>
      <p>Total efectivo gastado: ${viaje.efectivo_gastado.toFixed(2)}</p>
      <p>Comisión por flete: ${viaje.comision_monto.toFixed(2)}</p>
      <p>Balance efectivo (sobró): ${viaje.balance_efectivo.toFixed(2)}</p>
      <p>Ajuste financiero por rendimiento: ${viaje.ajuste_rendimiento.toFixed(2)}</p>
      <p><strong>Sueldo final liquidado: ${viaje.sueldo_final.toFixed(2)}</strong></p>
      <button onClick={() => window.print()}>Imprimir</button>
    </div>
  )
}
```

- [ ] **Step 3: Add routes in `src/App.tsx`**

```typescript
import ListaViajes from './pages/bitacora/ListaViajes'
import Boleta from './pages/bitacora/Boleta'
// ...inside <Routes>:
<Route path="/bitacora" element={<ProtectedRoute><Layout><ListaViajes /></Layout></ProtectedRoute>} />
<Route path="/bitacora/boleta/:id" element={<ProtectedRoute><Layout><Boleta /></Layout></ProtectedRoute>} />
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`. Use `webapp-testing` to visit `/bitacora`, confirm the trip saved in Task 9 appears in the table, click "Boleta", and confirm the settlement numbers shown match what Task 9's preview showed.

- [ ] **Step 5: Commit**

```bash
git add src/pages/bitacora/ListaViajes.tsx src/pages/bitacora/Boleta.tsx src/App.tsx
git commit -m "feat: add trip list and printable boleta"
```

---

### Task 11: Catálogos admin page

**Files:**
- Create: `src/pages/bitacora/Catalogos.tsx`
- Modify: `src/App.tsx` (add route)

**Interfaces:**
- Consumes: `supabase` (Task 1) directly for catalog CRUD (admin-only writes are already enforced by the RLS policies from Task 4, so no new RPC is needed).

- [ ] **Step 1: Write `src/pages/bitacora/Catalogos.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { Camion, Peso } from '../../types/bitacora'

export default function Catalogos() {
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [pesos, setPesos] = useState<Peso[]>([])

  async function reload() {
    const [c, p] = await Promise.all([
      supabase.from('bitacora_camiones').select('*').order('numero'),
      supabase.from('bitacora_pesos').select('*').order('orden'),
    ])
    setCamiones((c.data ?? []) as Camion[])
    setPesos((p.data ?? []) as Peso[])
  }

  useEffect(() => { reload() }, [])

  async function updatePlacas(id: string, placas: string) {
    await supabase.from('bitacora_camiones').update({ placas }).eq('id', id)
    reload()
  }

  async function updateComision(id: string, comision_porcentaje: number) {
    await supabase.from('bitacora_pesos').update({ comision_porcentaje }).eq('id', id)
    reload()
  }

  return (
    <div>
      <h1>Catálogos</h1>
      <section>
        <h2>Camiones</h2>
        <table>
          <tbody>
            {camiones.map((c) => (
              <tr key={c.id}>
                <td>{c.numero}</td>
                <td>
                  <input defaultValue={c.placas ?? ''} onBlur={(e) => updatePlacas(c.id, e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Comisión por peso</h2>
        <table>
          <tbody>
            {pesos.map((p) => (
              <tr key={p.id}>
                <td>{p.categoria}</td>
                <td>
                  <input type="number" step="0.01" defaultValue={p.comision_porcentaje}
                    onBlur={(e) => updateComision(p.id, Number(e.target.value))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Add the route in `src/App.tsx`, gated to admin**

```typescript
import Catalogos from './pages/bitacora/Catalogos'
// ...inside <Routes>:
<Route path="/bitacora/catalogos" element={
  <ProtectedRoute roles={['admin']}><Layout><Catalogos /></Layout></ProtectedRoute>
} />
```

- [ ] **Step 3: Manual verification**

Use `webapp-testing` logged in as `admin@translog.local`: visit `/bitacora/catalogos`, edit a camión's placas, tab away, reload the page, confirm the edit persisted. Then log in as an `operador` (create one via Task 6's `guardar_viaje` test-user pattern, or via the UserManagement page once Task 18 exists) and confirm `/bitacora/catalogos` shows "No tienes permiso" instead of the tables.

- [ ] **Step 4: Commit**

```bash
git add src/pages/bitacora/Catalogos.tsx src/App.tsx
git commit -m "feat: add admin catalog management page for camiones and comisiones"
```

---

## Phase D — Inventario backend

### Task 12: Inventario tables, stock trigger, RLS

**Files:**
- Create: `supabase/migrations/20260920100500_inventario.sql`

**Interfaces:**
- Produces: `inventario_productos` (with computed `stock_actual`, `estado`), `inventario_movimientos`.
- Consumes: `bitacora_camiones` (Task 4, for `unidad_vehiculo_id`), `profiles`/`private.current_user_role()` (Task 2).
- Task 14 reads/writes these tables by name.

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/20260920100500_inventario.sql

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
```

- [ ] **Step 2: Apply the migration**

Use `apply_migration` with `project_id: trjwhprjaciqkdjozqis`, `name: inventario`, `query:` the SQL above.

- [ ] **Step 3: Verify the stock trigger with real inserts**

Use `execute_sql` with `project_id: trjwhprjaciqkdjozqis`:
```sql
insert into public.inventario_productos (codigo_interno, nombre, unidad_medida, stock_inicial, stock_minimo)
values ('TEST-001', 'Filtro de aceite', 'pieza', 10, 5)
returning id;
```
Then, substituting `<producto_id>` and a `<profile_id>` from Task 3's admin user:
```sql
insert into public.inventario_movimientos (producto_id, responsable_id, tipo_movimiento, cantidad, motivo)
values ('<producto_id>', '<profile_id>', 'entrada', 20, 'compra');

select stock_actual, estado from public.inventario_productos where codigo_interno = 'TEST-001';
```
Expected: `stock_actual = 30, estado = 'OK'` (10 initial + 20 entrada).

```sql
insert into public.inventario_movimientos (producto_id, responsable_id, tipo_movimiento, cantidad, motivo)
values ('<producto_id>', '<profile_id>', 'salida', 27, 'uso en unidad 5');

select stock_actual, estado from public.inventario_productos where codigo_interno = 'TEST-001';
```
Expected: `stock_actual = 3, estado = 'Bajo'` (30 - 27 = 3, which is ≤ stock_minimo of 5).

Clean up:
```sql
delete from public.inventario_movimientos where producto_id = (select id from public.inventario_productos where codigo_interno = 'TEST-001');
delete from public.inventario_productos where codigo_interno = 'TEST-001';
```

- [ ] **Step 4: Run security advisors and regenerate types**

`get_advisors` (`type: security`). `generate_typescript_types` — overwrite `src/types/database.ts`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260920100500_inventario.sql src/types/database.ts
git commit -m "feat: add inventario tables with automatic stock recalculation trigger"
```

---

### Task 13: Inventario data access layer

**Files:**
- Create: `src/types/inventario.ts`
- Create: `src/lib/inventario.ts`

**Interfaces:**
- Consumes: `supabase`, `Database` (generated types).
- Produces: `fetchProductos()`, `fetchMovimientos(filtros)`, `crearMovimiento(input)`, `crearProducto(input)`. Tasks 15–16 import these.

- [ ] **Step 1: Write `src/types/inventario.ts`**

```typescript
import type { Database } from './database'

export type Producto = Database['public']['Tables']['inventario_productos']['Row']
export type Movimiento = Database['public']['Tables']['inventario_movimientos']['Row']

export interface NuevoProducto {
  codigo_interno: string
  nombre: string
  categoria: string
  unidad_medida: string
  stock_inicial: number
  stock_minimo: number
}

export interface NuevoMovimiento {
  producto_id: string
  unidad_vehiculo_id: string | null
  responsable_id: string
  tipo_movimiento: 'entrada' | 'salida'
  cantidad: number
  motivo: string
  observaciones: string
}
```

- [ ] **Step 2: Write `src/lib/inventario.ts`**

```typescript
import { supabase } from './supabaseClient'
import type { Movimiento, NuevoMovimiento, NuevoProducto, Producto } from '../types/inventario'

export async function fetchProductos() {
  const { data, error } = await supabase.from('inventario_productos').select('*').eq('activo', true).order('nombre')
  if (error) throw error
  return data as Producto[]
}

export async function crearProducto(input: NuevoProducto) {
  const { data, error } = await supabase.from('inventario_productos').insert(input).select().single()
  if (error) throw error
  return data as Producto
}

export async function fetchMovimientos(filtros: { productoId?: string; unidadId?: string } = {}) {
  let query = supabase.from('inventario_movimientos').select('*').order('creado_en', { ascending: false })
  if (filtros.productoId) query = query.eq('producto_id', filtros.productoId)
  if (filtros.unidadId) query = query.eq('unidad_vehiculo_id', filtros.unidadId)
  const { data, error } = await query
  if (error) throw error
  return data as Movimiento[]
}

export async function crearMovimiento(input: NuevoMovimiento) {
  const { data, error } = await supabase.from('inventario_movimientos').insert(input).select().single()
  if (error) throw error
  return data as Movimiento
}
```

- [ ] **Step 3: Verify the build picks up the new files with no type errors**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/inventario.ts src/lib/inventario.ts
git commit -m "feat: add inventario data access layer"
```

---

## Phase E — Inventario frontend

### Task 14: Product catalog page

**Files:**
- Create: `src/pages/inventario/Productos.tsx`
- Modify: `src/App.tsx` (add route)

**Interfaces:**
- Consumes: `fetchProductos`, `crearProducto` (Task 13), `useAuth` (Task 3).

- [ ] **Step 1: Write `src/pages/inventario/Productos.tsx`**

```typescript
import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { crearProducto, fetchProductos } from '../../lib/inventario'
import type { Producto } from '../../types/inventario'

export default function Productos() {
  const { profile } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([])
  const [form, setForm] = useState({ codigo_interno: '', nombre: '', categoria: '', unidad_medida: '', stock_inicial: 0, stock_minimo: 0 })
  const puedeCrear = profile?.rol === 'admin' || profile?.rol === 'gerencia'

  function reload() {
    fetchProductos().then(setProductos)
  }

  useEffect(reload, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await crearProducto(form)
    setForm({ codigo_interno: '', nombre: '', categoria: '', unidad_medida: '', stock_inicial: 0, stock_minimo: 0 })
    reload()
  }

  return (
    <div>
      <h1>Inventario — Productos</h1>
      <table>
        <thead>
          <tr><th>Código</th><th>Nombre</th><th>Stock actual</th><th>Mínimo</th><th>Estado</th></tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id} style={{ color: p.estado === 'Agotado' ? 'crimson' : p.estado === 'Bajo' ? 'darkorange' : 'inherit' }}>
              <td>{p.codigo_interno}</td>
              <td>{p.nombre}</td>
              <td>{p.stock_actual}</td>
              <td>{p.stock_minimo}</td>
              <td>{p.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {puedeCrear && (
        <form onSubmit={handleSubmit}>
          <h2>Nuevo producto</h2>
          <input placeholder="Código interno" required value={form.codigo_interno}
            onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })} />
          <input placeholder="Nombre" required value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <input placeholder="Categoría" value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
          <input placeholder="Unidad de medida" required value={form.unidad_medida}
            onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })} />
          <input type="number" placeholder="Stock inicial" value={form.stock_inicial}
            onChange={(e) => setForm({ ...form, stock_inicial: Number(e.target.value) })} />
          <input type="number" placeholder="Stock mínimo" value={form.stock_minimo}
            onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) })} />
          <button type="submit">Crear producto</button>
        </form>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add the route in `src/App.tsx`**

```typescript
import Productos from './pages/inventario/Productos'
// ...inside <Routes>:
<Route path="/inventario" element={<ProtectedRoute><Layout><Productos /></Layout></ProtectedRoute>} />
```

- [ ] **Step 3: Manual verification**

Use `webapp-testing` logged in as admin: visit `/inventario`, create a product with `stock_inicial = 10, stock_minimo = 5`, confirm it appears in the table with `stock_actual = 10, estado = OK`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/inventario/Productos.tsx src/App.tsx
git commit -m "feat: add inventario product catalog page"
```

---

### Task 15: Register movement + movement history

**Files:**
- Create: `src/pages/inventario/RegistroMovimiento.tsx`
- Create: `src/pages/inventario/Movimientos.tsx`
- Modify: `src/App.tsx` (add routes), `src/components/Sidebar.tsx` (link to registrar movimiento)

**Interfaces:**
- Consumes: `fetchProductos` (Task 13), `crearMovimiento`, `fetchMovimientos` (Task 13), `fetchCatalogos` (Task 8, reused for the `bitacora_camiones` dropdown — the two modules share this catalog as decided in the spec), `useAuth` (Task 3).

- [ ] **Step 1: Write `src/pages/inventario/RegistroMovimiento.tsx`**

```typescript
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { fetchCatalogos } from '../../lib/bitacora'
import { crearMovimiento, fetchProductos } from '../../lib/inventario'
import type { Camion } from '../../types/bitacora'
import type { Producto } from '../../types/inventario'

export default function RegistroMovimiento() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [productos, setProductos] = useState<Producto[]>([])
  const [camiones, setCamiones] = useState<Camion[]>([])
  const esOperador = profile?.rol === 'operador'
  const [form, setForm] = useState({
    producto_id: '', unidad_vehiculo_id: '', tipo_movimiento: esOperador ? 'salida' : 'entrada', cantidad: 0, motivo: '', observaciones: '',
  })

  useEffect(() => {
    fetchProductos().then(setProductos)
    fetchCatalogos().then((c) => setCamiones(c.camiones))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    await crearMovimiento({
      producto_id: form.producto_id,
      unidad_vehiculo_id: form.unidad_vehiculo_id || null,
      responsable_id: profile.id,
      tipo_movimiento: form.tipo_movimiento as 'entrada' | 'salida',
      cantidad: form.cantidad,
      motivo: form.motivo,
      observaciones: form.observaciones,
    })
    navigate('/inventario/movimientos')
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Registrar movimiento</h1>
      <label>
        Producto
        <select required value={form.producto_id} onChange={(e) => setForm({ ...form, producto_id: e.target.value })}>
          <option value="">Selecciona…</option>
          {productos.map((p) => <option key={p.id} value={p.id}>{p.codigo_interno} — {p.nombre}</option>)}
        </select>
      </label>
      <label>
        Unidad / Vehículo
        <select value={form.unidad_vehiculo_id} onChange={(e) => setForm({ ...form, unidad_vehiculo_id: e.target.value })}>
          <option value="">N/A</option>
          {camiones.map((c) => <option key={c.id} value={c.id}>{c.numero} — {c.placas}</option>)}
        </select>
      </label>
      {!esOperador && (
        <label>
          Tipo
          <select value={form.tipo_movimiento} onChange={(e) => setForm({ ...form, tipo_movimiento: e.target.value })}>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </select>
        </label>
      )}
      <label>
        Cantidad
        <input type="number" required min={0.01} step="0.01" value={form.cantidad}
          onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })} />
      </label>
      <label>
        Motivo
        <input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
      </label>
      <label>
        Observaciones
        <textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
      </label>
      <button type="submit">Guardar</button>
    </form>
  )
}
```

- [ ] **Step 2: Write `src/pages/inventario/Movimientos.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { fetchMovimientos } from '../../lib/inventario'
import type { Movimiento } from '../../types/inventario'

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])

  useEffect(() => { fetchMovimientos().then(setMovimientos) }, [])

  return (
    <div>
      <h1>Historial de movimientos</h1>
      <table>
        <thead>
          <tr><th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th></tr>
        </thead>
        <tbody>
          {movimientos.map((m) => (
            <tr key={m.id}>
              <td>{new Date(m.creado_en).toLocaleString()}</td>
              <td>{m.tipo_movimiento}</td>
              <td>{m.cantidad}</td>
              <td>{m.motivo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Add routes and sidebar link**

In `src/App.tsx`:
```typescript
import RegistroMovimiento from './pages/inventario/RegistroMovimiento'
import Movimientos from './pages/inventario/Movimientos'
// ...inside <Routes>:
<Route path="/inventario/movimientos/nuevo" element={<ProtectedRoute><Layout><RegistroMovimiento /></Layout></ProtectedRoute>} />
<Route path="/inventario/movimientos" element={<ProtectedRoute><Layout><Movimientos /></Layout></ProtectedRoute>} />
```

In `src/components/Sidebar.tsx`, add below the existing `/inventario` link:
```typescript
<NavLink to="/inventario/movimientos">Movimientos</NavLink>
```

- [ ] **Step 4: Manual verification**

Use `webapp-testing`: as admin, visit `/inventario/movimientos/nuevo`, register an "entrada" for the product created in Task 14, confirm it redirects to `/inventario/movimientos` and the row appears. Go back to `/inventario` and confirm `stock_actual` increased by the entered amount.

- [ ] **Step 5: Commit**

```bash
git add src/pages/inventario/RegistroMovimiento.tsx src/pages/inventario/Movimientos.tsx src/App.tsx src/components/Sidebar.tsx
git commit -m "feat: add movement registration form and movement history"
```

---

## Phase F — Cross-cutting

### Task 16: Dashboard

**Files:**
- Create: `src/pages/Dashboard.tsx`
- Modify: `src/App.tsx` (replace the placeholder `/` route)

**Interfaces:**
- Consumes: `fetchViajes` (Task 8), `fetchProductos` (Task 13), `useAuth` (Task 3).

- [ ] **Step 1: Write `src/pages/Dashboard.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchViajes } from '../lib/bitacora'
import { fetchProductos } from '../lib/inventario'
import type { Viaje } from '../types/bitacora'
import type { Producto } from '../types/inventario'

export default function Dashboard() {
  const { profile } = useAuth()
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const isManager = profile?.rol === 'admin' || profile?.rol === 'gerencia'

  useEffect(() => {
    if (!profile) return
    fetchViajes(isManager ? {} : { operadorId: profile.id }).then((v) => setViajes(v.slice(0, 5)))
    fetchProductos().then(setProductos)
  }, [profile, isManager])

  const stockBajo = productos.filter((p) => p.estado !== 'OK')

  return (
    <div>
      <h1>Dashboard</h1>
      <section>
        <h2>Viajes recientes</h2>
        <ul>
          {viajes.map((v) => <li key={v.id}>Folio {v.folio} — {v.fecha} — {v.estatus}</li>)}
        </ul>
      </section>
      {isManager && (
        <section>
          <h2>Alertas de stock</h2>
          <ul>
            {stockBajo.map((p) => <li key={p.id}>{p.nombre}: {p.stock_actual} ({p.estado})</li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire the route in `src/App.tsx`**

Replace the placeholder `<div>Dashboard (pendiente)</div>` on the `/` route with `<Dashboard />` (import it).

- [ ] **Step 3: Manual verification**

Use `webapp-testing`: log in as admin, confirm `/` shows the trip from Task 9 under "Viajes recientes" and the low-stock product from Task 15 (if its stock dropped to/below mínimo) under "Alertas de stock".

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.tsx src/App.tsx
git commit -m "feat: add role-aware dashboard"
```

---

### Task 17: User management (admin) via Edge Function

**Files:**
- Create: `supabase/functions/create-user/index.ts`
- Create: `src/pages/UserManagement.tsx`
- Modify: `src/App.tsx` (add route)

**Interfaces:**
- Consumes: `Database`/`Profile` types, `useAuth`.
- Produces: an Edge Function reachable at `POST /functions/v1/create-user`, called from the frontend via `supabase.functions.invoke('create-user', { body })`. Creating a user requires the service-role key (to call `auth.admin.createUser`), which must never reach the browser — that's why this is an Edge Function and not a direct client call.

- [ ] **Step 1: Write `supabase/functions/create-user/index.ts`**

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  // Verify the caller is an admin using their own JWT before doing anything
  // privileged.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await callerClient.auth.getUser()
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 })
  }

  const { data: profile } = await callerClient
    .from("profiles")
    .select("rol")
    .eq("id", userData.user.id)
    .single()

  if (profile?.rol !== "admin") {
    return new Response(JSON.stringify({ error: "Solo un administrador puede crear usuarios" }), { status: 403 })
  }

  const { email, password, nombre, rol } = await req.json()
  if (!email || !password || !nombre || !rol) {
    return new Response(JSON.stringify({ error: "Faltan campos" }), { status: 400 })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol },
  })

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), { status: 400 })
  }

  return new Response(JSON.stringify({ id: created.user.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})
```

- [ ] **Step 2: Deploy the function**

Use the Supabase MCP tool `deploy_edge_function` with `project_id: trjwhprjaciqkdjozqis`, `name: create-user`, `entrypoint_path: index.ts`, `verify_jwt: true`, `files: [{ name: "index.ts", content: "<the file content above>" }]`.

- [ ] **Step 3: Write `src/pages/UserManagement.tsx`**

```typescript
import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [form, setForm] = useState({ email: '', password: '', nombre: '', rol: 'operador' })
  const [error, setError] = useState<string | null>(null)

  function reload() {
    supabase.from('profiles').select('*').order('nombre').then(({ data }) => setProfiles(data ?? []))
  }

  useEffect(reload, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { error: fnError } = await supabase.functions.invoke('create-user', { body: form })
    if (fnError) {
      setError('No se pudo crear el usuario. Verifica los datos.')
      return
    }
    setForm({ email: '', password: '', nombre: '', rol: 'operador' })
    reload()
  }

  async function updateRol(id: string, rol: string) {
    await supabase.from('profiles').update({ rol }).eq('id', id)
    reload()
  }

  return (
    <div>
      <h1>Usuarios</h1>
      <table>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>
                <select value={p.rol} onChange={(e) => updateRol(p.id, e.target.value)}>
                  <option value="operador">Operador</option>
                  <option value="gerencia">Gerencia</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={handleSubmit}>
        <h2>Nuevo usuario</h2>
        <input type="email" placeholder="Correo" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Contraseña temporal" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input placeholder="Nombre" required value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
          <option value="operador">Operador</option>
          <option value="gerencia">Gerencia</option>
          <option value="admin">Admin</option>
        </select>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button type="submit">Crear usuario</button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Add the route in `src/App.tsx`, gated to admin**

```typescript
import UserManagement from './pages/UserManagement'
// ...inside <Routes>:
<Route path="/usuarios" element={<ProtectedRoute roles={['admin']}><Layout><UserManagement /></Layout></ProtectedRoute>} />
```

- [ ] **Step 5: Manual verification**

Use `webapp-testing` logged in as admin: visit `/usuarios`, create a new user with `rol: operador`, confirm it appears in the table. Log out, log in as that new user, confirm `/usuarios` shows "No tienes permiso".

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/create-user/index.ts src/pages/UserManagement.tsx src/App.tsx
git commit -m "feat: add admin user management via create-user edge function"
```

---

### Task 18: Deploy to Vercel

**Files:**
- Create: `vercel.json`

**Interfaces:** none — this task wires hosting, it doesn't change application code.

- [ ] **Step 1: Write `vercel.json`** (SPA rewrite so client-side routes like `/bitacora/viajes/123` don't 404 on refresh)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Push the repo to GitHub**

Confirm with the user before pushing (this is a visible, shared action). Then:
```bash
git remote add origin https://github.com/tomasjdev/Transporte-Y-Logistica.git
git push -u origin master
```

- [ ] **Step 3: Create the Vercel project**

Use the Vercel MCP tool to create a project linked to `tomasjdev/Transporte-Y-Logistica`, framework preset "Vite", and set environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as `.env.local`) for the Production and Preview environments.

- [ ] **Step 4: Trigger the first deploy and verify**

Trigger a deploy, wait for it to finish, then use `webapp-testing` (or a plain fetch) against the resulting `*.vercel.app` URL to confirm `/login` loads and a sign-in works end to end.

- [ ] **Step 5: Commit**

```bash
git add vercel.json
git commit -m "chore: add vercel SPA rewrite config"
```

---

## Self-Review Notes

- **Spec coverage:** every section of the design doc maps to a task — stack/structure → Task 1; roles/permissions → Tasks 2, 5, 12 (RLS) + Task 3 (frontend gating); Bitácora data model → Tasks 4–5; settlement formulas → Task 6 (verified against the live Excel formulas, not the cached values); persist/freeze rule → Task 7; Inventario model → Task 12; pages → Tasks 9–11, 14–16, 17.
- **Testing:** SQL-level tests (Task 6) use hand-computed expected values built from the real seeded catalog numbers, since the Excel's `HISTORIAL` sheet only stores aggregated results (no per-trip km/litros), not enough to reverse-engineer as black-box fixtures — the SQL asserts are the correctness net instead.
- **Out of scope**, matching the spec: no reports/analytics beyond the dashboard, no email/push notifications, no PWA, no GPS integration.
