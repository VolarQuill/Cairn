import { json, fail, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { explainConcept } from "@/lib/ai/prompts";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export const POST = guard(async (req: Request, ctx: any) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const id: string = ctx.params.id;
  const db = await getDb();
  const lesson = await db.getLesson(id);
  if (!lesson) return fail("Lesson not found.", 404);
  // ownership via course
  const course = await db.getCourse(lesson.course_id);
  if (!course || course.user_id !== user.id) return fail("Forbidden.", 403);

  const body = await req.json().catch(() => ({}));
  const style = String(body.style ?? "simple");
  const concept = String(body.concept ?? lesson.title);
  const explanation = await explainConcept({
    concept,
    style,
    context: `${lesson.title}\n${lesson.content}`,
  });
  return json({ explanation });
});
