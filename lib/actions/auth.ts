"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/lib/types";
import { getAppUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { emailSchema } from "@/lib/validators/auth";

function getSafeRedirectPath(redirectedFrom?: string | null) {
  if (!redirectedFrom?.startsWith("/")) {
    return undefined;
  }

  if (redirectedFrom.startsWith("//")) {
    return undefined;
  }

  return redirectedFrom;
}

function buildAuthCallbackUrl(origin: string, redirectedFrom?: string) {
  const callbackUrl = new URL("/auth/callback", origin);
  const safeRedirectPath = getSafeRedirectPath(redirectedFrom);

  if (safeRedirectPath) {
    callbackUrl.searchParams.set("redirectedFrom", safeRedirectPath);
  }

  return callbackUrl.toString();
}

async function getOrigin() {
  const configuredAppUrl = getAppUrl();

  if (configuredAppUrl !== "http://localhost:3000") {
    return configuredAppUrl;
  }

  const headerStore = await headers();
  const originHeader = headerStore.get("origin");

  if (originHeader) {
    return originHeader;
  }

  return configuredAppUrl;
}

export async function signInWithMagicLink(
  email: string,
  redirectedFrom?: string,
): Promise<ActionResult<{ message: string }>> {
  const parsedInput = emailSchema.safeParse({ email });

  if (!parsedInput.success) {
    return {
      success: false,
      error: {
        code: "AUTH_INVALID_EMAIL",
        message: parsedInput.error.issues[0]?.message ?? "Enter a valid email address",
      },
    };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const emailRedirectTo = buildAuthCallbackUrl(origin, redirectedFrom);
  const { error } = await supabase.auth.signInWithOtp({
    email: parsedInput.data.email,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    return {
      success: false,
      error: {
        code: "AUTH_MAGIC_LINK_FAILED",
        message: "We couldn’t send the magic link. Try again.",
      },
    };
  }

  return {
    success: true,
    data: {
      message: "Check your email for a sign-in link",
    },
  };
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect("/?error=AUTH_SIGN_OUT_FAILED");
  }

  redirect("/");
}
