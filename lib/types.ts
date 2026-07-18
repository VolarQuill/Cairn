// Shared domain types used across both the Supabase (cloud) and
// local JSON-file backends. Keeping one shape makes the rest of the app
// backend-agnostic.

export type SourceType = "text" | "url" | "file" | "topic";

export type Level = "beginner" | "intermediate" | "advanced";

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string | null; // local backend only
  created_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  title: string;
  description: string;
  goal: string;
  level: Level;
  source_type: SourceType;
  source_text: string;
  status: "draft" | "ready" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  module_index: number;
  lesson_index: number;
  module_title: string;
  title: string;
  content: string; // markdown
  objectives: string[];
  key_terms: { term: string; definition: string }[];
  est_minutes: number;
}

export type QuestionType = "mc" | "truefalse" | "short";

export interface Question {
  id: string;
  prompt: string;
  type: QuestionType;
  options?: string[]; // for mc / truefalse
  answer_index: number; // index into options
  explanation: string;
  rubric?: string; // for short answer grading
}

export interface Quiz {
  id: string;
  course_id: string;
  lesson_id: string | null;
  title: string;
  questions: Question[];
  created_at: string;
}

export interface Attempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total: number;
  answers: { question_id: string; chosen: number; correct: boolean }[];
  created_at: string;
}

export type Mastery = "new" | "learning" | "familiar" | "mastered";

export interface Progress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  status: Mastery;
  // Spaced repetition state (SM-2 inspired)
  ease: number;
  interval: number;
  reps: number;
  due_at: string;
  last_reviewed_at: string | null;
}

export interface ChatMessage {
  id: string;
  course_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// ---- Generated payloads from the AI layer (pre-persistence shapes) ----

export interface GeneratedLesson {
  module_title: string;
  title: string;
  content: string;
  objectives: string[];
  key_terms: { term: string; definition: string }[];
  est_minutes: number;
}

export interface GeneratedCourse {
  title: string;
  description: string;
  goal: string;
  level: Level;
  modules: { title: string; lessons: GeneratedLesson[] }[];
}
