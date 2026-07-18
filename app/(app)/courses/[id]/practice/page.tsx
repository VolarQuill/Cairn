import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { CourseTabs } from "@/components/CourseTabs";
import { QuizRunner } from "@/components/QuizRunner";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function PracticePage({
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

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/library" className="text-sm text-bark-50 hover:text-terracotta-100">
          <Icon name="arrow-left" className="inline h-4 w-4 align-middle" /> Library
        </Link>
        <h1 className="truncate text-xl font-semibold">{course.title}</h1>
        <div className="w-16" />
      </div>

      <div className="mt-4">
        <CourseTabs courseId={course.id} lesson={searchParams.lesson} />
      </div>

      <div className="mt-6">
        <QuizRunner
          courseId={course.id}
          lessons={lessons.map((l) => ({ id: l.id, title: l.title }))}
          initialLessonId={searchParams.lesson}
        />
      </div>
    </div>
  );
}
