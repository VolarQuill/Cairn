import { randomUUID } from "node:crypto";

const SITE = process.env.SITE || "https://cairn-beta-six.vercel.app";
const SB = process.env.SB_TOKEN;
const REF = process.env.SUPABASE_REF;
const email = `smoke+${randomUUID().slice(0, 8)}@cairn.test`;
const password = "SmokePass123!";

// ---- 1. admin-create a CONFIRMED user (Supabase Mgmt API) ----
const created = await fetch(`https://api.supabase.com/v1/projects/${REF}/users`, {
  method: "POST",
  headers: { Authorization: `Bearer ${SB}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, confirm: true, auto_confirm: true }),
}).then((r) => r.json());
const userId = created.id;
console.log("admin user:", userId ? "OK " + userId : "FAIL " + JSON.stringify(created).slice(0, 160));
if (!userId) process.exit(1);

const jar = [];
const withCookie = (init = {}) => ({
  ...init,
  headers: { "Content-Type": "application/json", ...(init.headers || {}), ...(jar.length ? { Cookie: jar.join("; ") } : {}) },
});

// ---- 2. sign in via the live app (anon key auth) ----
const loginRes = await fetch(`${SITE}/api/auth/login`, withCookie({
  method: "POST",
  body: JSON.stringify({ email, password }),
}));
const setC = loginRes.headers.getSetCookie?.() || [];
setC.forEach((c) => jar.push(c.split(";")[0]));
const loginJson = await loginRes.json().catch(() => ({}));
console.log("login:", loginRes.status, JSON.stringify(loginJson).slice(0, 120));

// ---- 3. /api/me ----
const meRes = await fetch(`${SITE}/api/me`, withCookie());
const me = await meRes.json().catch(() => ({}));
console.log("me:", meRes.status, me.user ? "user=" + me.user.email : JSON.stringify(me).slice(0, 120));

// ---- 4. create a course (exercises OpenRouter + Supabase write) ----
const courseRes = await fetch(`${SITE}/api/courses`, withCookie({
  method: "POST",
  body: JSON.stringify({ sourceType: "topic", sourceText: "the krebs cycle and cellular respiration", title: "SmokeTest" }),
}));
const course = await courseRes.json().catch(() => ({}));
console.log("course:", courseRes.status, "courseId=", course.courseId, "lessonCount=", course.lessonCount);

// ---- 5. cleanup: delete the test user (cascades to profile + course) ----
const del = await fetch(`https://api.supabase.com/v1/projects/${REF}/users/${userId}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${SB}` },
});
console.log("cleanup user delete:", del.status);

console.log(
  courseRes.ok && course.courseId && course.lessonCount > 0
    ? "=== SMOKE TEST PASSED: live app + Supabase + OpenRouter all working ==="
    : "=== SMOKE TEST INCOMPLETE — see above ==="
);
