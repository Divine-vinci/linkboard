alter table public.bookmarks enable row level security;
alter table public.tags enable row level security;
alter table public.bookmark_tags enable row level security;

create policy "bookmarks_select_own" on public.bookmarks
  for select using (auth.uid() = user_id);

create policy "bookmarks_insert_own" on public.bookmarks
  for insert with check (auth.uid() = user_id);

create policy "bookmarks_update_own" on public.bookmarks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "bookmarks_delete_own" on public.bookmarks
  for delete using (auth.uid() = user_id);

create policy "tags_select_own" on public.tags
  for select using (auth.uid() = user_id);

create policy "tags_insert_own" on public.tags
  for insert with check (auth.uid() = user_id);

create policy "tags_update_own" on public.tags
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tags_delete_own" on public.tags
  for delete using (auth.uid() = user_id);

create policy "bookmark_tags_select_own" on public.bookmark_tags
  for select using (
    exists (
      select 1
      from public.bookmarks
      where public.bookmarks.id = public.bookmark_tags.bookmark_id
        and public.bookmarks.user_id = auth.uid()
    )
  );

create policy "bookmark_tags_insert_own" on public.bookmark_tags
  for insert with check (
    exists (
      select 1
      from public.bookmarks
      where public.bookmarks.id = public.bookmark_tags.bookmark_id
        and public.bookmarks.user_id = auth.uid()
    )
  );

create policy "bookmark_tags_delete_own" on public.bookmark_tags
  for delete using (
    exists (
      select 1
      from public.bookmarks
      where public.bookmarks.id = public.bookmark_tags.bookmark_id
        and public.bookmarks.user_id = auth.uid()
    )
  );
