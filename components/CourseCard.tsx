import Link from "next/link";
import { Icon } from "@/components/icons";
import type { Course } from "@/lib/types";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function CourseCard({
  course,
  lessonCount = 0,
}: {
  course: Course;
  lessonCount?: number;
}) {
  const d = new Date(course.updated_at);
  return (
    <Link
      href={`/courses/${course.id}`}
      className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-center justify-between">
        <span className="chip capitalize">{LEVEL_LABEL[course.level] ?? course.level}</span>
        <span className="text-xs text-bark-50">
          {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
      <h3 className="mt-3 text-xl leading-snug transition group-hover:text-forest-200">
        {course.title}
      </h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-bark-100">
        {course.description}
      </p>
      <div className="mt-4 flex items-center gap-3 text-xs text-bark-50">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="book-open" className="h-4 w-4" /> {lessonCount} lessons
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-2.5 py-1 font-medium text-bark-100">
          Open <Icon name="arrow-right" className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
