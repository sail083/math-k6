import { describe, expect, it } from 'vitest';
import { chineseLessons, chineseUnits } from '@/content/chinese';
import { englishLessons, englishUnits } from '@/content/english';
import { completeLanguageLesson, parseRemoteLanguageProgress } from '@/lib/progress';
import type { ProgressData } from '@/lib/types';

describe('language unit catalog', () => {
  it('covers every grade from 3 through 6 with independent study units', () => {
    for (const units of [chineseUnits, englishUnits]) {
      for (const grade of [3, 4, 5, 6]) {
        const gradeUnits = units.filter((unit) => unit.grade === grade);
        expect(gradeUnits.length, `grade ${grade} should have units`).toBeGreaterThan(0);
        expect(gradeUnits.every((unit) => unit.lessonIds.length >= 3)).toBe(true);
      }
    }
  });

  it('keeps units in grade and semester order without changing their independent boundaries', () => {
    for (const units of [chineseUnits, englishUnits]) {
      const order = units.map((unit) => unit.grade * 100 + (unit.semester === '下册' ? 10 : 0) + (unit.unit ?? 0));
      expect(order).toEqual([...order].sort((a, b) => a - b));
    }
    const library = chineseUnits.find((unit) => unit.id === 'zh-g4-library')!;
    const poetry = chineseUnits.find((unit) => unit.id === 'zh-g4-poetry')!;
    const progress: ProgressData = { passedKnowledgePoints: [], stars: {} };
    expect(completeLanguageLesson(progress, 'chinese', poetry.lessonIds[1], poetry.lessonIds, 1)).toBe(progress);
    const completed = completeLanguageLesson(progress, 'chinese', poetry.lessonIds[0], poetry.lessonIds, 1);
    expect(completed.languageLessons?.chinese?.currentLessonId).toBe(poetry.lessonIds[1]);
    expect(completed.languageLessons?.chinese?.completedLessonIds).not.toContain(library.lessonIds[0]);
  });
  it('registers every lesson exactly once and restores all published completions from the remote shape', () => {
    for (const [subject, lessons, units] of [
      ['chinese', chineseLessons, chineseUnits], ['english', englishLessons, englishUnits],
    ] as const) {
      const ids = units.flatMap((unit) => unit.lessonIds);
      expect(new Set(ids).size).toBe(ids.length);
      expect([...ids].sort()).toEqual(lessons.map((lesson) => lesson.id).sort());
      const restored = parseRemoteLanguageProgress({ [subject]: [...ids, ids[0], 'unpublished'] });
      expect(restored[subject]?.completedLessonIds).toEqual([...ids].sort());
    }
  });

  it('advances within a high-grade unit without deleting earlier work or completing younger lessons', () => {
    const unit = chineseUnits.find((item) => item.grade === 6)!;
    const oldId = 'zh-campus-words';
    const original: ProgressData = { passedKnowledgePoints: ['g3-fraction-intro'], stars: { 'g3-fraction-intro': 2 },
      languageLessons: { chinese: { completedLessonIds: [oldId], currentLessonId: unit.lessonIds[0], updatedAt: 1 } } };
    expect(completeLanguageLesson(original, 'chinese', unit.lessonIds[1], unit.lessonIds, 2)).toBe(original);
    let progress = original;
    for (const [index, id] of unit.lessonIds.entries()) {
      progress = completeLanguageLesson(progress, 'chinese', id, unit.lessonIds, index + 2);
      expect(progress.languageLessons?.chinese?.currentLessonId).toBe(unit.lessonIds[index + 1] ?? null);
    }
    expect(progress.languageLessons?.chinese?.completedLessonIds).toEqual([oldId, ...unit.lessonIds]);
    expect(progress.passedKnowledgePoints).toEqual(original.passedKnowledgePoints);
    expect(completeLanguageLesson(progress, 'chinese', unit.lessonIds[2], unit.lessonIds, 9)).toBe(progress);
  });
});
