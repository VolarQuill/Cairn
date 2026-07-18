import { json, fail, guard } from "@/lib/api";
import { signIn, startLocalSession } from "@/lib/auth";
import { dataBackend } from "@/lib/util";

export const POST = guard(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) return fail("Email and password are required.");

  const user = await signIn(email, password);
  if (dataBackend() === "local") startLocalSession(user.id);
  return json({ user: { id: user.id, email: user.email, name: user.name } });
});
