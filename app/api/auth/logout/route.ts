import { json, guard } from "@/lib/api";
import { signOut } from "@/lib/auth";

export const POST = guard(async () => {
  await signOut();
  return json({ ok: true });
});
