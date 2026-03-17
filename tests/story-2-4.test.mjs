import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "linkboard-story-2-4-"));

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
    'export async function createClient() { return globalThis.__story24CreateClient(); }\n',
  );

  return compileModule("lib/actions/bookmarks.ts", {
    replacements: [
      ["@/lib/supabase/server", serverStubUrl],
      ["@/lib/types", pathToFileURL(path.join(root, "lib/types.ts")).href],
      ["@/lib/validators/bookmark", pathToFileURL(path.join(root, "lib/validators/bookmark.ts")).href],
    ],
  });
}

test("AC2 deleteBookmark validates auth, deletes by id, and returns success", async () => {
  const bookmarksUrl = await createBookmarksModule();
  const { deleteBookmark } = await import(`${bookmarksUrl}?delete-success=${Date.now()}`);

  globalThis.__story24CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
  });

  const unauthenticated = await deleteBookmark("bookmark-1");

  assert.deepEqual(unauthenticated, {
    success: false,
    error: {
      code: "AUTH_NOT_AUTHENTICATED",
      message: "You must be signed in to delete a bookmark.",
    },
  });

  globalThis.__story24CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-123" } } }),
    },
  });

  const validationError = await deleteBookmark("   ");
  assert.deepEqual(validationError, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Bookmark ID is required.",
    },
  });

  let deleteOptions = null;
  let deleteFilter = null;

  globalThis.__story24CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-123" } } }),
    },
    from: (table) => {
      assert.equal(table, "bookmarks");
      return {
        delete: (options) => {
          deleteOptions = options;
          return {
            eq: async (column, value) => {
              deleteFilter = { column, value };
              return { count: 1, error: null };
            },
          };
        },
      };
    },
  });

  const result = await deleteBookmark("bookmark-1");

  assert.deepEqual(deleteOptions, { count: "exact" });
  assert.deepEqual(deleteFilter, { column: "id", value: "bookmark-1" });
  assert.deepEqual(result, { success: true, data: null });
});

test("AC3 deleteBookmark returns not found and delete failed states correctly", async () => {
  const bookmarksUrl = await createBookmarksModule();
  const { deleteBookmark } = await import(`${bookmarksUrl}?delete-errors=${Date.now()}`);

  globalThis.__story24CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-123" } } }),
    },
    from: () => ({
      delete: () => ({
        eq: async () => ({ count: 0, error: null }),
      }),
    }),
  });

  const missing = await deleteBookmark("missing");
  assert.deepEqual(missing, {
    success: false,
    error: {
      code: "BOOKMARK_NOT_FOUND",
      message: "We couldn’t find that bookmark to delete.",
    },
  });

  globalThis.__story24CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-123" } } }),
    },
    from: () => ({
      delete: () => ({
        eq: async () => ({ count: null, error: { code: "42501", message: "rls denied" } }),
      }),
    }),
  });

  const failed = await deleteBookmark("bookmark-1");
  assert.deepEqual(failed, {
    success: false,
    error: {
      code: "BOOKMARK_DELETE_FAILED",
      message: "We couldn’t delete that bookmark. Try again.",
    },
  });
});

test("AC1-AC4 delete UI wires confirmation, optimistic rollback hooks, and accessibility", async () => {
  const cardSrc = await fs.readFile(path.join(root, "components/bookmark-card.tsx"), "utf8");
  const listSrc = await fs.readFile(path.join(root, "components/bookmark-list.tsx"), "utf8");

  assert.ok(cardSrc.includes("isConfirmingDelete"), "BookmarkCard must track delete confirmation state");
  assert.ok(cardSrc.includes("Delete this bookmark?"), "BookmarkCard must render inline confirmation copy");
  assert.ok(cardSrc.includes('aria-label="Confirm delete bookmark"'), "BookmarkCard confirm button needs accessible label");
  assert.ok(cardSrc.includes('event.key === "Escape"'), "BookmarkCard must support Escape to cancel delete confirmation");
  assert.ok(cardSrc.includes("cancelDeleteButtonRef.current?.focus()"), "BookmarkCard should focus the safer Cancel button when confirming delete");
  assert.ok(cardSrc.includes('role="alert"'), "BookmarkCard must announce delete errors");

  assert.ok(listSrc.includes("deleteBookmark"), "BookmarkList must call the deleteBookmark server action");
  assert.ok(listSrc.includes("handleBookmarkDelete"), "BookmarkList must expose optimistic delete handler");
  assert.ok(listSrc.includes("filter((bookmark) => bookmark.id !== bookmarkId)"), "BookmarkList must optimistically remove the bookmark");
  assert.ok(listSrc.includes("restoredBookmarks.splice"), "BookmarkList must restore bookmark position on delete failure");
  assert.ok(listSrc.includes("setDeleteError(result.error.message)"), "BookmarkList must surface server delete failures");
});
