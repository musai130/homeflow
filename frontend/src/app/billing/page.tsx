"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { fetchWithAuth } from "@/lib/api";

interface BillingMethod {
  id: string;
  maskedNumber: string;
  holder: string;
  expire: string;
}

interface BillingRecord {
  id: string;
  month: string;
  amount: string;
  chargedAt: string;
}

export default function BillingPage() {
  const [autoPay, setAutoPay] = useState(true);
  const [emailReceipts, setEmailReceipts] = useState(true);
  const [nextPaymentDate, setNextPaymentDate] = useState("2026-05-01");
  const [cards, setCards] = useState<BillingMethod[]>([]);
  const [history, setHistory] = useState<BillingRecord[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBilling() {
      try {
        const [methodsRes, recordsRes, settingsRes] = await Promise.all([
          fetchWithAuth("/billing/methods"),
          fetchWithAuth("/billing/records"),
          fetchWithAuth("/billing/settings"),
        ]);

        if (!methodsRes.ok || !recordsRes.ok || !settingsRes.ok) {
          throw new Error("Не удалось загрузить данные оплаты");
        }

        const methods = (await methodsRes.json()) as BillingMethod[];
        const records = (await recordsRes.json()) as BillingRecord[];
        const settings = (await settingsRes.json()) as {
          autoPay: boolean;
          emailReceipts: boolean;
          nextPaymentDate: string;
        };

        setCards(methods);
        setHistory(records);
        setAutoPay(settings.autoPay);
        setEmailReceipts(settings.emailReceipts);
        setNextPaymentDate(settings.nextPaymentDate);
      } catch (error) {
        setApiError(error instanceof Error ? error.message : "Не удалось загрузить данные оплаты");
      }
    }

    loadBilling();
  }, []);

  const yearlyTotal = useMemo(
    () => history.reduce((acc, item) => acc + Number(item.amount), 0),
    [history],
  );
  const yearlyGoal = 180000;
  const progress = Math.min(100, Math.round((yearlyTotal / yearlyGoal) * 100));

  async function addCard() {
    try {
      const response = await fetchWithAuth("/billing/methods", {
        method: "POST",
        body: JSON.stringify({
          number: "5555444433332222",
          holder: "HOMEFLOW USER",
          expire: "09/29",
        }),
      });

      if (!response.ok) throw new Error("Не удалось добавить карту");
      const card = (await response.json()) as BillingMethod;
      setCards((prev) => [card, ...prev]);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Не удалось добавить карту");
    }
  }

  async function updateSettings(next: { autoPay?: boolean; emailReceipts?: boolean }) {
    try {
      const response = await fetchWithAuth("/billing/settings", {
        method: "PATCH",
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error("Не удалось обновить настройки оплаты");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Не удалось обновить настройки оплаты");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-28 pt-8 md:px-8">
      <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_50px_rgba(3,8,20,0.08)] backdrop-blur animate-[fadeUp_400ms_ease-out]">
        <h1 className="text-3xl font-semibold">Оплата и расходы</h1>

        <section className="mt-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">HomeFlow Card</p>
          <p className="mt-7 text-xl tracking-[0.2em]">{cards[0]?.maskedNumber ?? "•••• ----"}</p>
          <div className="mt-4 flex items-end justify-between text-sm text-white/85">
            <p>{cards[0]?.holder ?? "NO CARD"}</p>
            <p>{cards[0]?.expire ?? "--/--"}</p>
          </div>
          <button
            type="button"
            onClick={addCard}
            className="mt-5 rounded-lg bg-white/15 px-3 py-2 text-sm"
          >
            Добавить карту
          </button>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Автосписание</h2>
              <p className="text-sm text-zinc-600">Следующая дата: {nextPaymentDate}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !autoPay;
                setAutoPay(next);
                updateSettings({ autoPay: next });
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                autoPay ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"
              }`}
            >
              {autoPay ? "Вкл" : "Выкл"}
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2">
            <p className="text-sm text-zinc-600">Получать чеки на email</p>
            <button
              type="button"
              onClick={() => {
                const next = !emailReceipts;
                setEmailReceipts(next);
                updateSettings({ emailReceipts: next });
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                emailReceipts ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"
              }`}
            >
              {emailReceipts ? "Вкл" : "Выкл"}
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 p-4">
          <h2 className="text-base font-semibold">История платежей</h2>
          <ul className="mt-3 space-y-2">
            {history.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{item.month}</p>
                  <p className="text-zinc-500">{new Date(item.chargedAt).toLocaleDateString("ru-RU")}</p>
                </div>
                <p className="font-semibold">{Number(item.amount).toLocaleString("ru-RU")} ₽</p>
              </li>
            ))}
          </ul>
        </section>

        {apiError ? <p className="mt-4 text-sm text-red-600">{apiError}</p> : null}

        <section className="mt-6 rounded-2xl border border-zinc-200 p-4">
          <h2 className="text-base font-semibold">Расходы за год</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {yearlyTotal.toLocaleString("ru-RU")} ₽ из {yearlyGoal.toLocaleString("ru-RU")} ₽
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-zinc-200">
            <div
              className="h-2 rounded-full bg-[var(--brand)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>
      </section>

      <BottomNav />
    </main>
  );
}
