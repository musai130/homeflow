"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LandingHeader() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [homePath, setHomePath] = useState("/profile");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const raw = localStorage.getItem("currentUser");
    const role = raw ? (JSON.parse(raw) as { role?: "user" | "cleaner" | "admin" }).role : undefined;
    setIsAuthorized(Boolean(token));
    if (role === "cleaner") setHomePath("/cleaner");
    else if (role === "admin") setHomePath("/admin");
    else setHomePath("/profile");
  }, []);

  function logout() {
    const approved = window.confirm("Выйти из аккаунта?");
    if (!approved) return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
    document.cookie = "accessToken=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "userRole=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    setIsAuthorized(false);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-3 z-40 mb-6 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a href="#hero" className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          HomeFlow
        </a>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <a href="#how-it-works" className="rounded-lg px-3 py-2 text-zinc-700 hover:bg-zinc-100">
            Как это работает
          </a>
          <a href="#features" className="rounded-lg px-3 py-2 text-zinc-700 hover:bg-zinc-100">
            Преимущества
          </a>
          <a href="#plans" className="rounded-lg px-3 py-2 text-zinc-700 hover:bg-zinc-100">
            Тарифы
          </a>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          {isAuthorized ? (
            <>
              <Link
                href={homePath}
                className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
              >
                Кабинет
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
              >
                Войти
              </Link>
              <Link
                href="/onboarding"
                className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
