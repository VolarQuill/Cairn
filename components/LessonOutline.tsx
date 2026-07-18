"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Lesson, Mastery } from "@/lib/types";

const DOT: Record<Mastery, string> = {
  new: "bg-bark-50",
  learning: "bg-amber-100",
  familiar: "bg-moss-100",
  mastered: "bg-forest-100",
};

export function LessonOutline({
  courseId,
  lessons,
  progressByLesson,
}: {
  courseId: string;
  lessons: Lesson[];
  progressByLesson: Record<string, { status: Mastery }>;
}) {
  const params = useSearchParams();
  const active = params.get("lesson");
  const firstId = lessons[0]?.id;

  const modules: { title: string; lessons: Lesson[] }[] = [];
  for (const l of lessons) {
    let m = modules.find((x) => x.title === l.module_title);
    if (!m) {
      m = { title: l.module_title, lessons: [] };
      modules.push(m);
    }
    m.lessons.push(l);
  }

  return (
    <nav className="space-y-5">
      {modules.map((m) => (
        <div key={m.title}>
          <div className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-bark-50">
            {m.title}
          </div>
          <div className="space-y-1">
            {m.lessons.map((l, i) => {
              const isActive = active === l.id || (!active && l.id === firstId);
              const p = progressByLesson[l.id];
              return (
                <Link
                  key={l.id}
                  href={`/courses/${courseId}?lesson=${l.id}`}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition ${
                    isActive
                      ? "bg-amber-50/30 font-semibold text-bark-300"
                      : "text-bark-100 hover:bg-cream-200"
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      p ? DOT[p.status] : "bg-cream-300"
                    }`}
                  />
                  <span className="truncate">{l.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
