-- Production smoke test: random nonexistent profile, no learner data inserted or changed.
begin;
do $setup$
declare actor uuid := gen_random_uuid();
begin
  if exists(select 1 from public.profiles where id = actor) then
    raise exception 'Test identity collision';
  end if;
  perform set_config('request.jwt.claim.sub', actor::text, true);
  perform set_config('request.jwt.claims', '{}', true);
end;
$setup$;
set local role authenticated;
do $verify$
declare
  actor uuid := auth.uid();
  fixture record;
  accepted integer := 0;
  rejected integer := 0;
begin
  if actor is null then raise exception 'Missing synthetic test identity'; end if;
  for fixture in select * from (values
      ('chinese', 'zh-g3-context-words'),
      ('chinese', 'zh-g3-context-references'),
      ('chinese', 'zh-g3-context-reading-card'),
      ('chinese', 'zh-g3-oral-listen'),
      ('chinese', 'zh-g3-oral-retell'),
      ('chinese', 'zh-g3-oral-respond'),
      ('chinese', 'zh-campus-words'),
      ('chinese', 'zh-campus-reading'),
      ('chinese', 'zh-campus-speaking'),
      ('chinese', 'zh-g4-library-words'),
      ('chinese', 'zh-g4-library-reading'),
      ('chinese', 'zh-g4-library-writing'),
      ('chinese', 'zh-g4-explain-main'),
      ('chinese', 'zh-g4-explain-order'),
      ('chinese', 'zh-g4-explain-card'),
      ('chinese', 'zh-g4-poetry-notice'),
      ('chinese', 'zh-g4-poetry-images'),
      ('chinese', 'zh-g4-poetry-writing'),
      ('chinese', 'zh-g5-water-methods'),
      ('chinese', 'zh-g5-water-reading'),
      ('chinese', 'zh-g5-water-writing'),
      ('chinese', 'zh-g5-merge-select'),
      ('chinese', 'zh-g5-merge-connect'),
      ('chinese', 'zh-g5-merge-card'),
      ('chinese', 'zh-g5-poetry-perspectives'),
      ('chinese', 'zh-g5-poetry-unsaid'),
      ('chinese', 'zh-g5-poetry-revision'),
      ('chinese', 'zh-g6-reading-corner-evidence'),
      ('chinese', 'zh-g6-reading-corner-reading'),
      ('chinese', 'zh-g6-reading-corner-writing'),
      ('chinese', 'zh-g6-speech-claim'),
      ('chinese', 'zh-g6-speech-reason'),
      ('chinese', 'zh-g6-speech-card'),
      ('chinese', 'zh-g6-information-combine'),
      ('chinese', 'zh-g6-information-conflict'),
      ('chinese', 'zh-g6-information-explain'),
      ('chinese', 'zh-g6-reading-summary-main'),
      ('chinese', 'zh-g6-reading-summary-order'),
      ('chinese', 'zh-g6-reading-summary-card'),
      ('english', 'en-g3a-u1-meet'),
      ('english', 'en-g3a-u1-help'),
      ('english', 'en-g3a-u1-friend-card'),
      ('english', 'en-g3a-u2-things'),
      ('english', 'en-g3a-u2-bag'),
      ('english', 'en-g3a-u2-care-card'),
      ('english', 'en-g3a-u3-colours'),
      ('english', 'en-g3a-u3-find'),
      ('english', 'en-g3a-u3-picture-card'),
      ('english', 'en-park-animals'),
      ('english', 'en-park-sentences'),
      ('english', 'en-park-listen-read'),
      ('english', 'en-g3-short-word-at'),
      ('english', 'en-g3-short-word-en'),
      ('english', 'en-g3-short-word-scene'),
      ('english', 'en-g3-routine-actions'),
      ('english', 'en-g3-routine-order'),
      ('english', 'en-g3-routine-card'),
      ('english', 'en-g4-sports-abilities'),
      ('english', 'en-g4-sports-invitation'),
      ('english', 'en-g4-sports-card'),
      ('english', 'en-g4-helping-ask'),
      ('english', 'en-g4-helping-order'),
      ('english', 'en-g4-helping-card'),
      ('english', 'en-g4-notice-listen'),
      ('english', 'en-g4-notice-update'),
      ('english', 'en-g4-notice-confirm'),
      ('english', 'en-g4-weather-read'),
      ('english', 'en-g4-weather-advice'),
      ('english', 'en-g4-weather-card'),
      ('english', 'en-g5-plate-food'),
      ('english', 'en-g5-plate-menu'),
      ('english', 'en-g5-plate-plan'),
      ('english', 'en-g5-habits-read'),
      ('english', 'en-g5-habits-compare'),
      ('english', 'en-g5-habits-card'),
      ('english', 'en-g6-money-choices'),
      ('english', 'en-g6-money-reason'),
      ('english', 'en-g6-money-plan'),
      ('english', 'en-g6-story-compare'),
      ('english', 'en-g6-story-conditions'),
      ('english', 'en-g6-story-flexible-plan'),
      ('english', 'en-g6-opinions-hear'),
      ('english', 'en-g6-opinions-reason'),
      ('english', 'en-g6-opinions-card'),
      ('english', 'en-g6-reflect-notice'),
      ('english', 'en-g6-reflect-revise'),
      ('english', 'en-g6-reflect-card')
    ) as lessons(subject, id)
  loop
    begin
      perform public.complete_language_lesson(fixture.subject, fixture.id, actor);
      raise exception 'Unexpected profile found';
    exception when sqlstate 'P0002' then
      accepted := accepted + 1; -- Passed allowlist, reached missing-profile guard.
    end;
    begin
      perform public.complete_language_lesson(
        case fixture.subject when 'chinese' then 'english' else 'chinese' end,
        fixture.id, actor);
      raise exception 'Cross-subject lesson accepted';
    exception when sqlstate '22023' then rejected := rejected + 1;
    end;
  end loop;
  begin
    perform public.complete_language_lesson('english', 'unpublished-smoke-test', actor);
    raise exception 'Unknown lesson accepted';
  exception when sqlstate '22023' then rejected := rejected + 1; end;
  begin
    perform public.complete_language_lesson(null, 'en-g6-opinions-hear', actor);
    raise exception 'Null subject accepted';
  exception when sqlstate '22023' then rejected := rejected + 1; end;
  begin
    perform public.complete_language_lesson('english', null, actor);
    raise exception 'Null lesson accepted';
  exception when sqlstate '22023' then rejected := rejected + 1; end;
  begin
    perform public.complete_language_lesson('english', 'en-g6-opinions-hear', gen_random_uuid());
    raise exception 'Different user accepted';
  exception when sqlstate '28000' then rejected := rejected + 1; end;
  perform set_config('request.jwt.claim.sub', '', true);
  begin
    perform public.complete_language_lesson('english', 'en-g6-opinions-hear', actor);
    raise exception 'Missing login accepted';
  exception when sqlstate '28000' then rejected := rejected + 1; end;
  perform set_config('verification.allowed', accepted::text, true);
  perform set_config('verification.rejected', rejected::text, true);
end;
$verify$;
reset role;
select current_setting('verification.allowed')::integer as lessons_passed_allowlist,
       current_setting('verification.rejected')::integer as invalid_calls_rejected,
       false as learner_records_written;
rollback;
