"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    userType: "young_professional" | "family";
    role: "user" | "cleaner" | "admin";
  };
}

function roleHome(role: LoginResponse["user"]["role"] | undefined): string {
  if (role === "cleaner") return "/cleaner";
  if (role === "admin") return "/admin";
  return "/profile";
}

export default function LoginPage() {
  const router = useRouter();
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
    [],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      const raw = localStorage.getItem("currentUser");
      const role = raw ? (JSON.parse(raw) as { role?: LoginResponse["user"]["role"] }).role : undefined;
      router.replace(roleHome(role));
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as
        | LoginResponse
        | { message?: string | string[] };

      if (!response.ok) {
        const apiMessage =
          "message" in data && data.message !== undefined
            ? data.message
            : undefined;
        const message = Array.isArray(apiMessage)
          ? apiMessage.join(", ")
          : apiMessage ?? "Login failed";
        throw new Error(message);
      }

      const result = data as LoginResponse;
      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("currentUser", JSON.stringify(result.user));
      document.cookie = `accessToken=${result.accessToken}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      document.cookie = `userRole=${result.user.role}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      const nextPath =
        new URLSearchParams(window.location.search).get("next") ?? roleHome(result.user.role);
      router.push(nextPath);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Login failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-white/70 bg-white/85 p-7 shadow-[0_20px_50px_rgba(3,8,20,0.10)] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">HomeFlow</p>
          <Link href="/" className="text-sm font-medium text-zinc-600 underline underline-offset-4">
            На главную
          </Link>
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-900">Вход в личный кабинет</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Введите email и пароль, чтобы управлять подпиской, графиком и оплатой.
        </p>

        <form className="mt-7 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-[var(--brand)] focus:ring"
              placeholder="you@email.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Пароль</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 outline-none ring-[var(--brand)] focus:ring"
              placeholder="Минимум 6 символов"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Входим..." : "Войти"}
          </button>
        </form>

        <p className="mt-5 text-sm text-zinc-700">
          Нет аккаунта?{" "}
          <Link href="/onboarding" className="font-semibold underline">
            Пройти регистрацию
          </Link>
        </p>
      </section>
    </main>
  );
}
