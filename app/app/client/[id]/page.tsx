"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { MonthCalendar } from "@/components/MonthCalendar";
import { ContentEditor } from "@/components/ContentEditor";
import { StatusBadge } from "@/components/StatusBadge";
import { getClient, listContents, type AgencyClient } from "@/lib/agency";
import { type ContentDetails } from "@/lib/types";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function ClientCalendar({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<AgencyClient | null>(null);
  const [contents, setContents] = useState<ContentDetails[]>([]);
  const [ref, setRef] = useState(new Date());
  const [editing, setEditing] = useState<ContentDetails | null>(null);
  const [creating, setCreating] = useState(false);

  const year = ref.getFullYear();
  const month = ref.getMonth();
  const bunny = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;

  async function load() {
    setClient(await getClient(clientId));
    setContents(await listContents(clientId));
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const monthContents = useMemo(
    () =>
      contents.filter((c) => {
        if (!c.data_agendada) return false;
        const d = new Date(c.data_agendada);
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [contents, year, month],
  );

  const naoProgramados = contents.filter((c) => !c.data_agendada);

  function openContent(id: string) {
    const c = contents.find((x) => x.id === id) ?? null;
    setEditing(c);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/app" className="text-sm text-gray-400 hover:text-white">← clientes</Link>
        <h1 className="text-2xl font-bold">{client?.nome ?? "…"}</h1>
        <button
          onClick={() => setCreating(true)}
          className="ml-auto rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          + Novo conteúdo
        </button>
      </header>

      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => setRef(new Date(year, month - 1, 1))} className="rounded-lg border border-white/10 px-2.5 py-1 hover:bg-white/5">←</button>
        <span className="min-w-[160px] text-center font-medium">{MONTHS[month]} {year}</span>
        <button onClick={() => setRef(new Date(year, month + 1, 1))} className="rounded-lg border border-white/10 px-2.5 py-1 hover:bg-white/5">→</button>
      </div>

      <MonthCalendar year={year} month={month} contents={monthContents} onOpen={openContent} />

      {naoProgramados.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-300">Não programados</h3>
          <ul className="space-y-2">
            {naoProgramados.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setEditing(c)}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10"
                >
                  <span className="flex-1">{c.tema}</span>
                  <StatusBadge status={c.status} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(creating || editing) && (
        <ContentEditor
          clientId={clientId}
          existing={editing}
          bunnyLibrary={bunny}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={load}
        />
      )}
    </main>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGate>
      <ClientCalendar clientId={id} />
    </AuthGate>
  );
}
