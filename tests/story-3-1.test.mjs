import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "linkboard-story-3-1-"));

async function compileModule(relativePath, { replacements = [] } = {}) {
  const sourcePath = path.join(root, relativePath);
  let source = await fs.readFile(sourcePath, "utf8");

  for (const [searchValue, replaceValue] of replacements) {
    source = source.replaceAll(searchValue, replaceValue);
  }

  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: sourcePath,
  });

  const outputPath = path.join(tmpRoot, relativePath.replace(/\.(ts|tsx)$/, ".mjs"));
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, transpiled.outputText, "utf8");

  return pathToFileURL(outputPath).href;
}

async function createStubModule(name, source) {
  const outputPath = path.join(tmpRoot, "stubs", `${name}.mjs`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, source, "utf8");
  return pathToFileURL(outputPath).href;
}

async function createTagModules() {
  const serverStubUrl = await createStubModule(
    "supabase-server",
    'export async function createClient() { return globalThis.__story31CreateClient(); }\n',
  );
  const zodUrl = pathToFileURL(path.join(root, "node_modules/zod/index.js")).href;
  const validatorUrl = await compileModule("lib/validators/tag.ts", {
    replacements: [["zod", zodUrl]],
  });
  const actionsUrl = await compileModule("lib/actions/tags.ts", {
    replacements: [
      ["zod", zodUrl],
      ["@/lib/supabase/server", serverStubUrl],
      ["@/lib/validators/tag", validatorUrl],
    ],
  });

  return { validatorUrl, actionsUrl };
}

test("AC1 tagNameSchema trims, lowercases, and rejects invalid tags", async () => {
  const { validatorUrl } = await createTagModules();
  const { tagNameSchema } = await import(`${validatorUrl}?validator=${Date.now()}`);

  const valid = tagNameSchema.safeParse("  React-19  ");
  assert.equal(valid.success, true);
  assert.equal(valid.data, "react-19");

  const invalidCharacters = tagNameSchema.safeParse("React JS");
  assert.equal(invalidCharacters.success, false);
  assert.equal(
    invalidCharacters.error.issues[0]?.message,
    "Tag names can only include lowercase letters, numbers, and hyphens",
  );

  const tooLong = tagNameSchema.safeParse("a".repeat(51));
  assert.equal(tooLong.success, false);
  assert.equal(tooLong.error.issues[0]?.message, "Tag name must be 50 characters or fewer");
});

test("AC1-AC2 createTagsAndAssign and updateBookmarkTags validate input, dedupe tags, and write joins", async () => {
  const { actionsUrl } = await createTagModules();
  const { createTagsAndAssign, updateBookmarkTags } = await import(`${actionsUrl}?actions=${Date.now()}`);

  globalThis.__story31CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
  });

  const unauthenticated = await createTagsAndAssign("00000000-0000-0000-0000-000000000001", ["react"]);
  assert.deepEqual(unauthenticated, {
    success: false,
    error: {
      code: "AUTH_NOT_AUTHENTICATED",
      message: "You must be signed in to manage tags.",
    },
  });

  globalThis.__story31CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-123" } } }),
    },
  });

  const validationError = await createTagsAndAssign("00000000-0000-0000-0000-000000000001", ["bad tag"]);
  assert.deepEqual(validationError, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Tag names can only include lowercase letters, numbers, and hyphens",
    },
  });

  let upsertPayload = null;
  let bookmarkTagUpsertPayload = null;
  let deleteFilter = null;
  let bookmarkTagInsertPayload = null;

  globalThis.__story31CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-123" } } }),
    },
    from: (table) => {
      if (table === "tags") {
        return {
          upsert: (payload, options) => {
            upsertPayload = { payload, options };
            return {
              select: async () => ({
                data: [
                  { id: "tag-1", user_id: "user-123", name: "react" },
                  { id: "tag-2", user_id: "user-123", name: "typescript" },
                ],
                error: null,
              }),
            };
          },
          select: () => ({
            order: async () => ({
              data: [
                { id: "tag-1", user_id: "user-123", name: "react" },
                { id: "tag-2", user_id: "user-123", name: "typescript" },
              ],
              error: null,
            }),
          }),
        };
      }

      if (table === "bookmark_tags") {
        return {
          upsert: async (payload, options) => {
            bookmarkTagUpsertPayload = { payload, options };
            return { error: null };
          },
          delete: () => ({
            eq: async (column, value) => {
              deleteFilter = { column, value };
              return { error: null };
            },
          }),
          insert: async (payload) => {
            bookmarkTagInsertPayload = payload;
            return { error: null };
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  });

  const BOOKMARK_UUID = "00000000-0000-0000-0000-000000000001";

  const createResult = await createTagsAndAssign(BOOKMARK_UUID, ["React", "typescript", "react"]);
  assert.equal(createResult.success, true);
  assert.deepEqual(createResult.data, [
    { id: "tag-1", user_id: "user-123", name: "react" },
    { id: "tag-2", user_id: "user-123", name: "typescript" },
  ]);
  assert.deepEqual(upsertPayload, {
    payload: [
      { user_id: "user-123", name: "react" },
      { user_id: "user-123", name: "typescript" },
    ],
    options: { onConflict: "user_id,name" },
  });
  assert.deepEqual(bookmarkTagUpsertPayload, {
    payload: [
      { bookmark_id: BOOKMARK_UUID, tag_id: "tag-1" },
      { bookmark_id: BOOKMARK_UUID, tag_id: "tag-2" },
    ],
    options: { onConflict: "bookmark_id,tag_id" },
  });

  const updateResult = await updateBookmarkTags(BOOKMARK_UUID, ["typescript", "react"]);
  assert.equal(updateResult.success, true);
  assert.deepEqual(deleteFilter, { column: "bookmark_id", value: BOOKMARK_UUID });
  assert.deepEqual(bookmarkTagInsertPayload, [
    { bookmark_id: BOOKMARK_UUID, tag_id: "tag-1" },
    { bookmark_id: BOOKMARK_UUID, tag_id: "tag-2" },
  ]);
});

