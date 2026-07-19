// Goals: server-set daily challenges (earn points) and client-set personal
// goals (no points). All logic is backend-agnostic — it only talks to the
// Database interface, so the same code runs on the local JSON store and
// Supabase.

import type { Database } from "./db";
import type { Goal, GoalMetric, GoalWithProgress, User } from "./types";

export const GOAL_METRICS: { value: GoalMetric; label: string }[] = [
  { value: "quiz_questions", label: "Quiz questions" },
  { value: "quizzes", label: "Quizzes" },
  { value: "lessons", label: "Lessons studied" },
  { value: "courses", label: "Courses created" },
];

/** YYYY-MM-DD in UTC — the boundary for "today". */
function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function dayIndex(key: string): number {
  return Math.floor(Date.parse(key + "T00:00:00Z") / 86_400_000);
}

/**
 * The server's pool of goals. One is chosen per day (deterministic by date),
 * so everyone sees the same "goal of the day" and it rotates over time.
 * The id is date-scoped so a goal can be earned once per day and again later.
 */
const SERVER_GOALS_POOL: Omit<Goal, "id" | "kind">[] = [
  {
    metric: "quiz_questions",
    target: 20,
    title: "Finish 20 quiz questions",
    description: "Sharpen recall — answer 20 quiz questions today.",
    points: 50,
  },
  {
    metric: "quizzes",
    target: 3,
    title: "Ace 3 quizzes",
    description: "Test yourself with 3 full quizzes today.",
    points: 40,
  },
  {
    metric: "lessons",
    target: 5,
    title: "Study 5 lessons",
    description: "Learn or review 5 lessons today.",
    points: 40,
  },
  {
    metric: "courses",
    target: 1,
    title: "Start a new course",
    description: "Spin up a fresh course to learn today.",
    points: 30,
  },
];

/** The server's goal for the current day. */
export function dailyServerGoal(): Goal {
  const key = todayKey();
  const base = SERVER_GOALS_POOL[dayIndex(key) % SERVER_GOALS_POOL.length];
  return { id: `server:${key}:${base.metric}`, kind: "server", ...base };
}

/** Attach live progress numbers to a goal for display. */
export function progressFor(goal: Goal, current: number): GoalWithProgress {
  const target = Math.max(1, goal.target);
  const pct = Math.max(0, Math.min(100, Math.round((current / target) * 100)));
  return {
    ...goal,
    current,
    target,
    pct,
    // Server goals complete on activity; client (personal) goals complete only
    // when the user explicitly marks them done — never auto-derived from
    // cumulative activity, which would mark brand-new goals "complete".
    complete: goal.kind === "client" ? Boolean(goal.done) : current >= target,
    awarded: false,
  };
}

/** Cumulative (all-time) activity count — used for client-set goals. */
export async function activityTotal(
  db: Database,
  userId: string,
  metric: GoalMetric
): Promise<number> {
  switch (metric) {
    case "quiz_questions": {
      const attempts = await db.getAttempts(userId);
      return attempts.reduce((n, a) => n + (a.total ?? 0), 0);
    }
    case "quizzes": {
      const attempts = await db.getAttempts(userId);
      return new Set(attempts.map((a) => a.quiz_id)).size;
    }
    case "lessons": {
      const progress = await db.listProgress(userId);
      return progress.filter((p) => p.status !== "new").length;
    }
    case "courses": {
      const courses = await db.listCourses(userId);
      return courses.length;
    }
  }
}

/**
 * Award points for the day's server goal if the user has just completed it.
 * Idempotent: a goal is only ever awarded once, tracked via
 * `user.awarded_goals`. Safe to call after any activity.
 */
export async function awardServerGoals(
  user: User,
  db: Database
): Promise<{ user: User; awardedPoints: number; completedIds: string[] }> {
  const goal = dailyServerGoal();
  const awarded = user.awarded_goals ?? [];
  if (awarded.includes(goal.id)) {
    return { user, awardedPoints: 0, completedIds: [] };
  }
  const current = await db.activityToday(user.id, goal.metric);
  if (current < goal.target) {
    return { user, awardedPoints: 0, completedIds: [] };
  }
  const updated = await db.updateUser(user.id, {
    points: (user.points ?? 0) + goal.points,
    awarded_goals: [...awarded, goal.id],
  });
  return { user: updated, awardedPoints: goal.points, completedIds: [goal.id] };
}
