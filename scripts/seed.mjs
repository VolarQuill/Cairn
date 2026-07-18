// Seed the LOCAL backend (data/cairn.json) with a demo account and two
// ready-made courses so the app is instantly usable with `npm run dev`.
//
//   node scripts/seed.mjs          # seed (overwrites existing local data)
//   node scripts/seed.mjs --keep   # skip if data already exists
//
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();
const DATA_DIR = process.env.CAIRN_DATA_DIR || path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "cairn.json");

const uid = (p) => `${p}_${crypto.randomBytes(10).toString("hex")}`;
const now = () => new Date().toISOString();
const inMin = (m) => new Date(Date.now() + m * 60000).toISOString();

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

// ---- demo user ----
const demoUser = {
  id: "usr_demo",
  email: "demo@cairn.local",
  name: "Demo Learner",
  password_hash: hashPassword("demo123"),
  created_at: now(),
};

// ---- course builder helper ----
function buildCourse({ title, description, goal, level, modules }) {
  const course = {
    id: uid("crs"),
    user_id: demoUser.id,
    title,
    description,
    goal,
    level,
    source_type: "text",
    source_text: description,
    status: "ready",
    created_at: now(),
    updated_at: now(),
  };
  const lessons = [];
  modules.forEach((mod, mi) => {
    mod.lessons.forEach((les, li) => {
      lessons.push({
        id: uid("les"),
        course_id: course.id,
        module_index: mi,
        lesson_index: li,
        module_title: mod.title,
        title: les.title,
        content: les.content,
        objectives: les.objectives,
        key_terms: les.key_terms,
        est_minutes: les.est_minutes,
      });
    });
  });
  return { course, lessons };
}

const courseA = buildCourse({
  title: "Spaced Repetition, in Practice",
  description:
    "How memory actually works, and how to schedule reviews so what you learn stays learned.",
  goal: "Build a personal review habit that beats cramming",
  level: "beginner",
  modules: [
    {
      title: "Module 1 · How memory fades",
      lessons: [
        {
          title: "The forgetting curve",
          est_minutes: 7,
          objectives: [
            "Describe the forgetting curve in your own words",
            "Explain why reviewing soon after learning helps",
          ],
          key_terms: [
            { term: "Forgetting curve", definition: "The exponential drop in recall over time without reinforcement." },
            { term: "Retrieval", definition: "Pulling information out of memory; strengthens the memory." },
          ],
          content: `## The forgetting curve\n\nHermann Ebbinghaus showed that we forget most of what we learn **fast** — often half within a day — unless we actively recall it. The curve is steep at first, then flattens.\n\n## Why review early\n\nEach successful *retrieval* rebuilds the memory trace. Reviewing soon after first learning interrupts the steep drop and makes the next interval safely longer.\n\n## Key Takeaway\n\nMemory is not stored once; it is rebuilt each time you remember. Schedule the rebuild early.`,
        },
        {
          title: "Cramming vs. spacing",
          est_minutes: 6,
          objectives: ["Contrast massed and spaced practice", "Name one reason spacing wins"],
          key_terms: [
            { term: "Massed practice", definition: "Studying the same thing in one long block (cramming)." },
            { term: "Spaced practice", definition: "Studying across separated sessions over time." },
          ],
          content: `## Cramming vs. spacing\n\nCramming crams information in just before a test. It can pass a quiz — then vanish. **Spacing** spreads the same total time across days, and the struggle to recall actually deepens learning.\n\n## Key Takeaway\n\nA little, often, beats a lot, once.`,
        },
      ],
    },
    {
      title: "Module 2 · Scheduling reviews",
      lessons: [
        {
          title: "The SM-2 algorithm",
          est_minutes: 8,
          objectives: ["Explain ease and interval", "Predict how 'easy' changes the next gap"],
          key_terms: [
            { term: "Ease factor", definition: "A number (>=1.3) that scales how fast review intervals grow." },
            { term: "Interval", definition: "Days until the item is due again." },
          ],
          content: `## The SM-2 algorithm\n\nSM-2 powers most flashcard apps. After each review you rate recall: *again / hard / good / easy*. The **ease factor** nudges up or down, and the **interval** grows (or resets) accordingly.\n\n- Again → interval resets, short gap\n- Good → interval multiplies by ease\n- Easy → bigger jump\n\n## Key Takeaway\n\nRate honestly. The scheduler uses your grade to find the perfect moment — just before you'd forget.`,
        },
        {
          title: "Building the habit",
          est_minutes: 5,
          objectives: ["List two ways to make reviews automatic", "Commit to a daily trigger"],
          key_terms: [{ term: "Habit stack", definition: "Attaching a new habit to an existing one (e.g. review after coffee)." }],
          content: `## Building the habit\n\nSpaced repetition only works if you actually show up. **Habit-stack** it: ten minutes of reviews after your morning coffee. Let the app tell you what's due — you just press *good*.\n\n## Key Takeaway\n\nThe best system is the one you open every day.`,
        },
      ],
    },
  ],
});

