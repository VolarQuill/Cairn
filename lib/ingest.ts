import { env } from "@/lib/util";

/** Best-effort HTML -> plain text for URL ingestion. */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Fetch a URL and return its readable text (best effort). */
export async function fetchUrlText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": "CairnBot/1.0 (+educational)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  const text = stripHtml(html);
  return text.slice(0, 20000);
}

/** Normalize a source into plain text the AI can consume. */
export async function resolveSource(params: {
  sourceType: string;
  sourceText: string;
}): Promise<{ text: string; resolved: boolean }> {
  const raw = (params.sourceText || "").trim();
  if (params.sourceType === "url") {
    try {
      const text = await fetchUrlText(raw);
      if (text.length > 200) return { text, resolved: true };
    } catch {
      /* fall through */
    }
    return { text: raw, resolved: false };
  }
  return { text: raw, resolved: true };
}

export function isUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

/** Where uploaded files are kept (local backend only). */
export const UPLOAD_DIR = env("CAIRN_DATA_DIR", process.cwd() + "/data") + "/uploads";
