"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/types";
import { CourseCard } from "@/components/CourseCard";
import { Icon } from "@/components/icons";

export function LibraryGrid({
  items,
}: {
  items: { course: Course; lessonCount: number }[];
}) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(({ course }) => {
      const matchQ =
        !needle ||
        course.title.toLowerCase().includes(needle) ||
        course.description.toLowerCase().includes(needle);
      const matchL = level === "all" || course.level === level;
      return matchQ && matchL;
    });
  }, [items, q, level]);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="input flex-1"
          placeholder="Search your courses…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="input sm:w-48"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option value="all">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-2 p-10 text-center">
          <p className="text-bark-100">
            {items.length === 0
              ? "No courses yet."
              : "No courses match your search."}
          </p>
          {items.length === 0 && (
            <Link href="/create" className="btn-amber mt-1">
              <Icon name="plus" className="inline h-4 w-4 align-middle" /> Create a course
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ course, lessonCount }) => (
            <CourseCard key={course.id} course={course} lessonCount={lessonCount} />
          ))}
        </div>
      )}
    </div>
  );
}
