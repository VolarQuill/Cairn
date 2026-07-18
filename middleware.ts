import { NextResponse, type NextRequest } from "next/server";

/**
 * When running the Supabase backend on Vercel, this middleware refreshes the
 * auth session cookie on each request. In local mode it's a no-op passthrough.
 *
 * We import @supabase/ssr lazily so the local backend never needs it.
 */
export async function middleware(request: NextRequest) {
  const backend = (process.env.DATA_BACKEND ?? "local").toLowerCase();
  if (backend !== "supabase") {
    return NextResponse.next();
  }

  const { createServerClient } = await import("@supabase/ssr");
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets & api routes.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
