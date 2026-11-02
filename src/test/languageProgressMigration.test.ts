import { describe, expect, it } from 'vitest';
import { chineseLessonIds } from '@/content/chinese';
import { englishLessonIds } from '@/content/english';
import { PUBLISHED_LANGUAGE_LESSON_IDS } from '@/lib/progress';
import migrationSql from '../../supabase/migrations/20260831234642_v1_language_progress.sql?raw';
const migrationFiles = import.meta.glob('../../supabase/migrations/*.sql', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

function executableSql(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');
}

// A later CREATE OR REPLACE wins. IDs in comments or superseded definitions
// must never make a missing live allowlist look ready for release.
const englishExpansionSql = Object.entries(migrationFiles)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, sql]) => executableSql(sql))
  .filter((sql) => /create or replace function public\.complete_language_lesson\(/i.test(sql))
  .at(-1)!;

function allowlist(sql: string, subject: 'chinese' | 'english'): string[] {
  const match = executableSql(sql).match(new RegExp(
    `subject_input = '${subject}'\\s+and lesson_id_input = any \\(array\\[([\\s\\S]*?)\\]::text\\[\\]\\)`,
  ));
  return [...(match?.[1] ?? '').matchAll(/'([^']+)'/g)].map((item) => item[1]);
}

describe('V1 language progress migration', () => {
  it('keeps language completions in an independent profiles column', () => {
    expect(migrationSql).toContain("add column language_progress jsonb not null default '{}'::jsonb");
    expect(migrationSql).toContain("progress #> '{languageLessons,chinese,completedLessonIds}'");
    expect(migrationSql).toContain("progress #> '{languageLessons,english,completedLessonIds}'");
    expect(migrationSql).not.toMatch(/set\s+progress\s*=/i);
    expect(migrationSql).toContain('grant select, update on table public.profiles to authenticated');
  });

  it('atomically deduplicates the published subject lessons', () => {
    expect(PUBLISHED_LANGUAGE_LESSON_IDS.chinese).toEqual(chineseLessonIds);
    expect(PUBLISHED_LANGUAGE_LESSON_IDS.english).toEqual(englishLessonIds);
    for (const subject of ['chinese', 'english'] as const) {
      const ids = allowlist(englishExpansionSql, subject);
      expect(ids.length).toBe(new Set(ids).size);
      expect(ids.sort()).toEqual([...PUBLISHED_LANGUAGE_LESSON_IDS[subject]].sort());
    }
    const backfillSql = migrationSql.split('create or replace function')[0];
    expect(backfillSql).toContain('where lesson_id = any');
    expect(backfillSql).toContain('valid_chinese');
    expect(backfillSql).toContain('valid_english');
    expect(englishExpansionSql).toMatch(/subject_input = 'chinese'[\s\S]+lesson_id_input = any/);
    expect(englishExpansionSql).toMatch(/subject_input = 'english'[\s\S]+lesson_id_input = any/);
    expect(englishExpansionSql).toContain('subject_input is null or lesson_id_input is null');
    expect(englishExpansionSql).toContain('select distinct lesson_id');
    expect(englishExpansionSql).toContain('set language_progress = jsonb_set(');
  });

  it('rejects comment-only IDs and IDs listed under the other subject', () => {
    const sql = "subject_input = 'english' and lesson_id_input = any (array['en-example']::text[])";
    expect(allowlist(`-- ${sql}\n/* ${sql} */`, 'english')).toEqual([]);
    expect(allowlist(`${sql}\n-- 'zh-example'`, 'chinese')).toEqual([]);
    expect(allowlist(`${sql}\n-- 'en-comment'`, 'english')).toEqual(['en-example']);
  });

  it('uses caller RLS and exposes the RPC only to authenticated users', () => {
    expect(englishExpansionSql).toContain('security invoker');
    expect(englishExpansionSql).toContain('or (select auth.uid()) <> user_id_input');
    expect(englishExpansionSql).toContain('where profile.id = user_id_input');
    expect(englishExpansionSql).toContain('complete_language_lesson(text, text, uuid)');
    expect(englishExpansionSql).toMatch(/revoke all on function[\s\S]+from public, anon;/);
    expect(englishExpansionSql).toMatch(/grant execute on function[\s\S]+to authenticated, service_role;/);
    expect(migrationSql).toContain('revoke all on function public.get_email_by_phone(text) from anon');
  });
});
