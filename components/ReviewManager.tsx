"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import type { Review } from "@/lib/types";

interface CourseLite {
  id: string;
  title: string;
  lessons: { id: string; title: string }[];
}

export function ReviewManager({
  courses,
  initialReviews,
}: {
  courses: CourseLite[];
  initialReviews: Review[];
}) {
  const [byLesson, setByLesson] = useState<Record<string, string>>(
    Object.fromEntries(initialReviews.map((r) => [r.lesson_id, r.id]))
  );
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  async function toggle(lessonId: string, courseId: string) {
    if (busy[lessonId]) return;
    const existing = byLesson[lessonId];
    setBusy((b) => ({ ...b, [lessonId]: true }));
    try {
      if (existing) {
        const res = await fetch(
          `/api/reviews?id=${encodeURIComponent(existing)}`,
          { method: "DELETE" }
        );
        if (res.ok)
          setByLesson((m) => {
            const n = { ...m };
            delete n[lessonId];
            return n;
          });
      } else {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lesson_id: lessonId, course_id: courseId }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.review) {
          setByLesson((m) => ({ ...m, [lessonId]: data.review.id }));
        }
      }
    } finally {
      setBusy((b) => ({ ...b, [lessonId]: false }));
    }
  }

  const totalMarked = Object.keys(byLesson).length;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl">Review list</h1>
        <Link
          href="/dashboard"
          className="text-sm text-bark-50 hover:text-terracotta-100 dark:text-cream-300"
        >
          Dashboard
        </Link>
      </div>
      <p className="mt-1 text-sm text-bark-100 dark:text-cream-200">
        Mark lessons you want to revisit. They&apos;ll show up in your
        dashboard&apos;s &ldquo;Needs review&rdquo; panel.
      </p>

      <div className="mb-2 mt-4 text-sm font-semibold text-bark-50 dark:text-cream-300">
        {totalMarked} marked for review
      </div>

      <div className="space-y-6">
        {courses.map((c) => (
          <div key={c.id}>
            <h2 className="mb-2 text-lg font-semibold">{c.title}</h2>
            {c.lessons.length === 0 ? (
              <p className="text-sm text-bark-50 dark:text-cream-300">
                No lessons yet.
              </p>
            ) : (
              <div className="card divide-y divide-cream-200 dark:divide-forest-200/40">
                {c.lessons.map((l) => {
                  const marked = Boolean(byLesson[l.id]);
                  return (
                    <button
                      key={l.id}
                      onClick={() => toggle(l.id, c.id)}
                      disabled={busy[l.id]}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-cream-200/40 dark:hover:bg-forest-200/30"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">
                        {l.title}
                      </span>
                      <span
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          marked
                            ? "bg-forest-200/20 text-forest-200 dark:bg-moss-50/20 dark:text-moss-50"
                            : "bg-cream-200 text-bark-50 dark:bg-forest-200/40 dark:text-cream-300"
                        }`}
                      >
                        <Icon name={marked ? "check" : "plus"} size={13} />
                        {marked ? "Marked" : "Review"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {courses.length === 0 && (
          <div className="card p-6 text-center text-sm text-bark-100 dark:text-cream-200">
            You have no courses yet. Create one to start building a review list.
          </div>
        )}
      </div>
    </div>
  );
}
