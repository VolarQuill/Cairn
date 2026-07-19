import type {
  Attempt,
  ChatMessage,
  Course,
  Lesson,
  Progress,
  Quiz,
  User,
  LeaderboardEntry,
  Level,
  SourceType,
  Mastery,
} from "@/lib/types";
import { dataBackend } from "@/lib/util";

/**
 * The single contract every backend must satisfy. The rest of the app
 * (API routes, server components) only ever talks to this interface, so the
 * exact same code runs against Supabase (cloud/Vercel) or a local JSON file.
 */
export interface Database {
  // ---- users ----
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(input: {
    id?: string;
    email: string;
    name: string;
    password_hash?: string | null;
  }): Promise<User>;
  updateUser(id: string, patch: Partial<User>): Promise<User>;
  /** Top `limit` users by points (global ranking). */
  listLeaderboard(limit: number): Promise<LeaderboardEntry[]>;

  // ---- courses ----
  createCourse(input: {
    user_id: string;
    title: string;
    description: string;
    goal: string;
    level: Level;
    source_type: SourceType;
    source_text: string;
    status?: Course["status"];
  }): Promise<Course>;
  getCourse(id: string): Promise<Course | null>;
  listCourses(user_id: string): Promise<Course[]>;
  updateCourse(id: string, patch: Partial<Course>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;

  // ---- lessons ----
  addLessons(
    course_id: string,
    lessons: Omit<Lesson, "id" | "course_id">[]
  ): Promise<Lesson[]>;
  getLessons(course_id: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | null>;
  updateLesson(id: string, patch: Partial<Lesson>): Promise<Lesson>;

  // ---- quizzes ----
  createQuiz(input: {
    course_id: string;
    lesson_id: string | null;
    title: string;
    questions: Quiz["questions"];
  }): Promise<Quiz>;
  getQuiz(id: string): Promise<Quiz | null>;
  listQuizzes(course_id: string): Promise<Quiz[]>;
  recordAttempt(input: {
    user_id: string;
    quiz_id: string;
    score: number;
    total: number;
    answers: Attempt["answers"];
  }): Promise<Attempt>;
  getAttempts(user_id: string, quiz_id?: string): Promise<Attempt[]>;

  // ---- chat ----
  addChatMessage(input: {
    course_id: string;
    user_id: string;
    role: ChatMessage["role"];
    content: string;
  }): Promise<ChatMessage>;
  getChatMessages(course_id: string, user_id: string): Promise<ChatMessage[]>;
  clearChat(course_id: string, user_id: string): Promise<void>;

  // ---- progress / SRS ----
  getProgress(user_id: string, lesson_id: string): Promise<Progress | null>;
  upsertProgress(input: Partial<Progress> & {
    user_id: string;
    lesson_id: string;
    course_id: string;
  }): Promise<Progress>;
  listProgress(user_id: string): Promise<Progress[]>;
  setMastery(
    user_id: string,
    lesson_id: string,
    course_id: string,
    status: Mastery
  ): Promise<Progress>;
}

let cached: Database | null = null;

/** Returns the active backend, selected by DATA_BACKEND (default: local). */
export async function getDb(): Promise<Database> {
  if (cached) return cached;
  if (dataBackend() === "supabase") {
    const mod = await import("./supabase");
    cached = mod.createSupabaseDb();
  } else {
    const mod = await import("./local");
    cached = mod.createLocalDb();
  }
  return cached;
}
