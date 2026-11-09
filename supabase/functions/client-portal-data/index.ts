// Edge Function: client-portal-data
// API única do portal. Auth = token do cliente na query string (?token=...).
// O front público NUNCA fala direto com as tabelas — tudo passa por aqui.
//
// Deploy: supabase functions deploy client-portal-data --no-verify-jwt
// (--no-verify-jwt porque a auth é o token do cliente, não um JWT do Supabase)

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const action = url.searchParams.get("action");
  if (!token) return json({ error: "missing token" }, 401);
  if (!action) return json({ error: "missing action" }, 400);

  const db = createClient(SUPABASE_URL, SERVICE_ROLE);

  // valida o token -> cliente
  const { data: client, error: cErr } = await db
    .from("clients")
    .select("id, agency_id, nome, avatar_url")
    .eq("portal_token", token)
    .single();
  if (cErr || !client) return json({ error: "invalid token" }, 403);

  try {
    switch (action) {
      // ── leitura ──────────────────────────────────────────────
      case "get-client":
        return json({ client });

      case "get-workspace-branding": {
        const { data } = await db
          .from("agencies")
          .select("nome, logo_url, cor_primaria")
          .eq("id", client.agency_id)
          .single();
        return json({ branding: data });
      }

      case "get-contents": {
        const monthStart = url.searchParams.get("monthStart");
        const monthEnd = url.searchParams.get("monthEnd");
        const includeDrafts = url.searchParams.get("include_drafts") === "true";
        let q = db
          .from("contents")
          .select("id, tema, status, formato, canal, data_agendada, media_id, capa_url")
          .eq("client_id", client.id)
          .order("data_agendada", { ascending: true });
        if (!includeDrafts) q = q.neq("status", "rascunho");
        if (monthStart) q = q.gte("data_agendada", monthStart);
        if (monthEnd) q = q.lte("data_agendada", monthEnd);
        const { data } = await q;
        return json({ contents: data ?? [] });
      }

      case "get-content-details": {
        const id = url.searchParams.get("contentId");
        const { data } = await db
          .from("contents")
          .select("*")
          .eq("id", id)
          .eq("client_id", client.id)
          .single();
        return json({ content: data });
      }

      case "get-conversations": {
        const id = url.searchParams.get("contentId");
        const { data } = await db
          .from("conversations")
          .select("*")
          .eq("content_id", id)
          .order("created_at", { ascending: true });
        return json({ conversations: data ?? [] });
      }

      case "get-feed-previews": {
        const { data } = await db
          .from("contents")
          .select("id, capa_url, status, data_agendada")
          .eq("client_id", client.id)
          .eq("formato", "reels")
          .order("data_agendada", { ascending: false });
        return json({ previews: data ?? [] });
      }

      // ── escrita (cliente só aprova ou pede ajuste) ───────────
      case "set-content-status": {
        if (req.method !== "POST") return json({ error: "use POST" }, 405);
        const { contentId, status } = await req.json();
        if (!["ajuste", "aprovado"].includes(status))
          return json({ error: "cliente só pode: ajuste | aprovado" }, 400);
        const { data, error } = await db
          .from("contents")
          .update({ status })
          .eq("id", contentId)
          .eq("client_id", client.id)
          .select()
          .single();
        if (error) return json({ error: error.message }, 400);
        return json({ content: data });
      }

      case "send-message": {
        if (req.method !== "POST") return json({ error: "use POST" }, 405);
        const { contentId, texto, videoTimestamp } = await req.json();
        const { data, error } = await db
          .from("conversations")
          .insert({
            content_id: contentId,
            autor_tipo: "cliente",
            autor_nome: client.nome,
            texto,
            video_timestamp: videoTimestamp ?? null,
          })
          .select()
          .single();
        if (error) return json({ error: error.message }, 400);
        return json({ message: data });
      }

      default:
        return json({ error: `unknown action: ${action}` }, 400);
    }
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
