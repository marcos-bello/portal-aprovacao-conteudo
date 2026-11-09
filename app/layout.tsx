import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal de Aprovação de Conteúdo",
  description:
    "Aprove ou peça ajustes no conteúdo da sua agência — calendário semanal, mensal e feed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body>{children}</body>
    </html>
  );
}
