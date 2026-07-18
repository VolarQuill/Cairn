import { randomBytes, randomUUID } from "crypto";

/** Stable id generator that works on Node (server) runtimes. */
export function uid(prefix = ""): string {
  const raw = randomUUID().replace(/-/g, "").slice(0, 20);
  return prefix ? `${prefix}_${raw}` : raw;
}

export function shortCode(len = 8): string {
  return randomBytes(Math.ceil(len / 2))
    .toString("hex")
    .slice(0, len);
}

export function nowISO(): string {
  return new Date().toISOString();
}

/** Add minutes to now and return ISO. */
export function inMinutes(min: number): string {
  return new Date(Date.now() + min * 60_000).toISOString();
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Deterministic, dependency-free password hashing (scrypt). */
import { scryptSync, randomBytes as rb, timingSafeEqual } from "crypto";

export function hashPassword(pw: string): string {
  const salt = rb(16).toString("hex");
  const derived = scryptSync(pw, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  try {
    const [scheme, salt, derived] = stored.split("$");
    if (scheme !== "scrypt") return false;
    const check = scryptSync(pw, salt, 64).toString("hex");
    return timingSafeEqual(Buffer.from(check), Buffer.from(derived));
  } catch {
    return false;
  }
}

/** HMAC-signed session token (no external deps). */
import { createHmac } from "crypto";

export function signSession(value: string, secret: string): string {
  const sig = createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${sig}`;
}

export function verifySession(token: string, secret: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", secret).update(value).digest("hex");
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return value;
}

export function env(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

/** Which backend the running instance should use. */
export function dataBackend(): "supabase" | "local" {
  return env("DATA_BACKEND", "local").toLowerCase() === "supabase"
    ? "supabase"
    : "local";
}

export function isLocal(): boolean {
  return dataBackend() === "local";
}
