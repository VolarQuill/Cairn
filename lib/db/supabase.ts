import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { supabaseServer } from "@/lib/supabase/server";
import type { Database as DbInterface } from "./index";
import type {
  Attempt,
  ChatMessage,
  Course,
  Lesson,
  Progress,
  Quiz,
  User,
  Mastery,
  Level,
  SourceType,
  Goal,
  Friend,
  Review,
  UserSearch,
  Difficulty,
} from "@/lib/types";
import { env } from "@/lib/util";

let _srole: SupabaseClient | null = null;

function client(): SupabaseClient {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const srole = env("SUPABASE_SERVICE_ROLE_KEY");
  // Prefer the service-role key (bypasses RLS) for all DB work.
  if (srole && url) {
    return (_srole ??= createClient(url, srole, {
      auth: { persistSession: false, autoRefreshToken: false },
    }));
  }
  // No service-role key: use the session-aware client so RLS sees the current
  // user's uid. The DB layer previously built its own anon client with no
  // session, which made auth.uid() NULL on the server and denied every
  // cross-user read (friend search, leaderboard) via RLS.
  if (!url) {
    throw new Error(
      "Supabase backend selected but NEXT_PUBLIC_SUPABASE_URL is missing. " +
        "Set them, or run with DATA_BACKEND=local."
    );
  }
  return supabaseServer();
}

