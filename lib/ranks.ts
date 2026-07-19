// Global ranking: points -> tier, and points earned per quiz.
// Pure helpers (no server/client deps) so they can run anywhere.

export const POINTS_PER_CORRECT = 10;

/** Course difficulty scales points: easy = x1, moderate = x1.5, advanced = x2. */
export const LEVEL_POINT_MULT: Record<string, number> = {
  beginner: 1,
  intermediate: 1.5,
  advanced: 2,
};

export interface RankTier {
  name: string;
  min: number;
  icon: string; // IconName, drawn in the UI
}

// Nature-themed tiers that climb as you earn points.
export const RANK_TIERS: RankTier[] = [
  { name: "Seedling", min: 0, icon: "seed" },
  { name: "Sprout", min: 100, icon: "leaf" },
  { name: "Sapling", min: 300, icon: "tree" },
  { name: "Scholar", min: 700, icon: "book-open" },
  { name: "Sage", min: 1500, icon: "bulb" },
  { name: "Cairn Master", min: 3000, icon: "rock" },
];

export interface RankInfo {
  tier: RankTier;
  next: RankTier | null;
  toNext: number; // points until next tier (0 if maxed)
  pct: number; // progress to next tier, 0-100
}

export function rankForPoints(points: number): RankInfo {
  let idx = 0;
  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (points >= RANK_TIERS[i].min) idx = i;
  }
  const tier = RANK_TIERS[idx];
  const next = idx < RANK_TIERS.length - 1 ? RANK_TIERS[idx + 1] : null;
  if (!next) return { tier, next: null, toNext: 0, pct: 100 };
  const span = next.min - tier.min;
  const into = points - tier.min;
  return {
    tier,
    next,
    toNext: next.min - points,
    pct: Math.max(0, Math.min(100, Math.round((into / span) * 100))),
  };
}

/** Points awarded for a quiz: correct answers x per-correct x difficulty multiplier. */
export function pointsForQuiz(correct: number, level: string): number {
  const mult = LEVEL_POINT_MULT[level] ?? 1;
  return Math.round(correct * POINTS_PER_CORRECT * mult);
}
