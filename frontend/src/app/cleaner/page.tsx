"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { RoleBottomNav } from "@/components/role-bottom-nav";

interface CleanerOrder {
  id: string;
  scheduledDate: string;
  status: string;
  customerName?: string;
  address?: string;
  cleanerReward?: number;
  cleanerCommentForCustomer?: string;
  cleanerWorkDetails?: string;
  cleanerUsedMaterials?: string;
  cleanerRecommendations?: string;
  subscriptionPreferences?: {
    frequency?: string;
    visitsPerMonth?: number;
    housingType?: string;
    area?: number;
    preferredTime?: string;
    sameCleaner?: boolean;
    priorityRooms?: string[];
    extraServices?: string[];
    wishes?: string;
  } | null;
}

function toRuStatus(status: string): string {
  const map: Record<string, string> = {
    scheduled: "Запланирована",
    in_progress: "В процессе",
    awaiting_confirmation: "Ожидает подтверждения",
    completed: "Завершена",
    cancelled: "Отменена",
    rescheduled: "Перенесена",
    closed: "Закрыта",
    resolved: "Решена",
  };
  return map[status] ?? status;
}

function toRuFrequency(value?: string): string {
  const map: Record<string, string> = {
    weekly: "Еженедельно",
    biweekly: "Раз в 2 недели",
    monthly: "Ежемесячно",
    custom: "Кастомно",
  };
  if (!value) return "Не указано";
  return map[value] ?? value;
}

