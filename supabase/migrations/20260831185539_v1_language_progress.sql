alter table public.profiles
  add column language_progress jsonb not null default '{}'::jsonb;

alter table public.profiles
  add constraint profiles_language_progress_is_object
  check (jsonb_typeof(language_progress) = 'object');

comment on column public.profiles.language_progress is
  'Completed Chinese and English lesson IDs. Kept outside legacy progress so old clients cannot overwrite it.';

-- Preserve any language completions written by the unreleased nested format.
-- The old key remains untouched so this additive migration is easy to roll back.
update public.profiles
set language_progress = jsonb_build_object(
  'chinese',
  coalesce((
    select jsonb_agg(lesson_id order by lesson_id)
    from (
      select distinct lesson_id
      from jsonb_array_elements_text(
        case
          when jsonb_typeof(progress #> '{languageLessons,chinese,completedLessonIds}') = 'array'
            then progress #> '{languageLessons,chinese,completedLessonIds}'
          else '[]'::jsonb
        end
      ) as lessons(lesson_id)
      where lesson_id = any (array[
        'zh-campus-words', 'zh-campus-reading', 'zh-campus-speaking'
      ]::text[])
    ) valid_chinese
  ), '[]'::jsonb),
  'english',
  coalesce((
    select jsonb_agg(lesson_id order by lesson_id)
    from (
      select distinct lesson_id
      from jsonb_array_elements_text(
        case
          when jsonb_typeof(progress #> '{languageLessons,english,completedLessonIds}') = 'array'
            then progress #> '{languageLessons,english,completedLessonIds}'
          else '[]'::jsonb
        end
      ) as lessons(lesson_id)
      where lesson_id = any (array[
        'en-park-animals', 'en-park-sentences', 'en-park-listen-read'
      ]::text[])
    ) valid_english
  ), '[]'::jsonb)
)
where language_progress = '{}'::jsonb
  and jsonb_typeof(progress -> 'languageLessons') = 'object';

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
      'zh-campus-speaking'
    ]::text[])
  ) and not (
    subject_input = 'english'
    and lesson_id_input = any (array[
      'en-park-animals',
      'en-park-sentences',
      'en-park-listen-read'
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
  to authenticated;
