"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

/**
 * Small delete control that sits on top of a course card. It deliberately lives
 * OUTSIDE the card's click-through link (see CourseCard) so a click here never
 * navigates — it just confirms and deletes the course.
 */
export function DeleteCourseButton({
  courseId,
  title,
}: {
  courseId: string;
  title: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (
      !window.confirm(
        `Delete “${title}” and all of its lessons, quizzes, and progress? This can’t be undone.`
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not delete that course.");
      }
      router.refresh();
    } catch (err: any) {
      window.alert(err?.message || "Could not delete that course.");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      aria-label={`Delete ${title}`}
      title="Delete course"
      className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-cream-300 bg-cream-100/85 text-bark-100 opacity-0 transition hover:border-terracotta-200 hover:bg-terracotta-50 hover:text-terracotta-200 focus-visible:opacity-100 group-hover:opacity-100 dark:border-forest-200/40 dark:bg-forest-300/85 dark:text-cream-200 dark:hover:border-terracotta-200 dark:hover:bg-terracotta-100/20 dark:hover:text-terracotta-100"
    >
      <Icon name="trash" className="h-4 w-4" />
    </button>
  );
}
