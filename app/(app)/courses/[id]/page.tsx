import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { CourseTabs } from "@/components/CourseTabs";
import { LessonOutline } from "@/components/LessonOutline";
import { LessonReader } from "@/components/LessonReader";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { lesson?: string };
}) {
  const user = await requireUser();
  const db = await getDb();
  const course = await db.getCourse(params.id);
  if (!course || course.user_id !== user.id) notFound();

  const lessons = await db.getLessons(params.id);
  const progress = await db.listProgress(user.id);
  const progressByLesson: Record<string, any> = {};
  for (const p of progress) {
    if (p.course_id === params.id) progressByLesson[p.lesson_id] = p;
  }

  const activeLesson =
    lessons.find((l) => l.id === searchParams.lesson) ?? lessons[0];

  if (!activeLesson) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-bark-100 dark:text-cream-200">This course has no lessons yet.</p>
        <Link href="/dashboard" className="btn-ghost mt-4">
          <Icon name="arrow-left" className="inline h-4 w-4 align-middle" /> Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/library" className="text-sm text-bark-50 hover:text-terracotta-100 dark:text-cream-300 dark:hover:text-terracotta-50">
          <Icon name="arrow-left" className="inline h-4 w-4 align-middle" /> Library
        </Link>
        <h1 className="truncate text-xl font-semibold">{course.title}</h1>
        <div className="w-16" />
      </div>

      <div className="mt-4">
        <CourseTabs courseId={course.id} lesson={activeLesson.id} />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
          <Suspense fallback={<div className="text-sm text-bark-50 dark:text-cream-300">Loading…</div>}>
            <LessonOutline
              courseId={course.id}
              lessons={lessons}
              progressByLesson={progressByLesson}
            />
          </Suspense>
        </aside>

        <section>
          <LessonReader
            lesson={activeLesson}
            courseId={course.id}
            lessons={lessons.map((l) => ({ id: l.id, title: l.title }))}
            initialProgress={progressByLesson[activeLesson.id]}
          />
        </section>
      </div>
    </div>
  );
}
