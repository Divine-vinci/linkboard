"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Bookmark } from "@/lib/types";
import { bookmarkCreateSchema, type BookmarkCreateInput } from "@/lib/validators/bookmark";

export async function createBookmark(
  input: BookmarkCreateInput,
): Promise<ActionResult<Bookmark>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: {
        code: "AUTH_NOT_AUTHENTICATED",
        message: "You must be signed in to save a bookmark.",
      },
    };
  }

  const parsedInput = bookmarkCreateSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsedInput.error.issues[0]?.message ?? "Enter a valid bookmark.",
      },
    };
  }

  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        ...parsedInput.data,
        user_id: user.id,
      })
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: {
          code: "BOOKMARK_CREATE_FAILED",
          message: "We couldn’t save that bookmark. Try again.",
        },
      };
    }

    return {
      success: true,
      data: data as Bookmark,
    };
  } catch {
    return {
      success: false,
      error: {
        code: "BOOKMARK_CREATE_FAILED",
        message: "We couldn’t save that bookmark. Try again.",
      },
    };
  }
}

export async function listBookmarks(): Promise<ActionResult<Bookmark[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: {
        code: "AUTH_NOT_AUTHENTICATED",
        message: "You must be signed in to view bookmarks.",
      },
    };
  }

  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        error: {
          code: "BOOKMARK_LIST_FAILED",
          message: "We couldn’t load your bookmarks. Try refreshing.",
        },
      };
    }

    return {
      success: true,
      data: (data ?? []) as Bookmark[],
    };
  } catch {
    return {
      success: false,
      error: {
        code: "BOOKMARK_LIST_FAILED",
        message: "We couldn’t load your bookmarks. Try refreshing.",
      },
    };
  }
}
