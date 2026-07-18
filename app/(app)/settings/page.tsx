"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export default function SettingsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setName(d.user?.name ?? "");
      })
      .catch(() => {});
  }, []);

  async function saveName() {
    setErr("");
    setSaved(false);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not save.");
      setData((p: any) => ({ ...p, user: d.user }));
      setSaved(true);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  if (!data) {
    return <div className="mx-auto max-w-2xl px-5 py-10 text-bark-50 dark:text-cream-300">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-3xl">Settings</h1>
      <p className="mt-1 text-bark-100 dark:text-cream-200">Your account and how Cairn is running.</p>

      {/* Profile */}
      <div className="card mt-6 p-6">
        <h2 className="text-xl">Profile</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Name</label>
            <div className="flex gap-2">
              <input className="input flex-1" value={name} onChange={(e) => setName(e.target.value)} />
              <button onClick={saveName} className="btn-primary">Save</button>
            </div>
            {saved && <p className="mt-1 text-sm text-moss-100 dark:text-moss-50">Saved.</p>}
            {err && <p className="mt-1 text-sm text-terracotta-200 dark:text-terracotta-100">{err}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={data.user?.email ?? ""} disabled />
          </div>
        </div>
      </div>

      {/* Runtime */}
      <div className="card mt-5 p-6">
        <h2 className="text-xl">How Cairn is running</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Data backend">
            <span className="pill bg-moss-100/20 text-forest-100 capitalize dark:bg-moss-100/15 dark:text-moss-50">
              {data.backend}
            </span>
          </Row>
          <Row label="AI engine">
            {data.aiConfigured ? (
              <span className="pill bg-moss-100/20 text-forest-100 dark:bg-moss-100/15 dark:text-moss-50">
                Configured <Icon name="check" className="inline h-3.5 w-3.5 align-middle" />
              </span>
            ) : (
              <span className="pill bg-amber-50/30 text-amber-200 dark:bg-amber-100/15 dark:text-amber-50">Offline mode</span>
            )}
          </Row>
          <Row label="Model">
            <code className="rounded bg-cream-200 px-2 py-1 text-bark-200 dark:bg-forest-300 dark:text-cream-100">{data.model}</code>
          </Row>
        </dl>
        <p className="mt-4 text-sm text-bark-50 dark:text-cream-300">
          {data.backend === "local"
            ? "Everything is stored on this machine in a local JSON file. No external accounts needed."
            : "Courses and progress are stored in Supabase and auth runs through Supabase Auth."}
          {!data.aiConfigured &&
            " Add a provider key (GEMINI_API_KEY or ANTHROPIC_API_KEY) to upgrade from offline placeholders to full AI generation."}
        </p>
      </div>

      <div className="card mt-5 p-6">
        <h2 className="text-xl">Source & deployment</h2>
        <p className="mt-2 text-sm text-bark-100 dark:text-cream-200">
          Cairn is open source and ships in two forms: deploy to Vercel + Supabase,
          or run the whole thing locally. See the README for both paths.
        </p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-cream-300 pb-3 last:border-0 dark:border-forest-200/40">
      <dt className="text-bark-100 dark:text-cream-200">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
