"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import type { Friend } from "@/lib/types";

export function FriendsPanel({
  initial,
  me,
}: {
  initial: Friend[];
  me: { id: string; name: string; points: number };
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const board = [...initial, me].sort((a, b) => b.points - a.points);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not add friend.");
      } else {
        setEmail("");
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

      <div className="mt-3 space-y-1.5">
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
            Add friends below to see a friendly scoreboard.
          </p>
        )}
      </div>

      <form onSubmit={add} className="mt-4">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={120}
          />
          <button type="submit" className="btn-amber shrink-0" disabled={busy}>
            <Icon name="plus" className="inline h-4 w-4 align-middle" /> Add
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-terracotta-100">{error}</p>}
      </form>
    </div>
  );
}
