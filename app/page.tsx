import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Icon, type IconName } from "@/components/icons";
import { getSessionUser } from "@/lib/auth";
import { dataBackend } from "@/lib/util";

const features: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "seed",
    title: "AI course builder",
    body: "Paste an article, upload a doc, drop a link, or name a topic. Cairn structures it into modules and lessons with clear objectives.",
  },
  {
    icon: "mirror",
    title: "Explanations your way",
    body: "Re-explain any concept simply, in depth, by analogy, visually, or with a worked example. Five lenses, one idea.",
  },
  {
    icon: "target",
    title: "Adaptive quizzes",
    body: "Auto-generated questions check understanding and explain every answer — including why the distractors are wrong.",
  },
  {
    icon: "chat",
    title: "Study chat (RAG)",
    body: "Ask anything about your material. Cairn retrieves the right lessons and answers from your own course, not the void.",
  },
  {
    icon: "repeat",
    title: "Spaced repetition",
    body: "A built-in scheduler spaces reviews so what you learn actually sticks — graded good / hard / again.",
  },
  {
    icon: "rock",
    title: "Runs anywhere",
    body: "Deploy to Vercel + Supabase, or run the whole thing locally with zero external services. Same code, your choice.",
  },
];

const steps = [
  { n: "1", t: "Feed it a source", d: "Text, a URL, a PDF, or just a topic you're curious about." },
  { n: "2", t: "Cairn builds the path", d: "Modules, lessons, key terms, and objectives — generated and saved." },
  { n: "3", t: "Learn, quiz, chat", d: "Read in your style, test yourself, and talk it through with your tutor." },
  { n: "4", t: "Let it stick", d: "Spaced reviews keep the knowledge warm long after the first read." },
];

