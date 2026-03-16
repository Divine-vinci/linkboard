import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "linkboard-story-2-1-"));

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

function createStubModule(name, source) {
  const outputPath = path.join(tmpRoot, "stubs", `${name}.mjs`);
  return fs
    .mkdir(path.dirname(outputPath), { recursive: true })
    .then(() => fs.writeFile(outputPath, source, "utf8"))
    .then(() => pathToFileURL(outputPath).href);
}

async function createRouteModule() {
  const fetcherStubUrl = await createStubModule(
    "fetcher",
    'export async function fetchUrlMetadata(url) { return globalThis.__story21FetchUrlMetadata(url); }\n',
  );
  const nextServerStubUrl = await createStubModule(
    "next-server",
    'export const NextResponse = { json(body, init = {}) { return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { "content-type": "application/json" } }); } };\n',
  );

  return compileModule("app/api/metadata/route.ts", {
    replacements: [
      ['next/server', nextServerStubUrl],
      ['@/lib/metadata/fetcher', fetcherStubUrl],
      ['@/lib/validators/bookmark', pathToFileURL(path.join(root, 'lib/validators/bookmark.ts')).href],
    ],
  });
}

async function createBookmarksModule() {
  const serverStubUrl = await createStubModule(
    "supabase-server",
    'export async function createClient() { return globalThis.__story21CreateClient(); }\n',
  );

  return compileModule("lib/actions/bookmarks.ts", {
    replacements: [
      ['@/lib/supabase/server', serverStubUrl],
      ['@/lib/types', pathToFileURL(path.join(root, 'lib/types.ts')).href],
      ['@/lib/validators/bookmark', pathToFileURL(path.join(root, 'lib/validators/bookmark.ts')).href],
    ],
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to start server"));
        return;
      }

      resolve(`http://127.0.0.1:${address.port}`);
    });
    server.once("error", reject);
  });
}

test("AC3 fetchUrlMetadata parses head metadata and resolves relative asset URLs", async () => {
  const { fetchUrlMetadata } = await import(pathToFileURL(path.join(root, "lib/metadata/fetcher.ts")).href);
  const server = http.createServer((request, response) => {
    if (request.url === "/article") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(`
        <!doctype html>
        <html>
          <head>
            <title>  Example &amp; Story  </title>
            <meta name="description" content="  A &quot;quoted&quot; description.  " />
            <meta property="og:image" content="/images/cover.png" />
            <link rel="icon" href="/favicon-32.png" />
          </head>
          <body>hello</body>
        </html>
      `);
      return;
    }

    response.writeHead(404).end();
  });

  const baseUrl = await listen(server);

  try {
    const metadata = await fetchUrlMetadata(`${baseUrl}/article`);

    assert.deepEqual(metadata, {
      title: "Example & Story",
      description: 'A "quoted" description.',
      favicon_url: `${baseUrl}/favicon-32.png`,
      og_image_url: `${baseUrl}/images/cover.png`,
    });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test("AC3 fetchUrlMetadata shares one timeout signal across redirects and stops after 3 hops", async () => {
  const { fetchUrlMetadata } = await import(pathToFileURL(path.join(root, "lib/metadata/fetcher.ts")).href);
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, init = {}) => {
    const requestUrl = String(url);
    calls.push({ url: requestUrl, signal: init.signal });

    if (requestUrl.includes("too-many")) {
      return new Response(null, {
        status: 302,
        headers: {
          location: `/too-many-${calls.length}`,
        },
      });
    }

    if (calls.length <= 3) {
      return new Response(null, {
        status: 302,
        headers: {
          location: `/hop-${calls.length}`,
        },
      });
    }

    return new Response("<html><head><title>Redirect Target</title></head></html>", {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  };

  try {
    const metadata = await fetchUrlMetadata("https://example.com/start");

    assert.equal(metadata?.title, "Redirect Target");
    assert.equal(calls.length, 4);
    assert.ok(calls.every((call) => call.signal === calls[0].signal), "expected one shared timeout signal");

    calls.length = 0;

    const limited = await fetchUrlMetadata("https://example.com/too-many");

    assert.equal(limited, null);
    assert.equal(calls.length, 4, "should stop after the fourth request attempts to exceed max redirects");
  } finally {
    global.fetch = originalFetch;
  }
});

test("AC3 metadata route rejects private URLs and returns empty metadata when fetching fails", async () => {
  const routeUrl = await createRouteModule();
  const { POST } = await import(`${routeUrl}?route-test=${Date.now()}`);

  globalThis.__story21FetchUrlMetadata = async () => ({
    title: "Fetched title",
    description: "Fetched description",
    favicon_url: "https://public.example/favicon.ico",
    og_image_url: null,
  });

  const invalidResponse = await POST(
    new Request("http://localhost/api/metadata", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "http://127.0.0.1/private" }),
    }),
  );

  assert.equal(invalidResponse.status, 400);
  assert.deepEqual(await invalidResponse.json(), {
    error: {
      code: "VALIDATION_ERROR",
      message: "Enter a valid public http(s) URL",
    },
  });

  const successResponse = await POST(
    new Request("http://localhost/api/metadata", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://public.example/article" }),
    }),
  );

  assert.equal(successResponse.status, 200);
  assert.deepEqual(await successResponse.json(), {
    title: "Fetched title",
    description: "Fetched description",
    favicon_url: "https://public.example/favicon.ico",
    og_image_url: null,
  });

  globalThis.__story21FetchUrlMetadata = async () => null;

  const fallbackResponse = await POST(
    new Request("http://localhost/api/metadata", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://public.example/article" }),
    }),
  );

  assert.equal(fallbackResponse.status, 200);
  assert.deepEqual(await fallbackResponse.json(), {
    title: null,
    description: null,
    favicon_url: null,
    og_image_url: null,
  });
});

