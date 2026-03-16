import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const exists = (relativePath) =>
  fs.existsSync(path.join(root, relativePath));

const packageJson = JSON.parse(read("package.json"));
const tsconfig = JSON.parse(read("tsconfig.json"));

test("AC1-AC2 scaffold, alias, and boilerplate cleanup are complete", () => {
  assert.equal(packageJson.dependencies.next.startsWith("16."), true);
  assert.deepEqual(tsconfig.compilerOptions.paths["@/*"], ["./*"]);

  const pageFile = read("app/page.tsx");
  const globalsFile = read("app/globals.css");

  assert.equal(pageFile.includes("Linkboard"), true);
  assert.equal(pageFile.includes("Deploy Now"), false);
  assert.equal(pageFile.includes("Templates"), false);
  assert.equal(globalsFile.includes("@import \"tailwindcss\";"), true);
});

test("AC3-AC4 dependencies and Supabase factories are present", () => {
  assert.equal(packageJson.dependencies["@supabase/supabase-js"] !== undefined, true);
  assert.equal(packageJson.dependencies["@supabase/ssr"] !== undefined, true);

  const browserClient = read("lib/supabase/client.ts");
  const serverClient = read("lib/supabase/server.ts");
  const middlewareClient = read("lib/supabase/middleware.ts");

  assert.equal(browserClient.includes("createBrowserClient"), true);
  assert.equal(serverClient.includes("createServerClient"), true);
  assert.equal(serverClient.includes("cookies"), true);
  assert.equal(middlewareClient.includes("updateSession"), true);
  assert.equal(middlewareClient.includes("NextResponse"), true);
});

test("AC5-AC7 env files, ignore rules, and shared types are defined", () => {
  assert.equal(exists(".env.local"), true);
  assert.equal(read(".env.local").includes("NEXT_PUBLIC_SUPABASE_URL="), true);
  assert.equal(read(".env.local").includes("NEXT_PUBLIC_SUPABASE_ANON_KEY="), true);

  const envExample = read(".env.example");
  assert.equal(envExample.includes("NEXT_PUBLIC_SUPABASE_URL="), true);
  assert.equal(envExample.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY="), true);
  assert.equal(envExample.includes("SUPABASE_SERVICE_ROLE_KEY="), true);

  assert.equal(read(".gitignore").includes(".env*.local"), true);

  const typesFile = read("lib/types.ts");
  assert.equal(typesFile.includes("export type ActionResult<T>"), true);
  assert.equal(typesFile.includes("success: true"), true);
  assert.equal(typesFile.includes("success: false"), true);
  assert.equal(typesFile.includes("export interface Bookmark"), true);
  assert.equal(typesFile.includes("export interface Tag"), true);
  assert.equal(typesFile.includes("export interface BookmarkWithTags"), true);
});

test("AC8 installs zod stable as documented deviation", () => {
  assert.equal(packageJson.dependencies.zod !== undefined, true);
  assert.equal(packageJson.dependencies.zod.startsWith("^3."), true);
});

test("AC9 migrations model bookmarks, tags, joins, search, and RLS", () => {
  const bookmarksSql = read("supabase/migrations/001_create_bookmarks.sql");
  const tagsSql = read("supabase/migrations/002_create_tags.sql");
  const bookmarkTagsSql = read("supabase/migrations/003_create_bookmark_tags.sql");
  const searchSql = read("supabase/migrations/004_add_search_vector.sql");
  const rlsSql = read("supabase/migrations/005_add_rls_policies.sql");

  assert.equal(bookmarksSql.includes("create table if not exists public.bookmarks"), true);
  assert.equal(bookmarksSql.includes("metadata_status"), true);
  assert.equal(tagsSql.includes("unique (user_id, name)"), true);
  assert.equal(bookmarkTagsSql.includes("primary key (bookmark_id, tag_id)"), true);
  assert.equal(searchSql.includes("search_vector tsvector"), true);
  assert.equal(searchSql.includes("using gin"), true);
  assert.equal(rlsSql.includes("enable row level security"), true);
  assert.equal(rlsSql.includes("auth.uid() = user_id"), true);
  assert.equal(rlsSql.includes("public.bookmark_tags"), true);
});

test("AC10 root middleware refreshes session and protects dashboard routes", () => {
  const middlewareFile = read("middleware.ts");

  assert.equal(middlewareFile.includes("updateSession(request)"), true);
  assert.equal(middlewareFile.includes("pathname.startsWith(\"/dashboard\")"), true);
  assert.equal(middlewareFile.includes('new URL("/login", request.url)'), true);
  assert.equal(middlewareFile.includes("matcher"), true);
  assert.equal(middlewareFile.includes("_next/static"), true);
  assert.equal(middlewareFile.includes("_next/image"), true);
  assert.equal(middlewareFile.includes("favicon.ico"), true);
});