export default async function Landing() {
  const user = await getSessionUser();
  const backend = dataBackend();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-cream-300/70 bg-cream-100/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-bark-100 md:flex">
            <a href="#features" className="hover:text-terracotta-100">Features</a>
            <a href="#how" className="hover:text-terracotta-100">How it works</a>
            <a href="#theme" className="hover:text-terracotta-100">Design</a>
            <a
              href="https://github.com"
              className="hover:text-terracotta-100"
            >
              Source
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className="btn-primary">
                Open app
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost hidden sm:inline-flex">
                  Sign in
                </Link>
                <Link href="/signup" className="btn-amber">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-fade-up">
            <span className="pill bg-moss-100/20 text-forest-100">
              <span className="h-2 w-2 rounded-full bg-amber-100" /> AI learning, the warm way
            </span>
            <h1 className="mt-5 text-5xl leading-[1.05] md:text-6xl">
              Build your path.
              <br />
              <span className="text-forest-200">Stack your knowledge.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-bark-100">
              Cairn turns any source into a structured, adaptive course — with
              multi-style explanations, smart quizzes, a study tutor, and spaced
              review that makes learning actually stick.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-amber px-5 py-3 text-base">
                Create your first course <Icon name="arrow-right" className="inline h-4 w-4 align-middle" />
              </Link>
              <a href="#how" className="btn-ghost px-5 py-3 text-base">
                See how it works
              </a>
            </div>
            <p className="mt-4 text-sm text-bark-50">
              Running in <strong className="text-bark-100">{backend}</strong> mode ·
              works with or without an API key.
            </p>
          </div>

          {/* Hero visual: a lesson card mock */}
          <div className="relative animate-fade-up">
            <div className="card rotate-1 mx-auto max-w-md p-5 shadow-lift">
              <div className="flex items-center justify-between">
                <span className="chip">Module 2 · Core Ideas</span>
                <span className="text-xs text-bark-50">8 min</span>
              </div>
              <h3 className="mt-3 text-xl">Why systems beat goals</h3>
              <p className="mt-2 text-sm text-bark-100">
                A goal is a moment; a system is a habit. Goals set direction, but
                systems do the walking…
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="pill bg-cream-200 text-bark-100"># systems</span>
                <span className="pill bg-cream-200 text-bark-100"># habits</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Simple", "Analogy", "Visual"].map((s) => (
                  <div
                    key={s}
                    className="rounded-lg border border-cream-300 bg-cream-100 py-2 text-center text-xs font-medium text-bark-100"
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div className="card -rotate-2 absolute -bottom-6 -left-4 hidden w-44 p-3 shadow-soft sm:block">
              <div className="text-xs font-semibold text-forest-200">
                Quiz <Icon name="check" className="inline h-3.5 w-3.5 align-middle text-moss-100" /> 4/5
              </div>
              <div className="mt-1 text-xs text-bark-50">
                “Distractor explained clearly.”
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-cream-300 bg-cream-50">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-4 px-5 py-8 text-center">
          {[
            ["5", "explanation styles"],
            ["∞", "sources accepted"],
            ["2", "ways to run it"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="font-display text-3xl text-forest-200">{n}</div>
              <div className="text-sm text-bark-50">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <h2 className="text-3xl md:text-4xl">Everything you need to learn deeply</h2>
        <p className="mt-2 max-w-xl text-bark-100">
          One calm workspace that turns passive reading into active, durable
          understanding.
        </p>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
              <Icon name={f.icon} size={26} className="text-forest-200" />
              <h3 className="mt-3 text-lg">{f.title}</h3>
              <p className="mt-1.5 text-sm text-bark-100">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-forest-300/5">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl">How Cairn works</h2>
          <div className="mt-9 grid gap-5 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="card relative p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 font-display text-bark-300">
                  {s.n}
                </div>
                <h3 className="mt-3 text-lg">{s.t}</h3>
                <p className="mt-1.5 text-sm text-bark-100">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Theme / design note */}
      <section id="theme" className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="card flex flex-col gap-6 bg-gradient-to-br from-cream-50 to-clay-100 p-8 md:flex-row md:items-center">
          <div className="flex-1">
            <h2 className="text-3xl">Designed to feel like a good book</h2>
            <p className="mt-3 max-w-md text-bark-100">
              Warm forest greens and amber on cream, set in Times New Roman. No
              cold blues, no purple gradients — just a calm place to think. And it
              respects your setup: run it on Vercel + Supabase, or entirely on
              your own machine with a local data store.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            {[
              ["Forest", "#14503B"],
              ["Moss", "#5C8A4A"],
              ["Amber", "#E29426"],
              ["Terracotta", "#C9683F"],
              ["Cream", "#FBF6EC"],
            ].map(([n, c]) => (
              <div key={n} className="text-center">
                <div
                  className="h-14 w-14 rounded-2xl border border-black/5 shadow-soft"
                  style={{ background: c }}
                />
                <div className="mt-1.5 text-xs text-bark-50">{n}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-forest-200 p-10 text-center text-cream-50 shadow-lift md:p-16">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-100/20" />
          <div className="absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-moss-100/20" />
          <h2 className="relative text-3xl md:text-4xl">Start stacking knowledge today</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-cream-100/90">
            Create a course from anything in under a minute. Free to run, yours to
            keep.
          </p>
          <div className="relative mt-7 flex justify-center gap-3">
            <Link href="/signup" className="btn-amber px-5 py-3 text-base">
              Get started free
            </Link>
            <Link
              href="/login"
              className="btn px-5 py-3 text-base border border-cream-100/40 text-cream-50 hover:bg-cream-50/10"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-cream-300">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-7 text-sm text-bark-50 sm:flex-row">
          <Logo size={26} />
          <p>Cairn — an AI learning companion. </p>
          <a href="https://github.com" className="hover:text-terracotta-100">
            View source <Icon name="arrow-right" className="inline h-4 w-4 align-middle" />
          </a>
        </div>
      </footer>
    </div>
  );
}
