"use client";

import { FORMAT_LABEL, type ContentSummary } from "@/lib/types";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const statusDot: Record<string, string> = {
  rascunho: "bg-status-rascunho",
  em_aprovacao: "bg-status-aprovacao",
  ajuste: "bg-status-ajuste",
  aprovado: "bg-status-aprovado",
};

function startOfGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const d = new Date(first);
  d.setDate(1 - first.getDay()); // volta até domingo
  return d;
}

export function MonthCalendar({
  year,
  month,
  contents,
  onOpen,
}: {
  year: number;
  month: number; // 0-11
  contents: ContentSummary[];
  onOpen: (id: string) => void;
}) {
  const grid = startOfGrid(year, month);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(grid);
    d.setDate(grid.getDate() + i);
    return d;
  });

  const byDay = new Map<string, ContentSummary[]>();
  for (const c of contents) {
    if (!c.data_agendada) continue;
    const key = new Date(c.data_agendada).toDateString();
    (byDay.get(key) ?? byDay.set(key, []).get(key)!).push(c);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="grid grid-cols-7 border-b border-white/10 text-center text-xs text-gray-400">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const inMonth = d.getMonth() === month;
          const items = byDay.get(d.toDateString()) ?? [];
          return (
            <div
              key={i}
              className={`min-h-[96px] border-b border-r border-white/5 p-1.5 ${
                inMonth ? "" : "opacity-30"
              }`}
            >
              <div className="mb-1 text-xs text-gray-400">{d.getDate()}</div>
              <div className="space-y-1">
                {items.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onOpen(c.id)}
                    className="flex w-full items-center gap-1 truncate rounded-md border-l-2 border-brand bg-white/5 px-1.5 py-1 text-left text-[11px] hover:bg-white/10"
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[c.status]}`} />
                    <span className="truncate">{c.tema}</span>
                    <span className="ml-auto shrink-0 text-gray-500">
                      {FORMAT_LABEL[c.formato]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
