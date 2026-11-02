import { describe, expect, it } from 'vitest';
import { getAllKnowledgePoints, getCourseTrack } from '@/lib/content';
describe('math difficulty and grade path guard', () => {
  it('keeps every course in a known difficulty tier and ordered by grade', () => {
    const allowed = new Set(['base', 'extension', 'challenge']);
    const courses = getAllKnowledgePoints();
    expect(courses.length).toBe(65);
    for (const kp of courses) expect(allowed.has(getCourseTrack(kp.meta)), kp.meta.id).toBe(true);
    for (let i = 1; i < courses.length; i += 1) expect(courses[i].meta.grade).toBeGreaterThanOrEqual(courses[i - 1].meta.grade);
  });
});
