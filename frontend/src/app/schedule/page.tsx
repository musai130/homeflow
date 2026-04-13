"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { fetchWithAuth, getAccessToken } from "@/lib/api";

interface VisitItem {
  id: string;
  date: string;
  time: string;
  status: string;
  scheduledDateIso: string;
  startedAt?: string;
  durationSeconds?: number;
  cleanerId?: string;
}

function toRuStatus(status: string): string {
  const map: Record<string, string> = {
    scheduled: "Запланирована",
    in_progress: "В процессе",
    completed: "Завершена",
    cancelled: "Отменена",
    rescheduled: "Перенесена",
  };
  return map[status] ?? status;
}

function fmtTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function SchedulePage() {
  const router = useRouter();
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [rescheduleOrderId, setRescheduleOrderId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [clockNow, setClockNow] = useState(Date.now());
  const [selectedTimerOrderId, setSelectedTimerOrderId] = useState<string | null>(null);
  const [siteAlert, setSiteAlert] = useState<{ type: "success" | "info"; text: string } | null>({
    type: "info",
    text: "Создавайте заказы через datepicker и управляйте ими в таймлайне.",
  });
  const [focusedOrderId, setFocusedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("orderId");
    if (orderId) {
      setFocusedOrderId(orderId);
      setSiteAlert({ type: "info", text: `Открыт заказ ${orderId}.` });
    }
  }, []);

  useEffect(() => {
    async function loadOrders() {
      if (!getAccessToken()) return;

      try {
        const response = await fetchWithAuth("/orders/me");
        if (!response.ok) throw new Error("Не удалось загрузить заказы");

        const data = (await response.json()) as Array<{
          id: string;
          scheduledDate: string;
          status: string;
          startedAt?: string;
          durationSeconds?: number;
          cleanerId?: string;
        }>;

        const mapped: VisitItem[] = data.map((item) => {
          const date = new Date(item.scheduledDate);
          return {
            id: item.id,
            date: date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
            time: date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
            status: item.status,
            scheduledDateIso: item.scheduledDate,
            startedAt: item.startedAt,
            durationSeconds: item.durationSeconds,
            cleanerId: item.cleanerId,
          };
        });

        setVisits(mapped);
      } catch (error) {
        setApiError(error instanceof Error ? error.message : "Не удалось загрузить заказы");
      }
    }

    loadOrders();
  }, []);

  const inProgressOrders = useMemo(
    () => visits.filter((item) => item.status === "in_progress" && item.startedAt),
    [visits],
  );

  useEffect(() => {
    if (inProgressOrders.length === 0) {
      setSelectedTimerOrderId(null);
      return;
    }

    if (!selectedTimerOrderId || !inProgressOrders.some((item) => item.id === selectedTimerOrderId)) {
      setSelectedTimerOrderId(inProgressOrders[0].id);
    }
  }, [inProgressOrders, selectedTimerOrderId]);

  const selectedTimerOrder = useMemo(
    () => inProgressOrders.find((item) => item.id === selectedTimerOrderId) ?? null,
    [inProgressOrders, selectedTimerOrderId],
  );

  const timerSeconds = useMemo(() => {
    if (!selectedTimerOrder?.startedAt) return 0;
    return Math.max(0, Math.floor((clockNow - new Date(selectedTimerOrder.startedAt).getTime()) / 1000));
  }, [clockNow, selectedTimerOrder]);

  async function createTimelineOrder() {
    if (!createDate) {
      setApiError("Выберите дату и время для нового заказа");
      return;
    }

    const parsed = new Date(createDate);
    if (Number.isNaN(parsed.getTime())) {
      setApiError("Некорректная дата");
      return;
    }

    try {
      const response = await fetchWithAuth("/orders/quick-book", {
        method: "PATCH",
        body: JSON.stringify({ scheduledDate: parsed.toISOString() }),
      });
      if (!response.ok) throw new Error("Не удалось создать заказ в таймлайне");

      const created = (await response.json()) as {
        id: string;
        scheduledDate: string;
        status: string;
        cleanerId?: string;
      };

      const date = new Date(created.scheduledDate);
      const next: VisitItem = {
        id: created.id,
        date: date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
        time: date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        status: created.status,
        scheduledDateIso: created.scheduledDate,
        cleanerId: created.cleanerId,
      };

      setVisits((current) => [next, ...current]);
      setCreateDate("");
      setSiteAlert({ type: "success", text: "Заказ добавлен в таймлайн." });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Не удалось создать заказ в таймлайне");
    }
  }

  async function confirmCleaning(id: string) {
    try {
      const response = await fetchWithAuth(`/orders/${id}/start`, { method: "PATCH" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string | string[] };
        const msg = Array.isArray(payload.message)
          ? payload.message.join(", ")
          : payload.message ?? "Не удалось подтвердить уборку";
        throw new Error(msg);
      }

      const updated = (await response.json()) as { id: string; status: string; startedAt?: string };
      setVisits((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, status: updated.status, startedAt: updated.startedAt ?? new Date().toISOString() }
            : item,
        ),
      );
      setSelectedTimerOrderId(id);
      setSiteAlert({ type: "success", text: "Уборка подтверждена и запущена." });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Не удалось подтвердить уборку");
    }
  }

  async function deleteOrder(id: string) {
    const approved = window.confirm("Удалить заказ? Это действие необратимо.");
    if (!approved) return;

    try {
      const response = await fetchWithAuth(`/orders/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Не удалось удалить заказ");

      setVisits((current) => current.filter((item) => item.id !== id));
      setSiteAlert({ type: "success", text: "Заказ удален." });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Не удалось удалить заказ");
    }
  }

  async function saveReschedule(id: string) {
    if (!rescheduleDate) {
      setApiError("Выберите дату и время");
      return;
    }

    const parsed = new Date(rescheduleDate);
    if (Number.isNaN(parsed.getTime())) {
      setApiError("Некорректный формат даты");
      return;
    }

    try {
      const response = await fetchWithAuth(`/orders/${id}/reschedule`, {
        method: "PATCH",
        body: JSON.stringify({ scheduledDate: parsed.toISOString() }),
      });
      if (!response.ok) throw new Error("Не удалось перенести визит");

      setVisits((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "rescheduled",
                scheduledDateIso: parsed.toISOString(),
                date: parsed.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
                time: parsed.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
              }
            : item,
        ),
      );
      setRescheduleOrderId(null);
      setRescheduleDate("");
      setSiteAlert({ type: "success", text: "Заказ успешно перенесен." });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Не удалось перенести визит");
    }
  }

  async function finishCleaning() {
    if (!selectedTimerOrder?.id) {
      setApiError("Выберите активный заказ для завершения");
      return;
    }

    try {
      const response = await fetchWithAuth(`/orders/${selectedTimerOrder.id}/complete`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Не удалось завершить заказ");

      setVisits((current) =>
        current.map((item) =>
          item.id === selectedTimerOrder.id
            ? { ...item, status: "completed", durationSeconds: timerSeconds }
            : item,
        ),
      );
      setSiteAlert({ type: "success", text: "Уборка завершена. Оцените ее в профиле." });
      router.push("/profile?rate=1");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Не удалось завершить заказ");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-28 pt-8 md:px-8">
      <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_50px_rgba(3,8,20,0.08)] backdrop-blur animate-[fadeUp_400ms_ease-out]">
        <h1 className="text-3xl font-semibold">График и выполнение уборок</h1>

        {siteAlert ? (
          <div
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
              siteAlert.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-sky-200 bg-sky-50 text-sky-900"
            }`}
          >
            {siteAlert.text}
          </div>
        ) : null}

        {apiError ? <p className="mt-3 text-sm text-red-600">{apiError}</p> : null}

        <section className="mt-6 rounded-2xl border border-zinc-200 p-4">
          <h2 className="text-lg font-semibold">Создать заказ в таймлайне</h2>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="min-w-[240px] flex-1 text-sm text-zinc-700">
              <span className="mb-1 block font-medium">Дата и время</span>
              <input
                type="datetime-local"
                value={createDate}
                onChange={(e) => setCreateDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
              />
            </label>
            <button
              type="button"
              onClick={createTimelineOrder}
              className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
            >
              Добавить в таймлайн
            </button>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold">Таймлайн уборок</h2>
          <ul className="mt-3 space-y-3">
            {visits.map((visit) => (
              <li
                key={visit.id}
                className={`rounded-2xl border bg-white p-4 ${
                  focusedOrderId === visit.id
                    ? "border-[var(--brand)] shadow-[0_0_0_2px_rgba(16,185,129,0.15)]"
                    : "border-zinc-200"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-zinc-500">{visit.time}</p>
                    <p className="text-base font-semibold">{visit.date}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                      visit.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : visit.status === "in_progress"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {toRuStatus(visit.status)}
                  </span>
                </div>

                {visit.durationSeconds ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    Длительность: {Math.floor(visit.durationSeconds / 60)} мин {visit.durationSeconds % 60} сек
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {(visit.status === "scheduled" || visit.status === "rescheduled") && (
                    <button
                      type="button"
                      onClick={() => confirmCleaning(visit.id)}
                      className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white"
                    >
                      Подтвердить уборку
                    </button>
                  )}

                  {visit.status !== "completed" && (
                    <button
                      type="button"
                      onClick={() => {
                        setRescheduleOrderId(visit.id);
                        setRescheduleDate(visit.scheduledDateIso.slice(0, 16));
                      }}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    >
                      Перенести
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteOrder(visit.id)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                  >
                    Удалить заказ
                  </button>
                </div>

                {rescheduleOrderId === visit.id ? (
                  <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <label className="block text-sm text-zinc-700">
                      <span className="mb-1 block font-medium">Новая дата и время</span>
                      <input
                        type="datetime-local"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
                      />
                    </label>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveReschedule(visit.id)}
                        className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Сохранить перенос
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleOrderId(null);
                          setRescheduleDate("");
                        }}
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 p-4">
          <h3 className="text-base font-semibold">Контроль времени</h3>

          {inProgressOrders.length > 0 ? (
            <>
              <label className="mt-3 block text-sm text-zinc-700">
                <span className="mb-1 block font-medium">Активный заказ для таймера</span>
                <select
                  value={selectedTimerOrderId ?? ""}
                  onChange={(e) => setSelectedTimerOrderId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
                >
                  {inProgressOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      Заказ #{order.id} - {order.date}, {order.time}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-3 grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
                {inProgressOrders.map((order) => {
                  const seconds = order.startedAt
                    ? Math.max(0, Math.floor((clockNow - new Date(order.startedAt).getTime()) / 1000))
                    : 0;
                  return (
                    <div key={order.id} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                      <p className="font-medium">#{order.id}</p>
                      <p>Прошло: {fmtTimer(seconds)}</p>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-3xl font-semibold tabular-nums">{fmtTimer(timerSeconds)}</p>
              <p className="mt-2 text-sm text-zinc-600">
                Таймер сохраняется в БД: по завершению пишется длительность и время окончания.
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={finishCleaning}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                >
                  Завершить выбранный заказ
                </button>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-zinc-600">Сейчас нет заказов в статусе "В процессе".</p>
          )}
        </section>
      </section>

      <BottomNav />
    </main>
  );
}
