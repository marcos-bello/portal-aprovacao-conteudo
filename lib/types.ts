export type ContentStatus = "rascunho" | "em_aprovacao" | "ajuste" | "aprovado";

export type ContentFormat =
  | "estatico"
  | "carrossel"
  | "reels"
  | "story"
  | "aprovacao_livre";

export type ContentChannel =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "google_meu_negocio"
  | "linkedin"
  | "x"
  | "pinterest";

export interface Client {
  id: string;
  agency_id: string;
  nome: string;
  avatar_url: string | null;
}

export interface Branding {
  nome: string;
  logo_url: string | null;
  cor_primaria: string | null;
}

export interface ContentSummary {
  id: string;
  tema: string;
  status: ContentStatus;
  formato: ContentFormat;
  canal: ContentChannel;
  data_agendada: string | null;
  media_id: string | null;
  capa_url: string | null;
}

export interface ContentDetails extends ContentSummary {
  legenda: string;
  media_provider: string | null;
}

export interface Conversation {
  id: string;
  content_id: string;
  autor_tipo: "agencia" | "cliente";
  autor_nome: string | null;
  texto: string;
  video_timestamp: number | null;
  created_at: string;
}

export const STATUS_LABEL: Record<ContentStatus, string> = {
  rascunho: "Rascunho",
  em_aprovacao: "Em Aprovação",
  ajuste: "Ajuste",
  aprovado: "Aprovado",
};

export const FORMAT_LABEL: Record<ContentFormat, string> = {
  estatico: "Estático",
  carrossel: "Carrossel",
  reels: "Reels",
  story: "Story",
  aprovacao_livre: "Aprovação Livre",
};

export const CHANNEL_LABEL: Record<ContentChannel, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  google_meu_negocio: "Google Meu Negócio",
  linkedin: "LinkedIn",
  x: "X",
  pinterest: "Pinterest",
};
