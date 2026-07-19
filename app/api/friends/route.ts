import { json, fail, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const db = await getDb();
  const q = new URL(req.url).searchParams.get("q");
  if (q && q.trim()) {
    const results = await db.searchUsers(q.trim(), user.id, 8);
    return json({ results });
  }
  const friends = await db.listFriends(user.id);
  return json({ friends });
});

export const POST = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const body = await req.json().catch(() => ({}));
  const db = await getDb();
  let friend = null;
  if (body.userId) {
    friend = await db.getUserById(String(body.userId));
  } else {
    const q = String(body.query ?? "").trim().toLowerCase();
    if (!q) return fail("Enter a username or email.", 400);
    friend = await db.getUserByEmail(q);
    if (!friend) friend = await db.getUserByUsername(q);
  }
  if (!friend) return fail("No Cairn account matches that.", 404);
  if (friend.id === user.id) return fail("That's you!", 400);
  await db.addFriend(user.id, friend.id);
  return json({
    ok: true,
    friend: {
      id: friend.id,
      name: friend.name,
      username: friend.username ?? "",
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
