# Portal de Aprovação de Conteúdo

App para agências de social media: o **cliente** aprova (ou pede ajuste) no conteúdo por um
**link exclusivo com token**, vendo um calendário mensal/semanal/feed; a **agência** cadastra
clientes e sobe os vídeos já editados.

> Projeto próprio, inspirado na arquitetura de portais de aprovação do mercado. Stack escolhido
> para ser barato e rápido de subir: **Supabase + Next.js + Bunny Stream**.

## Como funciona

- **Portal do cliente** — rota pública `/portal/<token>`, sem senha. Um token = um cliente.
  O front nunca fala direto com o banco: tudo passa pela Edge Function `client-portal-data`,
  que valida o token e devolve só os dados daquele cliente.
- **Área da agência** — `/app` (a construir), protegida por login do Supabase Auth. É onde se
  cadastra cliente, gera o token do portal e se sobe o vídeo.
- **Estados do conteúdo**: `rascunho → em_aprovacao → ajuste → aprovado`. O cliente só move para
  **ajuste** ou **aprovado**; o resto é da agência.

## Estrutura

```
app/
  portal/[token]/page.tsx   # portal público do cliente (sem login)
  app/login/page.tsx        # login/cadastro da agência
  app/page.tsx              # agência: lista + cadastro de clientes
  app/client/[id]/page.tsx  # agência: calendário do cliente + subir vídeo
  api/bunny/route.ts        # upload de vídeo ao Bunny (server-side)
  page.tsx                  # landing
components/                 # MonthCalendar, PostModal, ContentEditor, AuthGate, StatusBadge
lib/                        # api (portal), supabaseClient + agency (agência), tipos
supabase/
  migrations/0001_init.sql  # tabelas, enums, RLS
  functions/client-portal-data/  # Edge Function (API do portal)
  seed.sql                  # dados de teste
```

## Setup

### 1. Supabase
1. Crie um projeto em [supabase.com](https://supabase.com).
2. Rode a migration: cole `supabase/migrations/0001_init.sql` no **SQL Editor** (ou
   `supabase db push` com a CLI).
3. (Opcional) rode `supabase/seed.sql` para ter um cliente e posts de teste — ele imprime a URL
   `/portal/<token>` no final.
4. Faça deploy da Edge Function:
   ```bash
   supabase functions deploy client-portal-data --no-verify-jwt
   ```

### 2. Front-end
```bash
npm install
cp .env.local.example .env.local   # preencha com os dados do seu projeto
npm run dev
```
- **Portal do cliente:** `http://localhost:3000/portal/<token>` (token do seed).
- **Área da agência:** `http://localhost:3000/app` → cria conta, cadastra cliente (só o nome),
  abre o calendário dele, sobe o vídeo e move para **Em Aprovação**. O botão "Copiar link do
  cliente" dá a URL `/portal/<token>` para enviar ao cliente.

> **Supabase Auth:** por padrão o Supabase exige confirmação de e-mail no cadastro. Para testar
> rápido, desligue em **Authentication → Sign In / Providers → Email → Confirm email**.

### Variáveis (.env.local)
| var | o que é |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key do projeto |
| `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` | opcional; se vazio, derivada da URL acima |
| `NEXT_PUBLIC_BUNNY_LIBRARY_ID` | id da biblioteca do Bunny Stream (player) |
| `BUNNY_LIBRARY_ID` | mesmo id, usado no servidor (upload) |
| `BUNNY_API_KEY` | **secreta** — AccessKey da biblioteca, só no servidor |

> ⚠️ **Upload de vídeo ao Bunny: hipótese, não testada.** O contrato em `app/api/bunny/route.ts`
> foi escrito a partir da documentação do Bunny, sem validação com conta real. Enquanto não
> validar, dá para usar o app colando o **GUID** de um vídeo já existente no campo do editor.
> Para arquivos grandes, trocar o proxy por upload direto TUS com assinatura (limite de corpo
> serverless ~4,5 MB).

## Roadmap
- [x] Portal do cliente: calendário mensal + filtros de status + detalhe do post
- [x] Aprovar / pedir ajuste / chat por post
- [x] Edge Function com auth por token
- [x] Área da agência (`/app`): login, cadastro de cliente (só o nome), calendário por cliente,
      editor de conteúdo, link do portal para copiar
- [~] Upload de vídeo ao Bunny (código pronto, **não testado** com conta real)
- [ ] Visões Semanal e Feed
- [ ] Notificação (e-mail/push) quando há conteúdo para aprovar
- [ ] Export PDF / CSV
- [ ] Upload TUS direto (vídeos grandes)

## Segurança
- RLS liga o acesso da agência a `auth.uid()`; o anon não lê nenhuma tabela direto.
- `service_role key` só existe na Edge Function, nunca no front.
- `portal_token` é um UUID opaco por cliente.

## Licença
MIT
