import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase/server";
import type { User } from "@/lib/types";
import {
  dataBackend,
  env,
  signSession,
  verifySession,
  verifyPassword,
  hashPassword,
  uid,
} from "@/lib/util";

export const LOCAL_SESSION_COOKIE = "cairn_session";
const SECRET = env("CAIRN_SECRET", "dev-insecure-secret-change-me");

// ---------------- local backend ----------------

async function localCurrentUser(): Promise<User | null> {
  const token = cookies().get(LOCAL_SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = verifySession(token, SECRET);
  if (!userId) return null;
  const db = await getDb();
  return db.getUserById(userId);
}

export async function localSignIn(
  email: string,
  password: string
): Promise<User> {
  const db = await getDb();
  const user = await db.getUserByEmail(email);
  if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    throw new Error("Invalid email or password.");
  }
  return user;
}

export async function localSignUp(
  email: string,
  name: string,
  password: string
): Promise<User> {
  const db = await getDb();
  const existing = await db.getUserByEmail(email);
  if (existing) throw new Error("An account with that email already exists.");
  return db.createUser({
    email,
    name,
    password_hash: hashPassword(password),
  });
}

export function startLocalSession(userId: string) {
  cookies().set(LOCAL_SESSION_COOKIE, signSession(userId, SECRET), {
    httpOnly: true,
    sameSite: "lax",
    secure: env("NODE_ENV") === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function endLocalSession() {
  cookies().delete(LOCAL_SESSION_COOKIE);
}

// ---------------- supabase backend ----------------

async function supabaseCurrentUser(): Promise<User | null> {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const db = await getDb();
  let profile = await db.getUserById(user.id);
  if (!profile) {
    profile = await db.createUser({
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Learner",
    });
  }
  return profile;
}

export async function supabaseSignIn(
  email: string,
  password: string
): Promise<User> {
  const sb = supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const db = await getDb();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Sign in failed.");
  let profile = await db.getUserById(user.id);
  if (!profile) {
    profile = await db.createUser({
      id: user.id,
      email: user.email ?? email,
      name: user.user_metadata?.name ?? email.split("@")[0],
    });
  }
  return profile;
}

export async function supabaseSignUp(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const sb = supabaseServer();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Sign up failed.");
  const db = await getDb();
  let profile = await db.getUserById(data.user.id);
  if (!profile) {
    profile = await db.createUser({
      id: data.user.id,
      email: data.user.email ?? email,
      name,
    });
  }
  return profile;
}

export async function supabaseSignOut() {
  const sb = supabaseServer();
  await sb.auth.signOut();
}

// ---------------- unified facade ----------------

export async function getSessionUser(): Promise<User | null> {
  return dataBackend() === "supabase" ? supabaseCurrentUser() : localCurrentUser();
}

/** For server components/pages: redirect to login when unauthenticated. */
export async function requireUser(redirectTo = "/login"): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
  return dataBackend() === "supabase"
    ? supabaseSignIn(email, password)
    : localSignIn(email, password);
}

export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<User> {
  return dataBackend() === "supabase"
    ? supabaseSignUp(email, password, name)
    : localSignUp(email, name, password);
}

export async function signOut() {
  if (dataBackend() === "supabase") await supabaseSignOut();
  else endLocalSession();
}
