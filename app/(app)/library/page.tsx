import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { LibraryGrid } from "@/components/LibraryGrid";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await requireUser();
  const db = await getDb();
  const courses = await db.listCourses(user.id);
  const items = await Promise.all(
    courses.map(async (c) => ({
      course: c,
      lessonCount: (await db.getLessons(c.id)).length,
    }))
  );
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Library</h1>
          <p className="mt-1 text-bark-100 dark:text-cream-200">
            {courses.length} course{courses.length === 1 ? "" : "s"} in your collection.
          </p>
        </div>
      </div>
      <LibraryGrid items={items} />
    </div>
  );
}
