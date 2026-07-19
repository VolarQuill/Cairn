import { json, fail, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  dailyServerGoal,
  progressFor,
  activityTotal,
} from "@/lib/goals";
import type { GoalMetric, GoalWithProgress } from "@/lib/types";

export const dynamic = "force-dynamic";

function decorate(goal: ReturnType<typeof dailyServerGoal>, current: number, awarded: boolean): GoalWithProgress {
  const p = progressFor(goal, current);
  p.awarded = awarded;
  return p;
}

export const GET = guard(async () => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const db = await getDb();

  const server = dailyServerGoal();
  const serverCurrent = await db.activityToday(user.id, server.metric);
  const serverGoals: GoalWithProgress[] = [
    decorate(server, serverCurrent, (user.awarded_goals ?? []).includes(server.id)),
  ];

  const clientRaw = await db.listClientGoals(user.id);
  const client: GoalWithProgress[] = [];
  for (const g of clientRaw) {
    const cur = await activityTotal(db, user.id, g.metric);
    client.push(progressFor(g, cur));
  }

  return json({ server: serverGoals, client });
});

export const POST = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const metric = String(body.metric ?? "") as GoalMetric;
  const target = Math.max(1, Math.floor(Number(body.target) || 0));
  const valid: GoalMetric[] = ["quiz_questions", "quizzes", "lessons", "courses"];

  if (!title) return fail("Give your goal a title.");
  if (!valid.includes(metric)) return fail("Pick a valid metric.");
  if (!target) return fail("Set a target of at least 1.");

  const db = await getDb();
  const goal = await db.createClientGoal({ user_id: user.id, title, metric, target });
  const cur = await activityTotal(db, user.id, goal.metric);
  return json({ goal: progressFor(goal, cur) }, 201);
});

export const DELETE = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("Missing goal id.");
  const db = await getDb();
  await db.deleteClientGoal(id, user.id);
  return json({ ok: true });
});
