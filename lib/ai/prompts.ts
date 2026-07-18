import { complete, extractJson } from "./provider";
import type {
  GeneratedCourse,
  GeneratedLesson,
  Question,
  Level,
  SourceType,
} from "@/lib/types";

const lessonShapeDef = `"lessons": [ { "module_title": string, "title": string, "content": string, "objectives": string[], "key_terms": [{"term":string,"definition":string}], "est_minutes": number } ]`;

const COURSE_SYSTEM = `You are Cairn, an expert curriculum designer. You turn any source material into a clear, well-structured course.

Rules:
- Respond ONLY with a single valid JSON object (no prose, no markdown fences).
- Write in a warm, encouraging, plain-language tone.
- Lessons must be substantial (150-300 words of markdown each) and genuinely teach, not just summarize.
- Use markdown in lesson content: headings, lists, bold, and a short ## Key Takeaway at the end.
- key_terms: 2-4 important terms with plain definitions.
- objectives: 2-3 measurable learning outcomes per lesson.
- est_minutes: realistic per-lesson time (5-15).

JSON shape:
{
  "title": string,
  "description": string,            // 1-2 sentence overview
  "goal": string,                   // what the learner will be able to do
  "level": "beginner"|"intermediate"|"advanced",
  "modules": [
    { "title": string, ${lessonShapeDef} }
  ]
}`;

export async function generateCourse(params: {
  sourceType: SourceType;
  sourceText: string;
  goal: string;
  level: Level;
}): Promise<GeneratedCourse> {
  const srcLabel =
    params.sourceType === "topic"
      ? "a topic"
      : params.sourceType === "url"
      ? "web content"
      : params.sourceType === "file"
      ? "an uploaded document"
      : "provided text";

  const prompt = `Create a course from the following ${srcLabel}.

Learner goal: ${params.goal || "gain a solid, practical understanding"}
Target level: ${params.level}

SOURCE:
"""
${params.sourceText.slice(0, 12000)}
"""`;

  const res = await complete(
    { system: COURSE_SYSTEM, prompt, maxTokens: 4096, temperature: 0.5 },
    () => JSON.stringify(offlineCourse(params))
  );
  try {
    const parsed = extractJson<GeneratedCourse>(res.text);
    if (!parsed.modules?.length) throw new Error("no modules");
    return parsed;
  } catch {
    return offlineCourse(params);
  }
}

// ---------------- multi-style explanation ----------------

const STYLE_PROMPTS: Record<string, string> = {
  simple:
    "Explain this like I'm 12: short sentences, everyday analogies, no jargon.",
  deep: "Give a thorough, rigorous explanation with nuance, edge cases, and why it matters.",
  analogy:
    "Explain using a vivid real-world analogy or metaphor, then connect it back.",
  visual:
    "Explain in a way that's easy to visualize; include a small ASCII/text diagram or step list.",
  example:
    "Teach through a concrete worked example from start to finish.",
};

export async function explainConcept(params: {
  concept: string;
  style: keyof typeof STYLE_PROMPTS | string;
  context?: string;
}): Promise<string> {
  const styleText =
    STYLE_PROMPTS[params.style] ?? STYLE_PROMPTS.deep;
  const prompt = `Concept to explain: "${params.concept}"

${styleText}
${params.context ? `Context from the course:\n"""\n${params.context.slice(0, 4000)}\n"""\n` : ""}
Respond in markdown with a short heading. Keep it focused and useful.`;
  const res = await complete(
    {
      system:
        "You are Cairn, a friendly tutor. Respond in markdown, no preamble.",
      prompt,
      maxTokens: 900,
      temperature: 0.7,
    },
    () => offlineExplain(params)
  );
  return res.text;
}

// ---------------- quiz generation ----------------