export default function CleanerPage() {
  const [availableOrders, setAvailableOrders] = useState<CleanerOrder[]>([]);
  const [myOrders, setMyOrders] = useState<CleanerOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [notesByOrder, setNotesByOrder] = useState<
    Record<
      string,
      {
        cleanerCommentForCustomer: string;
        cleanerWorkDetails: string;
        cleanerUsedMaterials: string;
        cleanerRecommendations: string;
      }
    >
  >({});

  useEffect(() => {
    async function load() {
      try {
        const me = await fetchWithAuth("/auth/me");
        if (me.ok) {
          const meData = (await me.json()) as { role?: "user" | "cleaner" | "admin" };
          if (meData.role !== "cleaner" && meData.role !== "admin") {
            setHint("Ваш аккаунт не имеет роли исполнителя. Выберите роль исполнителя при регистрации.");
            return;
          }
        }

        const [availableResponse, mineResponse] = await Promise.all([
          fetchWithAuth("/orders/available"),
          fetchWithAuth("/orders/cleaner/me"),
        ]);

        if (!availableResponse.ok || !mineResponse.ok) {
          if (availableResponse.status === 403 || mineResponse.status === 403) {
            throw new Error("Доступ запрещен. Для этого раздела нужна роль исполнителя.");
          }
          throw new Error("Не удалось загрузить заказы исполнителя");
        }

        setAvailableOrders((await availableResponse.json()) as CleanerOrder[]);
        const mine = (await mineResponse.json()) as CleanerOrder[];
        setMyOrders(mine);
        setNotesByOrder(
          mine.reduce((acc, order) => {
            acc[order.id] = {
              cleanerCommentForCustomer: order.cleanerCommentForCustomer ?? "",
              cleanerWorkDetails: order.cleanerWorkDetails ?? "",
              cleanerUsedMaterials: order.cleanerUsedMaterials ?? "",
              cleanerRecommendations: order.cleanerRecommendations ?? "",
            };
            return acc;
          }, {} as Record<string, { cleanerCommentForCustomer: string; cleanerWorkDetails: string; cleanerUsedMaterials: string; cleanerRecommendations: string }>),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить заказы исполнителя");
      }
    }

    load();
  }, []);

  async function claimOrder(id: string) {
    try {
      const response = await fetchWithAuth(`/orders/${id}/claim`, { method: "PATCH" });
      if (!response.ok) throw new Error("Не удалось взять заказ");

      const claimed = (await response.json()) as CleanerOrder;
      setAvailableOrders((current) => current.filter((item) => item.id !== id));
      setMyOrders((current) => [claimed, ...current]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось взять заказ");
    }
  }

  async function startOrder(id: string) {
    try {
      const response = await fetchWithAuth(`/orders/${id}/cleaner/start`, { method: "PATCH" });
      if (!response.ok) throw new Error("Не удалось начать заказ");
      const updated = (await response.json()) as CleanerOrder;
      setMyOrders((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось начать заказ");
    }
  }

  async function finishOrder(id: string) {
    try {
      const response = await fetchWithAuth(`/orders/${id}/cleaner/complete`, { method: "PATCH" });
      if (!response.ok) throw new Error("Не удалось завершить заказ");
      const updated = (await response.json()) as CleanerOrder;
      setMyOrders((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось завершить заказ");
    }
  }

  async function saveNotes(id: string) {
    const payload = notesByOrder[id];
    if (!payload) return;

    try {
      const response = await fetchWithAuth(`/orders/${id}/cleaner/notes`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Не удалось сохранить комментарии и параметры");
      const updated = (await response.json()) as CleanerOrder;
      setMyOrders((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить комментарии и параметры");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-8 md:px-8">
      <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_50px_rgba(3,8,20,0.08)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Кабинет исполнителя</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Доступные заказы</h1>

        {hint ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{hint}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <h2 className="mt-6 text-lg font-semibold">Мои заказы</h2>
        <ul className="mt-3 space-y-3">
          {myOrders.map((order) => (
            <li key={order.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Заказ #{order.id}</p>
              <p className="mt-1 text-sm font-semibold">{new Date(order.scheduledDate).toLocaleString("ru-RU")}</p>
              <p className="mt-1 text-sm text-zinc-700">Заказчик: {order.customerName ?? "Не указан"}</p>
              <p className="mt-1 text-sm text-zinc-700">Адрес: {order.address ?? "Адрес не указан"}</p>
              <p className="mt-1 text-sm text-zinc-700">Доход: {(order.cleanerReward ?? 0).toLocaleString("ru-RU")} ₽</p>
              <p className="mt-1 text-xs uppercase text-zinc-500">{toRuStatus(order.status)}</p>

              {order.subscriptionPreferences ? (
                <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                  <p className="font-semibold text-zinc-900">Параметры подписки заказчика</p>
                  <p className="mt-1">Частота: {toRuFrequency(order.subscriptionPreferences.frequency)}</p>
                  <p>Визитов в месяц: {order.subscriptionPreferences.visitsPerMonth ?? "Не указано"}</p>
                  <p>Тип жилья: {order.subscriptionPreferences.housingType ?? "Не указано"}</p>
                  <p>Площадь: {order.subscriptionPreferences.area ?? "Не указано"} м2</p>
                  <p>Время визита: {order.subscriptionPreferences.preferredTime ?? "Не указано"}</p>
                  <p>
                    Предпочтение постоянного исполнителя: {order.subscriptionPreferences.sameCleaner ? "Да" : "Нет"}
                  </p>
                  {order.subscriptionPreferences.priorityRooms?.length ? (
                    <p>Приоритетные комнаты: {order.subscriptionPreferences.priorityRooms.join(", ")}</p>
                  ) : null}
                  {order.subscriptionPreferences.extraServices?.length ? (
                    <p>Доп. услуги: {order.subscriptionPreferences.extraServices.join(", ")}</p>
                  ) : null}
                  {order.subscriptionPreferences.wishes ? (
                    <p>Пожелания: {order.subscriptionPreferences.wishes}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-3 space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <label className="block text-sm text-zinc-700">
                  <span className="mb-1 block font-medium">Комментарий для заказчика</span>
                  <textarea
                    value={notesByOrder[order.id]?.cleanerCommentForCustomer ?? ""}
                    onChange={(e) =>
                      setNotesByOrder((current) => ({
                        ...current,
                        [order.id]: {
                          cleanerCommentForCustomer: e.target.value,
                          cleanerWorkDetails: current[order.id]?.cleanerWorkDetails ?? "",
                          cleanerUsedMaterials: current[order.id]?.cleanerUsedMaterials ?? "",
                          cleanerRecommendations: current[order.id]?.cleanerRecommendations ?? "",
                        },
                      }))
                    }
                    className="min-h-16 w-full rounded-lg border border-zinc-300 px-2 py-1.5"
                  />
                </label>
                <label className="block text-sm text-zinc-700">
                  <span className="mb-1 block font-medium">Параметры работ</span>
                  <textarea
                    value={notesByOrder[order.id]?.cleanerWorkDetails ?? ""}
                    onChange={(e) =>
                      setNotesByOrder((current) => ({
                        ...current,
                        [order.id]: {
                          cleanerCommentForCustomer: current[order.id]?.cleanerCommentForCustomer ?? "",
                          cleanerWorkDetails: e.target.value,
                          cleanerUsedMaterials: current[order.id]?.cleanerUsedMaterials ?? "",
                          cleanerRecommendations: current[order.id]?.cleanerRecommendations ?? "",
                        },
                      }))
                    }
                    className="min-h-16 w-full rounded-lg border border-zinc-300 px-2 py-1.5"
                  />
                </label>
                <label className="block text-sm text-zinc-700">
                  <span className="mb-1 block font-medium">Использованные материалы</span>
                  <input
                    value={notesByOrder[order.id]?.cleanerUsedMaterials ?? ""}
                    onChange={(e) =>
                      setNotesByOrder((current) => ({
                        ...current,
                        [order.id]: {
                          cleanerCommentForCustomer: current[order.id]?.cleanerCommentForCustomer ?? "",
                          cleanerWorkDetails: current[order.id]?.cleanerWorkDetails ?? "",
                          cleanerUsedMaterials: e.target.value,
                          cleanerRecommendations: current[order.id]?.cleanerRecommendations ?? "",
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-zinc-300 px-2 py-1.5"
                  />
                </label>
                <label className="block text-sm text-zinc-700">
                  <span className="mb-1 block font-medium">Рекомендации заказчику</span>
                  <input
                    value={notesByOrder[order.id]?.cleanerRecommendations ?? ""}
                    onChange={(e) =>
                      setNotesByOrder((current) => ({
                        ...current,
                        [order.id]: {
                          cleanerCommentForCustomer: current[order.id]?.cleanerCommentForCustomer ?? "",
                          cleanerWorkDetails: current[order.id]?.cleanerWorkDetails ?? "",
                          cleanerUsedMaterials: current[order.id]?.cleanerUsedMaterials ?? "",
                          cleanerRecommendations: e.target.value,
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-zinc-300 px-2 py-1.5"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => saveNotes(order.id)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  Сохранить параметры исполнителя
                </button>
              </div>

              <div className="mt-3 flex gap-2">
                {(order.status === "scheduled" || order.status === "rescheduled") ? (
                  <button
                    type="button"
                    onClick={() => startOrder(order.id)}
                    className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white"
                  >
                    Начать
                  </button>
                ) : null}
                {order.status === "in_progress" ? (
                  <button
                    type="button"
                    onClick={() => finishOrder(order.id)}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  >
                    Завершить (ожидает заказчика)
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <h2 className="mt-6 text-lg font-semibold">Заказы для взятия</h2>
        {availableOrders.length === 0 ? (
          <p className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            Сейчас нет доступных заказов. Это не ошибка.
          </p>
        ) : null}

        <ul className="mt-5 space-y-3">
          {availableOrders.map((order) => (
            <li key={order.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Заказ #{order.id}</p>
              <p className="mt-1 text-sm font-semibold">{new Date(order.scheduledDate).toLocaleString("ru-RU")}</p>
              <p className="mt-1 text-sm text-zinc-700">Заказчик: {order.customerName ?? "Не указан"}</p>
              <p className="mt-1 text-sm text-zinc-700">Адрес: {order.address ?? "Адрес не указан"}</p>
              <p className="mt-1 text-sm text-zinc-700">Доход: {(order.cleanerReward ?? 0).toLocaleString("ru-RU")} ₽</p>
              {order.subscriptionPreferences ? (
                <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                  <p className="font-semibold text-zinc-900">Параметры подписки заказчика</p>
                  <p className="mt-1">Частота: {toRuFrequency(order.subscriptionPreferences.frequency)}</p>
                  <p>Визитов в месяц: {order.subscriptionPreferences.visitsPerMonth ?? "Не указано"}</p>
                  <p>Тип жилья: {order.subscriptionPreferences.housingType ?? "Не указано"}</p>
                  <p>Площадь: {order.subscriptionPreferences.area ?? "Не указано"} м2</p>
                  <p>Время визита: {order.subscriptionPreferences.preferredTime ?? "Не указано"}</p>
                  <p>
                    Предпочтение постоянного исполнителя: {order.subscriptionPreferences.sameCleaner ? "Да" : "Нет"}
                  </p>
                  {order.subscriptionPreferences.priorityRooms?.length ? (
                    <p>Приоритетные комнаты: {order.subscriptionPreferences.priorityRooms.join(", ")}</p>
                  ) : null}
                  {order.subscriptionPreferences.extraServices?.length ? (
                    <p>Доп. услуги: {order.subscriptionPreferences.extraServices.join(", ")}</p>
                  ) : null}
                  {order.subscriptionPreferences.wishes ? (
                    <p>Пожелания: {order.subscriptionPreferences.wishes}</p>
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => claimOrder(order.id)}
                className="mt-3 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white"
              >
                Взять заказ
              </button>
            </li>
          ))}
        </ul>
      </section>

      <RoleBottomNav role="cleaner" />
    </main>
  );
}
