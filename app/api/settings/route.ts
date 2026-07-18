import { json, fail, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import {
  getSettings,
  saveSettings,
  maskKey,
  resolvedProvider,
} from "@/lib/settings";

export const dynamic = "force-dynamic";

export const GET = guard(async () => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const s = getSettings();
  return json({
    aiProvider: s.aiProvider,
    apiKeyMasked: maskKey(s.apiKey),
    hasKey: !!s.apiKey,
    model: s.model,
    provider: resolvedProvider(),
  });
});

export const PATCH = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const body = await req.json().catch(() => ({}));

  const patch: { aiProvider?: "gemini" | "anthropic" | ""; apiKey?: string; model?: string } = {};

  if (body.aiProvider === "gemini" || body.aiProvider === "anthropic" || body.aiProvider === "")
    patch.aiProvider = body.aiProvider;

  if (body.clearKey === true) {
    patch.apiKey = "";
  } else if (typeof body.apiKey === "string") {
    const k = body.apiKey.trim();
    // Ignore mask-only input (user didn't type a new key).
    const isMask = /^[\s•·*]+$/.test(k);
    if (k && !isMask) patch.apiKey = k;
  }

  if (typeof body.model === "string") {
    const m = body.model.trim();
    if (m) patch.model = m;
  }

  const saved = saveSettings(patch);
  return json({
    aiProvider: saved.aiProvider,
    apiKeyMasked: maskKey(saved.apiKey),
    hasKey: !!saved.apiKey,
    model: saved.model,
    provider: resolvedProvider(),
  });
});
