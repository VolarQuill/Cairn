"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // 30s cooldown after a failed attempt so the button can't be spammed.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign in failed.");
      // Navigate and stay in the "Signing in…" state until the page actually
      // unmounts. router.push is fire-and-forget, so resetting `loading` in a
      // `finally` here flipped the button back to "Sign in" while the redirect
      // was still in flight — making a successful login look like a failure.
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      setCooldown(30);
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-10 dark:bg-forest-400">
      <div className="absolute right-4 top-4 z-10"><ThemeToggle /></div>
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo size={40} />
        </div>
        <div className="card p-7">
          <h1 className="text-2xl">Welcome back</h1>
          <p className="mt-1 text-sm text-bark-100 dark:text-cream-200">
            Sign in to keep building your courses.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-terracotta-200/40 bg-terracotta-50/10 px-3 py-2 text-sm text-terracotta-200 dark:border-terracotta-100/40 dark:bg-terracotta-100/10 dark:text-terracotta-100">
                {error}
              </div>
            )}
            <button type="submit" className="btn-amber w-full py-3" disabled={loading || cooldown > 0}>
              {loading ? "Signing in…" : cooldown > 0 ? `Wait ${cooldown}s` : "Sign in"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-bark-50 dark:text-cream-300">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-terracotta-100 hover:text-terracotta-200 dark:text-terracotta-50 dark:hover:text-terracotta-100">
              Create an account
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-bark-50 dark:text-cream-300">
          Running locally? Use the account you signed up with — it&apos;s stored on this machine.
        </p>
      </div>
    </main>
  );
}
