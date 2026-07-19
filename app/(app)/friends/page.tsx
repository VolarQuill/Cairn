import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { FriendsPanel } from "@/components/FriendsPanel";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const user = await requireUser();
  const db = await getDb();
  const friends = await db.listFriends(user.id);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-3xl">Friends</h1>
      <p className="mt-1 text-sm text-bark-100 dark:text-cream-200">
        Add friends by email and compare scores on the leaderboard.
      </p>
      <div className="mt-6">
        <FriendsPanel
          initial={friends}
          me={{ id: user.id, name: user.name.split(" ")[0], points: user.points ?? 0 }}
        />
      </div>
    </div>
  );
}
