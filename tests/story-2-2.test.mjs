import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "linkboard-story-2-2-"));

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
    'export async function createClient() { return globalThis.__story22CreateClient(); }\n',
  );

  return compileModule("lib/actions/bookmarks.ts", {
    replacements: [
      ['@/lib/supabase/server', serverStubUrl],
      ['@/lib/types', pathToFileURL(path.join(root, 'lib/types.ts')).href],
      ['@/lib/validators/bookmark', pathToFileURL(path.join(root, 'lib/validators/bookmark.ts')).href],
    ],
  });
}

test("AC2/AC4 BookmarkCard renders OG preview, tags, and accessible external link affordances", async () => {
  const src = await read("components/bookmark-card.tsx");

  assert.ok(src.includes('from "next/image"'), "BookmarkCard must import next/image");
  assert.ok(src.includes("bookmark.og_image_url"), "BookmarkCard must render og_image_url when present");
  assert.ok(src.includes('loading="lazy"'), "BookmarkCard OG preview must lazy load");
  assert.ok(src.includes("rounded-t-2xl"), "BookmarkCard OG preview needs rounded top wrapper");
  assert.ok(src.includes("bookmark.tags"), "BookmarkCard must render bookmark tags");
  assert.ok(src.includes("rounded-full bg-slate-100 text-slate-600 text-xs px-2 py-0.5"), "BookmarkCard tags need pill styling");
  assert.ok(src.includes("focus-visible:ring-2"), "BookmarkCard link must keep keyboard focus ring");
  assert.ok(src.includes("aria-label={`Bookmark:"), "BookmarkCard must expose aria-label for screen readers");
});

test("AC1/AC3 BookmarkList uses responsive grid and empty state guidance", async () => {
  const src = await read("components/bookmark-list.tsx");

  assert.ok(src.includes("BookmarkWithTags"), "BookmarkList must accept BookmarkWithTags[]");
  assert.ok(src.includes("grid-cols-1"), "BookmarkList must default to one column");
  assert.ok(src.includes("sm:grid-cols-2"), "BookmarkList must render two columns on small screens+");
  assert.ok(src.includes("lg:grid-cols-3"), "BookmarkList must render three columns on large screens+");
  assert.ok(src.includes("xl:grid-cols-4"), "BookmarkList must render four columns on extra large screens+");
  assert.ok(src.includes("No bookmarks yet"), "BookmarkList empty state heading missing");
  assert.ok(src.includes("Paste a URL above to save your first bookmark"), "BookmarkList empty state guidance missing");
  assert.ok(src.includes("role=\"list\""), "BookmarkList must keep list semantics");
});

test("AC1/AC2 listBookmarks joins tags, preserves newest-first order, and flattens bookmark_tags", async () => {
  const bookmarksUrl = await createBookmarksModule();
  const { listBookmarks } = await import(`${bookmarksUrl}?list-test=${Date.now()}`);

  let selectArg = null;
  let orderArgs = null;

  globalThis.__story22CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-123" } } }),
    },
    from: (table) => {
      assert.equal(table, "bookmarks");
      return {
        select: (value) => {
          selectArg = value;
          return {
            order: async (column, options) => {
              orderArgs = { column, options };
              return {
                data: [
                  {
                    id: "bookmark-1",
                    user_id: "user-123",
                    url: "https://example.com/article",
                    title: "Example",
                    description: "Desc",
                    favicon_url: "https://example.com/favicon.ico",
                    og_image_url: "https://example.com/cover.png",
                    metadata_status: "success",
                    created_at: "2026-03-16T10:00:00Z",
                    updated_at: "2026-03-16T10:00:00Z",
                    search_vector: null,
                    bookmark_tags: [
                      { tags: { id: "tag-1", user_id: "user-123", name: "work" } },
                      { tags: { id: "tag-2", user_id: "user-123", name: "reading" } },
                    ],
                  },
                ],
                error: null,
              };
            },
          };
        },
      };
    },
  });

  const result = await listBookmarks();

  assert.equal(selectArg, "*, bookmark_tags(tags(*))");
  assert.deepEqual(orderArgs, {
    column: "created_at",
    options: { ascending: false },
  });
  assert.deepEqual(result, {
    success: true,
    data: [
      {
        id: "bookmark-1",
        user_id: "user-123",
        url: "https://example.com/article",
        title: "Example",
        description: "Desc",
        favicon_url: "https://example.com/favicon.ico",
        og_image_url: "https://example.com/cover.png",
        metadata_status: "success",
        created_at: "2026-03-16T10:00:00Z",
        updated_at: "2026-03-16T10:00:00Z",
        search_vector: null,
        tags: [
          { id: "tag-1", user_id: "user-123", name: "work" },
          { id: "tag-2", user_id: "user-123", name: "reading" },
        ],
      },
    ],
  });
});

test("AC2 app/dashboard/page and next.config wire BookmarkWithTags flow and remote images", async () => {
  const pageSrc = await read("app/dashboard/page.tsx");
  const configSrc = await read("next.config.ts");

  assert.ok(pageSrc.includes("BookmarkWithTags"), "dashboard page must type bookmarks as BookmarkWithTags[]");
  assert.ok(pageSrc.includes("BookmarkList bookmarks={bookmarks}"), "dashboard page must pass bookmarks to BookmarkList");
  assert.ok(configSrc.includes("remotePatterns"), "next.config.ts must configure remotePatterns for Next Image");
  assert.ok(configSrc.includes("protocol: \"https\""), "next.config.ts must allow https OG images");
  assert.ok(configSrc.includes('hostname: "**"'), "next.config.ts must allow arbitrary HTTPS hosts");
});
