-- Add first-class usernames while preserving phone-based login.
alter table public.profiles
  add column if not exists username text;

comment on column public.profiles.username is
  'Optional case-insensitive username used to sign in.';

-- Backfill usernames already stored in Auth user metadata.
update public.profiles as p
set username = nullif(btrim(au.raw_user_meta_data ->> 'username'), '')
from auth.users as au
where au.id = p.id
  and p.username is null
  and nullif(btrim(au.raw_user_meta_data ->> 'username'), '') is not null;

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

-- New accounts copy both login identifiers from Auth metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, phone, username)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'username'), '')
  );
  return new;
end;
$$;

-- Keep the original phone RPC for backwards compatibility, with a fixed
-- search_path because it runs as SECURITY DEFINER.
create or replace function public.get_email_by_phone(phone_input text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select au.email
  from auth.users as au
  join public.profiles as p on p.id = au.id
  where p.phone = btrim(phone_input)
  limit 1
$$;

revoke all on function public.get_email_by_phone(text) from public;
revoke all on function public.get_email_by_phone(text) from authenticated;
grant execute on function public.get_email_by_phone(text) to anon;

create or replace function public.get_email_by_login_identifier(identifier_input text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select au.email
  from auth.users as au
  join public.profiles as p on p.id = au.id
  where p.phone = btrim(identifier_input)
     or lower(p.username) = lower(btrim(identifier_input))
  limit 1
$$;

comment on function public.get_email_by_login_identifier(text) is
  'Resolves a phone number or case-insensitive username to its Auth email.';

revoke all on function public.get_email_by_login_identifier(text) from public;
revoke all on function public.get_email_by_login_identifier(text) from authenticated;
grant execute on function public.get_email_by_login_identifier(text) to anon;

-- Trigger functions are invoked by PostgreSQL and must not be callable as RPCs.
revoke all on function public.handle_new_user() from public, anon, authenticated;
