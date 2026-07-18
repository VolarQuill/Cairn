import { json, fail, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { schedule, Grade } from "@/lib/srs";
import type { Mastery } from "@/lib/types";

export const dynamic = "force-dynamic";

export const POST = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const body = await req.json().catch(() => ({}));
  const lessonId = String(body.lessonId ?? "");
  const courseId = String(body.courseId ?? "");
  if (!lessonId || !courseId) return fail("lessonId and courseId are required.");
  const db = await getDb();
  const course = await db.getCourse(courseId);
  if (!course || course.user_id !== user.id)
    return fail("Course not found.", 404);

  // Direct mastery set (dashboard / quick mark)
  if (typeof body.status === "string") {
    const status = body.status as Mastery;
    const p = await db.setMastery(user.id, lessonId, courseId, status);
    return json({ progress: p });
  }

  // Spaced-repetition grade (0=again,1=hard,2=good,3=easy)
  const grade = Math.max(0, Math.min(3, Number(body.grade))) as Grade;
  const prev = await db.getProgress(user.id, lessonId);
  const next = schedule(
    {
      ease: prev?.ease ?? 2.5,
      interval: prev?.interval ?? 0,
      reps: prev?.reps ?? 0,
      status: prev?.status ?? "new",
    },
    grade
  );
  const p = await db.upsertProgress({
    user_id: user.id,
    lesson_id: lessonId,
    course_id: courseId,
    ease: next.ease,
    interval: next.interval,
    reps: next.reps,
    due_at: next.due_at,
    status: next.status,
    last_reviewed_at: prev?.last_reviewed_at ?? null,
  });
  return json({ progress: p });
});

export const GET = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const db = await getDb();
  const progress = await db.listProgress(user.id);
  return json({ progress });
});
