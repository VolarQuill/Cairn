"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Question } from "@/lib/types";
import { Markdown } from "@/components/Markdown";
import { Icon } from "@/components/icons";

interface LessonRef {
  id: string;
  title: string;
}

export function QuizRunner({
  courseId,
  lessons,
  initialLessonId,
}: {
  courseId: string;
  lessons: LessonRef[];
  initialLessonId?: string | null;
}) {
  const [lessonId, setLessonId] = useState<string | null>(
    initialLessonId ?? null
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizId, setQuizId] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [err, setErr] = useState("");

  async function generate() {
    setLoading(true);
    setErr("");
    setResults(null);
    setSelected({});
    setCurrent(0);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, lessonId, count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate quiz.");
      setQuestions(data.questions);
      setQuizId(data.quizId);
      setTitle(data.title);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/quiz/${quizId}/grade`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          answers: questions.map((q, i) => ({
            question_id: q.id,
            chosen: selected[i] ?? -1,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not grade.");
      setResults(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const answeredCount = Object.keys(selected).length;
  const total = questions.length;
  const allAnswered = answeredCount >= total;
  const q = questions[current];
  const pct = total ? Math.round(((current + 1) / total) * 100) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="input sm:w-64"
          value={lessonId ?? ""}
          onChange={(e) => setLessonId(e.target.value || null)}
        >
          <option value="">Whole-course review</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
        <button onClick={generate} className="btn-ghost" disabled={loading}>
          <Icon name="refresh" className="inline h-4 w-4 align-middle" /> New quiz
        </button>
      </div>

      {loading && !results && (
        <div className="card mt-5 flex items-center gap-3 p-6">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-100 border-t-transparent" />
          <span className="text-bark-100 dark:text-cream-200">Generating your quiz…</span>
        </div>
      )}

      {err && (
        <div className="mt-4 rounded-lg border border-terracotta-200/40 bg-terracotta-50/10 px-3 py-2 text-sm text-terracotta-200 dark:text-terracotta-100">
          {err}
        </div>
      )}

      {!loading && questions.length > 0 && !results && q && (
        <div className="mt-5">
          {/* Progress */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-bark-100 dark:text-cream-200">
              {title}
            </span>
            <span className="text-sm text-bark-50 dark:text-cream-300">
              {current + 1} / {total}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cream-200 dark:bg-forest-200/50">
            <div
              className="h-full rounded-full bg-amber-100 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to question ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === current
                    ? "w-6 bg-amber-100"
                    : selected[i] !== undefined
                    ? "w-2.5 bg-moss-100 dark:bg-moss-50"
                    : "w-2.5 bg-cream-300 dark:bg-forest-200/50"
                }`}
              />
            ))}
          </div>

          {/* Big flashcard */}
          <div className="card mt-5 flex min-h-[300px] flex-col justify-center p-6 text-center sm:p-9">
            <p className="font-display text-lg leading-snug text-bark-200 dark:text-cream-100">
              {q.prompt}
            </p>
            <div className="mx-auto mt-6 grid w-full max-w-2xl gap-3 text-left">
              {(q.options ?? []).map((opt, oi) => {
                const isSel = selected[current] === oi;
                const letter = String.fromCharCode(65 + oi);
                return (
                  <button
                    key={oi}
                    onClick={() =>
                      setSelected((s) => ({ ...s, [current]: oi }))
                    }
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left text-lg transition ${
                      isSel
                        ? "border-amber-100 bg-amber-50/25 font-semibold shadow-glow"
                        : "border-cream-300 hover:border-amber-100/60 hover:bg-cream-200/40 dark:border-forest-200/40 dark:hover:bg-forest-200/40"
                    }`}
                  >
                    <span
                      className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border text-sm font-bold ${
                        isSel
                          ? "border-amber-100 bg-amber-100 text-bark-300"
                          : "border-cream-300 text-bark-50 dark:border-forest-200/50 dark:text-cream-300"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="btn-ghost"
            >
              <Icon name="arrow-left" className="inline h-4 w-4 align-middle" /> Back
            </button>

            {allAnswered ? (
              <button onClick={submit} className="btn-primary px-6 py-3">
                Submit answers <Icon name="check" className="inline h-4 w-4 align-middle" />
              </button>
            ) : current < total - 1 ? (
              <button
                onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
                disabled={selected[current] === undefined}
                className="btn-primary px-6"
              >
                Next <Icon name="arrow-right" className="inline h-4 w-4 align-middle" />
              </button>
            ) : (
              <button disabled className="btn-primary px-6 opacity-60">
                Answer all ({answeredCount}/{total})
              </button>
            )}
          </div>
        </div>
      )}

      {results && (
        <div className="mt-5">
          <div className="card flex flex-col items-center gap-2 p-6 text-center">
            <div className="font-display text-4xl text-forest-200 dark:text-moss-50">
              {results.score}/{results.total}
            </div>
            <p className="text-bark-100 dark:text-cream-200">
              {results.score === results.total
                ? "Perfect — that really stuck! "
                : results.score >= results.total / 2
                ? "Solid effort. Review the misses below."
                : "Tough one — re-read the lesson and try again."}
              {results.score === results.total && (
                <Icon name="tree" className="inline h-4 w-4 align-middle" />
              )}
            </p>
            <div className="mt-2 flex gap-2">
              <button onClick={generate} className="btn-amber">
                <Icon name="refresh" className="inline h-4 w-4 align-middle" /> Try another
              </button>
              {lessonId && (
                <Link
                  href={`/courses/${courseId}?lesson=${lessonId}`}
                  className="btn-ghost"
                >
                  Re-study lesson
                </Link>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {questions.map((q, qi) => {
              const r = results.results[qi];
              const chosen = r?.chosen;
              return (
                <div
                  key={q.id ?? qi}
                  className={`card p-5 border-l-4 ${
                    r?.correct
                      ? "border-l-moss-100"
                      : "border-l-terracotta-100"
                  }`}
                >
                  <p className="text-lg font-medium">
                    {qi + 1}. {q.prompt}
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    {(q.options ?? []).map((opt, oi) => {
                      const isCorrect = oi === r?.correct_index;
                      const isChosen = oi === chosen;
                      const cls = isCorrect
                        ? "text-forest-100 font-semibold dark:text-moss-50"
                        : isChosen
                        ? "text-terracotta-200 font-semibold line-through dark:text-terracotta-100"
                        : "text-bark-100 dark:text-cream-200";
                      return (
                        <div key={oi} className={cls}>
                          {String.fromCharCode(65 + oi)}. {opt}
                          {isCorrect && (
                            <Icon name="check" className="inline h-4 w-4 align-middle text-moss-100 dark:text-moss-50" />
                          )}
                          {isChosen && !isCorrect && " (your answer)"}
                        </div>
                      );
                    })}
                  </div>
                  {r?.explanation && (
                    <div className="mt-3 rounded-lg bg-cream-200/60 p-3 text-sm text-bark-100 dark:bg-forest-200/60 dark:text-cream-200">
                      <span className="font-semibold">Why: </span>
                      <Markdown>{r.explanation}</Markdown>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
