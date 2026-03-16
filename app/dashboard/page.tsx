import { BookmarkForm } from "@/components/bookmark-form";
import { BookmarkList } from "@/components/bookmark-list";
import { listBookmarks } from "@/lib/actions/bookmarks";
import type { BookmarkWithTags } from "@/lib/types";

export default async function DashboardPage() {
  const bookmarksResult = await listBookmarks();
  const bookmarks: BookmarkWithTags[] = bookmarksResult.success ? bookmarksResult.data : [];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Your bookmarks</h1>
        <p className="text-base leading-7 text-muted-foreground">
          Browse saved links with previews, tags, and searchable metadata.
        </p>
      </div>

      <BookmarkForm />
      {!bookmarksResult.success ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {bookmarksResult.error.message}
        </div>
      ) : (
        <BookmarkList bookmarks={bookmarks} />
      )}
    </section>
  );
}
