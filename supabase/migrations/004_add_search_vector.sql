alter table public.bookmarks
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(url, '')), 'C')
  ) stored;

create index if not exists idx_bookmarks_search_vector
  on public.bookmarks
  using gin (search_vector);