test("AC4 createBookmark enforces auth and validation before insert", async () => {
  const bookmarksUrl = await createBookmarksModule();
  const { createBookmark } = await import(`${bookmarksUrl}?actions-test=${Date.now()}`);

  globalThis.__story21CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
  });

  const unauthenticated = await createBookmark({
    url: "https://public.example/article",
    title: "Example",
    metadata_status: "success",
  });

  assert.deepEqual(unauthenticated, {
    success: false,
    error: {
      code: "AUTH_NOT_AUTHENTICATED",
      message: "You must be signed in to save a bookmark.",
    },
  });

  let insertPayload = null;

  globalThis.__story21CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-123" } } }),
    },
    from: (table) => {
      assert.equal(table, "bookmarks");
      return {
        insert: (payload) => {
          insertPayload = payload;
          return {
            select: () => ({
              single: async () => ({ data: { id: "bookmark-1", ...payload }, error: null }),
            }),
          };
        },
      };
    },
  });

  const validationError = await createBookmark({
    url: "not-a-url",
    title: "Broken",
    metadata_status: "success",
  });

  assert.equal(validationError.success, false);
  assert.equal(validationError.error.code, "VALIDATION_ERROR");

  const created = await createBookmark({
    url: "https://public.example/article",
    title: "Example",
    description: "Desc",
    favicon_url: "https://public.example/favicon.ico",
    og_image_url: null,
    metadata_status: "success",
  });

  assert.equal(created.success, true);
  assert.deepEqual(insertPayload, {
    url: "https://public.example/article",
    title: "Example",
    description: "Desc",
    favicon_url: "https://public.example/favicon.ico",
    og_image_url: null,
    metadata_status: "success",
    user_id: "user-123",
  });
});

test("AC1 listBookmarks returns Supabase rows and requests newest-first ordering", async () => {
  const bookmarksUrl = await createBookmarksModule();
  const { listBookmarks } = await import(`${bookmarksUrl}?list-test=${Date.now()}`);

  let orderArgs = null;
  const rows = [
    { id: "bookmark-2", created_at: "2026-03-16T10:00:00Z" },
    { id: "bookmark-1", created_at: "2026-03-15T10:00:00Z" },
  ];

  globalThis.__story21CreateClient = async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-123" } } }),
    },
    from: (table) => {
      assert.equal(table, "bookmarks");
      return {
        select: () => ({
          order: async (column, options) => {
            orderArgs = { column, options };
            return { data: rows, error: null };
          },
        }),
      };
    },
  });

  const result = await listBookmarks();

  assert.deepEqual(orderArgs, {
    column: "created_at",
    options: { ascending: false },
  });
  assert.deepEqual(result, {
    success: true,
    data: rows,
  });
});
