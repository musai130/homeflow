"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

interface MeResponse {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export default function MePage() {
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
    [],
  );

  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setProfile(null);
      setError("No token found. Please login first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json()) as
        | MeResponse
        | { message?: string | string[] };

      if (!response.ok) {
        const apiMessage =
          "message" in data && data.message !== undefined
            ? data.message
            : undefined;
        const message = Array.isArray(apiMessage)
          ? apiMessage.join(", ")
          : apiMessage ?? "Failed to fetch profile";
        throw new Error(message);
      }

      setProfile(data as MeResponse);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Failed to fetch profile";
      setProfile(null);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
    document.cookie = "accessToken=; Path=/; Max-Age=0; SameSite=Lax";
    setProfile(null);
    setError("Logged out.");
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold">My Profile</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Loads user data from protected endpoint <code>/auth/me</code>.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={fetchProfile}
          disabled={isLoading}
          className="rounded-md bg-black px-4 py-2 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Loading..." : "Load profile"}
        </button>
        <button
          onClick={logout}
          className="rounded-md border border-zinc-300 px-4 py-2 font-medium text-zinc-800 transition hover:bg-zinc-100"
        >
          Logout
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {profile ? (
        <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <p>
            <span className="font-semibold">ID:</span> {profile.id}
          </p>
          <p className="mt-2">
            <span className="font-semibold">Email:</span> {profile.email}
          </p>
          <p className="mt-2">
            <span className="font-semibold">Created:</span> {profile.createdAt}
          </p>
          <p className="mt-2">
            <span className="font-semibold">Updated:</span> {profile.updatedAt}
          </p>
        </div>
      ) : null}

      <p className="mt-8 text-sm text-zinc-700">
        <Link href="/login" className="font-semibold underline">
          Go to login
        </Link>{" "}
        or{" "}
        <Link href="/register" className="font-semibold underline">
          create account
        </Link>
        .
      </p>
    </main>
  );
}
