import { Icon, type IconName } from "@/components/icons";
import { RANK_TIERS, rankForPoints } from "@/lib/ranks";

export function RankJourney({ points = 0 }: { points?: number }) {
  const pts = Math.max(0, points);
  const max = RANK_TIERS[RANK_TIERS.length - 1].min;
  const fillPct = Math.min(100, (pts / max) * 100);
  const info = rankForPoints(pts);
  const currentIdx = RANK_TIERS.findIndex((t) => t.name === info.tier.name);

  return (
    <div className="card mt-6 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Your rank journey</h2>
        <span className="text-sm text-bark-50 dark:text-cream-300">{pts} pts</span>
      </div>
      <p className="mt-1 text-sm text-bark-100 dark:text-cream-200">
        {info.next
          ? `${info.tier.name} → ${info.next.name}: ${info.toNext} pts to go`
          : `Top rank reached — ${info.tier.name}`}
      </p>

      {/* Track: Seedling (0) on the left, Cairn Master (max) on the right */}
      <div className="relative mt-8 mb-1 h-2 w-full rounded-full bg-cream-200 dark:bg-forest-200/50">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-moss-100"
          style={{ width: `${fillPct}%` }}
        />
        {RANK_TIERS.map((t, i) => {
          const left = (t.min / max) * 100;
          const reached = pts >= t.min;
          const isCurrent = i === currentIdx;
          return (
            <div
              key={t.name}
              title={`${t.name} · ${t.min} pts`}
              style={{ left: `${left}%` }}
              className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                isCurrent
                  ? "border-amber-100 bg-amber-100"
                  : reached
                    ? "border-moss-100 bg-moss-100"
                    : "border-cream-200 bg-cream-100 dark:border-forest-200/60 dark:bg-forest-200/60"
              }`}
            />
          );
        })}
      </div>

      {/* Ladder legend — accurate to the checkpoints that upgrade each rank */}
      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {RANK_TIERS.map((t, i) => {
          const reached = pts >= t.min;
          const isCurrent = i === currentIdx;
          return (
            <div
              key={t.name}
              className={`flex flex-col items-center rounded-lg px-1 py-2 text-center ${
                isCurrent ? "bg-amber-50/20 dark:bg-amber-50/10" : ""
              }`}
            >
              <Icon
                name={t.icon as IconName}
                size={18}
                className={
                  isCurrent
                    ? "text-amber-100"
                    : reached
                      ? "text-moss-100"
                      : "text-bark-50 dark:text-cream-300"
                }
              />
              <span
                className={`mt-1 text-xs font-medium ${
                  isCurrent ? "text-amber-100" : "text-bark-50 dark:text-cream-300"
                }`}
              >
                {t.name}
              </span>
              <span className="text-[10px] text-bark-100 dark:text-cream-200">
                {t.min} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
