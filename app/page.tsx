export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-bold">Portal de Aprovação de Conteúdo</h1>
      <p className="text-gray-400">
        Cada cliente acessa o próprio portal por um link exclusivo, no formato:
      </p>
      <code className="rounded-lg bg-white/5 px-4 py-2 text-sm text-brand">
        /portal/&lt;token-do-cliente&gt;
      </code>
      <p className="max-w-md text-sm text-gray-500">
        A área da agência (cadastro de clientes e upload de vídeos) fica em{" "}
        <code className="text-gray-400">/app</code> e exige login. Veja o{" "}
        <code className="text-gray-400">README.md</code> para configurar o Supabase.
      </p>
    </main>
  );
}
