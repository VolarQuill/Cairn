import { json, fail, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = guard(async () => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const db = await getDb();
  const reviews = await db.listReviews(user.id);
  return json({ reviews });
});

export const POST = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const body = await req.json().catch(() => ({}));
  const lesson_id = String(body.lesson_id ?? "");
  const course_id = String(body.course_id ?? "");
  if (!lesson_id || !course_id) return fail("Missing lesson or course.", 400);
  const db = await getDb();
  const review = await db.addReview(user.id, lesson_id, course_id);
  return json({ ok: true, review });
});

export const DELETE = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("Missing id.", 400);
  const db = await getDb();
  await db.removeReview(id, user.id);
  return json({ ok: true });
});
