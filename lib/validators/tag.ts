import { z } from "zod";

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, "Tag name is required")
  .max(50, "Tag name must be 50 characters or fewer")
  .transform((value) => value.toLowerCase())
  .refine((value) => /^[a-z0-9-]+$/.test(value), {
    message: "Tag names can only include lowercase letters, numbers, and hyphens",
  });

export type TagNameInput = z.infer<typeof tagNameSchema>;
