"use client";

import { use, useEffect, useMemo, useState } from "react";
import { portalApi } from "@/lib/api";
import {
  STATUS_LABEL,
  type Branding,
  type Client,
  type ContentStatus,
  type ContentSummary,
} from "@/lib/types";
import { MonthCalendar } from "@/components/MonthCalendar";
import { PostModal } from "@/components/PostModal";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const STATUS_ORDER: ContentStatus[] = ["rascunho", "em_aprovacao", "ajuste", "aprovado"];

export default function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [client, setClient] = useState<Client | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [contents, setContents] = useState<ContentSummary[]>([]);
  const [ref, setRef] = useState(new Date());
  const [filter, setFilter] = useState<ContentStatus | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const year = ref.getFullYear();
  const month = ref.getMonth();

  async function loadMonth() {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    try {
      setContents(await portalApi.getContents(token, start, end));
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    portalApi.getClient(token).then(setClient).catch((e) => setError(String(e)));
    portalApi.getBranding(token).then(setBranding).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const counts = useMemo(() => {
    const c: Record<ContentStatus, number> = {
      rascunho: 0, em_aprovacao: 0, ajuste: 0, aprovado: 0,
    };
    for (const x of contents) c[x.status]++;
    return c;
  }, [contents]);

  const shown = filter ? contents.filter((c) => c.status === filter) : contents;

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="text-lg font-semibold text-status-ajuste">Não foi possível abrir o portal</p>
          <p className="mt-2 text-sm text-gray-400">
            Verifique se o link está completo. Se o problema continuar, fale com sua agência.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* header */}
      <header className="mb-6 flex items-center gap-3">
        {client?.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={client.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
        )}
        <h1 className="text-2xl font-bold">{client?.nome ?? "Portal"}</h1>
        {branding?.nome && (
          <span className="ml-auto text-sm text-gray-500">por {branding.nome}</span>
        )}
      </header>

      {/* barra de mês + filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setRef(new Date(year, month - 1, 1))}
          className="rounded-lg border border-white/10 px-2.5 py-1 hover:bg-white/5"
        >
          ←
        </button>
        <span className="min-w-[160px] text-center font-medium">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={() => setRef(new Date(year, month + 1, 1))}
          className="rounded-lg border border-white/10 px-2.5 py-1 hover:bg-white/5"
        >
          →
        </button>

        <div className="ml-auto flex flex-wrap gap-2">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? null : s)}
              className={`rounded-lg border px-3 py-1 text-sm ${
                filter === s ? "border-brand bg-brand/15 text-brand" : "border-white/10 hover:bg-white/5"
              }`}
            >
              {counts[s]} {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <MonthCalendar
        year={year}
        month={month}
        contents={shown}
        onOpen={(id) => setOpenId(id)}
      />

      {openId && (
        <PostModal
          token={token}
          contentId={openId}
          onClose={() => setOpenId(null)}
          onChanged={loadMonth}
        />
      )}
    </main>
  );
}
