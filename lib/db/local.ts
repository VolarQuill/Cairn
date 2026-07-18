import { promises as fs } from "fs";
import path from "path";
import type { Database } from "./index";
import type {
  Attempt,
  ChatMessage,
  Course,
  Lesson,
  Progress,
  Quiz,
  User,
  Mastery,
} from "@/lib/types";
import { nowISO, uid, inMinutes, env } from "@/lib/util";

interface Store {
  users: User[];
  courses: Course[];
  lessons: Lesson[];
  quizzes: Quiz[];
  attempts: Attempt[];
  chat: ChatMessage[];
  progress: Progress[];
}

const DATA_FILE =
  env("CAIRN_DATA_DIR", path.join(process.cwd(), "data")) + "/cairn.json";

let cache: Store | null = null;
let writeChain: Promise<void> = Promise.resolve();

async function load(): Promise<Store> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    cache = JSON.parse(raw) as Store;
  } catch {
    cache = {
      users: [],
      courses: [],
      lessons: [],
      quizzes: [],
      attempts: [],
      chat: [],
      progress: [],
    };
  }
  // ensure all arrays exist (forward-compat for older files)
  for (const k of [
    "users",
    "courses",
    "lessons",
    "quizzes",
    "attempts",
    "chat",
    "progress",
  ] as const) {
    if (!Array.isArray((cache as any)[k])) (cache as any)[k] = [];
  }
  return cache;
}

/** Serialize writes so concurrent requests can't clobber the file. */
function withWrite<T>(fn: (s: Store) => T | Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const s = await load();
    const res = await fn(s);
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(s, null, 2), "utf8");
    return res;
  };
  const p = writeChain.then(run, run);
  // keep the chain alive but swallow errors so one failure doesn't block others
  writeChain = p.then(
    () => undefined,
    () => undefined
  );
  return p;
}

function freshProgress(
  user_id: string,
  lesson_id: string,
  course_id: string
): Progress {
  return {
    id: uid("prg"),
    user_id,
    lesson_id,
    course_id,
    status: "new" as Mastery,
    ease: 2.5, // SM-2 default ease factor
    interval: 0,
    reps: 0,
    due_at: nowISO(),
    last_reviewed_at: null,
  };
}

