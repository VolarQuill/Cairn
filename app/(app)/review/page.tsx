import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ReviewManager } from "@/components/ReviewManager";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await requireUser();
  const db = await getDb();
  const courses = await db.listCourses(user.id);

  const tree = [];
  for (const c of courses) {
    const lessons = await db.getLessons(c.id);
    tree.push({
      id: c.id,
      title: c.title,
      lessons: lessons.map((l) => ({ id: l.id, title: l.title })),
    });
  }

  const reviews = await db.listReviews(user.id);

  return <ReviewManager courses={tree} initialReviews={reviews} />;
}
