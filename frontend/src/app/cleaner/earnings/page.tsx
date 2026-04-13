"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { RoleBottomNav } from "@/components/role-bottom-nav";

interface CleanerOrder {
  id: string;
  status: string;
  cleanerReward?: number;
  scheduledDate: string;
}

export default function CleanerEarningsPage() {
  const [orders, setOrders] = useState<CleanerOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetchWithAuth("/orders/cleaner/me");
        if (!response.ok) throw new Error("Не удалось загрузить доходы");
        setOrders((await response.json()) as CleanerOrder[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить доходы");
      }
    }

    load();
  }, []);

  const completed = useMemo(
    () => orders.filter((item) => item.status === "completed" || item.status === "awaiting_confirmation"),
    [orders],
  );
  const total = useMemo(
    () => completed.reduce((sum, item) => sum + (item.cleanerReward ?? 0), 0),
    [completed],
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-8 md:px-8">
      <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_50px_rgba(3,8,20,0.08)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Финансы исполнителя</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Мой заработок</h1>
        <p className="mt-2 text-sm text-zinc-600">Сумма по заказам в статусе завершенных и ожидающих подтверждения.</p>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm text-emerald-800">Итого заработано</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-900">{total.toLocaleString("ru-RU")} ₽</p>
        </div>

        <ul className="mt-5 space-y-3">
          {completed.map((order) => (
            <li key={order.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Заказ #{order.id}</p>
              <p className="mt-1 text-sm font-semibold">{new Date(order.scheduledDate).toLocaleString("ru-RU")}</p>
              <p className="mt-1 text-sm text-zinc-700">Доход: {(order.cleanerReward ?? 0).toLocaleString("ru-RU")} ₽</p>
            </li>
          ))}
        </ul>
      </section>

      <RoleBottomNav role="cleaner" />
    </main>
  );
}
