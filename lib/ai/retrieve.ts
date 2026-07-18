import type { Lesson } from "@/lib/types";

/**
 * Dependency-free lexical retrieval for the study chat (RAG).
 * Builds a TF-IDF index over lesson text and returns the most relevant
 * lessons for a query. Runs identically on local and cloud without any
 * embeddings service.
 */

interface Doc {
  id: string;
  title: string;
  text: string;
  terms: string[];
}

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]{2,}/g) ?? []).filter(
    (w) => !STOP.has(w)
  );
}

const STOP = new Set(
  "the a an and or but of to in on at by for with from as is are was were be been being this that these those it its we you they he she them his her their our your i me my not no can will would should could may might do does did have has had if then than so such into out up down over under again more most other some all any each every both few".split(
    " "
  )
);

export class Retriever {
  private docs: Doc[] = [];
  private df = new Map<string, number>();
  private n = 0;

  constructor(lessons: Lesson[]) {
    for (const l of lessons) {
      const text = `${l.title}\n${l.module_title}\n${l.content}`;
      const terms = tokenize(text);
      const seen = new Set(terms);
      for (const t of seen) this.df.set(t, (this.df.get(t) ?? 0) + 1);
      this.docs.push({ id: l.id, title: l.title, text, terms });
      this.n++;
    }
  }

  private tfidfVec(terms: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    for (const t of terms) tf.set(t, (tf.get(t) ?? 0) + 1);
    const vec = new Map<string, number>();
    const len = terms.length || 1;
    for (const [t, c] of tf) {
      const idf = Math.log((1 + this.n) / (1 + (this.df.get(t) ?? 0))) + 1;
      vec.set(t, (c / len) * idf);
    }
    return vec;
  }

  /** Returns the top-k lessons as a single context string. */
  topK(query: string, k = 4): string {
    const qvec = this.tfidfVec(tokenize(query));
    if (qvec.size === 0) {
      return this.docs
        .slice(0, k)
        .map((d) => `### ${d.title}\n${d.text.slice(0, 1200)}`)
        .join("\n\n");
    }
    const scored = this.docs.map((d) => ({
      d,
      score: cosine(qvec, this.tfidfVec(d.terms)),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored
      .slice(0, k)
      .map((s) => `### ${s.d.title}\n${s.d.text.slice(0, 1400)}`)
      .join("\n\n");
  }
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const v of a.values()) na += v * v;
  for (const v of b.values()) nb += v * v;
  const small = a.size < b.size ? a : b;
  const other = small === a ? b : a;
  for (const [k, v] of small) {
    const ov = other.get(k);
    if (ov) dot += v * ov;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
