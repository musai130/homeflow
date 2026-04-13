"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { RoleBottomNav } from "@/components/role-bottom-nav";
import { fetchWithAuth } from "@/lib/api";

interface AddressItem {
  id: string;
  value: string;
}

interface ComplaintItem {
  id: string;
  stars: number;
  comment: string;
  status: string;
}

interface AssignmentItem {
  id: string;
  cleanerId?: string;
  status: string;
  scheduledDate: string;
  cleanerCommentForCustomer?: string;
  cleanerWorkDetails?: string;
  cleanerUsedMaterials?: string;
  cleanerRecommendations?: string;
}

type NavRole = "customer" | "cleaner" | "admin";
type UserRole = "user" | "cleaner" | "admin";

function toRuStatus(status: string): string {
  const map: Record<string, string> = {
    scheduled: "Запланирована",
    in_progress: "В процессе",
    awaiting_confirmation: "Ожидает подтверждения",
    completed: "Завершена",
    cancelled: "Отменена",
    paused: "Приостановлена",
    active: "Активна",
    new: "Новая",
    resolved: "Решена",
  };
  return map[status] ?? status;
}

export default function ProfilePage() {
  const [navRole, setNavRole] = useState<NavRole>("customer");
  const [userRole, setUserRole] = useState<UserRole>("user");
  const [profile, setProfile] = useState({
    fullName: "",
    contacts: "",
    address: "",
    housingType: "",
    tariff: "",
    notifications: true,
  });
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [selectedCompletedOrderId, setSelectedCompletedOrderId] = useState<string>("");
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const lowRating = useMemo(() => rating > 0 && rating <= 2, [rating]);
  const completedAssignments = useMemo(
    () => assignments.filter((item) => item.status === "completed"),
    [assignments],
  );
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [pushSettings, setPushSettings] = useState({
    reminders: true,
    payments: true,
    incidents: true,
  });

  useEffect(() => {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { role?: UserRole };
      if (parsed.role === "cleaner") {
        setNavRole("cleaner");
        setUserRole("cleaner");
      } else if (parsed.role === "admin") {
        setNavRole("admin");
        setUserRole("admin");
      }
      else setNavRole("customer");
    } catch {
      setNavRole("customer");
      setUserRole("user");
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const complaintsPath = userRole === "admin" ? "/feedback/operator/complaints" : "/feedback/complaints/me";

        const [meRes, addressRes, complaintsRes, ordersRes] = await Promise.all([
          fetchWithAuth("/users/me"),
          fetchWithAuth("/users/me/addresses"),
          fetchWithAuth(complaintsPath),
          fetchWithAuth("/orders/me"),
        ]);

        if (!meRes.ok || !addressRes.ok || !complaintsRes.ok || !ordersRes.ok) {
          throw new Error("Не удалось загрузить профиль");
        }

        const me = (await meRes.json()) as {
          name?: string;
          phone?: string;
          address?: string;
          housingType?: string;
          tariff?: string;
          notificationsEnabled?: boolean;
          pushReminders?: boolean;
          pushPayments?: boolean;
          pushIncidents?: boolean;
        };

        setProfile({
          fullName: me.name ?? "",
          contacts: me.phone ?? "",
          address: me.address ?? "",
          housingType: me.housingType ?? "",
          tariff: me.tariff ?? "",
          notifications: me.notificationsEnabled ?? true,
        });

        setPushSettings({
          reminders: me.pushReminders ?? true,
          payments: me.pushPayments ?? true,
          incidents: me.pushIncidents ?? true,
        });

        setAddresses((await addressRes.json()) as AddressItem[]);
        setComplaints((await complaintsRes.json()) as ComplaintItem[]);
        const loadedAssignments = (await ordersRes.json()) as AssignmentItem[];
        setAssignments(loadedAssignments);
        const firstCompleted = loadedAssignments.find((item) => item.status === "completed");
        if (firstCompleted) {
          setSelectedCompletedOrderId(firstCompleted.id);
        }
      } catch (error) {
        setApiError(error instanceof Error ? error.message : "Не удалось загрузить профиль");
      }
    }

    loadData();
  }, [userRole]);

  async function saveProfile(nextProfile: typeof profile) {
    try {
      const response = await fetchWithAuth("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: nextProfile.fullName,
          phone: nextProfile.contacts,
          address: nextProfile.address,
          housingType: nextProfile.housingType,
          tariff: nextProfile.tariff,
          notificationsEnabled: nextProfile.notifications,
        }),
      });
      if (!response.ok) throw new Error("Не удалось сохранить профиль");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Не удалось сохранить профиль");
    }
  }

  async function savePush(nextPush: typeof pushSettings) {
    try {
      const response = await fetchWithAuth("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          pushReminders: nextPush.reminders,
          pushPayments: nextPush.payments,
          pushIncidents: nextPush.incidents,
        }),
      });
      if (!response.ok) throw new Error("Не удалось сохранить настройки уведомлений");
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Не удалось сохранить настройки уведомлений",
      );
    }
  }

  function addAddress() {
    if (!newAddress.trim()) return;

    fetchWithAuth("/users/me/addresses", {
      method: "POST",
      body: JSON.stringify({ value: newAddress.trim() }),
    })
      .then((res) => res.json())
      .then((address: AddressItem) => {
        setAddresses((prev) => [address, ...prev]);
        setNewAddress("");
      });
  }

  function removeAddress(addressId: string) {
    fetchWithAuth(`/users/me/addresses/${addressId}`, {
      method: "DELETE",
    }).then(() => {
      setAddresses((prev) => prev.filter((item) => item.id !== addressId));
    });
  }

  function submitRating() {
    if (rating === 0) return;
    if (!selectedCompletedOrderId) {
      setApiError("Оценку можно оставить только для завершенного заказа");
      return;
    }

    const selectedOrder = assignments.find((item) => item.id === selectedCompletedOrderId);
    const orderHint = selectedOrder
      ? `Заказ от ${new Date(selectedOrder.scheduledDate).toLocaleString("ru-RU")}. `
      : "";

    fetchWithAuth("/feedback/complaints", {
      method: "POST",
      body: JSON.stringify({
        stars: rating,
        comment: `${orderHint}${feedback || "Без комментария"}`,
      }),
    })
      .then((res) => res.json())
      .then((item: ComplaintItem) => {
        if (item.stars <= 2) {
          setComplaints((current) => [item, ...current]);
        }
      });
  }

  function resolveComplaint(id: string) {
    fetchWithAuth(`/feedback/operator/complaints/${id}/resolve`, {
      method: "PATCH",
    })
      .then((res) => res.json())
      .then((updated: ComplaintItem) => {
        setComplaints((current) =>
          current.map((item) => (item.id === id ? updated : item)),
        );
      });
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-28 pt-8 md:px-8">
      <section className="grid gap-5 lg:grid-cols-2 animate-[fadeUp_400ms_ease-out]">
        <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_50px_rgba(3,8,20,0.08)] backdrop-blur">
          <h1 className="text-3xl font-semibold">Профиль пользователя</h1>
          <div className="mt-5 grid gap-3">
            <label className="block text-sm text-zinc-700">
              <span className="mb-1 block font-medium">Имя</span>
              <input
                value={profile.fullName}
                onChange={(e) => {
                  const next = { ...profile, fullName: e.target.value };
                  setProfile(next);
                  saveProfile(next);
                }}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5"
              />
            </label>
            <label className="block text-sm text-zinc-700">
              <span className="mb-1 block font-medium">Контакты (телефон)</span>
              <input
                value={profile.contacts}
                onChange={(e) => {
                  const next = { ...profile, contacts: e.target.value };
                  setProfile(next);
                  saveProfile(next);
                }}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5"
              />
            </label>
            <label className="block text-sm text-zinc-700">
              <span className="mb-1 block font-medium">Основной адрес</span>
              <input
                value={profile.address}
                onChange={(e) => {
                  const next = { ...profile, address: e.target.value };
                  setProfile(next);
                  saveProfile(next);
                }}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5"
              />
            </label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block text-sm text-zinc-700">
                <span className="mb-1 block font-medium">Тип жилья</span>
                <input
                  value={profile.housingType}
                  onChange={(e) => {
                    const next = { ...profile, housingType: e.target.value };
                    setProfile(next);
                    saveProfile(next);
                  }}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5"
                />
              </label>
            </div>

            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-amber-700">Ваш тариф</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">{profile.tariff || "Flow+"}</p>
              <p className="mt-1 text-xs text-zinc-600">Тариф фиксируется после оформления подписки и не редактируется в профиле.</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={profile.notifications}
                onChange={(e) => {
                  const next = { ...profile, notifications: e.target.checked };
                  setProfile(next);
                  saveProfile(next);
                }}
              />
              Уведомления включены
            </label>

            <div className="rounded-xl border border-zinc-200 p-3">
              <p className="text-sm font-semibold">Несколько адресов</p>
              <ul className="mt-2 space-y-2 text-sm">
                {addresses.map((address) => (
                  <li
                    key={address.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-2 py-1.5"
                  >
                    <span>{address.value}</span>
                    <button
                      type="button"
                      onClick={() => removeAddress(address.id)}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                    >
                      Удалить
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-2">
                <input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Добавить адрес"
                  className="flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={addAddress}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Добавить
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 p-3">
              <p className="text-sm font-semibold">Push-уведомления</p>
              <div className="mt-2 space-y-2 text-sm">
                <label className="flex items-center justify-between">
                  Напоминания о визите
                  <input
                    type="checkbox"
                    checked={pushSettings.reminders}
                    onChange={(e) => {
                      const next = { ...pushSettings, reminders: e.target.checked };
                      setPushSettings(next);
                      savePush(next);
                    }}
                  />
                </label>
                <label className="flex items-center justify-between">
                  Платежи
                  <input
                    type="checkbox"
                    checked={pushSettings.payments}
                    onChange={(e) => {
                      const next = { ...pushSettings, payments: e.target.checked };
                      setPushSettings(next);
                      savePush(next);
                    }}
                  />
                </label>
                <label className="flex items-center justify-between">
                  Инциденты качества
                  <input
                    type="checkbox"
                    checked={pushSettings.incidents}
                    onChange={(e) => {
                      const next = { ...pushSettings, incidents: e.target.checked };
                      setPushSettings(next);
                      savePush(next);
                    }}
                  />
                </label>
              </div>
            </div>
            {apiError ? <p className="text-sm text-red-600">{apiError}</p> : null}
          </div>
        </article>

        <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_50px_rgba(3,8,20,0.08)] backdrop-blur">
          <h2 className="text-2xl font-semibold">Оценка выполненного заказа</h2>
          {completedAssignments.length > 0 ? (
            <label className="mt-3 block text-sm text-zinc-700">
              <span className="mb-1 block font-medium">Выберите завершенный заказ</span>
              <select
                value={selectedCompletedOrderId}
                onChange={(e) => setSelectedCompletedOrderId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5"
              >
                {completedAssignments.map((order) => (
                  <option key={order.id} value={order.id}>
                    {new Date(order.scheduledDate).toLocaleString("ru-RU")}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              У вас пока нет завершенных заказов для оценки.
            </p>
          )}
          <div className="mt-4 flex gap-1 text-3xl">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={star <= rating ? "text-amber-400" : "text-zinc-300"}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Комментарий"
            className="mt-3 min-h-24 w-full rounded-xl border border-zinc-300 px-3 py-2.5"
          />
          <button
            type="button"
            onClick={submitRating}
            disabled={completedAssignments.length === 0}
            className="mt-3 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Отправить оценку
          </button>
          {lowRating ? (
            <p className="mt-2 text-sm text-red-600">
              Низкая оценка автоматически добавляется в жалобы оператора.
            </p>
          ) : null}
        </article>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_50px_rgba(3,8,20,0.08)] backdrop-blur">
          <h3 className="text-xl font-semibold">Панель оператора: назначения</h3>
          <ul className="mt-3 space-y-2">
            {assignments.map((item) => (
              <li key={item.id} className="rounded-xl border border-zinc-200 p-3 text-sm">
                <p className="font-semibold">Исполнитель: {item.cleanerId ?? "не назначен"}</p>
                <p className="text-zinc-600">Дата: {new Date(item.scheduledDate).toLocaleString("ru-RU")}</p>
                <p className="mt-1 text-xs uppercase text-zinc-500">{toRuStatus(item.status)}</p>
                {item.cleanerCommentForCustomer ? (
                  <p className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-zinc-700">
                    Комментарий исполнителя: {item.cleanerCommentForCustomer}
                  </p>
                ) : null}
                {item.cleanerWorkDetails || item.cleanerUsedMaterials || item.cleanerRecommendations ? (
                  <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-zinc-700">
                    {item.cleanerWorkDetails ? <p>Параметры работ: {item.cleanerWorkDetails}</p> : null}
                    {item.cleanerUsedMaterials ? (
                      <p className="mt-1">Материалы: {item.cleanerUsedMaterials}</p>
                    ) : null}
                    {item.cleanerRecommendations ? (
                      <p className="mt-1">Рекомендации: {item.cleanerRecommendations}</p>
                    ) : null}
                  </div>
                ) : null}
                <Link href={`/schedule?orderId=${item.id}`} className="mt-2 inline-block text-xs font-semibold text-[var(--brand)] underline underline-offset-4">
                  Открыть заказ
                </Link>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_50px_rgba(3,8,20,0.08)] backdrop-blur">
          <h3 className="text-xl font-semibold">{userRole === "admin" ? "Панель оператора: жалобы" : "Мои жалобы"}</h3>
          <ul className="mt-3 space-y-2">
            {complaints.map((item) => (
              <li key={item.id} className="rounded-xl border border-zinc-200 p-3 text-sm">
                <p className="font-semibold">Оценка: {item.stars} / 5</p>
                <p className="mt-1 text-zinc-600">{item.comment}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs uppercase text-zinc-500">{toRuStatus(item.status)}</p>
                  {userRole === "admin" ? (
                    <button
                      type="button"
                      onClick={() => resolveComplaint(item.id)}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs"
                    >
                      Разобрать
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {navRole === "customer" ? <BottomNav /> : <RoleBottomNav role={navRole} />}
    </main>
  );
}
