"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lesson, Progress, Mastery } from "@/lib/types";
import { Markdown } from "@/components/Markdown";
import { MasteryBadge } from "@/components/MasteryBadge";
import { ExplainPanel } from "@/components/ExplainPanel";
import { Icon } from "@/components/icons";

const GRADES: { grade: 0 | 1 | 2 | 3; label: string; cls: string }[] = [
  { grade: 0, label: "Again", cls: "btn-terra" },
  { grade: 1, label: "Hard", cls: "btn-ghost" },
  { grade: 2, label: "Good", cls: "btn-primary" },
  { grade: 3, label: "Easy", cls: "btn-amber" },
];

export function LessonReader({
  lesson,
  courseId,
  initialProgress,
}: {
  lesson: Lesson;
  courseId: string;
  initialProgress?: Progress;
}) {
  const [progress, setProgress] = useState<Progress | undefined>(initialProgress);
  const [busy, setBusy] = useState(false);
  const [due, setDue] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function grade(g: 0 | 1 | 2 | 3) {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, courseId, grade: g }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      setProgress(data.progress);
      const d = new Date(data.progress.due_at);
      setDue(d.toLocaleString(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" }));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article>
      <div className="flex flex-wrap items-center gap-3">
        <span className="chip">{lesson.module_title}</span>
        {progress && <MasteryBadge status={progress.status} />}
      </div>
      <h1 className="mt-3 text-3xl">{lesson.title}</h1>
      <div className="mt-1 flex items-center gap-3 text-sm text-bark-50 dark:text-cream-300">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="clock" className="h-4 w-4" /> {lesson.est_minutes} min
        </span>
        {due && <span>· Next review: {due}</span>}
      </div>

      <Markdown className="mt-5">{lesson.content}</Markdown>

      {/* Objectives */}
      {lesson.objectives?.length > 0 && (
        <div className="card mt-6 p-5">
          <h3 className="text-lg">Learning objectives</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-bark-100 dark:text-cream-200">
            {lesson.objectives.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Key terms */}
      {lesson.key_terms?.length > 0 && (
        <div className="card mt-4 p-5">
          <h3 className="text-lg">Key terms</h3>
          <dl className="mt-2 space-y-2">
            {lesson.key_terms.map((t, i) => (
              <div key={i} className="border-b border-cream-300 pb-2 last:border-0 dark:border-forest-200/30">
                <dt className="font-semibold text-forest-200 dark:text-moss-50">{t.term}</dt>
                <dd className="text-sm text-bark-100 dark:text-cream-200">{t.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <ExplainPanel lessonId={lesson.id} lessonTitle={lesson.title} />

      {/* Actions */}
      <div className="card mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg">How well did this stick?</h3>
          <p className="text-sm text-bark-50 dark:text-cream-300">
            Rate it and Cairn schedules your next review.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              onClick={() => grade(g.grade)}
              disabled={busy}
              className={`${g.cls} px-4 py-2`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={`/courses/${courseId}/practice?lesson=${lesson.id}`} className="btn-primary">
          <Icon name="target" className="inline h-4 w-4 align-middle" /> Quiz this lesson
        </Link>
        <Link href={`/courses/${courseId}/chat`} className="btn-ghost">
          <Icon name="chat" className="inline h-4 w-4 align-middle" /> Ask the tutor
        </Link>
      </div>

      {err && <p className="mt-3 text-sm text-terracotta-200 dark:text-terracotta-100">{err}</p>}
    </article>
  );
}
