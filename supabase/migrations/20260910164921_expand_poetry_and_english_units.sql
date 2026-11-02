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
      'zh-campus-words',
      'zh-campus-reading',
      'zh-campus-speaking',
      'zh-g4-library-words',
      'zh-g4-library-reading',
      'zh-g4-library-writing',
      'zh-g5-water-methods',
      'zh-g5-water-reading',
      'zh-g5-water-writing',
      'zh-g6-reading-corner-evidence',
      'zh-g6-reading-corner-reading',
      'zh-g6-reading-corner-writing',
      'zh-g4-poetry-notice',
      'zh-g4-poetry-images',
      'zh-g4-poetry-writing'
    ]::text[])
  ) and not (
    subject_input = 'english'
    and lesson_id_input = any (array[
      'en-g3a-u1-meet',
      'en-g3a-u1-help',
      'en-g3a-u1-friend-card',
      'en-park-animals',
      'en-park-sentences',
      'en-park-listen-read',
      'en-g4-sports-abilities',
      'en-g4-sports-invitation',
      'en-g4-sports-card',
      'en-g5-plate-food',
      'en-g5-plate-menu',
      'en-g5-plate-plan',
      'en-g6-money-choices',
      'en-g6-money-reason',
      'en-g6-money-plan',
      'en-g3a-u2-things',
      'en-g3a-u2-bag',
      'en-g3a-u2-care-card',
      'en-g3a-u3-colours',
      'en-g3a-u3-find',
      'en-g3a-u3-picture-card'
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
