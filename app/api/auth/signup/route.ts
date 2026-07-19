import { json, fail, guard } from "@/lib/api";
import { signUp, startLocalSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase/server";
import { dataBackend } from "@/lib/util";

export const POST = guard(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  if (!email || !password) return fail("Email and password are required.");
  if (password.length < 6) return fail("Password must be at least 6 characters.");
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    return fail("Username must be 3-20 letters, numbers, or underscores.");

  const db = await getDb();
  if (await db.getUserByUsername(username))
    return fail("That username is taken.");

  const user = await signUp(email, username, password);
  if (dataBackend() === "local") {
    startLocalSession(user.id);
    return json({ user: { id: user.id, email: user.email, name: user.name } });
  }
  // Supabase: session is active only if email confirmation is off.
  const sb = supabaseServer();
  const { data } = await sb.auth.getSession();
  if (data.session) {
    return json({ user: { id: user.id, email: user.email, name: user.name } });
  }
  return json(
    {
      user: { id: user.id, email: user.email, name: user.name },
      needsConfirmation: true,
      message: "Check your email to confirm your account, then sign in.",
    },
    200
  );
});
