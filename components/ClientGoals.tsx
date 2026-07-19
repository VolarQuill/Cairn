"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import type { GoalMetric, GoalWithProgress } from "@/lib/types";

const METRICS: { value: GoalMetric; label: string }[] = [
  { value: "quiz_questions", label: "Quiz questions" },
  { value: "quizzes", label: "Quizzes" },
  { value: "lessons", label: "Lessons studied" },
  { value: "courses", label: "Courses created" },
];

function metricLabel(m: GoalMetric): string {
  return METRICS.find((x) => x.value === m)?.label ?? m;
}

export function ClientGoals({ initial }: { initial: GoalWithProgress[] }) {
  const router = useRouter();
  const [goals, setGoals] = useState<GoalWithProgress[]>(initial);
  const [title, setTitle] = useState("");
  const [metric, setMetric] = useState<GoalMetric>("quiz_questions");
  const [target, setTarget] = useState("10");
  const [busy, setBusy] = useState(false);

  // Award any server goal completed outside a quiz (lessons, courses), and
  // refresh the point total / server goal if anything was earned.
  async function sync() {
    try {
      const res = await fetch("/api/goals/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.awardedPoints > 0) router.refresh();
      }
    } catch {
      /* non-fatal */
    }
  }

  useEffect(() => {
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    const res = await fetch("/api/goals");
    if (res.ok) {
      const data = await res.json();
      setGoals(data.client ?? []);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, metric, target: Number(target) }),
      });
      if (res.ok) {
        setTitle("");
        setTarget("10");
        setMetric("quiz_questions");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/goals?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) setGoals((g) => g.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-3">
      <form onSubmit={add} className="card p-4">
        <div className="mb-2 text-sm font-semibold">Set your own goal</div>
        <input
          className="input"
          placeholder="e.g. Finish the algebra course"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <select
            className="input sm:w-1/2"
            value={metric}
            onChange={(e) => setMetric(e.target.value as GoalMetric)}
          >
            {METRICS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            className="input sm:w-24"
            type="number"
            min={1}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <button type="submit" className="btn-amber shrink-0" disabled={busy}>
            <Icon name="plus" className="inline h-4 w-4 align-middle" /> Add
          </button>
        </div>
        <p className="mt-2 text-xs text-bark-50 dark:text-cream-300">
          Personal goals track your progress but don&apos;t earn points.
        </p>
      </form>

      {goals.length === 0 ? (
        <div className="card flex items-center gap-3 p-4 text-sm text-bark-100 dark:text-cream-200">
          <Icon name="target" size={20} className="text-moss-100 dark:text-moss-50" />
          No personal goals yet — set one above.
        </div>
      ) : (
        goals.map((g) => (
          <div key={g.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-semibold">{g.title}</div>
                <div className="text-xs capitalize text-bark-50 dark:text-cream-300">
                  {metricLabel(g.metric)} · target {g.target}
                </div>
              </div>
              <button
                onClick={() => remove(g.id)}
                aria-label="Delete goal"
                className="rounded-lg border border-cream-300 px-2 py-1 text-cream-200 transition hover:border-terracotta-50 hover:text-terracotta-100 dark:border-forest-200/40"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-cream-200 dark:bg-forest-400">
              <div
                className={`h-full rounded-full transition-all ${
                  g.complete ? "bg-forest-200 dark:bg-moss-50" : "bg-amber-100"
                }`}
                style={{ width: `${g.pct}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-bark-50 dark:text-cream-300">
              {g.complete ? (
                <span className="font-medium text-forest-200 dark:text-moss-50">
                  Completed
                </span>
              ) : (
                `${g.current} / ${g.target}`
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
