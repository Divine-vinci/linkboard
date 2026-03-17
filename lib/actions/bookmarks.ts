"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Bookmark, BookmarkWithTags, Tag } from "@/lib/types";
import {
  bookmarkCreateSchema,
  bookmarkUpdateSchema,
  type BookmarkCreateInput,
  type BookmarkUpdateInput,
} from "@/lib/validators/bookmark";

type BookmarkRowWithTags = Bookmark & {
  bookmark_tags?: Array<{
    tags: Tag | null;
  }>;
};

function flattenBookmarkTags(bookmark: BookmarkRowWithTags): BookmarkWithTags {
  const { bookmark_tags, ...bookmarkFields } = bookmark;

  if (!Array.isArray(bookmark_tags)) {
    return { ...bookmarkFields, tags: [] };
  }

  return {
    ...bookmarkFields,
    tags: bookmark_tags.flatMap((bookmarkTag) => (bookmarkTag.tags ? [bookmarkTag.tags] : [])),
  };
}

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

export async function updateBookmark(
  id: string,
  input: BookmarkUpdateInput,
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
        message: "You must be signed in to edit a bookmark.",
      },
    };
  }

  const parsedInput = bookmarkUpdateSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsedInput.error.issues[0]?.message ?? "Enter valid bookmark details.",
      },
    };
  }

  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .update({
        ...parsedInput.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    const isMissingBookmark =
      !data &&
      (!error || error.code === "PGRST116" || error.details?.includes("0 rows"));

    if (isMissingBookmark) {
      return {
        success: false,
        error: {
          code: "BOOKMARK_NOT_FOUND",
          message: "We couldn’t find that bookmark to update.",
        },
      };
    }

    if (error || !data) {
      return {
        success: false,
        error: {
          code: "BOOKMARK_UPDATE_FAILED",
          message: "We couldn’t save your bookmark changes. Try again.",
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
        code: "BOOKMARK_UPDATE_FAILED",
        message: "We couldn’t save your bookmark changes. Try again.",
      },
    };
  }
}

export async function listBookmarks(): Promise<ActionResult<BookmarkWithTags[]>> {
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
      .select("*, bookmark_tags(tags(*))")
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
      data: (data ?? []).map((bookmark) => flattenBookmarkTags(bookmark as BookmarkRowWithTags)),
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
