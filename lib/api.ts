import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export function json(data: any, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Returns the current user id or throws a 401-style response. */
export async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user.id;
}

/** Wrap a handler so auth errors become 401 and general errors 400. */
export function guard(
  fn: (req: Request, ctx: any) => Promise<NextResponse>
): (req: Request, ctx: any) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e: any) {
      if (e?.message === "UNAUTHENTICATED")
        return fail("Sign in required.", 401);
      const msg = e?.message ?? "Something went wrong.";
      if (msg.includes("AI request failed"))
        return fail("The AI service is unavailable. Check your API key.", 502);
      return fail(msg, 400);
    }
  };
}
