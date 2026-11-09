"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { supabase } from "@/lib/supabaseClient";
import { addClient, ensureAgency, listClients, type AgencyClient } from "@/lib/agency";

function Dashboard() {
  const router = useRouter();
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [novo, setNovo] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    const id = await ensureAgency();
    setAgencyId(id);
    setClients(await listClients());
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!novo.trim() || !agencyId) return;
    setBusy(true);
    try {
      await addClient(agencyId, novo.trim());
      setNovo("");
      setClients(await listClients());
    } finally {
      setBusy(false);
    }
  }

  function portalUrl(token: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/portal/${token}`;
  }

  async function copy(token: string) {
    await navigator.clipboard.writeText(portalUrl(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus clientes</h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/app/login");
          }}
          className="text-sm text-gray-400 hover:text-white"
        >
          Sair
        </button>
      </header>

      <form onSubmit={criar} className="mb-6 flex gap-2">
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          placeholder="Nome do cliente"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          Cadastrar cliente
        </button>
      </form>

      {clients.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum cliente ainda. Cadastre o primeiro acima.</p>
      ) : (
        <ul className="space-y-2">
          {clients.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <Link href={`/app/client/${c.id}`} className="flex-1 font-medium hover:text-brand">
                {c.nome}
              </Link>
              <button
                onClick={() => copy(c.portal_token)}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs hover:bg-white/10"
                title={portalUrl(c.portal_token)}
              >
                {copied === c.portal_token ? "Copiado!" : "Copiar link do cliente"}
              </button>
              <Link
                href={`/app/client/${c.id}`}
                className="rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
              >
                Abrir calendário
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
