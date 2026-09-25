-- TaskManager database setup.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to run again; it won't duplicate anything.

create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  notes text not null default '',
  due date,
  time text check (time is null or time ~ '^\d{2}:\d{2}$'),
  priority smallint not null default 0 check (priority between 0 and 3),
  tags text[] not null default '{}',
  done boolean not null default false,
  completed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);

-- Row Level Security: each signed-in user can only see and change their own tasks.
alter table public.tasks enable row level security;

drop policy if exists "Users can read their own tasks" on public.tasks;
create policy "Users can read their own tasks" on public.tasks
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own tasks" on public.tasks;
create policy "Users can add their own tasks" on public.tasks
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks" on public.tasks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks" on public.tasks
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Live updates: lets other devices hear about changes instantly
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
end;
$$;
