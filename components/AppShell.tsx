"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Icon, type IconName } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { rankForPoints } from "@/lib/ranks";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/library", label: "Library", icon: "books" },
  { href: "/review", label: "Review", icon: "repeat" },
  { href: "/friends", label: "Friends", icon: "users" },
  { href: "/leaderboard", label: "Leaderboard", icon: "target" },
  { href: "/create", label: "New course", icon: "plus" },
  { href: "/settings", label: "Settings", icon: "gear" },
];

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string; points?: number };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const me = rankForPoints(user.points ?? 0);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col bg-gradient-to-b from-forest-300 to-forest-400 px-4 py-5 text-cream-50 shadow-lift">
      <div className="flex items-center justify-between px-2">
        <Logo href="/dashboard" withWord />
        <ThemeToggle />
      </div>
      <div className="mt-5 h-px bg-cream-50/10" />
      <nav className="mt-5 flex-1 space-y-1.5">
        {NAV.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              data-active={active ? "true" : undefined}
              className={`nav-dot group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-amber-100 text-bark-300 shadow-soft"
                  : "text-cream-100/80 hover:bg-cream-50/10 hover:text-cream-50"
              }`}
            >
              <Icon
                name={n.icon}
                size={18}
                className={`shrink-0 transition-transform group-hover:scale-110 ${
                  active ? "text-bark-300" : "text-amber-50"
                }`}
              />
              <span className="nav-underline">{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 rounded-2xl border border-cream-50/10 bg-cream-50/5 p-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 font-display text-sm font-semibold text-bark-300">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user.name}</div>
            <div className="truncate text-xs text-cream-100/60">{user.email}</div>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-cream-100/70">
              <Icon name={me.tier.icon as IconName} size={13} className="text-amber-50" />
              <span>{me.tier.name} · {user.points ?? 0} pts</span>
            </div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="mt-3 w-full rounded-lg border border-cream-50/20 px-3 py-1.5 text-xs font-medium text-cream-100/90 transition hover:border-terracotta-50 hover:bg-terracotta-100 hover:text-cream-50"
        >
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 md:block">{sidebar}</aside>

      {/* Mobile top bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between border-b border-cream-300/70 bg-forest-300 px-4 py-3 text-cream-50 dark:border-cream-300/10">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg px-2 py-1 text-2xl leading-none"
            >
              {open ? <Icon name="close" size={22} /> : <Icon name="menu" size={22} />}
            </button>
          </div>
        </div>
        {open && <div className="md:hidden">{sidebar}</div>}
      </div>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
