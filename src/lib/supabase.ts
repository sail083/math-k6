import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { LearningEventName } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // In test/CI environments or when env vars are not set,
  // create a dummy client that will gracefully fail on API calls.
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables. ' +
    'Authentication features will not work until these are configured.',
  );
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };

// ===== v0.3: Learning event logging =====

/**
 * Fire-and-forget learning event logger.
 * Failure never blocks learning — errors are logged to console only.
 * Caller must provide a stable idempotency key per semantic transition.
 */
export function logLearningEvent(params: {
  userId: string;
  clientEventId: string;
  eventName: LearningEventName;
  skillId?: string;
  courseId?: string;
  mode?: string;
  variant?: string;
  passed?: boolean;
  firstTry?: boolean;
  durationMs?: number;
  dueAt?: string;
  properties?: Record<string, unknown>;
}): void {
  try {
    supabase
      .from('learning_events')
      .insert({
        user_id: params.userId,
        client_event_id: params.clientEventId,
        event_name: params.eventName,
        skill_id: params.skillId ?? null,
        course_id: params.courseId ?? null,
        mode: params.mode ?? null,
        variant: params.variant ?? null,
        passed: params.passed ?? null,
        first_try: params.firstTry ?? null,
        duration_ms: params.durationMs ?? null,
        due_at: params.dueAt ?? null,
        app_version: '0.3.0',
        content_version: '0.3.0',
        properties: params.properties ?? {},
      })
      .then(({ error }) => {
        if (error) {
          // F16: duplicate insert (unique violation) is the final idempotency guard;
          // treat it as an expected no-op instead of an application error.
          if (error.code === '23505') return;
          console.error('[Event]', params.eventName, error.message);
        }
      });
  } catch (e) {
    console.error('[Event]', params.eventName, e);
  }
}
