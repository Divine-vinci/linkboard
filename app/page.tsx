import type { Metadata } from "next";
import Link from "next/link";

const title = "Linkboard | Save, tag, and rediscover the web";
const description =
  "Capture useful links, organize them with tags, and find them again with metadata-aware search.";

const features = [
  {
    name: "Auto-metadata capture",
    description:
      "Save a URL once and keep the page title, description, and source context attached for later.",
  },
  {
    name: "Flexible tagging",
    description:
      "Group bookmarks by project, topic, or workflow so your board stays organized as it grows.",
  },
  {
    name: "Full-text search",
    description:
      "Search across URLs, titles, descriptions, and tags to surface the right link in seconds.",
  },
] as const;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "Linkboard",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <main className="bg-background text-foreground">
      <nav aria-label="Primary" className="border-b border-slate-200/80 bg-background/95">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Linkboard
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-foreground transition hover:border-slate-900 hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Sign in
          </Link>
        </div>
      </nav>

      <section className="mx-auto flex min-h-[calc(100dvh-4.5rem)] w-full max-w-6xl items-center px-6 py-20 sm:py-24">
        <div className="max-w-3xl space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Your calm place for useful links
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Save every good link with the context you need to find it again.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Linkboard helps you collect research, references, and rabbit-hole gems in one searchable
              place so nothing valuable disappears into tabs, chats, or bookmarks bars.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Get started
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-slate-200 bg-background/80 px-6 py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl space-y-12">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Built for fast capture and easy rediscovery</h2>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Keep the speed of a bookmark bar without losing the organization and searchability your work requires.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="rounded-3xl border border-slate-200 bg-background p-6 shadow-sm"
              >
                <h3 className="text-xl font-semibold tracking-tight">{feature.name}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-start justify-between gap-8 rounded-3xl border border-slate-200 bg-slate-950 px-8 py-10 text-white shadow-sm sm:flex-row sm:items-center">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight">Start building a smarter bookmark habit.</h2>
            <p className="text-base leading-7 text-slate-300">
              Save links with metadata, organize them with tags, and find them instantly when you need them.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Create your board
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Linkboard</p>
          <p>Save, tag, and find links without losing context.</p>
        </div>
      </footer>
    </main>
  );
}
