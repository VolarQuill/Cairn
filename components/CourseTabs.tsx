"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

export function CourseTabs({
  courseId,
  lesson,
}: {
  courseId: string;
  lesson?: string | null;
}) {
  const pathname = usePathname();
  const base = `/courses/${courseId}`;
  const practiceHref = `${base}/practice${lesson ? `?lesson=${lesson}` : ""}`;
  const tabs: { href: string; label: string; icon: IconName; match: string }[] = [
    { href: `${base}${lesson ? `?lesson=${lesson}` : ""}`, label: "Learn", icon: "book-open", match: base },
    { href: practiceHref, label: "Practice", icon: "target", match: `${base}/practice` },
    { href: `${base}/chat`, label: "Chat", icon: "chat", match: `${base}/chat` },
  ];
  return (
    <div className="flex gap-1 rounded-xl border border-cream-300 bg-cream-50 p-1">
      {tabs.map((t) => {
        const isActive = pathname === t.match || pathname.startsWith(t.match + "/");
        return (
          <Link
            key={t.label}
            href={t.href}
            className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition ${
              isActive
                ? "bg-forest-200 text-cream-50"
                : "text-bark-100 hover:bg-cream-200"
            }`}
          >
            <Icon name={t.icon} className="inline h-4 w-4 align-middle" /> {t.label}
          </Link>
        );
      })}
    </div>
  );
}
