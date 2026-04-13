"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LandingAuthCta() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [homePath, setHomePath] = useState("/profile");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const currentUserRaw = localStorage.getItem("currentUser");
    setIsAuthorized(Boolean(token));

    if (currentUserRaw) {
      try {
        const parsed = JSON.parse(currentUserRaw) as { name?: string; role?: "user" | "cleaner" | "admin" };
        setUserName(parsed.name ?? null);
        if (parsed.role === "cleaner") setHomePath("/cleaner");
        else if (parsed.role === "admin") setHomePath("/admin");
        else setHomePath("/profile");
      } catch {
        setUserName(null);
      }
    }
  }, []);

  function logout() {
    const approved = window.confirm("Выйти из аккаунта?");
    if (!approved) return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
    document.cookie = "accessToken=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "userRole=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    setIsAuthorized(false);
    setUserName(null);
  }

  if (isAuthorized) {
    return (
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <span className="rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
          Вы авторизованы{userName ? `: ${userName}` : ""}
        </span>
        <Link
          href={homePath}
          className="rounded-xl bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white"
        >
          Перейти в кабинет
        </Link>
        <button
          type="button"
          onClick={logout}
          className="rounded-xl border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
        >
          Выйти
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href="/onboarding"
        className="rounded-xl bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white"
      >
        Начать за 2 минуты
      </Link>
      <Link
        href="/login"
        className="rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-800"
      >
        Войти
      </Link>
    </div>
  );
}
