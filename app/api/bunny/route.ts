import { NextRequest, NextResponse } from "next/server";

// Upload de vídeo para o Bunny Stream — roda NO SERVIDOR para a AccessKey nunca
// chegar ao navegador. Dois passos: cria o objeto de vídeo e envia o binário.
//
// ⚠️ Contrato escrito a partir da doc do Bunny; NÃO foi validado com conta real.
// Limite prático: o proxy serverless tem teto de corpo (~4,5 MB na Vercel Hobby).
// Para vídeos grandes, trocar por upload direto TUS com assinatura (ver README).

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const lib = process.env.BUNNY_LIBRARY_ID;
  const key = process.env.BUNNY_API_KEY;
  if (!lib || !key) {
    return NextResponse.json({ error: "Bunny não configurado (BUNNY_LIBRARY_ID / BUNNY_API_KEY)" }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const title = (form.get("title") as string) || "video";
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "arquivo ausente" }, { status: 400 });
  }

  // 1. cria o objeto de vídeo
  const createRes = await fetch(`https://video.bunnycdn.com/library/${lib}/videos`, {
    method: "POST",
    headers: { AccessKey: key, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!createRes.ok) {
    return NextResponse.json({ error: `criar vídeo: ${await createRes.text()}` }, { status: 502 });
  }
  const { guid } = (await createRes.json()) as { guid: string };

  // 2. envia o binário
  const buf = Buffer.from(await file.arrayBuffer());
  const upRes = await fetch(`https://video.bunnycdn.com/library/${lib}/videos/${guid}`, {
    method: "PUT",
    headers: { AccessKey: key },
    body: buf,
  });
  if (!upRes.ok) {
    return NextResponse.json({ error: `enviar binário: ${await upRes.text()}` }, { status: 502 });
  }

  return NextResponse.json({ guid });
}