export function createSupabaseDb(): DbInterface {
  const sb = () => client();

  const toCourse = (r: any): Course => ({
    id: r.id,
    user_id: r.user_id,
    title: r.title,
    description: r.description,
    goal: r.goal,
    level: r.level,
    source_type: r.source_type,
    source_text: r.source_text,
    status: r.status,
    created_at: r.created_at,
    updated_at: r.updated_at,
  });

  return {
    async getUserById(id) {
      const { data } = await sb()
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        password_hash: null,
        username: data.username ?? "",
        points: data.points ?? 0,
        awarded_goals: (data.awarded_goals as string[] | null) ?? [],
        created_at: data.created_at,
      };
    },
    async getUserByEmail(email) {
      const { data } = await sb()
        .from("profiles")
        .select("*")
        .eq("email", email.toLowerCase())
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        password_hash: null,
        username: data.username ?? "",
        points: data.points ?? 0,
        awarded_goals: (data.awarded_goals as string[] | null) ?? [],
        created_at: data.created_at,
      };
    },
    async createUser(input) {
      const { data, error } = await sb()
        .from("profiles")
        .insert({
          id: input.id ?? undefined,
          email: input.email.toLowerCase(),
          name: input.name,
          username: input.username ?? null,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        password_hash: null,
        username: data.username ?? "",
        points: data.points ?? 0,
        awarded_goals: (data.awarded_goals as string[] | null) ?? [],
        created_at: data.created_at,
      };
    },
    async updateUser(id, patch) {
      const { data, error } = await sb()
        .from("profiles")
        .update({ ...patch })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        password_hash: null,
        username: data.username ?? "",
        points: data.points ?? 0,
        awarded_goals: (data.awarded_goals as string[] | null) ?? [],
        created_at: data.created_at,
      };
    },

    async listLeaderboard(limit) {
      const { data, error } = await sb()
        .from("profiles")
        .select("id,name,points")
        .order("points", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        points: r.points ?? 0,
      }));
    },

    async createCourse(input) {
      const t = new Date().toISOString();
      const { data, error } = await sb()
        .from("courses")
        .insert({
          id: randomUUID(),
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
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return toCourse(data);
    },
    async getCourse(id) {
      const { data } = await sb()
        .from("courses")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      return data ? toCourse(data) : null;
    },
    async listCourses(user_id) {
      const { data, error } = await sb()
        .from("courses")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(toCourse);
    },
    async updateCourse(id, patch) {
      const { data, error } = await sb()
        .from("courses")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return toCourse(data);
    },
    async deleteCourse(id) {
      const { error } = await sb().from("courses").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },

    async addLessons(course_id, lessons) {
      const rows = lessons.map((l) => ({ id: randomUUID(), course_id, ...l }));
      const { data, error } = await sb()
        .from("lessons")
        .insert(rows)
        .select();
      if (error) throw new Error(error.message);
      return (data ?? []).map((r: any): Lesson => ({
        id: r.id,
        course_id: r.course_id,
        module_index: r.module_index,
        lesson_index: r.lesson_index,
        module_title: r.module_title,
        title: r.title,
        content: r.content,
        objectives: r.objectives ?? [],
        key_terms: r.key_terms ?? [],
        est_minutes: r.est_minutes ?? 5,
      }));
    },
    async getLessons(course_id) {
      const { data, error } = await sb()
        .from("lessons")
        .select("*")
        .eq("course_id", course_id)
        .order("module_index")
        .order("lesson_index");
      if (error) throw new Error(error.message);
      return (data ?? []).map((r: any): Lesson => ({
        id: r.id,
        course_id: r.course_id,
        module_index: r.module_index,
        lesson_index: r.lesson_index,
        module_title: r.module_title,
        title: r.title,
        content: r.content,
        objectives: r.objectives ?? [],
        key_terms: r.key_terms ?? [],
        est_minutes: r.est_minutes ?? 5,
      }));
    },
    async getLesson(id) {
      const { data } = await sb()
        .from("lessons")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id,
        course_id: data.course_id,
        module_index: data.module_index,
        lesson_index: data.lesson_index,
        module_title: data.module_title,
        title: data.title,
        content: data.content,
        objectives: data.objectives ?? [],
        key_terms: data.key_terms ?? [],
        est_minutes: data.est_minutes ?? 5,
      };
    },
    async updateLesson(id, patch) {
      const { data, error } = await sb()
        .from("lessons")
        .update({ ...patch })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        course_id: data.course_id,
        module_index: data.module_index,
        lesson_index: data.lesson_index,
        module_title: data.module_title,
        title: data.title,
        content: data.content,
        objectives: data.objectives ?? [],
        key_terms: data.key_terms ?? [],
        est_minutes: data.est_minutes ?? 5,
      };
    },

    async createQuiz(input) {
      const { data, error } = await sb()
        .from("quizzes")
        .insert({
          id: randomUUID(),
          course_id: input.course_id,
          lesson_id: input.lesson_id,
          title: input.title,
          questions: input.questions,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        course_id: data.course_id,
        lesson_id: data.lesson_id,
        title: data.title,
        questions: data.questions ?? [],
        created_at: data.created_at,
      };
    },
    async getQuiz(id) {
      const { data } = await sb()
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id,
        course_id: data.course_id,
        lesson_id: data.lesson_id,
        title: data.title,
        questions: data.questions ?? [],
        created_at: data.created_at,
      };
    },
    async listQuizzes(course_id) {
      const { data, error } = await sb()
        .from("quizzes")
        .select("*")
        .eq("course_id", course_id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(
        (r: any): Quiz => ({
          id: r.id,
          course_id: r.course_id,
          lesson_id: r.lesson_id,
          title: r.title,
          questions: r.questions ?? [],
          created_at: r.created_at,
        })
      );
    },
    async recordAttempt(input) {
      const { data, error } = await sb()
        .from("attempts")
        .insert({
          id: randomUUID(),
          user_id: input.user_id,
          quiz_id: input.quiz_id,
          score: input.score,
          total: input.total,
          answers: input.answers,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        user_id: data.user_id,
        quiz_id: data.quiz_id,
        score: data.score,
        total: data.total,
        answers: data.answers ?? [],
        created_at: data.created_at,
      };
    },
    async getAttempts(user_id, quiz_id) {
      let q = sb()
        .from("attempts")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });
      if (quiz_id) q = q.eq("quiz_id", quiz_id);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []).map(
        (r: any): Attempt => ({
          id: r.id,
          user_id: r.user_id,
          quiz_id: r.quiz_id,
          score: r.score,
          total: r.total,
          answers: r.answers ?? [],
          created_at: r.created_at,
        })
      );
    },

    async addChatMessage(input) {
      const { data, error } = await sb()
        .from("chat_messages")
        .insert({
          id: randomUUID(),
          course_id: input.course_id,
          user_id: input.user_id,
          role: input.role,
          content: input.content,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        course_id: data.course_id,
        user_id: data.user_id,
        role: data.role,
        content: data.content,
        created_at: data.created_at,
      };
    },
    async getChatMessages(course_id, user_id) {
      const { data, error } = await sb()
        .from("chat_messages")
        .select("*")
        .eq("course_id", course_id)
        .eq("user_id", user_id)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map(
        (r: any): ChatMessage => ({
          id: r.id,
          course_id: r.course_id,
          user_id: r.user_id,
          role: r.role,
          content: r.content,
          created_at: r.created_at,
        })
      );
    },
    async clearChat(course_id, user_id) {
      const { error } = await sb()
        .from("chat_messages")
        .delete()
        .eq("course_id", course_id)
        .eq("user_id", user_id);
      if (error) throw new Error(error.message);
    },

    async getProgress(user_id, lesson_id) {
      const { data } = await sb()
        .from("progress")
        .select("*")
        .eq("user_id", user_id)
        .eq("lesson_id", lesson_id)
        .maybeSingle();
      if (!data) return null;
      return data as Progress;
    },
    async upsertProgress(input) {
      const { user_id, lesson_id, course_id, ...rest } = input;
      const { data, error } = await sb()
        .from("progress")
        .upsert(
          { id: randomUUID(), user_id, lesson_id, course_id, ...rest },
          { onConflict: "user_id,lesson_id" }
        )
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Progress;
    },
    async listProgress(user_id) {
      const { data, error } = await sb()
        .from("progress")
        .select("*")
        .eq("user_id", user_id);
      if (error) throw new Error(error.message);
      return (data ?? []) as Progress[];
    },
    async setMastery(user_id, lesson_id, course_id, status) {
      const offsets: Record<Mastery, number> = {
        new: 0,
        learning: 60,
        familiar: 60 * 24,
        mastered: 60 * 24 * 7,
      };
      const due = new Date(
        Date.now() + offsets[status] * 60_000
      ).toISOString();
      const { data, error } = await sb()
        .from("progress")
        .upsert(
          {
            id: randomUUID(),
            user_id,
            lesson_id,
            course_id,
            status,
            last_reviewed_at: new Date().toISOString(),
            due_at: due,
          },
          { onConflict: "user_id,lesson_id" }
        )
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Progress;
    },

    async activityToday(userId, metric) {
      const start = `${new Date().toISOString().slice(0, 10)}T00:00:00Z`;
      if (metric === "quiz_questions" || metric === "quizzes") {
        const { data, error } = await sb()
          .from("attempts")
          .select("quiz_id,total")
          .eq("user_id", userId)
          .gte("created_at", start);
        if (error) throw new Error(error.message);
        const rows = (data ?? []) as any[];
        if (metric === "quiz_questions")
          return rows.reduce((n: number, r: any) => n + (r.total ?? 0), 0);
        return new Set(rows.map((r: any) => r.quiz_id)).size;
      }
      const table = metric === "lessons" ? "progress" : "courses";
      const col = metric === "lessons" ? "last_reviewed_at" : "created_at";
      const { data, error } = await sb()
        .from(table)
        .select("id")
        .eq("user_id", userId)
        .gte(col, start);
      if (error) throw new Error(error.message);
      return (data ?? []).length;
    },
    async listClientGoals(userId) {
      const { data, error } = await sb()
        .from("client_goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r: any): Goal => ({
        id: r.id,
        kind: "client",
        title: r.title,
        metric: r.metric,
        target: r.target ?? 1,
        points: 0,
        owner_id: r.user_id,
        created_at: r.created_at,
        difficulty: (r.difficulty ?? "medium") as Difficulty,
        course_id: r.course_id ?? null,
        done: Boolean(r.done),
        baseline: r.baseline ?? 0,
      }));
    },
    async createClientGoal(input) {
      const { data, error } = await sb()
        .from("client_goals")
        .insert({
          id: randomUUID(),
          user_id: input.user_id,
          title: input.title,
          metric: input.metric,
          target: input.target,
          difficulty: input.difficulty ?? "medium",
          course_id: input.course_id ?? null,
          baseline: input.baseline ?? 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        kind: "client",
        title: data.title,
        metric: data.metric,
        target: data.target ?? 1,
        points: 0,
        owner_id: data.user_id,
        created_at: data.created_at,
        difficulty: (data.difficulty ?? "medium") as Difficulty,
        course_id: data.course_id ?? null,
        done: Boolean(data.done),
        baseline: data.baseline ?? 0,
      };
    },
    async setClientGoalDone(id, userId, done) {
      const { data, error } = await sb()
        .from("client_goals")
        .update({ done })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        kind: "client",
        title: data.title,
        metric: data.metric,
        target: data.target ?? 1,
        points: 0,
        owner_id: data.user_id,
        created_at: data.created_at,
        difficulty: (data.difficulty ?? "medium") as Difficulty,
        course_id: data.course_id ?? null,
        done: Boolean(data.done),
        baseline: data.baseline ?? 0,
      };
    },
    async deleteClientGoal(id, userId) {
      const { error } = await sb()
        .from("client_goals")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    },

    // ---- friends ----
    async listFriends(userId) {
      const { data: links, error: le } = await sb()
        .from("friends")
        .select("friend_id")
        .eq("user_id", userId);
      if (le) throw new Error(le.message);
      const ids = (links ?? []).map((l: any) => l.friend_id as string);
      if (ids.length === 0) return [];
      const { data, error } = await sb()
        .from("profiles")
        .select("id,name,email,points")
        .in("id", ids);
      if (error) throw new Error(error.message);
      return (data ?? [])
        .map(
          (r: any): Friend => ({
            id: r.id,
            name: r.name,
            email: r.email,
            points: r.points ?? 0,
          })
        )
        .sort((a: Friend, b: Friend) => b.points - a.points);
    },
    async addFriend(userId, friendId) {
      const rows = [
        { user_id: userId, friend_id: friendId },
        { user_id: friendId, friend_id: userId },
      ];
      const { error } = await sb().from("friends").insert(rows);
      if (error) throw new Error(error.message);
    },
    async removeFriend(userId, friendId) {
      const { error } = await sb()
        .from("friends")
        .delete()
        .or(
          `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
        );
      if (error) throw new Error(error.message);
    },
    async getUserByUsername(username) {
      const { data } = await sb()
        .from("profiles")
        .select("*")
        .eq("username", username.toLowerCase())
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        username: data.username ?? "",
        password_hash: null,
        points: data.points ?? 0,
        awarded_goals: (data.awarded_goals as string[] | null) ?? [],
        created_at: data.created_at,
      };
    },
    async searchUsers(query, excludeId, limit = 8) {
      const { data, error } = await sb()
        .from("profiles")
        .select("id,name,username,email,points")
        .or(
          `username.ilike.%${query}%,email.ilike.%${query}%,name.ilike.%${query}%`
        )
        .neq("id", excludeId)
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []).map(
        (r: any): UserSearch => ({
          id: r.id,
          name: r.name,
          username: r.username ?? "",
          email: r.email,
          points: r.points ?? 0,
        })
      );
    },

    // ---- reviews ----
    async listReviews(userId) {
      const { data, error } = await sb()
        .from("reviews")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map(
        (r: any): Review => ({
          id: r.id,
          user_id: r.user_id,
          lesson_id: r.lesson_id,
          course_id: r.course_id,
          created_at: r.created_at,
        })
      );
    },
    async addReview(userId, lessonId, courseId) {
      const { data, error } = await sb()
        .from("reviews")
        .upsert(
          {
            id: randomUUID(),
            user_id: userId,
            lesson_id: lessonId,
            course_id: courseId,
            created_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        )
        .select()
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        user_id: data.user_id,
        lesson_id: data.lesson_id,
        course_id: data.course_id,
        created_at: data.created_at,
      };
    },
    async removeReview(id, userId) {
      const { error } = await sb()
        .from("reviews")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    },
  };
}
