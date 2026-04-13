"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const items = [
  { href: "/subscription", label: "Подписка" },
  { href: "/schedule", label: "График" },
  { href: "/billing", label: "Оплата" },
  { href: "/profile", label: "Профиль" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    const approved = window.confirm("Выйти из аккаунта?");
    if (!approved) return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
    document.cookie = "accessToken=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    document.cookie = "userRole=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    router.replace("/login");
    router.refresh();
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto mb-4 w-[calc(100%-2rem)] max-w-3xl rounded-2xl border border-white/60 bg-white/80 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur">
      <ul className="grid grid-cols-5 gap-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-xl px-3 py-2 text-center text-sm font-medium transition ${
                  active
                    ? "bg-[var(--brand)] text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={logout}
            className="block w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Выйти
          </button>
        </li>
      </ul>
    </nav>
  );
}
