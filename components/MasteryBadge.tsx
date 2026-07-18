import type { Mastery } from "@/lib/types";

const MAP: Record<
  Mastery,
  { label: string; cls: string; dot: string }
> = {
  new: { label: "New", cls: "bg-clay-100 text-bark-100", dot: "bg-bark-50" },
  learning: { label: "Learning", cls: "bg-amber-50/30 text-amber-200", dot: "bg-amber-100" },
  familiar: { label: "Familiar", cls: "bg-moss-100/20 text-forest-100", dot: "bg-moss-100" },
  mastered: { label: "Mastered", cls: "bg-forest-200/15 text-forest-100", dot: "bg-forest-100" },
};

export function MasteryBadge({ status }: { status: Mastery }) {
  const m = MAP[status] ?? MAP.new;
  return (
    <span className={`pill ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}