test("AC1-AC2 listUserTags orders tags and updateBookmarkTags handles empty replacement", async () => {
  const { actionsUrl } = await createTagModules();
  const { listUserTags, updateBookmarkTags } = await import(`${actionsUrl}?list=${Date.now()}`);

  let deleteCount = 0;
  globalThis.__story31CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-123" } } }),
    },
    from: (table) => {
      if (table === "tags") {
        return {
          select: () => ({
            order: async (column) => {
              assert.equal(column, "name");
              return {
                data: [
                  { id: "tag-1", user_id: "user-123", name: "react" },
                  { id: "tag-2", user_id: "user-123", name: "typescript" },
                ],
                error: null,
              };
            },
          }),
        };
      }

      if (table === "bookmark_tags") {
        return {
          delete: () => ({
            eq: async () => {
              deleteCount += 1;
              return { error: null };
            },
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  });

  const listResult = await listUserTags();
  assert.deepEqual(listResult, {
    success: true,
    data: [
      { id: "tag-1", user_id: "user-123", name: "react" },
      { id: "tag-2", user_id: "user-123", name: "typescript" },
    ],
  });

  const emptyUpdate = await updateBookmarkTags("00000000-0000-0000-0000-000000000001", []);
  assert.deepEqual(emptyUpdate, { success: true, data: [] });
  assert.equal(deleteCount, 1);
});

test("AC1-AC3 tag UI and form integrations expose keyboard and accessibility hooks", async () => {
  const tagInputSource = await fs.readFile(path.join(root, "components/tag-input.tsx"), "utf8");
  const bookmarkFormSource = await fs.readFile(path.join(root, "components/bookmark-form.tsx"), "utf8");
  const bookmarkEditSource = await fs.readFile(path.join(root, "components/bookmark-edit-form.tsx"), "utf8");
  const bookmarkListSource = await fs.readFile(path.join(root, "components/bookmark-list.tsx"), "utf8");

  assert.ok(tagInputSource.includes('event.key === "Enter" || event.key === ","'), "TagInput must add tags with Enter or comma");
  assert.ok(tagInputSource.includes('event.key === "Backspace" && !draftValue'), "TagInput must remove the last tag on Backspace");
  assert.ok(tagInputSource.includes('aria-label="Selected tags"'), "TagInput must expose selected tags to assistive tech");
  assert.ok(tagInputSource.includes('aria-label={`Remove tag ${tag}`}'), "TagInput remove buttons need accessible labels");
  assert.ok(tagInputSource.includes('role="alert"'), "TagInput validation errors must announce via role alert");
  assert.ok(tagInputSource.includes('focus-within:ring-2 focus-within:ring-slate-500'), "TagInput must render visible focus state");

  assert.ok(bookmarkFormSource.includes("createTagsAndAssign(bookmarkResult.data.id, tagNames)"), "BookmarkForm must assign tags after bookmark creation");
  assert.ok(bookmarkFormSource.includes("setTagNames([]);"), "BookmarkForm must clear tags after save");
  assert.ok(bookmarkFormSource.includes("<TagInput disabled={isPending} label=\"Tags\" onChange={setTagNames} value={tagNames} />"), "BookmarkForm must render TagInput");

  assert.ok(bookmarkEditSource.includes("updateBookmarkTags(bookmark.id, tagNames)"), "BookmarkEditForm must update tags on save");
  assert.ok(bookmarkEditSource.includes("await Promise.all(["), "BookmarkEditForm should save bookmark fields and tags together");
  assert.ok(bookmarkEditSource.includes("buildOptimisticTags(bookmark.user_id, tagNames)"), "BookmarkEditForm must optimistically update local tags");
  assert.ok(bookmarkEditSource.includes("<TagInput disabled={isUpdating} id={tagInputId} label=\"Tags\" onChange={setTagNames} value={tagNames} />"), "BookmarkEditForm must render TagInput with existing tags");

  assert.ok(bookmarkListSource.includes("bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark"), "BookmarkList must replace the full bookmark payload so tag updates propagate");
});
