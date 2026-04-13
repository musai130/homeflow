"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CustomerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile");
  }, [router]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-8 md:px-8">
      <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_50px_rgba(3,8,20,0.08)] backdrop-blur">
        <p className="text-sm text-zinc-600">Переадресуем в профиль...</p>
      </section>
    </main>
  );
}
