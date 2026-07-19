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
  Goal,
  Review,
  UserSearch,
} from "@/lib/types";
import { nowISO, uid, inMinutes, env } from "@/lib/util";

interface FriendRow {
  user_id: string;
  friend_id: string;
  created_at: string;
}

interface Store {
  users: User[];
  courses: Course[];
  lessons: Lesson[];
  quizzes: Quiz[];
  attempts: Attempt[];
  chat: ChatMessage[];
  progress: Progress[];
  clientGoals: Goal[];
  friends: FriendRow[];
  reviews: Review[];
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
      clientGoals: [],
      friends: [],
      reviews: [],
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
    "clientGoals",
    "friends",
    "reviews",
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
      const u = s.users.find((x) => x.id === id);
      return u ? { ...u, points: u.points ?? 0 } : null;
    },
    async getUserByEmail(email) {
      const s = await load();
      const e = email.toLowerCase();
      const u = s.users.find((x) => x.email.toLowerCase() === e);
      return u ? { ...u, points: u.points ?? 0 } : null;
    },
    async createUser(input) {
      return withWrite((s) => {
        const user: User = {
          id: uid("usr"),
          email: input.email,
          name: input.name,
          username: input.username ?? input.name,
          password_hash: input.password_hash ?? null,
          points: 0,
          awarded_goals: [],
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

    async listLeaderboard(limit) {
      const s = await load();
      return s.users
        .map((u) => ({ id: u.id, name: u.name, points: u.points ?? 0 }))
        .sort((a, b) => b.points - a.points)
        .slice(0, limit);
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

    async activityToday(userId, metric) {
      const s = await load();
      const today = nowISO().slice(0, 10);
      const sameDay = (iso?: string | null) => (iso ?? "").slice(0, 10) === today;
      switch (metric) {
        case "quiz_questions":
          return s.attempts
            .filter((a) => a.user_id === userId && sameDay(a.created_at))
            .reduce((n, a) => n + (a.total ?? 0), 0);
        case "quizzes":
          return new Set(
            s.attempts
              .filter((a) => a.user_id === userId && sameDay(a.created_at))
              .map((a) => a.quiz_id)
          ).size;
        case "lessons":
          return s.progress.filter((p) => p.user_id === userId && sameDay(p.last_reviewed_at)).length;
        case "courses":
          return s.courses.filter((c) => c.user_id === userId && sameDay(c.created_at)).length;
        default:
          return 0;
      }
    },
    async listClientGoals(userId) {
      const s = await load();
      return s.clientGoals
        .filter((g) => g.owner_id === userId)
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    },
    async createClientGoal(input) {
      return withWrite((s) => {
        const g: Goal = {
          id: uid("goal"),
          kind: "client",
          title: input.title,
          metric: input.metric,
          target: input.target,
          points: 0, // personal goals never award points
          owner_id: input.user_id,
          created_at: nowISO(),
          difficulty: input.difficulty ?? "medium",
          course_id: input.course_id ?? null,
          done: false,
          baseline: input.baseline ?? 0,
        };
        s.clientGoals.push(g);
        return g;
      });
    },
    async setClientGoalDone(id, userId, done) {
      return withWrite((s) => {
        const g = s.clientGoals.find(
          (x) => x.id === id && x.owner_id === userId
        );
        if (!g) throw new Error("goal not found");
        g.done = done;
        return { ...g };
      });
    },
    async deleteClientGoal(id, userId) {
      return withWrite((s) => {
        s.clientGoals = s.clientGoals.filter(
          (g) => !(g.id === id && g.owner_id === userId)
        );
      });
    },

    // ---- friends ----
    async listFriends(userId) {
      const s = await load();
      const ids = s.friends
        .filter((f) => f.user_id === userId)
        .map((f) => f.friend_id);
      return ids
        .map((fid) => s.users.find((u) => u.id === fid))
        .filter((u): u is User => Boolean(u))
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          points: u.points ?? 0,
        }))
        .sort((a, b) => b.points - a.points);
    },
    async addFriend(userId, friendId) {
      return withWrite((s) => {
        const pair = (a: string, b: string) =>
          s.friends.find((f) => f.user_id === a && f.friend_id === b);
        const exists =
          pair(userId, friendId) || pair(friendId, userId);
        if (!exists) {
          const t = nowISO();
          s.friends.push({ user_id: userId, friend_id: friendId, created_at: t });
          s.friends.push({ user_id: friendId, friend_id: userId, created_at: t });
        }
      });
    },
    async removeFriend(userId, friendId) {
      return withWrite((s) => {
        s.friends = s.friends.filter(
          (f) =>
            !(
              (f.user_id === userId && f.friend_id === friendId) ||
              (f.user_id === friendId && f.friend_id === userId)
            )
        );
      });
    },
    async getUserByUsername(username) {
      const s = await load();
      const u = s.users.find(
        (x) => (x.username ?? "").toLowerCase() === username.toLowerCase()
      );
      return u ? { ...u, points: u.points ?? 0 } : null;
    },
    async searchUsers(query, excludeId, limit = 8) {
      const s = await load();
      const q = query.toLowerCase();
      return s.users
        .filter((u) => u.id !== excludeId)
        .filter((u) => {
          const hay = `${u.username ?? ""} ${u.email} ${u.name}`.toLowerCase();
          return hay.includes(q);
        })
        .slice(0, limit)
        .map(
          (u): UserSearch => ({
            id: u.id,
            name: u.name,
            username: u.username ?? "",
            email: u.email,
            points: u.points ?? 0,
          })
        );
    },

    // ---- reviews ----
    async listReviews(userId) {
      const s = await load();
      return s.reviews
        .filter((r) => r.user_id === userId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    },
    async addReview(userId, lessonId, courseId) {
      return withWrite((s) => {
        const existing = s.reviews.find(
          (r) => r.user_id === userId && r.lesson_id === lessonId
        );
        if (existing) return existing;
        const r: Review = {
          id: uid("rev"),
          user_id: userId,
          lesson_id: lessonId,
          course_id: courseId,
          created_at: nowISO(),
        };
        s.reviews.push(r);
        return r;
      });
    },
    async removeReview(id, userId) {
      return withWrite((s) => {
        s.reviews = s.reviews.filter(
          (r) => !(r.id === id && r.user_id === userId)
        );
      });
    },
  };
}
