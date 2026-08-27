-- v0.4: Expand learning event names to include goal-continuity events.
-- Only drop and re-add the event_name check constraint; no table, RLS,
-- grant, or policy changes are made here.

ALTER TABLE public.learning_events DROP CONSTRAINT IF EXISTS chk_event_name;

ALTER TABLE public.learning_events ADD CONSTRAINT chk_event_name
  CHECK (event_name IN (
    'home_task_viewed',
    'home_task_opened',
    'intervention_assigned',
    'intervention_completed',
    'skill_review_scheduled',
    'skill_review_started',
    'skill_review_finished',
    'stable_achieved',
    'goal_entry_viewed',
    'learning_goal_started',
    'goal_path_viewed',
    'target_resume_shown',
    'target_resume_opened',
    'target_learning_started',
    'target_learning_completed',
    'repair_unavailable_shown'
  ));
