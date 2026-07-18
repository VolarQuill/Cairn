"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

interface SettingsData {
  aiProvider: "gemini" | "anthropic" | "";
  apiKeyMasked: string;
  hasKey: boolean;
  model: string;
  provider: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  // AI key section
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [provider, setProvider] = useState<"gemini" | "anthropic">("gemini");
  const [keyInput, setKeyInput] = useState("");
  const [modelInput, setModelInput] = useState("");
  const [keyBusy, setKeyBusy] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [keyErr, setKeyErr] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([me, set]) => {
        setData(me);
        setName(me.user?.name ?? "");
        setSettings(set);
        setProvider(set.aiProvider === "anthropic" ? "anthropic" : "gemini");
        setModelInput(set.model || "");
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

  async function saveKey() {
    setKeyErr("");
    setKeySaved(false);
    setKeyBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ aiProvider: provider, apiKey: keyInput, model: modelInput }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not save.");
      setSettings(d);
      setKeyInput("");
      setKeySaved(true);
      const me = await (await fetch("/api/me")).json();
      if (me.user) setData(me);
    } catch (e: any) {
      setKeyErr(e.message);
    } finally {
      setKeyBusy(false);
    }
  }

  async function removeKey() {
    setKeyErr("");
    setKeyBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clearKey: true }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not remove.");
      setSettings(d);
      setKeyInput("");
      const me = await (await fetch("/api/me")).json();
      if (me.user) setData(me);
    } catch (e: any) {
      setKeyErr(e.message);
    } finally {
      setKeyBusy(false);
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

      {/* AI provider key */}
      <div className="card mt-5 p-6">
        <div className="flex items-center gap-2">
          <Icon name="key" className="h-5 w-5 text-forest-200 dark:text-moss-50" />
          <h2 className="text-xl">Bring your own key (BYOK)</h2>
        </div>
        <p className="mt-1 text-sm text-bark-100 dark:text-cream-200">
          Cairn ships with a built-in Gemini key, so AI generation works out of the box. Want to
          use your own? Paste any Gemini or Anthropic key below to override the default
          (bring-your-own-key). It&apos;s stored locally on this device and never leaves it.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Provider</label>
            <select
              className="input sm:w-64"
              value={provider}
              onChange={(e) => setProvider(e.target.value as "gemini" | "anthropic")}
            >
              <option value="gemini">Google Gemini</option>
              <option value="anthropic">Anthropic Claude</option>
            </select>
          </div>
          <div>
            <label className="label">API key</label>
            <input
              type="password"
              className="input"
              placeholder={
                settings?.hasKey ? `Current key: ${settings.apiKeyMasked}` : "Paste your API key…"
              }
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-bark-50 dark:text-cream-300">
              Leave blank to keep your current key. Whatever you enter here overrides Cairn&apos;s
              built-in default.
            </p>
          </div>
          <div>
            <label className="label">Model (optional)</label>
            <input
              className="input sm:w-80"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              placeholder="e.g. gemini-2.0-flash"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={saveKey} className="btn-primary" disabled={keyBusy}>
              {keyBusy ? "Saving…" : "Save key"}
            </button>
            {settings?.hasKey && (
              <button onClick={removeKey} className="btn-ghost" disabled={keyBusy}>
                <Icon name="trash" className="inline h-4 w-4 align-middle" /> Remove key
              </button>
            )}
            {keySaved && <span className="text-sm text-moss-100 dark:text-moss-50">Saved.</span>}
            {keyErr && (
              <span className="text-sm text-terracotta-200 dark:text-terracotta-100">{keyErr}</span>
            )}
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
