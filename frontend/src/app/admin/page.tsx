"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { RoleBottomNav } from "@/components/role-bottom-nav";

interface ComplaintItem {
  id: string;
  stars: number;
  comment: string;
  status: string;
  operatorComment?: string;
}

function toRuStatus(status: string): string {
  const map: Record<string, string> = {
    new: "Новая",
    in_progress: "В работе",
    closed: "Закрыта",
    resolved: "Решена",
  };
  return map[status] ?? status;
}

export default function AdminPage() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [commentById, setCommentById] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const response = await fetchWithAuth("/feedback/operator/complaints");
        if (!response.ok) throw new Error("Не удалось загрузить жалобы");
        setComplaints((await response.json()) as ComplaintItem[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить жалобы");
      }
    }

    load();
  }, []);

  async function resolveComplaint(id: string) {
    try {
      const response = await fetchWithAuth(`/feedback/operator/complaints/${id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ comment: commentById[id] ?? "" }),
      });
      if (!response.ok) throw new Error("Не удалось ответить на жалобу");
      const updated = (await response.json()) as ComplaintItem;
      setComplaints((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось ответить на жалобу");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-8 md:px-8">
      <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_50px_rgba(3,8,20,0.08)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Кабинет администратора</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Жалобы и инциденты</h1>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <ul className="mt-5 space-y-3">
          {complaints.map((item) => (
            <li key={item.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-semibold">Оценка: {item.stars} / 5</p>
              <p className="mt-1 text-sm text-zinc-600">{item.comment}</p>
              <p className="mt-1 text-xs uppercase text-zinc-500">{toRuStatus(item.status)}</p>
              <label className="mt-3 block text-sm text-zinc-700">
                <span className="mb-1 block">Комментарий админа</span>
                <textarea
                  value={commentById[item.id] ?? item.operatorComment ?? ""}
                  onChange={(e) =>
                    setCommentById((current) => ({
                      ...current,
                      [item.id]: e.target.value,
                    }))
                  }
                  className="min-h-20 w-full rounded-lg border border-zinc-300 px-2 py-1.5"
                  placeholder="Напишите ответ заказчику"
                />
              </label>
              <button
                type="button"
                onClick={() => resolveComplaint(item.id)}
                className="mt-3 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                Ответить / закрыть жалобу
              </button>
            </li>
          ))}
        </ul>
      </section>

      <RoleBottomNav role="admin" />
    </main>
  );
}
