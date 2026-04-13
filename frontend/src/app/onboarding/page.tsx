"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "@/lib/api";

type HousingType = "Квартира" | "Дом" | "Офис";
type PlanType = "1" | "2" | "4";
type UserRole = "user" | "cleaner" | "admin";

function roleHome(role: UserRole | undefined): string {
  if (role === "cleaner") return "/cleaner";
  if (role === "admin") return "/admin";
  return "/profile";
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<UserRole>("user");

  const [housingType, setHousingType] = useState<HousingType>("Квартира");
  const [area, setArea] = useState("45");
  const [rooms, setRooms] = useState("2");

  const [plan, setPlan] = useState<PlanType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      const raw = localStorage.getItem("currentUser");
      const savedRole = raw ? (JSON.parse(raw) as { role?: UserRole }).role : undefined;
      router.replace(roleHome(savedRole));
    }
  }, [router]);

  const progress = useMemo(() => `${(step / 3) * 100}%`, [step]);

  function normalizeErrorMessage(message: string): string {
    if (message.toLowerCase().includes("email already exists")) {
      return "Пользователь с таким email уже существует";
    }
    return message;
  }

  async function nextStep() {
    setError(null);

    if (step === 1) {
      if (!name.trim()) {
        setError("Укажите имя.");
        return;
      }
      if (!email.trim() && !phone.trim()) {
        setError("Укажите email или телефон.");
        return;
      }
      if (password.length < 6) {
        setError("Пароль должен быть не короче 6 символов.");
        return;
      }
      if (!address.trim()) {
        setError("Укажите адрес.");
        return;
      }

      if (email.trim()) {
        setIsCheckingEmail(true);
        try {
          const response = await fetch(
            `${buildApiUrl("/auth/check-email")}?email=${encodeURIComponent(email.trim())}`,
          );
          if (!response.ok) {
            throw new Error("Не удалось проверить email");
          }

          const data = (await response.json()) as { available: boolean };
          if (!data.available) {
            setError("Пользователь с таким email уже существует");
            return;
          }
        } catch (checkError) {
          setError(
            checkError instanceof Error
              ? normalizeErrorMessage(checkError.message)
              : "Не удалось проверить email",
          );
          return;
        } finally {
          setIsCheckingEmail(false);
        }
      }
    }

    setStep((prev) => Math.min(prev + 1, 3));
  }

  function prevStep() {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  }

  async function submitOnboarding(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!plan) {
      setError("Выберите тариф на последнем шаге.");
      return;
    }

    setIsSubmitting(true);

    const derivedEmail = email.trim() || `${phone.replace(/\D/g, "") || "user"}@phone.local`;
    const derivedUserType = Number(rooms) >= 3 ? "family" : "young_professional";

    const profile = {
      name,
      email: derivedEmail,
      phone,
      address,
      housingType,
      area,
      rooms,
      plan,
      role,
    };

    try {
      const registerResponse = await fetch(buildApiUrl("/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: derivedEmail,
          phone: phone || undefined,
          userType: derivedUserType,
          role,
          password,
        }),
      });

      if (!registerResponse.ok) {
        const data = (await registerResponse.json()) as { message?: string | string[] };
        const message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message ?? (registerResponse.status === 409
              ? "Пользователь с таким email уже существует"
              : "Не удалось зарегистрироваться");
        throw new Error(normalizeErrorMessage(message));
      }

      const loginResponse = await fetch(buildApiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: derivedEmail,
          password,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error("Не удалось выполнить вход после регистрации");
      }

      const loginData = (await loginResponse.json()) as {
        accessToken: string;
        user: { role?: UserRole };
      };

      localStorage.setItem("accessToken", loginData.accessToken);
      localStorage.setItem("currentUser", JSON.stringify(loginData.user));
      document.cookie = `accessToken=${loginData.accessToken}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      document.cookie = `userRole=${loginData.user.role ?? role}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      localStorage.setItem("onboardingProfile", JSON.stringify(profile));
      const targetByRole: Record<UserRole, string> = {
        user: "/profile",
        cleaner: "/cleaner",
        admin: "/admin",
      };
      router.push(targetByRole[role]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? normalizeErrorMessage(submitError.message)
          : "Не удалось завершить онбординг",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-28 pt-8 md:px-8">
      <section className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-[0_20px_50px_rgba(3,8,20,0.08)] backdrop-blur animate-[fadeUp_400ms_ease-out]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">
            HomeFlow
          </p>
          <Link href="/" className="text-sm font-medium text-zinc-600 underline underline-offset-4">
            На главную
          </Link>
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
          Регистрация и мини-онбординг
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          3 шага: аккаунт, параметры жилья и стартовый тариф.
        </p>

        <div className="mt-6 h-2 w-full rounded-full bg-zinc-200">
          <div
            className="h-2 rounded-full bg-[var(--brand)] transition-all duration-300"
            style={{ width: progress }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">Шаг {step} из 3</p>

        <form className="mt-6 space-y-5" onSubmit={submitOnboarding}>
          {step === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium">Имя</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-[var(--brand)] focus:ring"
                  placeholder="Иван"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-[var(--brand)] focus:ring"
                  placeholder="you@email.com"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Телефон</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-[var(--brand)] focus:ring"
                  placeholder="+7 900 000 00 00"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Пароль</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-[var(--brand)] focus:ring"
                  placeholder="Минимум 6 символов"
                  required
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium">Адрес</span>
                <input
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-[var(--brand)] focus:ring"
                  placeholder="Москва, ул. Примерная, д. 10"
                  required
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium">Кто вы в системе</span>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-[var(--brand)] focus:ring"
                >
                  <option value="user">Заказчик</option>
                  <option value="cleaner">Исполнитель</option>
                  <option value="admin">Администратор</option>
                </select>
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Тип жилья</span>
                <select
                  value={housingType}
                  onChange={(event) => setHousingType(event.target.value as HousingType)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-[var(--brand)] focus:ring"
                >
                  <option>Квартира</option>
                  <option>Дом</option>
                  <option>Офис</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Площадь, м2</span>
                <input
                  type="number"
                  min={10}
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-[var(--brand)] focus:ring"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Комнат</span>
                <input
                  type="number"
                  min={1}
                  value={rooms}
                  onChange={(event) => setRooms(event.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-[var(--brand)] focus:ring"
                />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { id: "1", title: "1 раз/мес", text: "Базовый ритм" },
                { id: "2", title: "2 раза/мес", text: "Оптимальный" },
                { id: "4", title: "4 раза/мес", text: "Максимальный комфорт" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlan(item.id as PlanType)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    plan === item.id
                      ? "border-[var(--brand)] bg-[var(--brand)]/10"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <p className="text-base font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-600">{item.text}</p>
                </button>
              ))}
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex flex-wrap justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Назад
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={isCheckingEmail}
                className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isCheckingEmail ? "Проверяем email..." : "Следующий шаг"}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !plan}
                className="rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                {isSubmitting ? "Создаем аккаунт..." : "Зарегистрироваться"}
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
