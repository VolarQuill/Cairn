import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/util";
import {
  resolvedProvider,
  resolvedApiKey,
  resolvedModel,
  type AiProvider,
} from "@/lib/settings";

/**
 * AI provider wrapper.
 *
 * Cairn is provider-agnostic — it is NOT hard-wired to any single vendor or
 * model. The active provider is chosen purely by which secret is configured:
 *   - GEMINI_API_KEY    -> Google Gemini (OpenAI-compatible endpoint)
 *   - ANTHROPIC_API_KEY -> Anthropic Claude
 *   - a user-supplied key from Settings (see lib/settings) also counts
 *   - neither           -> fully offline heuristic fallback (product still works)
 *
 * The model id is configurable via CAIRN_MODEL / GEMINI_MODEL (or a key the
 * user sets in Settings) and falls back to a sensible per-provider default. No
 * specific model is baked into the platform.
 */

const GEMINI_OPENAI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/openai";

export type { AiProvider };

/** Which provider is active, based on configured environment secrets or the
 *  key a user pasted in Settings. */
export function activeProvider(): AiProvider | null {
  return resolvedProvider();
}

export function hasApiKey(): boolean {
  return resolvedProvider() !== null;
}

/** Resolve the model id. Never hard-codes a specific vendor's model. */
export function MODEL(): string {
  return resolvedModel();
}

let _anthropic: Anthropic | null = null;
let _anthropicKey = "";
function anthropic(): Anthropic {
  const key = resolvedApiKey();
  if (_anthropic && _anthropicKey === key) return _anthropic;
  const opts: ConstructorParameters<typeof Anthropic>[0] = {
    apiKey: key || "missing",
  };
  const base = env("ANTHROPIC_BASE_URL");
  if (base) (opts as any).baseURL = base;
  _anthropic = new Anthropic(opts);
  _anthropicKey = key;
  return _anthropic;
}

export interface CompleteOptions {
  system?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  /** If true, throw instead of using the offline fallback. */
  requireModel?: boolean;
}

/**
 * Single-shot completion returning plain text.
 * Falls back to `offline()` when no key is configured.
 */
export async function complete(
  opts: CompleteOptions,
  offline?: () => string
): Promise<{ text: string; source: "model" | "offline" }> {
  const provider = activeProvider();
  if (!provider) {
    if (opts.requireModel || !offline) {
      throw new Error(
        "No AI provider is configured. Set GEMINI_API_KEY or ANTHROPIC_API_KEY, or add your own key in Settings, to enable AI generation."
      );
    }
    return { text: offline(), source: "offline" };
  }

  try {
    const text =
      provider === "gemini"
        ? await geminiComplete(opts)
        : await anthropicComplete(opts);
    return { text, source: "model" };
  } catch (e: any) {
    if (offline && !opts.requireModel) {
      return { text: offline(), source: "offline" };
    }
    throw new Error(`AI request failed: ${e?.message ?? String(e)}`);
  }
}

async function anthropicComplete(opts: CompleteOptions): Promise<string> {
  const msg = await anthropic().messages.create({
    model: MODEL(),
    max_tokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.6,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });
  return (msg.content as any[])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/**
 * Gemini via its OpenAI-compatible endpoint. Uses the global fetch — no extra
 * dependency. The base URL can be overridden with GEMINI_BASE_URL (e.g. a
 * proxy / OpenAI-compatible gateway).
 */
async function geminiComplete(opts: CompleteOptions): Promise<string> {
  const base = (env("GEMINI_BASE_URL") || GEMINI_OPENAI_BASE).replace(/\/$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolvedApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL(),
      max_tokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.6,
      messages: [
        ...(opts.system ? [{ role: "system", content: opts.system }] : []),
        { role: "user", content: opts.prompt },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  return (content ?? "").trim();
}

/** Extract the first well-formed JSON value from a model response. */
export function extractJson<T = any>(text: string): T {
  // Prefer fenced ```json blocks.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new Error("No JSON found in model response.");
  // Walk to the matching closing bracket.
  const open = candidate[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        const slice = candidate.slice(start, i + 1);
        return JSON.parse(slice) as T;
      }
    }
  }
  throw new Error("Malformed JSON in model response.");
}
