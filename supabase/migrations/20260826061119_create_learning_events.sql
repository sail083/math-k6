-- v0.3: Minimal append-only learning events table
-- No raw answers, no free text, no contact data.

CREATE TABLE public.learning_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_event_id text NOT NULL,
  event_name text NOT NULL,
  skill_id text,
  course_id text,
  mode text,
  variant text,
  passed boolean,
  first_try boolean,
  duration_ms int,
  due_at timestamptz,
  app_version text,
  content_version text,
  properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Unique idempotency constraint (per user)
CREATE UNIQUE INDEX learning_events_user_client_id_idx
  ON public.learning_events (user_id, client_event_id);

-- Query indexes
CREATE INDEX learning_events_user_created_idx
  ON public.learning_events (user_id, created_at DESC);
CREATE INDEX learning_events_event_created_idx
  ON public.learning_events (event_name, created_at DESC);

-- Allowed event names
ALTER TABLE public.learning_events ADD CONSTRAINT chk_event_name
  CHECK (event_name IN (
    'home_task_viewed',
    'home_task_opened',
    'intervention_assigned',
    'intervention_completed',
    'skill_review_scheduled',
    'skill_review_started',
    'skill_review_finished',
    'stable_achieved'
  ));

-- Non-negative duration
ALTER TABLE public.learning_events ADD CONSTRAINT chk_duration_nonneg
  CHECK (duration_ms IS NULL OR duration_ms >= 0);

-- ===== Security =====

ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;

-- Revoke everything first
REVOKE ALL ON public.learning_events FROM anon;
REVOKE ALL ON public.learning_events FROM authenticated;

-- Grant INSERT only to authenticated
GRANT INSERT ON public.learning_events TO authenticated;

-- Insert policy: users can only insert their own events
CREATE POLICY "Users can insert own events"
  ON public.learning_events
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- No SELECT/UPDATE/DELETE policy for authenticated or anon.
-- Analysis read only via service_role (bypasses RLS).
GRANT SELECT ON public.learning_events TO service_role;
