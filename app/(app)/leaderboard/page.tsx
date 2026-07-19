import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { rankForPoints } from "@/lib/ranks";
import { Icon, type IconName } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await requireUser();
  const db = await getDb();
  const board = await db.listLeaderboard(50);
  const rank = board.findIndex((e) => e.id === user.id) + 1;
  const me = rankForPoints(user.points ?? 0);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl">Global leaderboard</h1>
        <Link
          href="/dashboard"
          className="text-sm text-bark-50 hover:text-terracotta-100 dark:text-cream-300"
        >
          Dashboard
        </Link>
      </div>

      {/* Your standing */}
      <div className="card mt-6 flex items-center gap-4 p-5">
        <Icon
          name={me.tier.icon as IconName}
          size={32}
          className="shrink-0 text-amber-100"
        />
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-lg font-semibold">{me.tier.name}</span>
            <span className="text-sm text-bark-50 dark:text-cream-300">
              Rank #{rank || board.length + 1} · {user.points ?? 0} pts
            </span>
          </div>
          {me.next && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cream-200 dark:bg-forest-200/50">
              <div
                className="h-full rounded-full bg-moss-100 transition-all"
                style={{ width: `${me.pct}%` }}
              />
            </div>
          )}
          <p className="mt-1 text-sm text-bark-100 dark:text-cream-200">
            {me.next
              ? `${me.toNext} pts to ${me.next.name}`
              : "Top tier — nice work."}
          </p>
        </div>
      </div>

      {/* Board */}
      <div className="mt-6 space-y-2">
        {board.map((e, i) => {
          const isYou = e.id === user.id;
          return (
            <div
              key={e.id}
              className={`card flex items-center gap-3 px-4 py-3 ${
                isYou ? "border-l-4 border-l-amber-100" : ""
              }`}
            >
              <span
                className={`w-8 text-center font-display text-lg ${
                  i < 3 ? "text-amber-100" : "text-bark-50 dark:text-cream-300"
                }`}
              >
                {i + 1}
              </span>
              <span className="flex-1 truncate font-medium">
                {e.name}
                {isYou && " (you)"}
              </span>
              <span className="font-display text-forest-200 dark:text-moss-50">
                {e.points} pts
              </span>
            </div>
          );
        })}
        {board.length === 0 && (
          <div className="card p-6 text-center text-sm text-bark-100 dark:text-cream-200">
            No scores yet — finish a quiz to get on the board.
          </div>
        )}
      </div>
    </div>
  );
}
