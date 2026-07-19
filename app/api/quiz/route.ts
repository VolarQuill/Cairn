import { json, fail, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { generateQuiz } from "@/lib/ai/prompts";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export const POST = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const body = await req.json().catch(() => ({}));
  const courseId = String(body.courseId ?? "");
  const lessonId = body.lessonId ? String(body.lessonId) : null;
  const count = Math.min(30, Math.max(3, Number(body.count) || 10));
  if (!courseId) return fail("courseId is required.");

  const db = await getDb();
  const course = await db.getCourse(courseId);
  if (!course || course.user_id !== user.id)
    return fail("Course not found.", 404);

  let title = `${course.title} — Review`;
  let content = "";
  if (lessonId) {
    const lesson = await db.getLesson(lessonId);
    if (!lesson) return fail("Lesson not found.", 404);
    title = `${lesson.title} — Quiz`;
    content = lesson.content;
  } else {
    const lessons = await db.getLessons(courseId);
    content = lessons
      .slice(0, 4)
      .map((l) => `## ${l.title}\n${l.content}`)
      .join("\n\n");
  }

  const questions = await generateQuiz({ lessonTitle: title, lessonContent: content, count });
  const quiz = await db.createQuiz({ course_id: courseId, lesson_id: lessonId, title, questions });
  return json({ quizId: quiz.id, title: quiz.title, questions, courseId, lessonId });
});
