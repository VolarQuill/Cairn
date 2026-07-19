import { readFileSync } from "node:fs";

const SB = process.env.SB_TOKEN;
const VT = process.env.VTOKEN;
const PID = "prj_XboPoNqMwgn6WwReJ4rtS89L71AU";
const REF = process.env.SUPABASE_REF; // reuse existing "Cairn" project
const SBH = { Authorization: `Bearer ${SB}`, "Content-Type": "application/json" };
const VH = { Authorization: `Bearer ${VT}`, "Content-Type": "application/json" };

// ---- api keys ----
const kr = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys`, { headers: SBH }).then((r) => r.json());
const keys = Array.isArray(kr) ? kr : (kr.keys || kr.data || []);
if (!keys.length) throw new Error("keys empty: " + JSON.stringify(kr).slice(0, 200));
const anon = (keys.find((k) => k.name === "anon") || {}).api_key;
const srole = (keys.find((k) => k.name === "service_role") || {}).api_key;
const url = `https://${REF}.supabase.co`;
console.log("SUPABASE_URL:", url);
if (!anon || !srole) throw new Error("Missing keys: " + JSON.stringify(keys).slice(0, 200));

// ---- run schema.sql (idempotent: IF NOT EXISTS) ----
const sql = readFileSync("supabase/schema.sql", "utf8");
const sqlRes = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: "POST",
  headers: SBH,
  body: JSON.stringify({ query: sql }),
}).then((r) => r.json());
console.log("schema SQL:", Array.isArray(sqlRes) ? sqlRes.map((x) => x.status || x.command || "ok").join(",") : JSON.stringify(sqlRes).slice(0, 200));

// ---- push real values into Vercel env (PATCH placeholders) ----
const envList = await fetch(`https://api.vercel.com/v10/projects/${PID}/env`, { headers: VH }).then((r) => r.json());
const byKey = new Map((envList.envs || []).map((e) => [e.key, e]));
const updates = {
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
  SUPABASE_SERVICE_ROLE_KEY: srole,
};
for (const [key, value] of Object.entries(updates)) {
  const e = byKey.get(key);
  if (!e) { console.log("WARN no env " + key); continue; }
  const res = await fetch(`https://api.vercel.com/v10/projects/${PID}/env/${e.id}`, {
    method: "PATCH",
    headers: VH,
    body: JSON.stringify({ value, type: "encrypted", target: ["production", "preview", "development"] }),
  });
  console.log(res.ok ? `OK   patched ${key}` : `ERR  ${key}: ${JSON.stringify(await res.json()).slice(0, 160)}`);
}
console.log("=== DONE: Supabase wired, Vercel env updated. Redeploy to apply. ===");
