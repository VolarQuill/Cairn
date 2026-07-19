import { json, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { dailyServerGoal, progressFor, awardServerGoals } from "@/lib/goals";

export const dynamic = "force-dynamic";

/**
 * Award any server goal the user has just completed (idempotent) and return
 * the updated points + the day's server goal with its live progress. Called by
 * the dashboard on mount so goals completed outside of a quiz (lessons, courses)
 * still grant their points.
 */
export const POST = guard(async () => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const db = await getDb();
  const result = await awardServerGoals(user, db);

  const server = dailyServerGoal();
  const serverCurrent = await db.activityToday(result.user.id, server.metric);
  const serverGoal = progressFor(server, serverCurrent);
  serverGoal.awarded = (result.user.awarded_goals ?? []).includes(server.id);

  return json({
    points: result.user.points ?? 0,
    awardedPoints: result.awardedPoints,
    server: [serverGoal],
  });
});
