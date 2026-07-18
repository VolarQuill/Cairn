/**
 * Server-side text extraction for uploaded files.
 *
 * Cairn lets users upload far more than plain text: Word, PowerPoint, Excel,
 * PDF, OpenDocument, and RTF. This module turns those binaries into the plain
 * text the AI layer consumes. It is server-only and lazy-loads each parser so
 * the cold path stays light.
 */

const PLAIN_RE =
  /\.(txt|md|markdown|mdx|csv|tsv|json|xml|html?|yml|yaml|log|tex|text)$/i;
const OFFICE_ZIP_RE =
  /\.(pptx|pptm|xlsx|xlsm|odt|ott|odp|otp|ods|ots)$/i;

export async function extractTextFromFile(
  name: string,
  buf: Buffer
): Promise<string> {
  const lower = name.toLowerCase();

  if (lower.endsWith(".rtf")) return stripRtf(buf.toString("latin1"));
  if (PLAIN_RE.test(lower)) return buf.toString("utf8");
  if (lower.endsWith(".pdf")) return extractPdf(buf);
  if (lower.endsWith(".docx") || lower.endsWith(".docm")) return extractDocx(buf);
  if (OFFICE_ZIP_RE.test(lower)) return extractOfficeZip(buf);

  // Unknown extension — best effort as UTF-8 text.
  return buf.toString("utf8");
}

// ---------------------------------------------------------------------------

async function extractPdf(buf: Buffer): Promise<string> {
  // @ts-ignore - pdf-parse ships no types for this subpath
  const mod = await import("pdf-parse/lib/pdf-parse.js");
  const pdfParse: any = mod.default ?? mod;
  const data = await pdfParse(buf);
  return (data?.text ?? "").trim();
}

async function extractDocx(buf: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const res = await mammoth.extractRawText({ buffer: buf });
  return (res?.value ?? "").trim();
}

async function extractOfficeZip(buf: Buffer): Promise<string> {
  const jszip = (await import("jszip")).default;
  const zip = await jszip.loadAsync(buf);
  const texts: string[] = [];
  for (const relPath of Object.keys(zip.files)) {
    if (!relPath.toLowerCase().endsWith(".xml")) continue;
    if (zip.files[relPath].dir) continue;
    const xml = await zip.files[relPath].async("string");
    texts.push(...xmlTextNodes(xml));
  }
  return texts
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Pull visible text out of Office/OpenDocument XML parts. */
function xmlTextNodes(xml: string): string[] {
  const out: string[] = [];
  const patterns = [
    /<a:t>([\s\S]*?)<\/a:t>/g, // DrawingML runs (PowerPoint shapes, Word drawings)
    /<text:p[^>]*>([\s\S]*?)<\/text:p>/g, // ODF paragraphs
    /<text:span[^>]*>([\s\S]*?)<\/text:span>/g, // ODF spans
    /<t[^>]*>([\s\S]*?)<\/t>/g, // spreadsheet cells / shared strings
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)))
      out.push(stripTags(m[1]).replace(/\s+/g, " ").trim());
  }
  return out;
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** Rough but effective RTF → text converter. */
function stripRtf(rtf: string): string {
  let text = rtf;
  // Drop ignore / generator / metadata groups (e.g. {\*\generator}, {\fonttbl}).
  text = text.replace(/\{\\\*?[^{}]*\}/g, " ");
  text = text.replace(/\\par\b[ ]?/gi, "\n");
  text = text.replace(/\\'[0-9a-fA-F]{2}/g, " "); // hex escapes
  text = text.replace(/\\[a-z]+(-?\d+)?[ ]?/g, " "); // control words
  text = text.replace(/\\[^a-z\s]/g, " "); // control symbols
  text = text.replace(/[{}]/g, " ");
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
