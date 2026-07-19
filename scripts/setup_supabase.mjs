import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SB = process.env.SB_TOKEN;
const VT = process.env.VTOKEN;
const PID = "prj_XboPoNqMwgn6WwReJ4rtS89L71AU";
const SBH = { Authorization: `Bearer ${SB}`, "Content-Type": "application/json" };
const VH = { Authorization: `Bearer ${VT}`, "Content-Type": "application/json" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- 1. organization ----
const orgs = await fetch("https://api.supabase.com/v1/organizations", { headers: SBH }).then((r) => r.json());
if (!Array.isArray(orgs) || !orgs[0]) throw new Error("No Supabase org: " + JSON.stringify(orgs).slice(0, 200));
const orgId = orgs[0].id;
console.log("org:", orgs[0].name, orgId);

// ---- db password (meets Supabase policy) ----
const raw = execFileSync("openssl", ["rand", "-base64", "16"]).toString().trim();
const dbPass = raw.replace(/[^A-Za-z0-9]/g, "") + "Aa1" + raw.length;

// ---- 2. create project ----
const created = await fetch("https://api.supabase.com/v1/projects", {
  method: "POST",
  headers: SBH,
  body: JSON.stringify({ name: "cairn", organization_id: orgId, region: "us-east-1", plan: "free", db_pass: dbPass }),
}).then((r) => r.json());
const ref = created.id;
console.log("project ref:", ref, "initial status:", created.status);
if (!ref) throw new Error("Project create failed: " + JSON.stringify(created).slice(0, 300));

// ---- 3. poll until ACTIVE_HEALTHY ----
let status = "";
for (let i = 0; i < 45; i++) {
  const p = await fetch(`https://api.supabase.com/v1/projects/${ref}`, { headers: SBH }).then((r) => r.json());
  status = p.status;
  if (i % 3 === 0 || status === "ACTIVE_HEALTHY") console.log(`poll ${i}: ${status}`);
  if (status === "ACTIVE_HEALTHY") break;
  await sleep(8000);
}
if (status !== "ACTIVE_HEALTHY") throw new Error("Project never became healthy (last: " + status + ")");

// ---- 4. api keys ----
const keys = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, { headers: SBH }).then((r) => r.json());
const anon = (keys.find((k) => k.name === "anon key") || {}).api_key;
const srole = (keys.find((k) => k.name === "service_role key") || {}).api_key;
const url = `https://${ref}.supabase.co`;
console.log("SUPABASE_URL:", url);

// ---- 5. run schema.sql ----
const sql = readFileSync("supabase/schema.sql", "utf8");
const sqlRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/sql`, {
  method: "POST",
  headers: SBH,
  body: JSON.stringify({ query: sql }),
}).then((r) => r.json());
console.log("schema SQL status:", Array.isArray(sqlRes) ? sqlRes.map((x) => x.status || x.command).join(",") : JSON.stringify(sqlRes).slice(0, 200));

// ---- 6. push real values into Vercel env (PATCH existing placeholders) ----
const envList = await fetch(`https://api.vercel.com/v10/projects/${PID}/env`, { headers: VH }).then((r) => r.json());
const byKey = new Map((envList.env || []).map((e) => [e.key, e]));
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

console.log("=== DONE: Supabase live, Vercel env updated. Redeploy to apply. ===");
