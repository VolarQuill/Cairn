import { json, fail, guard } from "@/lib/api";
import { signUp, startLocalSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { dataBackend } from "@/lib/util";

export const POST = guard(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim() || email.split("@")[0];
  if (!email || !password) return fail("Email and password are required.");
  if (password.length < 6) return fail("Password must be at least 6 characters.");

  const user = await signUp(email, password, name);
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
