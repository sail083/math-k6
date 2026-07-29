-- ============================================================
-- 001_create_profiles.sql
-- Profiles table + phone lookup RPC + auto-create trigger
-- ============================================================

-- 1. Profiles table linked to auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  phone text unique,
  created_at timestamp with time zone default now()
);

comment on table public.profiles is 'User profile data linked to Supabase auth.';

-- 2. RPC to look up email by phone number
--    Used by the login flow: client sends phone, gets back email.
create or replace function public.get_email_by_phone(phone_input text)
returns text as $$
  select au.email
  from auth.users au
  join public.profiles p on p.id = au.id
  where p.phone = phone_input
  limit 1
$$ language sql security definer;

comment on function public.get_email_by_phone(text) is 'Returns the auth email for a given phone number.';

-- 3. Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.raw_user_meta_data->>'phone');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Row Level Security
alter table public.profiles enable row level security;

-- Users can only read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 5. Progress column for storing learning data as JSONB
--    (alternative to user_metadata which has a size limit)
alter table public.profiles add column if not exists progress jsonb default '{}'::jsonb;

comment on column public.profiles.progress is 'Learning progress data synced from client localStorage.';
