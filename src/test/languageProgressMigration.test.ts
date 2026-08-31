import { describe, expect, it } from 'vitest';
import { chineseLessonIds } from '@/content/chinese';
import { englishLessonIds } from '@/content/english';
import { PUBLISHED_LANGUAGE_LESSON_IDS } from '@/lib/progress';
import migrationSql from '../../supabase/migrations/20260831234642_v1_language_progress.sql?raw';

describe('V1 language progress migration', () => {
  it('keeps language completions in an independent profiles column', () => {
    expect(migrationSql).toContain("add column language_progress jsonb not null default '{}'::jsonb");
    expect(migrationSql).toContain("progress #> '{languageLessons,chinese,completedLessonIds}'");
    expect(migrationSql).toContain("progress #> '{languageLessons,english,completedLessonIds}'");
    expect(migrationSql).not.toMatch(/set\s+progress\s*=/i);
    expect(migrationSql).toContain('grant select, update on table public.profiles to authenticated');
  });

  it('atomically deduplicates only the six published subject lessons', () => {
    expect(PUBLISHED_LANGUAGE_LESSON_IDS.chinese).toEqual(chineseLessonIds);
    expect(PUBLISHED_LANGUAGE_LESSON_IDS.english).toEqual(englishLessonIds);
    for (const id of [
      ...PUBLISHED_LANGUAGE_LESSON_IDS.chinese,
      ...PUBLISHED_LANGUAGE_LESSON_IDS.english,
    ]) {
      expect(migrationSql).toContain(`'${id}'`);
    }
    const backfillSql = migrationSql.split('create or replace function')[0];
    expect(backfillSql).toContain('where lesson_id = any');
    expect(backfillSql).toContain('valid_chinese');
    expect(backfillSql).toContain('valid_english');
    expect(migrationSql).toMatch(/subject_input = 'chinese'[\s\S]+lesson_id_input = any/);
    expect(migrationSql).toMatch(/subject_input = 'english'[\s\S]+lesson_id_input = any/);
    expect(migrationSql).toContain('subject_input is null or lesson_id_input is null');
    expect(migrationSql).toContain('select distinct lesson_id');
    expect(migrationSql).toContain('set language_progress = jsonb_set(');
  });

  it('uses caller RLS and exposes the RPC only to authenticated users', () => {
    expect(migrationSql).toContain('security invoker');
    expect(migrationSql).toContain('or (select auth.uid()) <> user_id_input');
    expect(migrationSql).toContain('where profile.id = user_id_input');
    expect(migrationSql).toContain('complete_language_lesson(text, text, uuid)');
    expect(migrationSql).toMatch(/revoke all on function[\s\S]+from public, anon;/);
    expect(migrationSql).toMatch(/grant execute on function[\s\S]+to authenticated;/);
    expect(migrationSql).toContain('revoke all on function public.get_email_by_phone(text) from anon');
  });
});
