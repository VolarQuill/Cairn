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
  Goal,
  GoalMetric,
  Difficulty,
  Friend,
  Review,
  UserSearch,
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
    username?: string;
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

  // ---- goals ----
  /** Activity count for `metric` performed *today* (server daily goals). */
  activityToday(user_id: string, metric: GoalMetric): Promise<number>;
  /** Personal (client-set) goals owned by the user. */
  listClientGoals(user_id: string): Promise<Goal[]>;
  createClientGoal(input: {
    user_id: string;
    title: string;
    metric: GoalMetric;
    target: number;
    difficulty?: Difficulty;
    course_id?: string | null;
    /** Activity count at creation — personal-goal progress starts here. */
    baseline?: number;
  }): Promise<Goal>;
  /** Mark a client goal done/undone (explicit completion). */
  setClientGoalDone(id: string, user_id: string, done: boolean): Promise<Goal>;
  deleteClientGoal(id: string, user_id: string): Promise<void>;

  // ---- friends (mutual; stored as two directed rows) ----
  /** Other users this user is friends with (their profiles). */
  listFriends(user_id: string): Promise<Friend[]>;
  /** Adds a mutual friendship (idempotent). */
  addFriend(user_id: string, friend_id: string): Promise<void>;
  /** Removes a mutual friendship. */
  removeFriend(user_id: string, friend_id: string): Promise<void>;
  /** Find a single user by their unique username (case-insensitive). */
  getUserByUsername(username: string): Promise<User | null>;
  /** Type-ahead search across username/email/name, excluding `excludeId`. */
  searchUsers(query: string, excludeId: string, limit?: number): Promise<UserSearch[]>;

  // ---- reviews (lessons flagged "needs review") ----
  listReviews(user_id: string): Promise<Review[]>;
  addReview(
    user_id: string,
    lesson_id: string,
    course_id: string
  ): Promise<Review>;
  removeReview(id: string, user_id: string): Promise<void>;
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