export function createLocalDb(): Database {
  return {
    async getUserById(id) {
      const s = await load();
      return s.users.find((u) => u.id === id) ?? null;
    },
    async getUserByEmail(email) {
      const s = await load();
      const e = email.toLowerCase();
      return s.users.find((u) => u.email.toLowerCase() === e) ?? null;
    },
    async createUser(input) {
      return withWrite((s) => {
        const user: User = {
          id: uid("usr"),
          email: input.email,
          name: input.name,
          password_hash: input.password_hash ?? null,
          created_at: nowISO(),
        };
        s.users.push(user);
        return user;
      });
    },
    async updateUser(id, patch) {
      return withWrite((s) => {
        const u = s.users.find((x) => x.id === id);
        if (!u) throw new Error("user not found");
        Object.assign(u, patch);
        return u;
      });
    },

    async createCourse(input) {
      return withWrite((s) => {
        const t = nowISO();
        const c: Course = {
          id: uid("crs"),
          user_id: input.user_id,
          title: input.title,
          description: input.description,
          goal: input.goal,
          level: input.level,
          source_type: input.source_type,
          source_text: input.source_text,
          status: input.status ?? "ready",
          created_at: t,
          updated_at: t,
        };
        s.courses.push(c);
        return c;
      });
    },
    async getCourse(id) {
      const s = await load();
      return s.courses.find((c) => c.id === id) ?? null;
    },
    async listCourses(user_id) {
      const s = await load();
      return s.courses
        .filter((c) => c.user_id === user_id)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    },
    async updateCourse(id, patch) {
      return withWrite((s) => {
        const c = s.courses.find((x) => x.id === id);
        if (!c) throw new Error("course not found");
        Object.assign(c, patch, { updated_at: nowISO() });
        return c;
      });
    },
    async deleteCourse(id) {
      return withWrite((s) => {
        const store = s as Store;
        store.courses = store.courses.filter((c) => c.id !== id);
        store.lessons = store.lessons.filter((l) => l.course_id !== id);
        store.quizzes = store.quizzes.filter((q) => q.course_id !== id);
        store.progress = store.progress.filter((p) => p.course_id !== id);
      });
    },

    async addLessons(course_id, lessons) {
      return withWrite((s) => {
        const created: Lesson[] = lessons.map((l) => ({
          id: uid("les"),
          course_id,
          ...l,
        }));
        s.lessons.push(...created);
        return created;
      });
    },
    async getLessons(course_id) {
      const s = await load();
      return s.lessons
        .filter((l) => l.course_id === course_id)
        .sort(
          (a, b) =>
            a.module_index - b.module_index || a.lesson_index - b.lesson_index
        );
    },
    async getLesson(id) {
      const s = await load();
      return s.lessons.find((l) => l.id === id) ?? null;
    },
    async updateLesson(id, patch) {
      return withWrite((s) => {
        const l = s.lessons.find((x) => x.id === id);
        if (!l) throw new Error("lesson not found");
        Object.assign(l, patch);
        return l;
      });
    },

    async createQuiz(input) {
      return withWrite((s) => {
        const q: Quiz = {
          id: uid("quiz"),
          course_id: input.course_id,
          lesson_id: input.lesson_id,
          title: input.title,
          questions: input.questions,
          created_at: nowISO(),
        };
        s.quizzes.push(q);
        return q;
      });
    },
    async getQuiz(id) {
      const s = await load();
      return s.quizzes.find((q) => q.id === id) ?? null;
    },
    async listQuizzes(course_id) {
      const s = await load();
      return s.quizzes
        .filter((q) => q.course_id === course_id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    async recordAttempt(input) {
      return withWrite((s) => {
        const a: Attempt = {
          id: uid("att"),
          user_id: input.user_id,
          quiz_id: input.quiz_id,
          score: input.score,
          total: input.total,
          answers: input.answers,
          created_at: nowISO(),
        };
        s.attempts.push(a);
        return a;
      });
    },
    async getAttempts(user_id, quiz_id) {
      const s = await load();
      return s.attempts
        .filter((a) => a.user_id === user_id && (!quiz_id || a.quiz_id === quiz_id))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },

    async addChatMessage(input) {
      return withWrite((s) => {
        const m: ChatMessage = {
          id: uid("msg"),
          course_id: input.course_id,
          user_id: input.user_id,
          role: input.role,
          content: input.content,
          created_at: nowISO(),
        };
        s.chat.push(m);
        return m;
      });
    },
    async getChatMessages(course_id, user_id) {
      const s = await load();
      return s.chat
        .filter((m) => m.course_id === course_id && m.user_id === user_id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    },
    async clearChat(course_id, user_id) {
      return withWrite((s) => {
        s.chat = s.chat.filter(
          (m) => !(m.course_id === course_id && m.user_id === user_id)
        );
      });
    },

    async getProgress(user_id, lesson_id) {
      const s = await load();
      return (
        s.progress.find(
          (p) => p.user_id === user_id && p.lesson_id === lesson_id
        ) ?? null
      );
    },
    async upsertProgress(input) {
      return withWrite((s) => {
        let p = s.progress.find(
          (x) => x.user_id === input.user_id && x.lesson_id === input.lesson_id
        );
        if (!p) {
          p = freshProgress(input.user_id, input.lesson_id, input.course_id);
          s.progress.push(p);
        }
        const { user_id, lesson_id, course_id, ...rest } = input;
        Object.assign(p, rest);
        if (input.course_id) p.course_id = input.course_id;
        return p;
      });
    },
    async listProgress(user_id) {
      const s = await load();
      return s.progress.filter((p) => p.user_id === user_id);
    },
    async setMastery(user_id, lesson_id, course_id, status) {
      return withWrite((s) => {
        let p = s.progress.find(
          (x) => x.user_id === user_id && x.lesson_id === lesson_id
        );
        if (!p) {
          p = freshProgress(user_id, lesson_id, course_id);
          s.progress.push(p);
        }
        p.status = status;
        p.last_reviewed_at = nowISO();
        // schedule next review based on mastery
        const offsets: Record<Mastery, number> = {
          new: 0,
          learning: 60,
          familiar: 60 * 24,
          mastered: 60 * 24 * 7,
        };
        p.due_at = inMinutes(offsets[status]);
        return p;
      });
    },
  };
}
