import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

const DEFAULT_REDIRECT_PATH = "/dashboard";

function getSafeRedirectPath(redirectedFrom: string | null) {
  if (!redirectedFrom?.startsWith("/")) {
    return DEFAULT_REDIRECT_PATH;
  }

  if (redirectedFrom.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  return redirectedFrom;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectedFrom = requestUrl.searchParams.get("redirectedFrom");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
  }

  const destination = getSafeRedirectPath(redirectedFrom);

  return NextResponse.redirect(new URL(destination, request.url));
}
