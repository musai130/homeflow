"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { buildApiUrl } from "@/lib/api";

interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  userType: "young_professional" | "family";
  createdAt: string;
}

type UserRole = "user" | "cleaner" | "admin";

function roleHome(role: UserRole | undefined): string {
  if (role === "cleaner") return "/cleaner";
  if (role === "admin") return "/admin";
  return "/profile";
}

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<"young_professional" | "family">(
    "young_professional",
  );
  const [role, setRole] = useState<UserRole>("user");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      const raw = localStorage.getItem("currentUser");
      const savedRole = raw ? (JSON.parse(raw) as { role?: UserRole }).role : undefined;
      router.replace(roleHome(savedRole));
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl("/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone, userType, role, password }),
      });

      const data = (await response.json()) as
        | RegisterResponse
        | { message?: string | string[] };

      if (!response.ok) {
        const apiMessage =
          "message" in data && data.message !== undefined
            ? data.message
            : undefined;
        const message = Array.isArray(apiMessage)
          ? apiMessage.join(", ")
          : apiMessage ?? "Registration failed";
        throw new Error(message);
      }

      const result = data as RegisterResponse;
      setSuccess(
        `User ${result.email} registered successfully. Now you can log in.`,
      );
      setPassword("");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Registration failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Register</h1>
        <Link href="/" className="text-sm font-medium text-zinc-600 underline underline-offset-4">
          На главную
        </Link>
      </div>
      <p className="mt-2 text-sm text-zinc-600">
        Create a new account to use the API.
      </p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Name</span>
          <input
            type="text"
            required
            minLength={2}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
            placeholder="John Doe"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
            placeholder="user@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Phone (optional)</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
            placeholder="+7 900 000-00-00"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">User type</span>
          <select
            value={userType}
            onChange={(event) =>
              setUserType(event.target.value as "young_professional" | "family")
            }
            className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
          >
            <option value="young_professional">Young professional</option>
            <option value="family">Family</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
          >
            <option value="user">Customer</option>
            <option value="cleaner">Cleaner</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
            placeholder="password123"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-green-700">{success}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-black px-4 py-2 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-700">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold underline">
          Login
        </Link>
      </p>
    </main>
  );
}
