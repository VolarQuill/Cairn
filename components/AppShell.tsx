"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Icon, type IconName } from "@/components/icons";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/library", label: "Library", icon: "books" },
  { href: "/create", label: "New course", icon: "plus" },
  { href: "/settings", label: "Settings", icon: "gear" },
];

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const sidebar = (
    <div className="flex h-full flex-col bg-forest-300 px-4 py-5 text-cream-50">
      <div className="px-2">
        <Logo href="/dashboard" withWord />
      </div>
      <nav className="mt-7 flex-1 space-y-1">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive(n.href)
                ? "bg-amber-100 text-bark-300"
                : "text-cream-100/85 hover:bg-cream-50/10"
            }`}
          >
            <Icon name={n.icon} size={18} className="shrink-0" />
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="mt-4 rounded-xl bg-cream-50/5 p-3">
        <div className="truncate text-sm font-semibold">{user.name}</div>
        <div className="truncate text-xs text-cream-100/60">{user.email}</div>
        <button
          onClick={signOut}
          className="mt-2 w-full rounded-lg border border-cream-50/20 px-3 py-1.5 text-xs font-medium hover:bg-cream-50/10"
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
        <div className="flex items-center justify-between border-b border-cream-300 bg-forest-300 px-4 py-3 text-cream-50">
          <Logo href="/dashboard" />
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg px-2 py-1 text-2xl leading-none"
          >
            {open ? <Icon name="close" size={22} /> : <Icon name="menu" size={22} />}
          </button>
        </div>
        {open && <div className="md:hidden">{sidebar}</div>}
      </div>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
