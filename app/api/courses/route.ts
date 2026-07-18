import { json, fail, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { generateCourse } from "@/lib/ai/prompts";
import { resolveSource } from "@/lib/ingest";
import type { Level, SourceType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = guard(async () => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const db = await getDb();
  const courses = await db.listCourses(user.id);
  return json({ courses });
});

export const POST = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  const body = await req.json().catch(() => ({}));
  const sourceType: SourceType = body.sourceType || "text";
  const sourceText = String(body.sourceText ?? "").trim();
  const goal = String(body.goal ?? "").trim();
  const providedTitle = String(body.title ?? "").trim();
  const level: Level = ["beginner", "intermediate", "advanced"].includes(body.level)
    ? body.level
    : "beginner";

  if (sourceType === "topic" && !sourceText)
    return fail("Enter a topic to build a course around.");
  if (sourceType !== "topic" && sourceText.length < 20)
    return fail("Add a bit more source material (at least 20 characters).");

  // Resolve URLs / clean text.
  const { text, resolved } = await resolveSource({ sourceType, sourceText });

  const generated = await generateCourse({ sourceType, sourceText: text, goal, level });

  const db = await getDb();
  const course = await db.createCourse({
    user_id: user.id,
    title: providedTitle || generated.title,
    description: generated.description,
    goal: goal || generated.goal,
    level: generated.level || level,
    source_type: sourceType,
    source_text: text,
    status: "ready",
  });

  // Flatten modules -> lessons.
  const lessons = generated.modules.flatMap((m, mi) =>
    m.lessons.map((l, li) => ({
      module_index: mi,
      lesson_index: li,
      module_title: l.module_title || m.title,
      title: l.title,
      content: l.content,
      objectives: l.objectives ?? [],
      key_terms: l.key_terms ?? [],
      est_minutes: l.est_minutes ?? 8,
    }))
  );
  await db.addLessons(course.id, lessons);

  return json({
    courseId: course.id,
    title: course.title,
    lessonCount: lessons.length,
    resolved,
    offline: false,
  });
});
