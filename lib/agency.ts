"use client";

// Camada de dados da ÁREA DA AGÊNCIA. Tudo via supabase-js com o JWT do usuário;
// a RLS (migration 0001) restringe cada linha ao dono (auth.uid()).
import { supabase } from "./supabaseClient";
import type {
  ContentChannel,
  ContentDetails,
  ContentFormat,
  ContentStatus,
} from "./types";

export interface AgencyClient {
  id: string;
  agency_id: string;
  nome: string;
  avatar_url: string | null;
  portal_token: string;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Garante que existe uma linha `agencies` para o usuário logado e devolve o id. */
export async function ensureAgency(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("sem sessão");

  const { data: existing } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("agencies")
    .insert({ owner_user_id: user.id, nome: user.email ?? "Minha Agência" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function listClients(): Promise<AgencyClient[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, agency_id, nome, avatar_url, portal_token")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Cadastra um cliente — só o nome. O portal_token é gerado pelo banco. */
export async function addClient(agencyId: string, nome: string): Promise<AgencyClient> {
  const { data, error } = await supabase
    .from("clients")
    .insert({ agency_id: agencyId, nome })
    .select("id, agency_id, nome, avatar_url, portal_token")
    .single();
  if (error) throw error;
  return data;
}

export async function getClient(id: string): Promise<AgencyClient> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, agency_id, nome, avatar_url, portal_token")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

/** Todos os conteúdos do cliente (inclui rascunhos e não programados). */
export async function listContents(clientId: string): Promise<ContentDetails[]> {
  const { data, error } = await supabase
    .from("contents")
    .select("*")
    .eq("client_id", clientId)
    .order("data_agendada", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as ContentDetails[];
}

export interface ContentInput {
  id?: string;
  client_id: string;
  tema: string;
  legenda: string;
  status: ContentStatus;
  formato: ContentFormat;
  canal: ContentChannel;
  data_agendada: string | null;
  media_id: string | null;
}

export async function saveContent(input: ContentInput): Promise<ContentDetails> {
  if (input.id) {
    const { id, ...rest } = input;
    const { data, error } = await supabase
      .from("contents")
      .update(rest)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as ContentDetails;
  }
  const { data, error } = await supabase
    .from("contents")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as ContentDetails;
}

export async function deleteContent(id: string): Promise<void> {
  const { error } = await supabase.from("contents").delete().eq("id", id);
  if (error) throw error;
}

/** Envia um arquivo de vídeo para o Bunny via nossa rota /api/bunny e devolve o guid. */
export async function uploadVideo(file: File, title: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("title", title);
  const res = await fetch("/api/bunny", { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  const { guid } = (await res.json()) as { guid: string };
  return guid;
}
