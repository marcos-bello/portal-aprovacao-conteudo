-- Portal de Aprovação de Conteúdo — schema inicial
-- Inspirado na arquitetura do Pode Postar (Supabase + token por cliente).
-- Rodar com: supabase db push  (ou colar no SQL Editor do Supabase)

-- ────────────────────────────────────────────────────────────────────────
-- Enums
-- ────────────────────────────────────────────────────────────────────────
create type content_status as enum ('rascunho', 'em_aprovacao', 'ajuste', 'aprovado');
create type content_format as enum ('estatico', 'carrossel', 'reels', 'story', 'aprovacao_livre');
create type content_channel as enum ('instagram', 'tiktok', 'youtube', 'google_meu_negocio', 'linkedin', 'x', 'pinterest');

-- ────────────────────────────────────────────────────────────────────────
-- Tabelas
-- ────────────────────────────────────────────────────────────────────────
create table agencies (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  nome          text not null,
  logo_url      text,
  cor_primaria  text default '#7C3AED',
  created_at    timestamptz not null default now()
);

create table clients (
  id           uuid primary key default gen_random_uuid(),
  agency_id    uuid not null references agencies(id) on delete cascade,
  nome         text not null,
  avatar_url   text,
  -- token opaco do portal público: 1 token = 1 cliente, sem senha
  portal_token uuid not null unique default gen_random_uuid(),
  created_at   timestamptz not null default now()
);

create table contents (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references clients(id) on delete cascade,
  tema           text not null,
  legenda        text default '',
  status         content_status  not null default 'rascunho',
  formato        content_format  not null default 'reels',
  canal          content_channel not null default 'instagram',
  -- null = "Não Programado"
  data_agendada  timestamptz,
  -- mídia: provider + id (ex.: bunny / media-<uuid>)
  media_provider text default 'bunny',
  media_id       text,
  capa_url       text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on contents (client_id);
create index on contents (status);
create index on contents (data_agendada);

create table conversations (
  id              uuid primary key default gen_random_uuid(),
  content_id      uuid not null references contents(id) on delete cascade,
  -- 'agencia' ou 'cliente' (quem escreveu)
  autor_tipo      text not null default 'cliente',
  autor_nome      text,
  texto           text not null,
  -- comentário ancorado no tempo do vídeo (segundos), opcional
  video_timestamp int,
  created_at      timestamptz not null default now()
);
create index on conversations (content_id);

-- ────────────────────────────────────────────────────────────────────────
-- RLS: as tabelas ficam FECHADAS pro anon. Todo acesso do portal público
-- passa pela Edge Function (service_role), que valida o token. O front
-- NUNCA fala direto com as tabelas usando a anon key.
-- A área da agência usa auth.uid() = owner_user_id.
-- ────────────────────────────────────────────────────────────────────────
alter table agencies      enable row level security;
alter table clients       enable row level security;
alter table contents      enable row level security;
alter table conversations enable row level security;

-- Agência: dono enxerga/edita o que é dele.
create policy "agency owner reads own" on agencies
  for select using (owner_user_id = auth.uid());
create policy "agency owner writes own" on agencies
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "agency reads own clients" on clients
  for all using (agency_id in (select id from agencies where owner_user_id = auth.uid()))
  with check (agency_id in (select id from agencies where owner_user_id = auth.uid()));

create policy "agency reads own contents" on contents
  for all using (client_id in (
    select c.id from clients c join agencies a on a.id = c.agency_id
    where a.owner_user_id = auth.uid()))
  with check (client_id in (
    select c.id from clients c join agencies a on a.id = c.agency_id
    where a.owner_user_id = auth.uid()));

create policy "agency reads own conversations" on conversations
  for all using (content_id in (
    select ct.id from contents ct
    join clients c on c.id = ct.client_id
    join agencies a on a.id = c.agency_id
    where a.owner_user_id = auth.uid()))
  with check (content_id in (
    select ct.id from contents ct
    join clients c on c.id = ct.client_id
    join agencies a on a.id = c.agency_id
    where a.owner_user_id = auth.uid()));

-- Nenhuma policy pro anon = anon não lê nada direto. Correto: o portal usa a Edge Function.

-- ────────────────────────────────────────────────────────────────────────
-- Trigger: updated_at
-- ────────────────────────────────────────────────────────────────────────
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger contents_touch before update on contents
  for each row execute function touch_updated_at();
