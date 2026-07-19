import { json, fail, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { gradeShortAnswer } from "@/lib/ai/prompts";
import { pointsForQuiz } from "@/lib/ranks";
import { awardServerGoals } from "@/lib/goals";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export const POST = guard(async (req: Request, ctx: any) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const quizId: string = ctx.params.id;
  const db = await getDb();
  const quiz = await db.getQuiz(quizId);
  if (!quiz) return fail("Quiz not found.", 404);
  const course = await db.getCourse(quiz.course_id);
  if (!course || course.user_id !== user.id)
    return fail("Forbidden.", 403);

  const body = await req.json().catch(() => ({}));
  const answers: any[] = Array.isArray(body.answers) ? body.answers : [];

  const results: {
    question_id: string;
    chosen: number | null;
    correct: boolean;
    correct_index: number;
    explanation: string;
    feedback?: string;
  }[] = [];

  let score = 0;
  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    const ans = answers[i] ?? answers.find((a) => a.question_id === q.id) ?? {};
    let correct = false;
    let chosen: number | null = null;
    let feedback: string | undefined;

    if (q.type === "short") {
      const graded = await gradeShortAnswer({
        question: q.prompt,
        rubric: q.explanation,
        userAnswer: String(ans.text ?? ""),
      });
      correct = graded.correct;
      feedback = graded.feedback;
      chosen = null;
    } else {
      chosen = typeof ans.chosen === "number" ? ans.chosen : null;
      correct = chosen === q.answer_index;
    }
    if (correct) score++;
    results.push({
      question_id: q.id,
      chosen,
      correct,
      correct_index: q.answer_index,
      explanation: q.explanation,
      feedback,
    });
  }

  const attempt = await db.recordAttempt({
    user_id: user.id,
    quiz_id: quizId,
    score,
    total: quiz.questions.length,
    answers: results.map((r) => ({
      question_id: r.question_id,
      chosen: r.chosen ?? -1,
      correct: r.correct,
    })),
  });

  // Award difficulty-scaled points: correct x per-correct x course-level multiplier.
  const earned = pointsForQuiz(score, course.level);
  let updated = await db.updateUser(user.id, {
    points: (user.points ?? 0) + earned,
  });

  // Server daily goal: grant bonus points if this quiz completed it (once).
  const bonus = await awardServerGoals(updated, db);
  updated = bonus.user;

  return json({
    score,
    total: quiz.questions.length,
    attemptId: attempt.id,
    results,
    earned,
    goalPoints: bonus.awardedPoints,
    points: updated.points ?? (user.points ?? 0) + earned,
  });
});
