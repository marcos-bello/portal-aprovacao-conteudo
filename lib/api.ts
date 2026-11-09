// Client-side API: fala com a Edge Function client-portal-data, passando o token.
// Espelha exatamente o padrão do portal de referência: browser -> edge function.
import type {
  Branding,
  Client,
  ContentDetails,
  ContentStatus,
  ContentSummary,
  Conversation,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL; // ex.: https://<ref>.supabase.co/functions/v1
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function fnUrl(action: string, token: string, params: Record<string, string> = {}) {
  const u = new URL(`${BASE}/client-portal-data`);
  u.searchParams.set("token", token);
  u.searchParams.set("action", action);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(ANON ? { apikey: ANON, Authorization: `Bearer ${ANON}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const portalApi = {
  getClient: (token: string) =>
    call<{ client: Client }>(fnUrl("get-client", token)).then((r) => r.client),

  getBranding: (token: string) =>
    call<{ branding: Branding }>(fnUrl("get-workspace-branding", token)).then(
      (r) => r.branding,
    ),

  getContents: (token: string, monthStart?: string, monthEnd?: string) =>
    call<{ contents: ContentSummary[] }>(
      fnUrl("get-contents", token, {
        include_drafts: "false",
        ...(monthStart ? { monthStart } : {}),
        ...(monthEnd ? { monthEnd } : {}),
      }),
    ).then((r) => r.contents),

  getContentDetails: (token: string, contentId: string) =>
    call<{ content: ContentDetails }>(
      fnUrl("get-content-details", token, { contentId }),
    ).then((r) => r.content),

  getConversations: (token: string, contentId: string) =>
    call<{ conversations: Conversation[] }>(
      fnUrl("get-conversations", token, { contentId }),
    ).then((r) => r.conversations),

  setStatus: (token: string, contentId: string, status: Extract<ContentStatus, "ajuste" | "aprovado">) =>
    call<{ content: ContentDetails }>(fnUrl("set-content-status", token), {
      method: "POST",
      body: JSON.stringify({ contentId, status }),
    }).then((r) => r.content),

  sendMessage: (token: string, contentId: string, texto: string, videoTimestamp?: number) =>
    call<{ message: Conversation }>(fnUrl("send-message", token), {
      method: "POST",
      body: JSON.stringify({ contentId, texto, videoTimestamp }),
    }).then((r) => r.message),
};
