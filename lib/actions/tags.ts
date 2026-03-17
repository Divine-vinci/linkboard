"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { ActionError, ActionResult, Tag } from "@/lib/types";
import { tagNameSchema } from "@/lib/validators/tag";

import type { SupabaseClient } from "@supabase/supabase-js";

const bookmarkIdSchema = z.string().trim().uuid("Bookmark ID must be a valid UUID");
const tagNamesSchema = z.array(tagNameSchema);

const bookmarkTagInputSchema = z.object({
  bookmarkId: bookmarkIdSchema,
  tagNames: tagNamesSchema,
});

type AuthenticatedContext = {
  supabase: SupabaseClient;
  userId: string;
};

type AuthResult =
  | { success: true; context: AuthenticatedContext }
  | { success: false; error: ActionError };

async function authenticate(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: {
        code: "AUTH_NOT_AUTHENTICATED",
        message: "You must be signed in to manage tags.",
      },
    };
  }

  return { success: true, context: { supabase, userId: user.id } };
}

function dedupeTagNames(tagNames: string[]) {
  return [...new Set(tagNames)];
}

async function upsertTags(
  supabase: SupabaseClient,
  userId: string,
  tagNames: string[],
): Promise<ActionResult<Tag[]>> {
  if (tagNames.length === 0) {
    return { success: true, data: [] };
  }

  try {
    const { data, error } = await supabase
      .from("tags")
      .upsert(
        tagNames.map((name) => ({ user_id: userId, name })),
        { onConflict: "user_id,name" },
      )
      .select("id, user_id, name");

    if (error || !data) {
      return {
        success: false,
        error: {
          code: "TAG_CREATE_FAILED",
          message: "We couldn't create those tags. Try again.",
        },
      };
    }

    return {
      success: true,
      data: (data as Tag[]).sort((left, right) => left.name.localeCompare(right.name)),
    };
  } catch {
    return {
      success: false,
      error: {
        code: "TAG_CREATE_FAILED",
        message: "We couldn't create those tags. Try again.",
      },
    };
  }
}

export async function createTagsAndAssign(
  bookmarkId: string,
  tagNames: string[],
): Promise<ActionResult<Tag[]>> {
  const authResult = await authenticate();

  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const { supabase, userId } = authResult.context;

  const parsedInput = bookmarkTagInputSchema.safeParse({ bookmarkId, tagNames });

  if (!parsedInput.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsedInput.error.issues[0]?.message ?? "Enter valid tags.",
      },
    };
  }

  const dedupedTagNames = dedupeTagNames(parsedInput.data.tagNames);

  const tagsResult = await upsertTags(supabase, userId, dedupedTagNames);

  if (!tagsResult.success) {
    return tagsResult;
  }

  if (tagsResult.data.length === 0) {
    return { success: true, data: [] };
  }

  try {
    const { error } = await supabase.from("bookmark_tags").upsert(
      tagsResult.data.map((tag) => ({
        bookmark_id: parsedInput.data.bookmarkId,
        tag_id: tag.id,
      })),
      { onConflict: "bookmark_id,tag_id" },
    );

    if (error) {
      return {
        success: false,
        error: {
          code: "TAG_CREATE_FAILED",
          message: "We couldn't assign those tags. Try again.",
        },
      };
    }

    return { success: true, data: tagsResult.data };
  } catch {
    return {
      success: false,
      error: {
        code: "TAG_CREATE_FAILED",
        message: "We couldn't assign those tags. Try again.",
      },
    };
  }
}

export async function updateBookmarkTags(
  bookmarkId: string,
  tagNames: string[],
): Promise<ActionResult<Tag[]>> {
  const authResult = await authenticate();

  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const { supabase, userId } = authResult.context;

  const parsedInput = bookmarkTagInputSchema.safeParse({ bookmarkId, tagNames });

  if (!parsedInput.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsedInput.error.issues[0]?.message ?? "Enter valid tags.",
      },
    };
  }

  const dedupedTagNames = dedupeTagNames(parsedInput.data.tagNames);

  try {
    const { error: deleteError } = await supabase
      .from("bookmark_tags")
      .delete()
      .eq("bookmark_id", parsedInput.data.bookmarkId);

    if (deleteError) {
      return {
        success: false,
        error: {
          code: "TAG_UPDATE_FAILED",
          message: "We couldn't update those tags. Try again.",
        },
      };
    }

    if (dedupedTagNames.length === 0) {
      return { success: true, data: [] };
    }

    const tagsResult = await upsertTags(supabase, userId, dedupedTagNames);

    if (!tagsResult.success) {
      return {
        success: false,
        error: {
          code: "TAG_UPDATE_FAILED",
          message: "We couldn't update those tags. Try again.",
        },
      };
    }

    const { error: insertError } = await supabase.from("bookmark_tags").insert(
      tagsResult.data.map((tag) => ({
        bookmark_id: parsedInput.data.bookmarkId,
        tag_id: tag.id,
      })),
    );

    if (insertError) {
      return {
        success: false,
        error: {
          code: "TAG_UPDATE_FAILED",
          message: "We couldn't update those tags. Try again.",
        },
      };
    }

    return { success: true, data: tagsResult.data };
  } catch {
    return {
      success: false,
      error: {
        code: "TAG_UPDATE_FAILED",
        message: "We couldn't update those tags. Try again.",
      },
    };
  }
}

export async function listUserTags(): Promise<ActionResult<Tag[]>> {
  const authResult = await authenticate();

  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const { supabase } = authResult.context;

  try {
    const { data, error } = await supabase.from("tags").select("id, user_id, name").order("name");

    if (error) {
      return {
        success: false,
        error: {
          code: "TAG_LIST_FAILED",
          message: "We couldn't load your tags. Try again.",
        },
      };
    }

    return {
      success: true,
      data: (data ?? []) as Tag[],
    };
  } catch {
    return {
      success: false,
      error: {
        code: "TAG_LIST_FAILED",
        message: "We couldn't load your tags. Try again.",
      },
    };
  }
}
