import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

const PHONE_RE = /^1[3-9]\d{9}$/;
const USERNAME_RE = /^[a-z][a-z0-9_-]{2,31}$/i;
const MIN_FAILURE_DELAY_MS = 250;

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function getPlatformKey(pluralName: string, legacyName: string): string | null {
  const pluralValue = Deno.env.get(pluralName);
  if (pluralValue) {
    try {
      const key = JSON.parse(pluralValue).default;
      if (typeof key === 'string' && key) return key;
    } catch {
      // Older projects expose only the legacy environment variables below.
    }
  }
  return Deno.env.get(legacyName) ?? null;
}

function validIdentifier(identifier: string): boolean {
  return PHONE_RE.test(identifier) || USERNAME_RE.test(identifier);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return response({ error: 'method_not_allowed' }, 405);

  const startedAt = Date.now();
  const invalidCredentials = async () => {
    const wait = MIN_FAILURE_DELAY_MS - (Date.now() - startedAt);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    return response({ error: 'invalid_credentials' }, 401);
  };

  try {
    const body = await req.json() as { identifier?: unknown; password?: unknown };
    const identifier = typeof body.identifier === 'string' ? body.identifier.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!validIdentifier(identifier) || password.length < 6) return invalidCredentials();

    const url = Deno.env.get('SUPABASE_URL');
    const secretKey = getPlatformKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');
    const publishableKey = getPlatformKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
    if (!url || !secretKey || !publishableKey) {
      console.error('Required Supabase Edge Function environment variables are unavailable.');
      return response({ error: 'service_unavailable' }, 503);
    }

    const admin = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const predicate = PHONE_RE.test(identifier)
      ? `phone.eq.${identifier}`
      : `username.ilike.${identifier}`;
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .or(predicate)
      .limit(1)
      .maybeSingle();
    if (profileError || !profile) return invalidCredentials();

    const { data: userResult, error: userError } = await admin.auth.admin.getUserById(profile.id);
    const email = userResult.user?.email;
    if (userError || !email) return invalidCredentials();

    const tokenResponse = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!tokenResponse.ok) return invalidCredentials();

    const token = await tokenResponse.json() as { access_token?: unknown; refresh_token?: unknown };
    if (typeof token.access_token !== 'string' || typeof token.refresh_token !== 'string') {
      return invalidCredentials();
    }
    return response({ access_token: token.access_token, refresh_token: token.refresh_token });
  } catch (error) {
    console.error('Identifier login failed unexpectedly.', error);
    return response({ error: 'service_unavailable' }, 503);
  }
});
