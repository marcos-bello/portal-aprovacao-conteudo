"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client do navegador para a ÁREA DA AGÊNCIA: faz login (Supabase Auth) e CRUD
// direto nas tabelas. A RLS garante que cada agência só enxerga o que é dela.
// O PORTAL DO CLIENTE não usa este client — ele fala com a Edge Function por token.
//
// Criação LAZY: só instancia no primeiro uso (no navegador). Assim o `next build`
// consegue pré-renderizar as páginas mesmo sem as variáveis de ambiente.
let _client: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local",
    );
  }
  _client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return _client;
}

// Proxy: adia a criação até o primeiro acesso de propriedade e mantém o `this`
// correto nos métodos. Os call sites continuam usando `supabase.xxx` normalmente.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
});
