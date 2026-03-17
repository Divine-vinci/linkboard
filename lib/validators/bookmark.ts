import { z } from "zod";

export const urlSchema = z
  .string()
  .trim()
  .min(1, "URL is required")
  .url("Enter a valid URL")
  .refine(
    (value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Only http and https URLs are allowed" },
  );

export const bookmarkCreateSchema = z.object({
  url: urlSchema,
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  favicon_url: z.string().url().nullable().optional(),
  og_image_url: z.string().url().nullable().optional(),
  metadata_status: z.enum(["pending", "success", "failed"]).default("pending"),
});

export const bookmarkUpdateSchema = z.object({
  title: z.string().max(500, "Title must be 500 characters or fewer").nullable().optional(),
  description: z.string().max(2000, "Description must be 2000 characters or fewer").nullable().optional(),
});

export const searchQuerySchema = z
  .string()
  .trim()
  .min(1, "Enter a search query")
  .max(200, "Search query must be 200 characters or fewer");

export type BookmarkCreateInput = z.infer<typeof bookmarkCreateSchema>;
export type BookmarkUpdateInput = z.infer<typeof bookmarkUpdateSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
