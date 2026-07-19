import { json, fail, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { rankForPoints } from "@/lib/ranks";

export const dynamic = "force-dynamic";

export const GET = guard(async () => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const db = await getDb();
  const board = await db.listLeaderboard(50);
  const rank = board.findIndex((e) => e.id === user.id) + 1;
  return json({
    board,
    you: {
      points: user.points ?? 0,
      rank: rank > 0 ? rank : board.length + 1,
      total: board.length,
      ...rankForPoints(user.points ?? 0),
    },
  });
});
