import { json, fail, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = guard(async (_req: Request, ctx: any) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const id: string = ctx.params.id;
  const db = await getDb();
  const course = await db.getCourse(id);
  if (!course || course.user_id !== user.id)
    return fail("Course not found.", 404);
  const [lessons, quizzes, progress] = await Promise.all([
    db.getLessons(id),
    db.listQuizzes(id),
    db.listProgress(user.id),
  ]);
  const progressByLesson: Record<string, any> = {};
  for (const p of progress) {
    if (p.course_id === id) progressByLesson[p.lesson_id] = p;
  }
  return json({ course, lessons, quizzes, progressByLesson });
});

export const PATCH = guard(async (req: Request, ctx: any) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const id: string = ctx.params.id;
  const db = await getDb();
  const course = await db.getCourse(id);
  if (!course || course.user_id !== user.id)
    return fail("Course not found.", 404);
  const body = await req.json().catch(() => ({}));
  const patch: any = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.goal === "string") patch.goal = body.goal;
  if (typeof body.description === "string") patch.description = body.description;
  if (["ready", "archived", "draft"].includes(body.status))
    patch.status = body.status;
  const updated = await db.updateCourse(id, patch);
  return json({ course: updated });
});

export const DELETE = guard(async (_req: Request, ctx: any) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const id: string = ctx.params.id;
  const db = await getDb();
  const course = await db.getCourse(id);
  if (!course || course.user_id !== user.id)
    return fail("Course not found.", 404);
  await db.deleteCourse(id);
  return json({ ok: true });
});
