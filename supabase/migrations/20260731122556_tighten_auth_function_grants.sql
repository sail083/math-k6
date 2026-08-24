-- The identifier resolvers are needed before authentication. Keep them limited
-- to anon and prevent trigger functions from being exposed as callable RPCs.
revoke all on function public.get_email_by_phone(text) from public, authenticated;
grant execute on function public.get_email_by_phone(text) to anon;

revoke all on function public.get_email_by_login_identifier(text) from public, authenticated;
grant execute on function public.get_email_by_login_identifier(text) to anon;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Remove the temporary phone-slot fallback used while the admin account was
-- provisioned; usernames now have their own column.
update public.profiles
set phone = null
where username is not null
  and phone = username
  and phone !~ '^1[3-9][0-9]{9}$';

-- Preserve the existing ownership rules while avoiding per-row auth.uid()
-- evaluation and preventing ownership changes during updates.
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
