"use client";

import { useState } from "react";
import { saveContent, deleteContent, uploadVideo, type ContentInput } from "@/lib/agency";
import {
  CHANNEL_LABEL,
  FORMAT_LABEL,
  STATUS_LABEL,
  type ContentChannel,
  type ContentDetails,
  type ContentFormat,
  type ContentStatus,
} from "@/lib/types";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const FORMATS = Object.keys(FORMAT_LABEL) as ContentFormat[];
const CHANNELS = Object.keys(CHANNEL_LABEL) as ContentChannel[];
// a agência controla estes; "ajuste"/"aprovado" são resultado do cliente
const AGENCY_STATUSES: ContentStatus[] = ["rascunho", "em_aprovacao"];

export function ContentEditor({
  clientId,
  existing,
  bunnyLibrary,
  onClose,
  onSaved,
}: {
  clientId: string;
  existing: ContentDetails | null;
  bunnyLibrary?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tema, setTema] = useState(existing?.tema ?? "");
  const [legenda, setLegenda] = useState(existing?.legenda ?? "");
  const [status, setStatus] = useState<ContentStatus>(existing?.status ?? "rascunho");
  const [formato, setFormato] = useState<ContentFormat>(existing?.formato ?? "reels");
  const [canal, setCanal] = useState<ContentChannel>(existing?.canal ?? "instagram");
  const [data, setData] = useState(toLocalInput(existing?.data_agendada ?? null));
  const [mediaId, setMediaId] = useState(existing?.media_id ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const guid = await uploadVideo(file, tema || file.name);
      setMediaId(guid);
    } catch (e) {
      setErr(`Upload falhou: ${(e as Error).message}`);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!tema.trim()) {
      setErr("Dê um tema ao conteúdo.");
      return;
    }
    setBusy(true);
    setErr(null);
    const payload: ContentInput = {
      id: existing?.id,
      client_id: clientId,
      tema: tema.trim(),
      legenda,
      status,
      formato,
      canal,
      data_agendada: data ? new Date(data).toISOString() : null,
      media_id: mediaId || null,
    };
    try {
      await saveContent(payload);
      onSaved();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!existing?.id) return;
    if (!confirm("Excluir este conteúdo?")) return;
    setBusy(true);
    try {
      await deleteContent(existing.id);
      onSaved();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e1119]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="font-semibold">{existing ? "Editar conteúdo" : "Novo conteúdo"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 md:grid-cols-2">
          {/* esquerda: vídeo */}
          <div className="space-y-3">
            <div className="aspect-[9/16] w-full overflow-hidden rounded-xl bg-black">
              {mediaId && bunnyLibrary ? (
                <iframe
                  className="h-full w-full"
                  src={`https://iframe.mediadelivery.net/embed/${bunnyLibrary}/${mediaId}`}
                  allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">sem vídeo</div>
              )}
            </div>
            <label className="block cursor-pointer rounded-lg border border-dashed border-white/20 px-3 py-2 text-center text-sm text-gray-300 hover:bg-white/5">
              {uploading ? "Enviando…" : "Enviar vídeo (Bunny)"}
              <input type="file" accept="video/*" className="hidden" onChange={onFile} disabled={uploading} />
            </label>
            <input
              value={mediaId}
              onChange={(e) => setMediaId(e.target.value)}
              placeholder="ou cole o GUID do vídeo (Bunny)"
              className={field}
            />
          </div>

          {/* direita: campos */}
          <div className="space-y-3">
            <input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Tema" className={field} />
            <textarea
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              placeholder="Legenda"
              rows={5}
              className={field}
            />
            <div className="grid grid-cols-2 gap-3">
              <select value={formato} onChange={(e) => setFormato(e.target.value as ContentFormat)} className={field}>
                {FORMATS.map((f) => <option key={f} value={f}>{FORMAT_LABEL[f]}</option>)}
              </select>
              <select value={canal} onChange={(e) => setCanal(e.target.value as ContentChannel)} className={field}>
                {CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>)}
              </select>
            </div>
            <label className="block text-xs text-gray-400">Data de publicação
              <input type="datetime-local" value={data} onChange={(e) => setData(e.target.value)} className={`${field} mt-1`} />
            </label>
            <label className="block text-xs text-gray-400">Status
              <select value={status} onChange={(e) => setStatus(e.target.value as ContentStatus)} className={`${field} mt-1`}>
                {AGENCY_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                {existing && !AGENCY_STATUSES.includes(existing.status) && (
                  <option value={existing.status}>{STATUS_LABEL[existing.status]} (definido pelo cliente)</option>
                )}
              </select>
            </label>
            <p className="text-xs text-gray-500">
              Mova para <b>Em Aprovação</b> para o cliente ver e decidir.
            </p>
          </div>
        </div>

        {err && <p className="px-5 text-sm text-status-ajuste">{err}</p>}

        <footer className="flex items-center justify-between border-t border-white/10 px-5 py-3">
          {existing ? (
            <button onClick={remove} disabled={busy} className="text-sm text-status-ajuste hover:underline">
              Excluir
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5">
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={busy || uploading}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {busy ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