export async function generateQuiz(params: {
  lessonTitle: string;
  lessonContent: string;
  count?: number;
}): Promise<Question[]> {
  const n = params.count ?? 5;
  const prompt = `Generate ${n} quiz questions for this lesson. Mix multiple-choice and one true/false.

Lesson title: ${params.lessonTitle}

Lesson content:
"""
${params.lessonContent.slice(0, 6000)}
"""

Respond ONLY with JSON:
[ { "prompt": string, "type": "mc"|"truefalse", "options": string[], "answer_index": number, "explanation": string } ]

Rules:
- answer_index is the index of the correct option.
- For true/false use options ["True","False"].
- Distractors must be plausible but clearly wrong.
- explanation teaches why the answer is correct.`;

  const res = await complete(
    { system: "You are Cairn's assessment engine. Output strict JSON only.", prompt, maxTokens: 1800, temperature: 0.5 },
    () => JSON.stringify(offlineQuiz(params))
  );
  try {
    const parsed = extractJson<Question[]>(res.text);
    if (!Array.isArray(parsed) || !parsed.length) throw new Error("empty");
    return parsed.map((q, i) => ({
      id: `q${i}`,
      prompt: q.prompt,
      type: q.type ?? "mc",
      options: q.options ?? ["True", "False"],
      answer_index: q.answer_index ?? 0,
      explanation: q.explanation ?? "",
    }));
  } catch {
    return offlineQuiz(params);
  }
}

// ---------------- short-answer grading ----------------

export async function gradeShortAnswer(params: {
  question: string;
  rubric: string;
  userAnswer: string;
}): Promise<{ correct: boolean; feedback: string }> {
  const prompt = `Grade this short answer against the rubric.

Question: ${params.question}
Rubric / expected idea: ${params.rubric}
Student answer: "${params.userAnswer}"

Respond ONLY with JSON: { "correct": boolean, "feedback": string }
Be generous: reward conceptually correct answers even if wording differs. Feedback should be one helpful sentence.`;
  const offlineGrade = () =>
    JSON.stringify({
      correct: params.userAnswer.trim().length > 12,
      feedback:
        params.userAnswer.trim().length > 12
          ? "Looks reasonable — a solid attempt."
          : "Try to write a fuller answer referencing the key idea.",
    });
  const res = await complete(
    { system: "You are Cairn's grader. Strict JSON only.", prompt, maxTokens: 300, temperature: 0.2 },
    offlineGrade
  );
  try {
    return extractJson<{ correct: boolean; feedback: string }>(res.text);
  } catch {
    return { correct: params.userAnswer.trim().length > 12, feedback: "Could not auto-grade; a longer answer is usually better." };
  }
}

// ---------------- study chat (RAG) ----------------

