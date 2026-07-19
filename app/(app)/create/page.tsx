"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import type { Level, SourceType } from "@/lib/types";

const TYPES: { id: SourceType; label: string; icon: IconName; hint: string }[] = [
  { id: "text", label: "Paste text", icon: "note", hint: "Notes, an excerpt, anything" },
  { id: "topic", label: "A topic", icon: "bulb", hint: "Cairn writes it from scratch" },
  { id: "url", label: "A link", icon: "link", hint: "Article or page URL" },
  { id: "file", label: "Upload", icon: "file", hint: "PDF, Word, PowerPoint, Excel & more" },
];

const SAMPLE = `Spaced repetition is a learning technique that incorporates increasing intervals of time between subsequent reviews of previously learned material. The idea is that each time you successfully recall something, the memory is strengthened and the next review can be spaced further out. This combats the forgetting curve described by Hermann Ebbinghaus, which shows how memories fade rapidly without reinforcement. Tools like flashcards schedule reviews using algorithms such as SM-2, which adjust intervals based on how easily you remembered each item.`;

export default function CreatePage() {
  const router = useRouter();
  const [type, setType] = useState<SourceType>("text");
  const [text, setText] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<Level>("beginner");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setError("");
    setExtracting(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not read that file.");
      const text = data.text || "";
      setText(text);
      if (text.trim().length < 20) {
        setError(
          "We couldn’t pull much text from that file. You can paste its contents here instead."
        );
      }
    } catch (e: any) {
      setError(e.message || "Could not read that file. Try pasting the text instead.");
    } finally {
      setExtracting(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (type === "topic" ? !text.trim() : text.trim().length < 20) {
      setError(type === "topic" ? "Enter a topic." : "Add a bit more source material.");
      return;
    }
    setBusy(true);
    try {
      setStatus("Reading your source…");
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceType: type, sourceText: text, goal, level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the course.");
      setStatus("Structuring lessons & objectives…");
      router.push(`/courses/${data.courseId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
      setStatus("");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/dashboard" className="text-sm text-bark-50 hover:text-terracotta-100 dark:text-cream-300 dark:hover:text-terracotta-50">
        <Icon name="arrow-left" className="inline h-4 w-4 align-middle" /> Back to dashboard
      </Link>
      <h1 className="mt-3 text-3xl">Create a course</h1>
      <p className="mt-1 text-bark-100 dark:text-cream-200">
        Feed Cairn a source and it will build a structured, study-ready course.
      </p>

      <form onSubmit={submit} className="card mt-6 space-y-5 p-6">
        {/* Type selector */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TYPES.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setType(t.id)}
              className={`rounded-xl border p-3 text-left transition hover-lift ${
                type === t.id
                  ? "border-amber-100 bg-amber-50/20 shadow-glow"
                  : "border-cream-300 hover:border-amber-100/60 dark:border-forest-200/40"
              }`}
            >
              <Icon name={t.icon} size={22} className="text-forest-200 dark:text-moss-50" />
              <div className="mt-1 text-sm font-semibold">{t.label}</div>
              <div className="text-xs text-bark-50 dark:text-cream-300">{t.hint}</div>
            </button>
          ))}
        </div>

        {/* Source input */}
        <div>
          <label className="label" htmlFor="src">
            {type === "topic"
              ? "What do you want to learn about?"
              : type === "url"
              ? "URL"
              : type === "file"
              ? "Upload a file or paste its text"
              : "Your source text"}
          </label>
          {type === "file" ? (
            <div className="space-y-2">
              <input
                type="file"
                accept=".txt,.text,.md,.markdown,.mdx,.csv,.tsv,.json,.xml,.html,.htm,.yml,.yaml,.log,.tex,.rtf,.pdf,.doc,.docx,.docm,.ppt,.pptx,.pptm,.xls,.xlsx,.xlsm,.ods,.ots,.odt,.ott,.odp,.otp,.pages,.key,application/pdf,application/msword,application/vnd.ms-powerpoint,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.*,application/vnd.oasis.opendocument.*,text/*"
                onChange={(e) => onFile(e.target.files?.[0])}
                className="block w-full cursor-pointer rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 text-sm text-bark-100 transition hover:border-amber-100/60 focus:border-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-100/40 dark:border-forest-200/40 dark:bg-forest-400 dark:text-cream-200 dark:focus:border-amber-100 dark:focus:ring-amber-100/30 dark:[color-scheme:dark] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-bark-300 file:transition hover:file:bg-amber-50 dark:file:bg-moss-50 dark:file:text-forest-300"
                disabled={extracting}
              />
              <textarea
                id="src"
                className="input min-h-[180px] font-mono text-[13px]"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Pasted file contents will appear here…"
              />
            </div>
          ) : (
            <textarea
              id="src"
              className="input min-h-[200px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                type === "topic"
                  ? "e.g. The basics of personal finance"
                  : type === "url"
                  ? "https://example.com/article"
                  : "Paste the text you want to learn from…"
              }
            />
          )}
          {type === "text" && (
            <button
              type="button"
              onClick={() => {
                setText(SAMPLE);
                setType("text");
              }}
              className="mt-2 text-xs text-terracotta-100 hover:text-terracotta-200 dark:text-terracotta-50 dark:hover:text-terracotta-100"
            >
              Try a sample <Icon name="arrow-right" className="inline h-4 w-4 align-middle" />
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="goal">Your goal (optional)</label>
            <input
              id="goal"
              className="input"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Explain it to a friend"
            />
          </div>
          <div>
            <label className="label" htmlFor="level">Level</label>
            <select
              id="level"
              className="input"
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-terracotta-200/40 bg-terracotta-50/10 px-3 py-2 text-sm text-terracotta-200 dark:text-terracotta-100">
            {error}
          </div>
        )}

        <button type="submit" className="btn-amber w-full py-3" disabled={busy || extracting}>
          {extracting
            ? "Reading your file…"
            : busy
            ? (status || "Building your course…")
            : "Build my course"}{" "}
          <Icon name="arrow-right" className="inline h-4 w-4 align-middle" />
        </button>
        {(busy || extracting) && (
          <p className="text-center text-xs text-bark-50 dark:text-cream-300">
            {extracting
              ? "Pulling the text out of your file…"
              : "This takes a moment while the AI structures your material. You’ll be sent to your course automatically."}
          </p>
        )}
      </form>
    </div>
  );
}
