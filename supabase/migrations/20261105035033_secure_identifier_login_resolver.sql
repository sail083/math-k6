-- Username and phone login must not expose an Auth email through a public RPC.
-- The production Edge Function now resolves the identifier server-side and
-- exchanges valid credentials directly with Supabase Auth.
revoke all on function public.get_email_by_phone(text)
  from public, anon, authenticated;

revoke all on function public.get_email_by_login_identifier(text)
  from public, anon, authenticated;
