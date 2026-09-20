-- supabase/migrations/20260920095518_fix_viajes_insert_own_estatus.sql
--
-- Fixes a role-separation gap in Task 5's bitacora_viajes INSERT policy.
-- The original viajes_insert_own WITH CHECK only verified ownership
-- (operador_id = auth.uid()), never estatus. That let a non-manager
-- operador INSERT a brand-new trip with estatus = 'liquidado' directly
-- (whether via a direct table write or via guardar_viaje, which is
-- security invoker and thus subject to this same policy), self-liquidating
-- their own first-time trip. The project's spec is explicit that an
-- operador may only "crear y editar sus propios viajes mientras estén en
-- borrador" — only gerencia/admin liquidate trips. This must be enforced
-- by RLS itself, not left to the frontend never sending
-- estatus: 'liquidado' from an operador session.
--
-- This mirrors viajes_update_own_borrador_or_manager's existing pattern:
-- operador insert is only allowed while estatus = 'borrador'; gerencia/
-- admin remain unrestricted (they may insert a trip in any status,
-- including inserting it already-liquidado).

drop policy "viajes_insert_own" on public.bitacora_viajes;

create policy "viajes_insert_own"
  on public.bitacora_viajes for insert to authenticated
  with check (
    (operador_id = auth.uid() and estatus = 'borrador')
    or private.current_user_role() in ('gerencia', 'admin')
  );
