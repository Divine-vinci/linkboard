import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "linkboard-story-2-3-"));

const read = async (relativePath) => fs.readFile(path.join(root, relativePath), "utf8");

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

async function createBookmarksModule() {
  const serverStubUrl = await createStubModule(
    "supabase-server",
    'export async function createClient() { return globalThis.__story23CreateClient(); }\n',
  );

  return compileModule("lib/actions/bookmarks.ts", {
    replacements: [
      ["@/lib/supabase/server", serverStubUrl],
      ["@/lib/types", pathToFileURL(path.join(root, "lib/types.ts")).href],
      ["@/lib/validators/bookmark", pathToFileURL(path.join(root, "lib/validators/bookmark.ts")).href],
    ],
  });
}

test("AC2 updateBookmark validates input, enforces auth, and updates timestamped fields", async () => {
  const bookmarksUrl = await createBookmarksModule();
  const { updateBookmark } = await import(`${bookmarksUrl}?update-test=${Date.now()}`);

  globalThis.__story23CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
  });

  const unauthenticated = await updateBookmark("bookmark-1", { title: "Updated" });

  assert.deepEqual(unauthenticated, {
    success: false,
    error: {
      code: "AUTH_NOT_AUTHENTICATED",
      message: "You must be signed in to edit a bookmark.",
    },
  });

  let updatePayload = null;
  let updateFilter = null;

  globalThis.__story23CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-123" } } }),
    },
    from: (table) => {
      assert.equal(table, "bookmarks");
      return {
        update: (payload) => {
          updatePayload = payload;
          return {
            eq: (column, value) => {
              updateFilter = { column, value };
              return {
                select: () => ({
                  single: async () => ({
                    data: {
                      id: "bookmark-1",
                      user_id: "user-123",
                      url: "https://example.com/article",
                      title: payload.title,
                      description: payload.description,
                      favicon_url: null,
                      og_image_url: null,
                      metadata_status: "success",
                      created_at: "2026-03-16T10:00:00.000Z",
                      updated_at: payload.updated_at,
                      search_vector: null,
                    },
                    error: null,
                  }),
                }),
              };
            },
          };
        },
      };
    },
  });

  const validationError = await updateBookmark("bookmark-1", { title: "x".repeat(501) });
  assert.equal(validationError.success, false);
  assert.equal(validationError.error.code, "VALIDATION_ERROR");

  const updated = await updateBookmark("bookmark-1", {
    title: "Updated title",
    description: "Updated description",
  });

  assert.deepEqual(updateFilter, { column: "id", value: "bookmark-1" });
  assert.equal(updatePayload.title, "Updated title");
  assert.equal(updatePayload.description, "Updated description");
  assert.equal(typeof updatePayload.updated_at, "string");
  assert.equal(updated.success, true);
  assert.equal(updated.data.title, "Updated title");
});

test("AC3 updateBookmark returns BOOKMARK_NOT_FOUND when Supabase returns no row", async () => {
  const bookmarksUrl = await createBookmarksModule();
  const { updateBookmark } = await import(`${bookmarksUrl}?not-found-test=${Date.now()}`);

  globalThis.__story23CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-123" } } }),
    },
    from: () => ({
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({
              data: null,
              error: { code: "PGRST116", details: "The result contains 0 rows", message: "missing" },
            }),
          }),
        }),
      }),
    }),
  });

  const result = await updateBookmark("missing", { title: "Updated" });

  assert.deepEqual(result, {
    success: false,
    error: {
      code: "BOOKMARK_NOT_FOUND",
      message: "We couldn’t find that bookmark to update.",
    },
  });
});

test("AC3 updateBookmark returns BOOKMARK_UPDATE_FAILED when Supabase update fails", async () => {
  const bookmarksUrl = await createBookmarksModule();
  const { updateBookmark } = await import(`${bookmarksUrl}?update-failed-test=${Date.now()}`);

  globalThis.__story23CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-123" } } }),
    },
    from: () => ({
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({
              data: null,
              error: { code: "42501", message: "rls denied" },
            }),
          }),
        }),
      }),
    }),
  });

  const result = await updateBookmark("bookmark-1", { title: "Updated" });

  assert.deepEqual(result, {
    success: false,
    error: {
      code: "BOOKMARK_UPDATE_FAILED",
      message: "We couldn’t save your bookmark changes. Try again.",
    },
  });
});

test("AC1-AC4 edit UI wires inline form, optimistic updates, accessibility, and cancel flow", async () => {
  const cardSrc = await read("components/bookmark-card.tsx");
  const listSrc = await read("components/bookmark-list.tsx");
  const formSrc = await read("components/bookmark-edit-form.tsx");

  assert.ok(cardSrc.includes("BookmarkEditForm"), "BookmarkCard must render BookmarkEditForm inline");
  assert.ok(cardSrc.includes("isEditing"), "BookmarkCard must track edit mode");
  assert.ok(cardSrc.includes("Edit"), "BookmarkCard must expose Edit button text");
  assert.ok(listSrc.includes("useState"), "BookmarkList must manage local bookmarks state");
  assert.ok(listSrc.includes("handleBookmarkUpdate"), "BookmarkList must update local bookmarks after edits");
  assert.ok(formSrc.includes("updateBookmark"), "BookmarkEditForm must call updateBookmark server action");
  assert.ok(formSrc.includes("titleInputRef.current?.focus()"), "BookmarkEditForm must focus the title input on mount");
  assert.ok(formSrc.includes('role="alert"'), "BookmarkEditForm errors must be announced to screen readers");
  assert.ok(formSrc.includes('event.key === "Escape"'), "BookmarkEditForm must support Escape to cancel");
  assert.ok(formSrc.includes("onSave(optimisticBookmark)"), "BookmarkEditForm must apply optimistic updates before server response");
  assert.ok(formSrc.includes("onSave(bookmark)"), "BookmarkEditForm must revert optimistic updates on failure");
  assert.ok(formSrc.includes("onCancel();"), "BookmarkEditForm must close after a successful save");
  assert.ok(cardSrc.includes("Bookmark updated."), "BookmarkCard must show a success confirmation after saving");
});
