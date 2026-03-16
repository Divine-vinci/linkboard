export type ActionError = {
  code: string;
  message: string;
};

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError };

export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
  metadata_status: "pending" | "success" | "failed";
  created_at: string;
  updated_at: string;
  search_vector: string | null;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
}

export interface BookmarkWithTags extends Bookmark {
  tags: Tag[];
}
