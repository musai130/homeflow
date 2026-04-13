"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { fetchWithAuth, getAccessToken } from "@/lib/api";

const plans = [
  { id: 1, visits: 1, basePrice: 4200, title: "Lite" },
  { id: 2, visits: 2, basePrice: 7600, title: "Smart" },
  { id: 4, visits: 4, basePrice: 13900, title: "Flow+" },
] as const;

type Housing = "Квартира" | "Дом" | "Офис";
type FrequencyMode = "monthly" | "weekly";

export default function SubscriptionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<number>(2);
  const [housingType, setHousingType] = useState<Housing>("Квартира");
  const [area, setArea] = useState<number>(50);
  const [status, setStatus] = useState<"active" | "paused" | "cancelled">("active");
  const [frequencyMode, setFrequencyMode] = useState<FrequencyMode>("monthly");
  const [preferredTime, setPreferredTime] = useState("11:00");
  const [promoCode, setPromoCode] = useState("");
  const [sameCleaner, setSameCleaner] = useState(false);
  const [priorityRooms, setPriorityRooms] = useState<string[]>([]);
  const [extraServices, setExtraServices] = useState<string[]>([]);
  const [wishes, setWishes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSubscriptionId, setActiveSubscriptionId] = useState<string | null>(null);

  const selectedPlan = plans.find((p) => p.id === selected) ?? plans[1];

  useEffect(() => {
    async function loadCurrentSubscription() {
      if (!getAccessToken()) return;

      try {
        const response = await fetchWithAuth("/subscriptions/me");
        if (!response.ok) return;
        const items = (await response.json()) as Array<{
          id: string;
          status: "active" | "paused" | "cancelled";
          visitsPerMonth: number;
        }>;
        const current = items[0];
        if (!current) return;
        setActiveSubscriptionId(current.id);
        setStatus(current.status);
        setSelected(current.visitsPerMonth === 1 || current.visitsPerMonth === 2 || current.visitsPerMonth === 4 ? current.visitsPerMonth : 2);
      } catch {
        // keep page interactive even if no previous subscription exists
      }
    }

    loadCurrentSubscription();
  }, []);

  const total = useMemo(() => {
    const multiplier = housingType === "Дом" ? 1.2 : housingType === "Офис" ? 1.3 : 1;
    const areaFactor = Math.max(1, area / 50);
    const periodicity = frequencyMode === "weekly" ? 2.2 : 1;
    const extras = extraServices.length * 450;
    const promoDiscount = promoCode.trim().toUpperCase() === "HOMEFLOW10" ? 0.9 : 1;
    return Math.round(selectedPlan.basePrice * multiplier * areaFactor * periodicity * promoDiscount + extras);
  }, [selectedPlan.basePrice, housingType, area, frequencyMode, extraServices.length, promoCode]);

  function toggleItem(value: string, source: string[], setSource: (next: string[]) => void) {
    if (source.includes(value)) {
      setSource(source.filter((item) => item !== value));
      return;
    }
    setSource([...source, value]);
  }

  async function completeSubscription() {
    setSubmitError(null);

    if (!getAccessToken()) {
      setSubmitError("Сначала пройдите регистрацию и вход.");
      router.push("/onboarding");
      return;
    }

    setIsSubmitting(true);

    const frequency =
      frequencyMode === "weekly"
        ? "weekly"
        : selected === 1
          ? "monthly"
          : selected === 2
            ? "biweekly"
            : "weekly";

    const startDate = new Date().toISOString();

    try {
      const response = await fetchWithAuth("/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          frequency,
          startDate,
          price: total,
          visitsPerMonth: selected,
          housingType,
          area,
          preferredTime,
          sameCleaner,
          priorityRooms,
          extraServices,
          wishes,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string | string[] };
        const message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message ?? "Не удалось оформить подписку";
        throw new Error(message);
      }

      const subscription = (await response.json()) as { id: string };
      setActiveSubscriptionId(subscription.id);
      router.push("/schedule");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не удалось оформить подписку");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateStatus(nextStatus: "active" | "paused" | "cancelled") {
    setStatus(nextStatus);
    if (!activeSubscriptionId) return;

    try {
      const response = await fetchWithAuth(`/subscriptions/${activeSubscriptionId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error("Не удалось изменить статус подписки");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не удалось изменить статус подписки");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-28 pt-8 md:px-8">
      <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_50px_rgba(3,8,20,0.08)] backdrop-blur animate-[fadeUp_400ms_ease-out]">
        <h1 className="text-3xl font-semibold">Выбор подписки</h1>
        <p className="mt-2 text-sm text-zinc-600">Настройте частоту, параметры жилья и управление статусом.</p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {plans.map((plan) => {
            const active = selected === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelected(plan.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <p className="text-sm uppercase tracking-[0.12em] opacity-80">{plan.title}</p>
                <p className="mt-2 text-2xl font-semibold">{plan.visits}x / мес</p>
                <p className={`mt-2 text-sm ${active ? "text-white/90" : "text-zinc-600"}`}>
                  от {plan.basePrice.toLocaleString("ru-RU")} ₽
                </p>
              </button>
            );
          })}
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-200 p-4">
          <h2 className="text-base font-semibold">Режим подписки и время визита</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFrequencyMode("monthly")}
              className={`rounded-full px-4 py-2 text-sm ${
                frequencyMode === "monthly" ? "bg-[var(--brand)] text-white" : "bg-zinc-100"
              }`}
            >
              По месяцам
            </button>
            <button
              type="button"
              onClick={() => setFrequencyMode("weekly")}
              className={`rounded-full px-4 py-2 text-sm ${
                frequencyMode === "weekly" ? "bg-[var(--brand)] text-white" : "bg-zinc-100"
              }`}
            >
              2 раза в неделю
            </button>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium">Предпочтительное время визита</span>
            <input
              type="time"
              value={preferredTime}
              onChange={(event) => setPreferredTime(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 outline-none ring-[var(--brand)] focus:ring"
            />
          </label>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Тип жилья</p>
            <div className="flex flex-wrap gap-2">
              {(["Квартира", "Дом", "Офис"] as Housing[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setHousingType(type)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    housingType === type
                      ? "bg-[var(--brand)] text-white"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Площадь, м2</span>
            <input
              type="number"
              min={10}
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 outline-none ring-[var(--brand)] focus:ring"
            />
          </label>
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <h2 className="text-base font-semibold">Что входит в уборку</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {[
              "Влажная уборка",
              "Пылесос",
              "Кухня",
              "Санузлы",
              "Зеркала",
              "Вынос мусора",
            ].map((item) => (
              <div key={item} className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-700">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 p-4">
          <h2 className="text-base font-semibold">Приоритетные комнаты и доп. услуги</h2>

          <div className="mt-3">
            <p className="mb-2 text-sm text-zinc-600">Приоритетные комнаты</p>
            <div className="flex flex-wrap gap-2">
              {["Детская", "Кухня", "Гостиная", "Спальня"].map((room) => (
                <button
                  key={room}
                  type="button"
                  onClick={() => toggleItem(room, priorityRooms, setPriorityRooms)}
                  className={`rounded-full px-4 py-2 text-sm ${
                    priorityRooms.includes(room)
                      ? "bg-[var(--brand)] text-white"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {room}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm text-zinc-600">Дополнительные услуги</p>
            <div className="flex flex-wrap gap-2">
              {["Мытье окон", "Глажка", "Химчистка мебели"].map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleItem(service, extraServices, setExtraServices)}
                  className={`rounded-full px-4 py-2 text-sm ${
                    extraServices.includes(service)
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium">Пожелания к уборке</span>
            <textarea
              value={wishes}
              onChange={(event) => setWishes(event.target.value)}
              className="min-h-24 w-full rounded-xl border border-zinc-300 px-3 py-2.5"
              placeholder="Например: уборка кухни после готовки"
            />
          </label>

          <label className="mt-4 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sameCleaner}
              onChange={(event) => setSameCleaner(event.target.checked)}
            />
            Назначать по возможности одного и того же исполнителя
          </label>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 p-4">
          <h2 className="text-base font-semibold">Промокод</h2>
          <label className="mt-2 block">
            <input
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 outline-none ring-[var(--brand)] focus:ring"
              placeholder="HOMEFLOW10"
            />
          </label>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 p-4">
          <h2 className="text-base font-semibold">Управление подпиской</h2>
          <p className="mt-1 text-sm text-zinc-600">Текущий статус: {status}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateStatus("paused")}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              Приостановить
            </button>
            <button
              type="button"
              onClick={() => updateStatus("cancelled")}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              Отменить
            </button>
            <button
              type="button"
              onClick={() => updateStatus("active")}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              Возобновить
            </button>
          </div>
        </section>

        <button
          type="button"
          onClick={completeSubscription}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-2xl bg-[var(--brand)] px-4 py-3 text-base font-semibold text-white"
        >
          {isSubmitting
            ? "Оформляем подписку..."
            : `Оформить подписку за ${total.toLocaleString("ru-RU")} ₽ / мес`}
        </button>
        {submitError ? <p className="mt-3 text-sm text-red-600">{submitError}</p> : null}
      </section>

      <BottomNav />
    </main>
  );
}
