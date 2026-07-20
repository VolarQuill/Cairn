import { execFileSync } from "node:child_process";

const TOKEN = process.env.VTOKEN;
const PID = process.env.VPID;
const SECRET = execFileSync("openssl", ["rand", "-hex", "24"]).toString().trim();

const VARS = [
  ["DATA_BACKEND", "supabase"],
  ["NEXT_PUBLIC_SUPABASE_URL", "https://placeholder.supabase.co"],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "placeholder-anon"],
  ["SUPABASE_SERVICE_ROLE_KEY", "placeholder-service"],
  ["GEMINI_API_KEY", "sk-or-v1-your-openrouter-key"],
  ["GEMINI_BASE_URL", "https://openrouter.ai/api/v1"],
  ["GEMINI_MODEL", "openrouter/free"],
  ["CAIRN_SECRET", SECRET],
];

const H = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

const existing = await fetch(`https://api.vercel.com/v10/projects/${PID}/env`, { headers: H })
  .then((r) => r.json())
  .then((j) => new Set((j.env || []).map((e) => e.key)));

for (const [key, value] of VARS) {
  if (existing.has(key)) {
    console.log(`skip (exists): ${key}`);
    continue;
  }
  const res = await fetch(`https://api.vercel.com/v10/projects/${PID}/env`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ key, value, type: "encrypted", target: ["production", "preview", "development"] }),
  });
  const j = await res.json();
  console.log(res.ok ? `OK   ${key}` : `ERR  ${key}: ${j.error?.message || JSON.stringify(j).slice(0, 140)}`);
}
