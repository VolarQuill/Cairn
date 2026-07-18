import * as fs from "fs";
import path from "path";
import { env } from "@/lib/util";

/**
 * Local, device-scoped settings store.
 *
 * Cairn lets a user paste their own AI provider key from the Settings page so
 * the app works without any server-side secret. We persist that key (plus the
 * chosen provider and optional model override) in a small JSON file inside the
 * data directory. The AI provider layer consults this store on top of the
 * normal environment variables — env secrets still win.
 *
 * This module is server-only (it touches the filesystem) and is loaded lazily
 * on first import.
 */

export type AiProvider = "gemini" | "anthropic";

export interface AppSettings {
  aiProvider: AiProvider | "";
  apiKey: string;
  model: string;
}

const memory: AppSettings = { aiProvider: "", apiKey: "", model: "" };
let loaded = false;

function dataFile(): string {
  const dir = env("CAIRN_DATA_DIR", path.join(process.cwd(), "data"));
  return path.join(dir, "settings.json");
}

function loadSync() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = fs.readFileSync(dataFile(), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      memory.aiProvider = parsed.aiProvider === "gemini" || parsed.aiProvider === "anthropic"
        ? parsed.aiProvider
        : "";
      memory.apiKey = typeof parsed.apiKey === "string" ? parsed.apiKey : "";
      memory.model = typeof parsed.model === "string" ? parsed.model : "";
    }
  } catch {
    /* no settings file yet — start empty */
  }
}

export function getSettings(): AppSettings {
  loadSync();
  return { ...memory };
}

export function saveSettings(patch: Partial<AppSettings>): AppSettings {
  loadSync();
  if (patch.aiProvider === "gemini" || patch.aiProvider === "anthropic")
    memory.aiProvider = patch.aiProvider;
  if (typeof patch.apiKey === "string") memory.apiKey = patch.apiKey;
  if (typeof patch.model === "string") memory.model = patch.model;
  try {
    fs.mkdirSync(path.dirname(dataFile()), { recursive: true });
    fs.writeFileSync(dataFile(), JSON.stringify(memory, null, 2), "utf8");
  } catch {
    /* best effort — in-memory value still applies for this process */
  }
  return { ...memory };
}

/** Which provider is active.
 *
 * A key the user pasted in Settings is authoritative — it represents an
 * explicit choice. If the user hasn't set one, we fall back to any configured
 * environment secret, then to offline mode.
 */
export function resolvedProvider(): AiProvider | null {
  loadSync();
  if ((memory.aiProvider === "gemini" || memory.aiProvider === "anthropic") && memory.apiKey)
    return memory.aiProvider;
  if (env("GEMINI_API_KEY")) return "gemini";
  if (env("ANTHROPIC_API_KEY")) return "anthropic";
  return null;
}

/** The api key to use for a given provider (user key wins, env is fallback). */
export function resolvedApiKey(): string {
  loadSync();
  const p = resolvedProvider();
  if (p === "gemini")
    return (memory.aiProvider === "gemini" ? memory.apiKey : "") || env("GEMINI_API_KEY") || "";
  if (p === "anthropic")
    return (memory.aiProvider === "anthropic" ? memory.apiKey : "") || env("ANTHROPIC_API_KEY") || "";
  return memory.apiKey || env("GEMINI_API_KEY") || env("ANTHROPIC_API_KEY") || "";
}

/** Resolve the model id, allowing a user-supplied override. */
export function resolvedModel(): string {
  loadSync();
  if (memory.model) return memory.model;
  const explicit = env("CAIRN_MODEL") || env("GEMINI_MODEL");
  if (explicit) return explicit;
  return resolvedProvider() === "gemini"
    ? "gemini-1.5-flash"
    : "claude-3-5-sonnet-20241022";
}

/** Mask a key for safe display, e.g. "••••W7x9". */
export function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 4) return "•".repeat(key.length);
  return "•".repeat(Math.max(4, key.length - 4)) + key.slice(-4);
}
