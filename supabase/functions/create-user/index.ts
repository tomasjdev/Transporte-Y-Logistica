import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
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
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const { data: profile } = await callerClient
    .from("profiles")
    .select("rol")
    .eq("id", userData.user.id)
    .single()

  if (profile?.rol !== "admin") {
    return new Response(JSON.stringify({ error: "Solo un administrador puede crear usuarios" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const { email, password, nombre, rol } = await req.json()
  if (!email || !password || !nombre || !rol) {
    return new Response(JSON.stringify({ error: "Faltan campos" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol },
  })

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  // handle_new_user() always inserts the new profile with rol = 'operador'
  // (it never trusts client-supplied metadata — see
  // 20260920112458_fix_open_signup_privilege_escalation.sql). Explicitly
  // set the intended role here, using the already-instantiated
  // service-role client, now that the user (and its trigger-created
  // profile row) exists.
  const { error: roleError } = await adminClient.from("profiles").update({ rol }).eq("id", created.user.id)
  if (roleError) {
    return new Response(JSON.stringify({ error: roleError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify({ id: created.user.id }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
