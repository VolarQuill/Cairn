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
  const [results, setResults] = useState<any>(null);
  const [err, setErr] = useState("");

  async function generate() {
    setLoading(true);
    setErr("");
    setResults(null);
    setSelected({});
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
          <span className="text-bark-100">Generating your quiz…</span>
        </div>
      )}

      {err && (
        <div className="mt-4 rounded-lg border border-terracotta-200/40 bg-terracotta-50/10 px-3 py-2 text-sm text-terracotta-200">
          {err}
        </div>
      )}

      {!loading && questions.length > 0 && !results && (
        <div className="mt-5 space-y-5">
          <h2 className="text-xl">{title}</h2>
          {questions.map((q, qi) => (
            <div key={q.id ?? qi} className="card p-5">
              <p className="font-medium">
                {qi + 1}. {q.prompt}
              </p>
              <div className="mt-3 grid gap-2">
                {(q.options ?? []).map((opt, oi) => {
                  const isSel = selected[qi] === oi;
                  return (
                    <button
                      key={oi}
                      onClick={() => setSelected((s) => ({ ...s, [qi]: oi }))}
                      className={`rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                        isSel
                          ? "border-amber-100 bg-amber-50/25 font-semibold"
                          : "border-cream-300 hover:border-amber-100/60"
                      }`}
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            onClick={submit}
            className="btn-primary w-full py-3"
            disabled={answeredCount < questions.length}
          >
            {answeredCount < questions.length
              ? `Answer all questions (${answeredCount}/${questions.length})`
              : "Submit answers"}
          </button>
        </div>
      )}

      {results && (
        <div className="mt-5">
          <div className="card flex flex-col items-center gap-2 p-6 text-center">
            <div className="font-display text-4xl text-forest-200">
              {results.score}/{results.total}
            </div>
            <p className="text-bark-100">
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
                  <p className="font-medium">
                    {qi + 1}. {q.prompt}
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    {(q.options ?? []).map((opt, oi) => {
                      const isCorrect = oi === r?.correct_index;
                      const isChosen = oi === chosen;
                      const cls = isCorrect
                        ? "text-forest-100 font-semibold"
                        : isChosen
                        ? "text-terracotta-200 font-semibold line-through"
                        : "text-bark-100";
                      return (
                        <div key={oi} className={cls}>
                          {String.fromCharCode(65 + oi)}. {opt}
                          {isCorrect && (
                            <Icon name="check" className="inline h-4 w-4 align-middle text-moss-100" />
                          )}
                          {isChosen && !isCorrect && " (your answer)"}
                        </div>
                      );
                    })}
                  </div>
                  {r?.explanation && (
                    <div className="mt-3 rounded-lg bg-cream-200/60 p-3 text-sm text-bark-100">
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
