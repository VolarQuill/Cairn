import { json, fail, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Retriever } from "@/lib/ai/retrieve";
import { chatAnswer } from "@/lib/ai/prompts";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export const POST = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const body = await req.json().catch(() => ({}));
  const courseId = String(body.courseId ?? "");
  if (!courseId) return fail("courseId is required.");
  const db = await getDb();
  const course = await db.getCourse(courseId);
  if (!course || course.user_id !== user.id)
    return fail("Course not found.", 404);

  // Clear conversation request
  if (body.action === "clear") {
    await db.clearChat(courseId, user.id);
    return json({ cleared: true });
  }

  const message = String(body.message ?? "").trim();
  if (!message) return fail("Message is empty.");

  const lessons = await db.getLessons(courseId);
  const retriever = new Retriever(lessons);
  const context = retriever.topK(message, 4);
  const history = await db.getChatMessages(courseId, user.id);
  const reply = await chatAnswer({
    question: message,
    context,
    history: history.map((m) => ({ role: m.role, content: m.content })),
  });

  await db.addChatMessage({ course_id: courseId, user_id: user.id, role: "user", content: message });
  const assistantMsg = await db.addChatMessage({
    course_id: courseId,
    user_id: user.id,
    role: "assistant",
    content: reply,
  });

  return json({ reply, messageId: assistantMsg.id });
});

export const GET = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const url = new URL(req.url);
  const courseId = url.searchParams.get("courseId") ?? "";
  if (!courseId) return fail("courseId is required.");
  const db = await getDb();
  const course = await db.getCourse(courseId);
  if (!course || course.user_id !== user.id) return fail("Forbidden.", 403);
  const messages = await db.getChatMessages(courseId, user.id);
  return json({ messages });
});
