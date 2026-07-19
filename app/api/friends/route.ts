import { json, fail, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = guard(async () => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const db = await getDb();
  const friends = await db.listFriends(user.id);
  return json({ friends });
});

export const POST = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) return fail("Enter a friend's email.", 400);
  const db = await getDb();
  const friend = await db.getUserByEmail(email);
  if (!friend) return fail("No Cairn account uses that email.", 404);
  if (friend.id === user.id) return fail("That's your own email.", 400);
  await db.addFriend(user.id, friend.id);
  return json({
    ok: true,
    friend: {
      id: friend.id,
      name: friend.name,
      email: friend.email,
      points: friend.points ?? 0,
    },
  });
});

export const DELETE = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("Missing id.", 400);
  const db = await getDb();
  await db.removeFriend(user.id, id);
  return json({ ok: true });
});
