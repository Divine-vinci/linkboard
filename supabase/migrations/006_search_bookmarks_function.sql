create or replace function search_bookmarks(search_query text)
returns table (bookmark_id uuid, rank real)
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct on (b.id)
    b.id as bookmark_id,
    ts_rank(b.search_vector, websearch_to_tsquery('english', search_query)) as rank
  from public.bookmarks b
  left join public.bookmark_tags bt on bt.bookmark_id = b.id
  left join public.tags t on t.id = bt.tag_id
  where b.user_id = auth.uid()
    and (
      b.search_vector @@ websearch_to_tsquery('english', search_query)
      or t.name ilike '%' || search_query || '%'
    )
  order by b.id, rank desc;
$$;
