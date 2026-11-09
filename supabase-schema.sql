-- Run this SQL in Supabase Dashboard > SQL Editor.
-- One JSON finance document per authenticated user; RLS prevents cross-user access.
create table if not exists public.user_finance (
  id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"transactions":[],"assets":[],"liabilities":[],"budgets":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_finance enable row level security;

drop policy if exists "Users can read own finance data" on public.user_finance;
create policy "Users can read own finance data"
on public.user_finance for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert own finance data" on public.user_finance;
create policy "Users can insert own finance data"
on public.user_finance for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own finance data" on public.user_finance;
create policy "Users can update own finance data"
on public.user_finance for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- No anonymous access. Never disable RLS or put a service_role key in the app.
