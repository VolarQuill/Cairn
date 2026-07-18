import { json, fail, guard } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { extractTextFromFile } from "@/lib/extract";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export const POST = guard(async (req: Request) => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Invalid upload.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0)
    return fail("No file provided.", 400);
  if (file.size > MAX_BYTES)
    return fail("That file is too large (max 25 MB).", 413);

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromFile(file.name, buf);
    return json({ text: text.slice(0, 200_000), name: file.name });
  } catch (e: any) {
    return fail(e?.message || "Could not read that file.");
  }
});
