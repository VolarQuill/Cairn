"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import type { Difficulty, GoalWithProgress } from "@/lib/types";

const METRICS = [
  { value: "quiz_questions", label: "Quiz questions" },
  { value: "quizzes", label: "Quizzes" },
  { value: "lessons", label: "Lessons studied" },
  { value: "courses", label: "Courses created" },
] as const;

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

function metricLabel(m: string): string {
  return METRICS.find((x) => x.value === m)?.label.toLowerCase() ?? m;
}

export function PersonalGoals({
  initial,
  courses,
}: {
  initial: GoalWithProgress[];
  courses: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [metric, setMetric] = useState<string>("quiz_questions");
  const [target, setTarget] = useState("10");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [busy, setBusy] = useState(false);

  // searchable course picker
  const [courseOpen, setCourseOpen] = useState(false);
  const [courseQuery, setCourseQuery] = useState("");
  const [courseId, setCourseId] = useState<string | null>(null);
  const courseName = courses.find((c) => c.id === courseId)?.title ?? null;
  const courseMatches = courseQuery.trim()
    ? courses.filter((c) =>
        c.title.toLowerCase().includes(courseQuery.trim().toLowerCase())
      )
    : courses;

  // Award any server daily-goal points on mount (kept from the old widget).
  useEffect(() => {
    fetch("/api/goals/sync", { method: "POST" }).catch(() => {});
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          metric,
          target: Number(target),
          difficulty,
          course_id: courseId,
        }),
      });
      if (res.ok) {
        setTitle("");
        setTarget("10");
        setDifficulty("medium");
        setCourseId(null);
        setCourseQuery("");
        setCourseOpen(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  // Open the course's practice quiz for this goal (button 1).
  function startQuiz(g: GoalWithProgress) {
    if (g.course_id) router.push(`/courses/${g.course_id}/practice?from=goal`);
  }

  // Mark the goal as complete (button 2) — explicit, never auto-derived.
  async function markDone(g: GoalWithProgress) {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: g.id, done: true }),
    });
    if (res.ok) router.refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/goals?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) router.refresh();
  }

  return (
    <div>
      <h2 className="mb-3 text-2xl">Personal goal</h2>
      {initial.length === 0 ? (
        <div className="card p-4 text-sm text-bark-100 dark:text-cream-200">
          Set a personal goal below to track it here.
        </div>
      ) : (
        <div className="space-y-3">
          {initial.map((g) => (
            <div key={g.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 break-words text-sm font-semibold leading-snug">
                  {g.title}
                </span>
                {g.done && (
                  <Icon
                    name="check"
                    size={14}
                    className="mt-0.5 shrink-0 text-forest-200 dark:text-moss-50"
                  />
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-bark-50 dark:text-cream-300">
                {g.difficulty && (
                  <span className="rounded-full bg-cream-200 px-2 py-0.5 capitalize dark:bg-forest-200/40">
                    {g.difficulty}
                  </span>
                )}
                {g.course_id && (
                  <span className="truncate rounded-full bg-cream-200 px-2 py-0.5 dark:bg-forest-200/40">
                    {courseName ?? "course"}
                  </span>
                )}
                {!g.done && (
                  <span>
                    {g.current} / {g.target} {metricLabel(g.metric)}
                  </span>
                )}
                {g.done && <span className="font-medium text-forest-200 dark:text-moss-50">Completed</span>}
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cream-200 dark:bg-forest-400">
                <div
                  className={`h-full rounded-full ${
                    g.done ? "bg-forest-200 dark:bg-moss-50" : "bg-amber-100"
                  }`}
                  style={{ width: `${g.pct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                {!g.done ? (
                  <>
                    {g.course_id && (
                      <button
                        onClick={() => startQuiz(g)}
                        className="btn-amber flex-1 text-xs"
                        title="Practice this course's quiz"
                      >
                        <Icon name="target" className="inline h-3.5 w-3.5 align-middle" /> Complete
                      </button>
                    )}
                    <button
                      onClick={() => markDone(g)}
                      className="btn-ghost flex-1 text-xs"
                      title="Mark this goal as complete"
                    >
                      <Icon name="check" className="inline h-3.5 w-3.5 align-middle" /> Mark complete
                    </button>
                  </>
                ) : (
                  <span className="flex-1 text-xs font-medium text-forest-200 dark:text-moss-50">
                    <Icon name="check" className="inline h-3.5 w-3.5 align-middle" /> Completed
                  </span>
                )}
                <button
                  onClick={() => remove(g.id)}
                  aria-label="Delete goal"
                  className="rounded-lg border border-cream-300 px-2 py-1.5 text-cream-200 transition hover:border-terracotta-50 hover:text-terracotta-100 dark:border-forest-200/40"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add goal form */}
      <form onSubmit={add} className="card mt-4 space-y-2 p-4">
        <div className="text-sm font-semibold">New personal goal</div>
        <input
          className="input"
          placeholder="e.g. Finish the algebra course"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            className="input sm:w-1/2"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            {METRICS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            className="input sm:w-20"
            type="number"
            min={1}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <select
            className="input sm:w-28"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* searchable course picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCourseOpen((v) => !v)}
            className="input flex w-full items-center justify-between text-left"
          >
            <span
              className={
                courseName ? "" : "text-bark-50/70 dark:text-cream-300/50"
              }
            >
              {courseName ?? "Select course (optional)"}
            </span>
            <Icon
              name="arrow-right"
              size={14}
              className="rotate-90 text-bark-50 dark:text-cream-300"
            />
          </button>
          {courseOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-cream-300 bg-cream-50 shadow-lift dark:border-cream-300/20 dark:bg-forest-300">
              <input
                autoFocus
                className="w-full border-b border-cream-300 bg-transparent px-3 py-2 text-sm outline-none dark:border-cream-300/20"
                placeholder="Search courses…"
                value={courseQuery}
                onChange={(e) => setCourseQuery(e.target.value)}
              />
              <div className="max-h-44 overflow-y-auto">
                {courseMatches.length === 0 && (
                  <div className="px-3 py-2 text-sm text-bark-50 dark:text-cream-300">
                    No courses.
                  </div>
                )}
                {courseMatches.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      setCourseId(c.id);
                      setCourseOpen(false);
                      setCourseQuery("");
                    }}
                    className="block w-full truncate px-3 py-2 text-left text-sm transition hover:bg-cream-200/60 dark:hover:bg-forest-200/40"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="btn-amber w-full py-2 text-sm" disabled={busy}>
          <Icon name="plus" className="inline h-4 w-4 align-middle" /> Add goal
        </button>
      </form>
    </div>
  );
}
