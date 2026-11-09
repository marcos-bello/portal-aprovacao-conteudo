"use client";

import { useEffect, useState } from "react";
import { portalApi } from "@/lib/api";
import {
  CHANNEL_LABEL,
  FORMAT_LABEL,
  type ContentDetails,
  type Conversation,
} from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function PostModal({
  token,
  contentId,
  onClose,
  onChanged,
}: {
  token: string;
  contentId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [content, setContent] = useState<ContentDetails | null>(null);
  const [msgs, setMsgs] = useState<Conversation[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [c, m] = await Promise.all([
      portalApi.getContentDetails(token, contentId),
      portalApi.getConversations(token, contentId),
    ]);
    setContent(c);
    setMsgs(m);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId]);

  async function act(status: "ajuste" | "aprovado") {
    setBusy(true);
    try {
      await portalApi.setStatus(token, contentId, status);
      await load();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await portalApi.sendMessage(token, contentId, draft.trim());
      setDraft("");
      setMsgs(await portalApi.getConversations(token, contentId));
    } finally {
      setBusy(false);
    }
  }

  const bunnyLib = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e1119]"
        onClick={(e) => e.stopPropagation()}
      >
        {!content ? (
          <div className="p-10 text-center text-gray-400">Carregando…</div>
        ) : (
          <>
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={content.status} />
                <span className="text-xs text-gray-400">
                  {CHANNEL_LABEL[content.canal]} · {FORMAT_LABEL[content.formato]}
                </span>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </header>

            <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-5 md:grid-cols-2">
              {/* mídia */}
              <div>
                <h2 className="mb-2 text-lg font-semibold">{content.tema}</h2>
                <div className="aspect-[9/16] w-full overflow-hidden rounded-xl bg-black">
                  {content.media_id && bunnyLib ? (
                    <iframe
                      className="h-full w-full"
                      src={`https://iframe.mediadelivery.net/embed/${bunnyLib}/${content.media_id}`}
                      allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      sem vídeo
                    </div>
                  )}
                </div>
              </div>

              {/* legenda + chat */}
              <div className="flex flex-col">
                <p className="whitespace-pre-wrap rounded-xl bg-white/5 p-3 text-sm text-gray-200">
                  {content.legenda || "— sem legenda —"}
                </p>

                <h3 className="mb-2 mt-4 text-sm font-semibold text-gray-300">Conversa</h3>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {msgs.length === 0 && (
                    <p className="text-xs text-gray-500">Nenhuma mensagem ainda.</p>
                  )}
                  {msgs.map((m) => (
                    <div key={m.id} className="rounded-lg bg-white/5 p-2 text-sm">
                      <span className="text-xs font-medium text-brand">
                        {m.autor_nome ?? m.autor_tipo}
                      </span>
                      <p className="text-gray-200">{m.texto}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Escreva uma mensagem…"
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  <button
                    onClick={send}
                    disabled={busy}
                    className="rounded-lg bg-white/10 px-3 text-sm hover:bg-white/20 disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-center gap-3 border-t border-white/10 px-5 py-3">
              <button
                onClick={() => act("ajuste")}
                disabled={busy}
                className="rounded-lg border border-status-ajuste/40 bg-status-ajuste/15 px-5 py-2 text-sm font-medium text-status-ajuste hover:bg-status-ajuste/25 disabled:opacity-50"
              >
                Pedir ajuste
              </button>
              <button
                onClick={() => act("aprovado")}
                disabled={busy}
                className="rounded-lg border border-status-aprovado/40 bg-status-aprovado/15 px-5 py-2 text-sm font-medium text-status-aprovado hover:bg-status-aprovado/25 disabled:opacity-50"
              >
                Aprovar
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
