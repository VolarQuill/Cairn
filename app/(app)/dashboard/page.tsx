import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { CourseCard } from "@/components/CourseCard";
import { MasteryBadge } from "@/components/MasteryBadge";
import { Logo } from "@/components/Logo";
import { Icon, type IconName } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const db = await getDb();
  const courses = await db.listCourses(user.id);

  const lessonCounts: Record<string, number> = {};
  const lessonMeta = new Map<
    string,
    { title: string; courseId: string; courseTitle: string }
  >();
  for (const c of courses) {
    const lessons = await db.getLessons(c.id);
    lessonCounts[c.id] = lessons.length;
    for (const l of lessons)
      lessonMeta.set(l.id, { title: l.title, courseId: c.id, courseTitle: c.title });
  }

  const progress = await db.listProgress(user.id);
  const totalLessons = Object.values(lessonCounts).reduce((a, b) => a + b, 0);
  const mastered = progress.filter((p) => p.status === "mastered").length;
  const dueNow = progress.filter(
    (p) => p.status !== "mastered" && new Date(p.due_at).getTime() <= Date.now()
  );
  const studied = progress.filter((p) => p.status !== "new").length;

  const stats: { label: string; value: number; icon: IconName }[] = [
    { label: "Courses", value: courses.length, icon: "books" },
    { label: "Lessons", value: totalLessons, icon: "book-open" },
    { label: "Studied", value: studied, icon: "pen" },
    { label: "Mastered", value: mastered, icon: "tree" },
  ];

  const recent = courses.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Hello, {user.name.split(" ")[0]} <Icon name="wave" size={26} className="inline text-amber-100 align-middle" /></h1>
          <p className="mt-1 text-bark-100">Here&apos;s where your learning stands.</p>
        </div>
        <Link href="/create" className="btn-amber">
          <Icon name="plus" className="inline h-4 w-4 align-middle" /> New course
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <Icon name={s.icon} size={22} className="text-forest-200" />
            <div className="mt-1 font-display text-3xl text-forest-200">{s.value}</div>
            <div className="text-sm text-bark-50">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-9 grid gap-8 lg:grid-cols-3">
        {/* Recent courses */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl">Your courses</h2>
            {courses.length > 6 && (
              <Link href="/library" className="text-sm text-terracotta-100 hover:text-terracotta-200">
                View all <Icon name="arrow-right" className="inline h-4 w-4 align-middle" />
              </Link>
            )}
          </div>
          {recent.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {recent.map((c) => (
                <CourseCard key={c.id} course={c} lessonCount={lessonCounts[c.id]} />
              ))}
            </div>
          )}
        </div>

        {/* Due for review */}
        <div>
          <h2 className="text-2xl">Due for review</h2>
          <p className="mt-1 text-sm text-bark-100">
            {dueNow.length === 0
              ? "All caught up — nice work."
              : "A few lessons are ready for a quick refresher."}
          </p>
          <div className="mt-4 space-y-3">
            {dueNow.slice(0, 6).map((p) => {
              const meta = lessonMeta.get(p.lesson_id);
              if (!meta) return null;
              return (
                <Link
                  key={p.id}
                  href={`/courses/${meta.courseId}`}
                  className="card flex items-center justify-between p-3.5 hover:shadow-lift"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{meta.title}</div>
                    <div className="truncate text-xs text-bark-50">{meta.courseTitle}</div>
                  </div>
                  <MasteryBadge status={p.status} />
                </Link>
              );
            })}
            {dueNow.length === 0 && (
              <div className="card flex items-center gap-3 p-4 text-sm text-bark-100">
                <Icon name="leaf" size={22} className="text-moss-100" /> Nothing due. Your brain thanks you.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <Logo size={44} withWord={false} href={null} />
      <h3 className="text-xl">No courses yet</h3>
      <p className="max-w-sm text-sm text-bark-100">
        Turn an article, a document, a link, or a topic into a structured course in
        under a minute.
      </p>
      <Link href="/create" className="btn-amber mt-1">
        <Icon name="plus" className="inline h-4 w-4 align-middle" /> Create your first course
      </Link>
    </div>
  );
}
