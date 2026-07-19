"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import type { Friend, UserSearch } from "@/lib/types";

export function FriendsPanel({
  initial,
  me,
}: {
  initial: Friend[];
  me: { id: string; name: string; points: number };
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearch[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const board = [...initial, me].sort((a, b) => b.points - a.points);

  // Live, type-ahead search — refetch as the user types (debounced).
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/friends?q=${encodeURIComponent(q)}`);
        const data = await res.json().catch(() => ({}));
        setResults(data.results ?? []);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  async function addById(id: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not add friend.");
      } else {
        setQuery("");
        setResults([]);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/friends?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <Icon name="target" size={18} className="text-amber-100" />
        <h3 className="text-lg font-semibold">Friends scoreboard</h3>
      </div>

      {/* Type-ahead search */}
      <div className="relative mt-4">
        <div className="flex items-center gap-2 rounded-lg border border-cream-300 bg-cream-50 px-2.5 py-1.5 dark:border-cream-300/20 dark:bg-forest-300/40">
          <Icon name="users" size={16} className="shrink-0 text-bark-50 dark:text-cream-300" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-bark-50/70 dark:placeholder:text-cream-300/50"
            placeholder="Search username or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={60}
          />
        </div>
        {query.trim() && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-cream-300 bg-cream-50 shadow-lift dark:border-cream-300/20 dark:bg-forest-300">
            {results.length === 0 && !searching && (
              <div className="px-3 py-2 text-sm text-bark-50 dark:text-cream-300">
                No matches.
              </div>
            )}
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => addById(r.id)}
                disabled={busy}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition hover:bg-cream-200/60 dark:hover:bg-forest-200/40"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{r.name}</span>
                  <span className="block truncate text-xs text-bark-50 dark:text-cream-300">
                    @{r.username || r.email}
                  </span>
                </span>
                <Icon name="plus" size={15} className="shrink-0 text-forest-200 dark:text-moss-50" />
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-terracotta-100">{error}</p>}

      {/* Scoreboard */}
      <div className="mt-4 space-y-1.5">
        {board.map((f, i) => {
          const isMe = f.id === me.id;
          return (
            <div
              key={f.id}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${
                isMe ? "bg-amber-100/15" : ""
              }`}
            >
              <span className="w-5 text-center text-sm font-display text-bark-50 dark:text-cream-300">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {f.name}
                {isMe && " (you)"}
              </span>
              <span className="font-display text-sm text-forest-200 dark:text-moss-50">
                {f.points}
              </span>
              {!isMe && (
                <button
                  onClick={() => remove(f.id)}
                  aria-label={`Remove ${f.name}`}
                  className="rounded p-1 text-cream-200 transition hover:text-terracotta-100 dark:text-cream-300/60"
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          );
        })}
        {board.length <= 1 && (
          <p className="px-1 py-2 text-xs text-bark-50 dark:text-cream-300">
            Search above to add friends and compare scores.
          </p>
        )}
      </div>
    </div>
  );
}
