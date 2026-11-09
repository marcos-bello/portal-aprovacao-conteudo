import { STATUS_LABEL, type ContentStatus } from "@/lib/types";

const styles: Record<ContentStatus, string> = {
  rascunho: "bg-status-rascunho/15 text-status-rascunho border-status-rascunho/30",
  em_aprovacao: "bg-status-aprovacao/15 text-status-aprovacao border-status-aprovacao/30",
  ajuste: "bg-status-ajuste/15 text-status-ajuste border-status-ajuste/30",
  aprovado: "bg-status-aprovado/15 text-status-aprovado border-status-aprovado/30",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
