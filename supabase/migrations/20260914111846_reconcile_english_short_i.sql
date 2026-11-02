-- Reconcile executable allowlists with the published catalog; do not modify stored progress.
-- Supersedes the prior allowlist migration and includes the current catalog.
create or replace function public.complete_language_lesson(
  subject_input text,
  lesson_id_input text,
  user_id_input uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  merged_progress jsonb;
begin
  if user_id_input is null
     or (select auth.uid()) is null
     or (select auth.uid()) <> user_id_input then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if subject_input is null or lesson_id_input is null or (not (
    subject_input = 'chinese'
    and lesson_id_input = any (array[
      'zh-g4-dialogue-key',
      'zh-g4-dialogue-confirm',
      'zh-g4-dialogue-card',
      'zh-g3-context-words',
      'zh-g3-context-references',
      'zh-g3-context-reading-card',
      'zh-g3-oral-listen',
      'zh-g3-oral-retell',
      'zh-g3-oral-respond',
      'zh-campus-words',
      'zh-campus-reading',
      'zh-campus-speaking',
      'zh-g4-library-words',
      'zh-g4-library-reading',
      'zh-g4-library-writing',
      'zh-g4-explain-main',
      'zh-g4-explain-order',
      'zh-g4-explain-card',
      'zh-g4-poetry-notice',
      'zh-g4-poetry-images',
      'zh-g4-poetry-writing',
      'zh-g5-water-methods',
      'zh-g5-water-reading',
      'zh-g5-water-writing',
      'zh-g5-merge-select',
      'zh-g5-merge-connect',
      'zh-g5-merge-card',
      'zh-g5-report-select',
      'zh-g5-report-order',
      'zh-g5-report-card',
      'zh-g5-poetry-perspectives',
      'zh-g5-poetry-unsaid',
      'zh-g5-poetry-revision',
      'zh-g6-reading-corner-evidence',
      'zh-g6-reading-corner-reading',
      'zh-g6-reading-corner-writing',
      'zh-g6-speech-claim',
      'zh-g6-speech-reason',
      'zh-g6-speech-card',
      'zh-g6-information-combine',
      'zh-g6-information-conflict',
      'zh-g6-information-explain',
      'zh-g6-reading-summary-main',
      'zh-g6-reading-summary-order',
      'zh-g6-reading-summary-card'
    ]::text[])
  ) and not (
    subject_input = 'english'
    and lesson_id_input = any (array[
      'en-g3-short-i-sit-fit',
      'en-g3-short-i-six-mix',
      'en-g3-short-i-scene-card',
      'en-g3a-u1-meet',
      'en-g3a-u1-help',
      'en-g3a-u1-friend-card',
      'en-g3a-u2-things',
      'en-g3a-u2-bag',
      'en-g3a-u2-care-card',
      'en-g3a-u3-colours',
      'en-g3a-u3-find',
      'en-g3a-u3-picture-card',
      'en-park-animals',
      'en-park-sentences',
      'en-park-listen-read',
      'en-g3-short-word-at',
      'en-g3-short-word-en',
      'en-g3-short-word-scene',
      'en-g3-routine-actions',
      'en-g3-routine-order',
      'en-g3-routine-card',
      'en-g4-sports-abilities',
      'en-g4-sports-invitation',
      'en-g4-sports-card',
      'en-g4-helping-ask',
      'en-g4-helping-order',
      'en-g4-helping-card',
      'en-g4-notice-listen',
      'en-g4-notice-update',
      'en-g4-notice-confirm',
      'en-g4-weather-read',
      'en-g4-weather-advice',
      'en-g4-weather-card',
      'en-g5-plate-food',
      'en-g5-plate-menu',
      'en-g5-plate-plan',
      'en-g5-habits-read',
      'en-g5-habits-compare',
      'en-g5-habits-card',
      'en-g6-money-choices',
      'en-g6-money-reason',
      'en-g6-money-plan',
      'en-g6-story-compare',
      'en-g6-story-conditions',
      'en-g6-story-flexible-plan',
      'en-g6-opinions-hear',
      'en-g6-opinions-reason',
      'en-g6-opinions-card',
      'en-g6-reflect-notice',
      'en-g6-reflect-revise',
      'en-g6-reflect-card'
    ]::text[])
  )) then
    raise exception 'lesson does not belong to subject' using errcode = '22023';
  end if;

  update public.profiles as profile
  set language_progress = jsonb_set(
    profile.language_progress,
    array[subject_input],
    (
      select jsonb_agg(lesson_id order by lesson_id)
      from (
        select distinct lesson_id
        from (
          select jsonb_array_elements_text(
            case
              when jsonb_typeof(profile.language_progress -> subject_input) = 'array'
                then profile.language_progress -> subject_input
              else '[]'::jsonb
            end
          ) as lesson_id
          union all
          select lesson_id_input
        ) values_to_merge
      ) deduplicated
    ),
    true
  )
  where profile.id = user_id_input
  returning profile.language_progress into merged_progress;

  if merged_progress is null then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  return merged_progress;
end;
$$;

revoke all on function public.complete_language_lesson(text, text, uuid)
  from public, anon;
grant execute on function public.complete_language_lesson(text, text, uuid)
  to authenticated, service_role;
