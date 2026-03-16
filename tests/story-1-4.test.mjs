import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

test("AC1 landing page is a server component with semantic HTML and login CTAs", () => {
  const src = read("app/page.tsx");

  // Must NOT be a client component
  assert.ok(
    !src.includes("'use client'") && !src.includes('"use client"'),
    "page.tsx must not have a 'use client' directive",
  );

  // Semantic landmarks
  assert.ok(src.includes("<main"), "missing <main> landmark");
  assert.ok(src.includes("<nav"), "missing <nav> landmark");
  assert.ok(src.includes("<footer"), "missing <footer> landmark");
  assert.ok(src.includes("<h1"), "missing <h1> heading");

  // CTA links to /login
  const loginLinkCount = (src.match(/href="\/login"/g) || []).length;
  assert.ok(loginLinkCount >= 2, `expected at least 2 CTA links to /login, found ${loginLinkCount}`);

  // Primary and secondary CTAs with distinct text
  assert.ok(src.includes("Get started"), "missing primary CTA text");
  assert.ok(src.includes("Create your board"), "missing secondary CTA text");
});

test("AC1 landing page presents three value propositions with accessible focus indicators", () => {
  const src = read("app/page.tsx");

  // Three required value props from story
  for (const prop of ["Auto-metadata capture", "Flexible tagging", "Full-text search"]) {
    assert.ok(src.includes(prop), `missing value proposition: "${prop}"`);
  }

  // Keyboard-navigable focus indicators (NFR13, NFR16)
  const focusRingCount = (src.match(/focus-visible:ring/g) || []).length;
  assert.ok(focusRingCount >= 3, `expected focus-visible rings on interactive elements, found ${focusRingCount}`);
});

test("AC2 metadata exports title, description, and Open Graph fields without images", () => {
  const src = read("app/page.tsx");

  assert.ok(src.includes("export const metadata: Metadata"), "missing named metadata export");
  assert.ok(src.includes("openGraph"), "missing openGraph configuration");
  assert.ok(src.includes("siteName"), "missing openGraph.siteName");
  assert.ok(src.includes('type: "website"'), "missing openGraph.type");
  assert.ok(src.includes('url: "/"'), "openGraph.url should be relative (resolved via metadataBase)");

  // Verify no OG images field exists inside the openGraph block
  // Extract the openGraph object content between its braces
  const ogStart = src.indexOf("openGraph:");
  assert.ok(ogStart !== -1, "openGraph key not found");
  const ogBlock = src.slice(ogStart, src.indexOf("},", ogStart) + 2);
  assert.ok(
    !ogBlock.includes("images"),
    "openGraph block must not contain images field (no OG image asset exists yet)",
  );
});

test("AC2 robots.ts allows landing page and disallows private routes", () => {
  const src = read("app/robots.ts");

  assert.ok(src.includes("MetadataRoute.Robots"), "must use MetadataRoute.Robots type");
  assert.ok(src.includes('allow: "/"'), "must allow root path");
  assert.ok(src.includes('"/dashboard"'), "must disallow /dashboard");
  assert.ok(src.includes('"/api/"'), "must disallow /api/ routes");
});