const courseB = buildCourse({
  title: "How Photosynthesis Works",
  description:
    "From a sunbeam to a sugar molecule: the two stages that feed almost all life on Earth.",
  goal: "Explain photosynthesis to a curious 12-year-old",
  level: "beginner",
  modules: [
    {
      title: "Module 1 · Capturing light",
      lessons: [
        {
          title: "What plants actually do",
          est_minutes: 6,
          objectives: ["State the photosynthesis equation", "Name the two inputs plants need"],
          key_terms: [
            { term: "Photosynthesis", definition: "Turning light, water, and CO₂ into glucose and oxygen." },
            { term: "Chlorophyll", definition: "The green pigment that catches light." },
          ],
          content: `## What plants actually do\n\nPlants are quiet chemists. Using sunlight, they combine **water** and **carbon dioxide** into **glucose** (sugar) and **oxygen**:\n\n> 6 CO₂ + 6 H₂O + light → C₆H₁₂O₆ + 6 O₂\n\n## Key Takeaway\n\nPlants make their own food from light. We breathe the byproduct.`,
        },
        {
          title: "Light reactions",
          est_minutes: 8,
          objectives: ["Locate the light reactions", "Name what they produce"],
          key_terms: [
            { term: "Thylakoid", definition: "Disk-shaped membranes in the chloroplast where light is captured." },
            { term: "ATP", definition: "The cell's energy currency." },
          ],
          content: `## Light reactions\n\nIn the **thylakoid** membranes, chlorophyll grabs photons and splits water. That energy is packaged into **ATP** and a carrier called NADPH, and oxygen is released as waste.\n\n## Key Takeaway\n\nStage one turns sunlight into portable energy and frees oxygen.`,
        },
      ],
    },
    {
      title: "Module 2 · Building sugar",
      lessons: [
        {
          title: "The Calvin cycle",
          est_minutes: 7,
          objectives: ["Locate the Calvin cycle", "Explain what it builds from CO₂"],
          key_terms: [
            { term: "Stroma", definition: "The fluid inside the chloroplast where the Calvin cycle runs." },
            { term: "Glucose", definition: "The sugar that stores the captured energy." },
          ],
          content: `## The Calvin cycle\n\nIn the **stroma**, the ATP and NADPH from stage one power a cycle that grabs CO₂ and assembles it into **glucose**. No light needed directly — just the energy from stage one.\n\n## Key Takeaway\n\nStage two is the factory: CO₂ in, sugar out.`,
        },
      ],
    },
  ],
});

async function main() {
  const keep = process.argv.includes("--keep");
  let existing = null;
  try {
    existing = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  } catch {}

  if (keep && existing?.users?.length) {
    console.log("Local data already exists; skipping (use without --keep to reset).");
    return;
  }

  const store = {
    users: [demoUser],
    courses: [courseA.course, courseB.course],
    lessons: [...courseA.lessons, ...courseB.lessons],
    quizzes: [],
    attempts: [],
    chat: [],
    progress: [],
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
  console.log(`Seeded local data → ${DATA_FILE}`);
  console.log(`  • Demo account: ${demoUser.email} / demo123`);
  console.log(`  • Courses: ${store.courses.length} (${store.lessons.length} lessons)`);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
