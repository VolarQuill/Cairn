"use client";

import { useState } from "react";
import { Markdown } from "@/components/Markdown";
import { Icon, type IconName } from "@/components/icons";

const STYLES: { id: string; label: string; icon: IconName }[] = [
  { id: "simple", label: "Simple", icon: "seed" },
  { id: "deep", label: "In depth", icon: "books" },
  { id: "analogy", label: "Analogy", icon: "repeat" },
  { id: "visual", label: "Visual", icon: "image" },
  { id: "example", label: "Example", icon: "pencil" },
];

export function ExplainPanel({
  lessonId,
  lessonTitle,
}: {
  lessonId: string;
  lessonTitle: string;
}) {
  const [style, setStyle] = useState("simple");
  const [concept, setConcept] = useState(lessonTitle);
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");

  async function run() {
    setLoading(true);
    setErr("");
    setOpen(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/explain`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ style, concept: concept || lessonTitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not explain.");
      setOut(data.explanation);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mt-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg">Explain it to me…</h3>
        {out && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-sm text-terracotta-100 hover:text-terracotta-200 dark:text-terracotta-50 dark:hover:text-terracotta-100"
          >
            {open ? "Hide" : "Show"} explanation
          </button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStyle(s.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              style === s.id
                ? "bg-amber-100 text-bark-300"
                : "border border-cream-300 text-bark-100 hover:border-amber-100 dark:border-forest-200/40 dark:text-cream-200"
            }`}
          >
            <Icon name={s.icon} className="inline h-4 w-4 align-middle" /> {s.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          className="input flex-1"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Concept to explain (defaults to the lesson)"
        />
        <button onClick={run} className="btn-primary" disabled={loading}>
          {loading ? "Thinking…" : "Explain"}
        </button>
      </div>

      {open && (loading || out || err) && (
        <div className="mt-4 rounded-xl border border-cream-300 bg-cream-50 p-4 dark:border-forest-200/40 dark:bg-forest-300">
          {loading && <p className="text-sm text-bark-50 dark:text-cream-300">Cairn is writing…</p>}
          {err && <p className="text-sm text-terracotta-200 dark:text-terracotta-100">{err}</p>}
          {out && !loading && <Markdown>{out}</Markdown>}
        </div>
      )}
    </div>
  );
}
