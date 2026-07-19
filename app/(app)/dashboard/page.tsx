import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { CourseCard } from "@/components/CourseCard";
import { Logo } from "@/components/Logo";
import { Icon, type IconName } from "@/components/icons";
import { rankForPoints } from "@/lib/ranks";
import { PersonalGoals } from "@/components/PersonalGoals";
import { FriendsPanel } from "@/components/FriendsPanel";
import { dailyServerGoal, progressFor, activityTotal, clientProgressCurrent } from "@/lib/goals";
import type { GoalMetric, GoalWithProgress } from "@/lib/types";

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

  const me = rankForPoints(user.points ?? 0);
  const totalLessons = Object.values(lessonCounts).reduce((a, b) => a + b, 0);
  const allProgress = await db.listProgress(user.id);
  const mastered = allProgress.filter((p) => p.status === "mastered").length;

  // Goals: today's server-set challenge (earns points) + the user's personal goals.
  const serverGoal = dailyServerGoal();
  const serverCurrent = await db.activityToday(user.id, serverGoal.metric);
  const serverWithProgress = progressFor(serverGoal, serverCurrent);
  serverWithProgress.awarded = (user.awarded_goals ?? []).includes(serverGoal.id);

  const clientRaw = await db.listClientGoals(user.id);
  const clientInitial: GoalWithProgress[] = [];
  for (const g of clientRaw) {
    const cur = await activityTotal(db, user.id, g.metric);
    clientInitial.push(progressFor(g, clientProgressCurrent(cur, g)));
  }

  // Friends (for the right-rail scoreboard) + reviews (flagged lessons).
  const friends = await db.listFriends(user.id);
  const reviews = await db.listReviews(user.id);

  const stats: { label: string; value: number; icon: IconName }[] = [
    { label: "Courses", value: courses.length, icon: "books" },
    { label: "Lessons", value: totalLessons, icon: "book-open" },
    { label: "Mastered", value: mastered, icon: "tree" },
  ];

  const recent = courses.slice(0, 6);
  const courseChoices = courses.map((c) => ({ id: c.id, title: c.title }));

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">
            Hello, {user.name.split(" ")[0]}{" "}
            <Icon name="wave" size={26} className="inline text-amber-100 align-middle" />
          </h1>
          <p className="mt-1 text-bark-100 dark:text-cream-200">
            Here&apos;s where your learning stands.
          </p>
        </div>
        <Link href="/create" className="btn-amber">
          <Icon name="plus" className="inline h-4 w-4 align-middle" /> New course
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <Icon name={s.icon} size={22} className="text-forest-200 dark:text-moss-50" />
            <div className="mt-1 font-display text-3xl text-forest-200 dark:text-moss-50">
              {s.value}
            </div>
            <div className="text-sm text-bark-50 dark:text-cream-300">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Your rank */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 card p-5">
        <div className="flex items-center gap-3">
          <Icon name={me.tier.icon as IconName} size={26} className="text-amber-100 shrink-0" />
          <div>
            <div className="text-lg font-semibold">{me.tier.name}</div>
            <div className="text-sm text-bark-50 dark:text-cream-300">
              {user.points ?? 0} points
              {me.next ? ` · ${me.toNext} to ${me.next.name}` : ""}
            </div>
          </div>
        </div>
        <Link href="/leaderboard" className="btn-ghost">
          View leaderboard <Icon name="arrow-right" className="inline h-4 w-4 align-middle" />
        </Link>
      </div>

      <div className="mt-9 grid gap-8 lg:grid-cols-3 lg:gap-0 lg:min-h-screen">
        {/* Main column */}
        <div className="space-y-9 lg:col-span-2 lg:pr-8">
          {/* Goals */}
          <div>
            <h2 className="mb-3 text-2xl">Goals</h2>
            {/* Today's server-set challenge */}
            <div className="card flex flex-col p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-amber-100/15 px-2.5 py-1 text-xs font-medium text-amber-100">
                    Set by Cairn
                  </span>
                  {serverWithProgress.points > 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-forest-200 dark:text-moss-50">
                      <Icon name="rock" size={14} /> +{serverWithProgress.points} pts
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-semibold">{serverWithProgress.title}</h3>
                {serverWithProgress.description && (
                  <p className="mt-1 text-sm text-bark-100 dark:text-cream-200">
                    {serverWithProgress.description}
                  </p>
                )}
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-cream-200 dark:bg-forest-400">
                  <div
                    className={`h-full rounded-full transition-all ${
                      serverWithProgress.complete
                        ? "bg-forest-200 dark:bg-moss-50"
                        : "bg-amber-100"
                    }`}
                    style={{ width: `${serverWithProgress.pct}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-bark-50 dark:text-cream-300">
                    {serverWithProgress.complete
                      ? "Goal complete!"
                      : `${serverWithProgress.current} / ${serverWithProgress.target} ${metricNoun(
                          serverWithProgress.metric
                        )}`}
                  </span>
                  {serverWithProgress.awarded && (
                    <span className="flex items-center gap-1 font-medium text-forest-200 dark:text-moss-50">
                      <Icon name="check" size={14} /> Earned
                    </span>
                  )}
                </div>
              </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Recent courses */}
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-2xl">Your courses</h2>
                {courses.length > 6 && (
                  <Link
                    href="/library"
                    className="text-sm text-terracotta-100 hover:text-terracotta-200 dark:text-terracotta-50 dark:hover:text-terracotta-100"
                  >
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

            {/* Needs review (lessons the user flagged from the Review page) */}
            <div>
              <h2 className="text-2xl">Needs review</h2>
              <p className="mt-1 text-sm text-bark-100 dark:text-cream-200">
                {reviews.length === 0
                  ? "Nothing flagged yet."
                  : "Lessons you marked for a refresher."}
              </p>
              <div className="mt-4 space-y-3">
                {reviews.slice(0, 6).map((r) => {
                  const meta = lessonMeta.get(r.lesson_id);
                  if (!meta) return null;
                  return (
                    <Link
                      key={r.id}
                      href={`/courses/${meta.courseId}`}
                      className="card flex items-center justify-between gap-3 p-3.5 hover:shadow-lift hover-lift"
                    >
                      <div className="min-w-0">
                        <div className="break-words text-sm font-semibold leading-snug">
                          {meta.title}
                        </div>
                        <div className="break-words text-xs leading-snug text-bark-50 dark:text-cream-300">
                          {meta.courseTitle}
                        </div>
                      </div>
                      <Icon
                        name="arrow-right"
                        size={16}
                        className="shrink-0 text-bark-50 dark:text-cream-300"
                      />
                    </Link>
                  );
                })}
                {reviews.length === 0 && (
                  <div className="card flex items-center gap-3 p-4 text-sm text-bark-100 dark:text-cream-200">
                    <Icon name="leaf" size={22} className="shrink-0 text-moss-100 dark:text-moss-50" />
                    <span>
                      Flag lessons on the <span className="font-medium">Review</span> page to
                      fill this in.
                    </span>
                  </div>
                )}
                {reviews.length > 0 && (
                  <Link
                    href="/review"
                    className="block text-sm text-terracotta-100 hover:text-terracotta-200 dark:text-terracotta-50 dark:hover:text-terracotta-100"
                  >
                    Manage review list <Icon name="arrow-right" className="inline h-4 w-4 align-middle" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <aside className="space-y-6 lg:col-span-1 lg:border-l lg:border-cream-300 lg:pl-8 dark:lg:border-cream-300/10">
          <div>
            <h2 className="mb-3 text-2xl">Today&apos;s goal</h2>
            <div className="card flex flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-amber-100/15 px-2.5 py-1 text-xs font-medium text-amber-100">
                  Set by Cairn
                </span>
                {serverWithProgress.points > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-forest-200 dark:text-moss-50">
                    <Icon name="rock" size={14} /> +{serverWithProgress.points} pts
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-base font-semibold leading-snug">
                {serverWithProgress.title}
              </h3>
              {serverWithProgress.description && (
                <p className="mt-1 text-sm text-bark-100 dark:text-cream-200">
                  {serverWithProgress.description}
                </p>
              )}
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-cream-200 dark:bg-forest-400">
                <div
                  className={`h-full rounded-full transition-all ${
                    serverWithProgress.complete ? "bg-forest-200 dark:bg-moss-50" : "bg-amber-100"
                  }`}
                  style={{ width: `${serverWithProgress.pct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-bark-50 dark:text-cream-300">
                  {serverWithProgress.complete
                    ? "Goal complete!"
                    : `${serverWithProgress.current} / ${serverWithProgress.target} ${metricNoun(
                        serverWithProgress.metric
                      )}`}
                </span>
                {serverWithProgress.awarded && (
                  <span className="flex items-center gap-1 font-medium text-forest-200 dark:text-moss-50">
                    <Icon name="check" size={14} /> Earned
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Personal goals — created and shown only here in the side dashboard */}
          <PersonalGoals initial={clientInitial} courses={courseChoices} />

          <FriendsPanel
            initial={friends}
            me={{ id: user.id, name: user.name.split(" ")[0], points: user.points ?? 0 }}
          />
        </aside>
      </div>
    </div>
  );
}

function metricNoun(m: GoalMetric): string {
  switch (m) {
    case "quiz_questions":
      return "questions";
    case "quizzes":
      return "quizzes";
    case "lessons":
      return "lessons";
    case "courses":
      return "courses";
    default:
      return m;
  }
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <Logo size={44} withWord={false} href={null} />
      <h3 className="text-xl">No courses yet</h3>
      <p className="max-w-sm text-sm text-bark-100 dark:text-cream-200">
        Turn an article, a document, a link, or a topic into a structured course in
        under a minute.
      </p>
      <Link href="/create" className="btn-amber mt-1">
        <Icon name="plus" className="inline h-4 w-4 align-middle" /> Create your first course
      </Link>
    </div>
  );
}
