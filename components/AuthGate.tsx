"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/** Envolve páginas da agência: só renderiza com sessão ativa; senão manda pro login. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setOk(true);
      else router.replace("/app/login");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/app/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (!ok) {
    return (
      <main className="flex min-h-screen items-center justify-center text-gray-400">
        Carregando…
      </main>
    );
  }
  return <>{children}</>;
}
