import { json, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { hasApiKey, MODEL } from "@/lib/ai/provider";
// MODEL is now a function (resolves env + user-set key).
import { dataBackend } from "@/lib/util";

export const dynamic = "force-dynamic";

export const GET = guard(async () => {
  const user = await getSessionUser();
  if (!user) return json({ user: null, backend: dataBackend() }, 200);
  return json(
    {
      user: { id: user.id, email: user.email, name: user.name },
      backend: dataBackend(),
      aiConfigured: hasApiKey(),
      model: MODEL(),
    },
    200
  );
});

export const PATCH = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) return json({ error: "Name is required." }, 400);
  const db = await getDb();
  const updated = await db.updateUser(user.id, { name });
  return json({ user: { id: updated.id, email: updated.email, name: updated.name } });
});
