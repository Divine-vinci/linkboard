create table if not exists public.bookmark_tags (
  bookmark_id uuid not null references public.bookmarks(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (bookmark_id, tag_id)
);

create index if not exists idx_bookmark_tags_bookmark_id on public.bookmark_tags(bookmark_id);
create index if not exists idx_bookmark_tags_tag_id on public.bookmark_tags(tag_id);