export async function chatAnswer(params: {
  question: string;
  context: string;
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<string> {
  const historyText = params.history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Student" : "Cairn"}: ${m.content}`)
    .join("\n");
  const prompt = `You are Cairn, a patient study tutor for THIS course. Answer using the course material below. If the material doesn't cover it, say so and give a careful general answer. Use markdown. Keep answers concise (under 200 words) unless the student asks for depth.

COURSE MATERIAL:
"""
${params.context.slice(0, 9000)}
"""

RECENT CONVERSATION:
${historyText}

Student: ${params.question}`;
  const res = await complete(
    { system: "Cairn study tutor. Markdown answers, no preamble.", prompt, maxTokens: 700, temperature: 0.5 },
    () => offlineChat(params)
  );
  return res.text;
}

// ================= OFFLINE FALLBACKS (no API key needed) =================

function offlineCourse(p: {
  sourceType: SourceType;
  sourceText: string;
  goal: string;
  level: Level;
}): GeneratedCourse {
  const text = p.sourceText || "the provided topic";
  const title =
    p.sourceType === "topic"
      ? capitalize(p.sourceText.slice(0, 60))
      : titleFromText(text);
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30)
    .slice(0, 40);
  const chunks = chunkArray(sentences, Math.max(2, Math.ceil(sentences.length / 4)));
  const modules = chunks.map((chunk, i) => ({
    title: `Module ${i + 1}: ${moduleName(i)}`,
    lessons: [
      {
        module_title: `Module ${i + 1}: ${moduleName(i)}`,
        title: lessonName(i, 0),
        content:
          `## Overview\n\n` +
          chunk.join(" ") +
          `\n\n## Key Takeaway\n\nThis section covers the essentials above. Re-read the key sentences and try to restate them in your own words.`,
        objectives: [
          "Summarize the main idea of this section.",
          "Identify one detail you can apply.",
        ],
        key_terms: extractTerms(chunk.join(" ")),
        est_minutes: 8,
      } as GeneratedLesson,
    ],
  }));
  if (!modules.length) {
    modules.push({
      title: "Module 1: Getting Started",
      lessons: [
        {
          module_title: "Module 1: Getting Started",
          title: "Introduction",
          content:
            "## Welcome\n\nThis is a locally-generated starter course (no AI key configured). Add an ANTHROPIC_API_KEY to get a richer, AI-authored curriculum.\n\n## Key Takeaway\n\nYou can study, quiz, and chat with your material either way.",
          objectives: ["Open a lesson", "Take a quiz"],
          key_terms: [],
          est_minutes: 5,
        } as GeneratedLesson,
      ],
    });
  }
  return {
    title,
    description: `A course built from your ${p.sourceType}. ${
      p.goal ? "Goal: " + p.goal : ""
    }`,
    goal: p.goal || "Understand the material",
    level: p.level,
    modules,
  };
}

function offlineExplain(p: {
  concept: string;
  style: string;
  context?: string;
}): string {
  return `## ${capitalize(p.concept)}\n\n${
    p.context
      ? "Based on your course material:\n\n" + p.context.slice(0, 600) + "\n\n"
      : ""
  }*Offline mode (no AI key).* Here's a plain restatement: **${p.concept}** is an important idea in this course. Review the related lesson and try teaching it back to yourself — that's the fastest way to make it stick.\n\n## Key Takeaway\n\nSet ANTHROPIC_API_KEY to unlock richer, multi-style explanations.`;
}

function offlineQuiz(p: { lessonTitle: string; lessonContent: string }): Question[] {
  const words = p.lessonContent
    .replace(/[#*`>]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 5)
    .slice(0, 30);
  const a = words[0] ?? "learning";
  const b = words[3] ?? "practice";
  return [
    {
      id: "q0",
      prompt: `Which idea is central to "${p.lessonTitle}"?`,
      type: "mc",
      options: [capitalize(a), capitalize(b), "None of these", "All of these"],
      answer_index: 0,
      explanation: `The lesson emphasizes ${a}. (Offline quiz — set an API key for adaptive questions.)`,
    },
    {
      id: "q1",
      prompt: `Reviewing this lesson regularly improves retention.`,
      type: "truefalse",
      options: ["True", "False"],
      answer_index: 0,
      explanation: "Spaced repetition is one of the most effective study habits.",
    },
  ];
}

function offlineChat(p: {
  question: string;
  context: string;
  history: any[];
}): string {
  return `*(Offline mode — no AI key configured.)* I can see your question about **${p.question.slice(
    0,
    80
  )}**. The course material covers related ideas; re-reading the lessons and taking a quiz will help most. Set \`ANTHROPIC_API_KEY\` to enable live, contextual tutoring.`;
}

// ---- tiny text helpers (no deps) ----
function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
function titleFromText(t: string): string {
  const first = t.split(/[.\n]/)[0]?.trim().slice(0, 70);
  return capitalize(first || "New Course");
}
function moduleName(i: number): string {
  return ["Foundations", "Core Ideas", "In Practice", "Going Further", "Mastery"][i % 5];
}
function lessonName(i: number, j: number): string {
  return `Lesson ${i + 1}.${j + 1}`;
}
function chunkArray<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  const size = Math.ceil(arr.length / n) || 1;
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  if (out.length === 0) out.push([]);
  return out;
}
function extractTerms(text: string): { term: string; definition: string }[] {
  const words = text.match(/\b[A-Z][a-zA-Z]{4,}\b/g)?.slice(0, 4) ?? [];
  return words.map((w) => ({ term: w, definition: `A key term appearing in this section.` }));
}
