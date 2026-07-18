import type { Mastery, Progress } from "@/lib/types";
import { inMinutes } from "@/lib/util";

/**
 * Spaced-repetition scheduler (SM-2 inspired).
 * Given a learner's self-reported grade (0=again, 1=hard, 2=good, 3=easy)
 * we update ease / interval / reps and compute the next due date, plus a
 * coarse mastery label used for the dashboard.
 */

export type Grade = 0 | 1 | 2 | 3;

const MASTERY_THRESHOLD = { reps: 3, intervalDays: 21 };

export function schedule(
  prev: Pick<Progress, "ease" | "interval" | "reps" | "status">,
  grade: Grade
): { ease: number; interval: number; reps: number; due_at: string; status: Mastery } {
  let ease = prev.ease || 2.5;
  let interval = prev.interval || 0;
  let reps = prev.reps || 0;

  if (grade < 2) {
    // Forgotten — reset the interval but keep some ease.
    reps = 0;
    interval = grade === 0 ? 10 : 60; // minutes
  } else {
    reps += 1;
    if (reps === 1) interval = 60; // 1h
    else if (reps === 2) interval = 60 * 24; // 1d
    else if (reps === 3) interval = 60 * 24 * 3; // 3d
    else interval = Math.round(interval * ease); // grow
  }

  // Ease adjustment (SM-2)
  ease =
    ease + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02));
  ease = Math.max(1.3, Math.round(ease * 100) / 100);

  let status: Mastery = prev.status;
  if (grade < 2) status = reps === 0 && interval < 60 ? "new" : "learning";
  else if (reps < 2) status = "learning";
  else if (reps < MASTERY_THRESHOLD.reps || interval < MASTERY_THRESHOLD.intervalDays * 60)
    status = "familiar";
  else status = "mastered";

  return {
    ease,
    interval,
    reps,
    due_at: inMinutes(interval),
    status,
  };
}

export function masteryRank(m: Mastery): number {
  return { new: 0, learning: 1, familiar: 2, mastered: 3 }[m];
}
