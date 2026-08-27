import { describe, it, expect } from 'vitest';
import { parseLearningGoal, setLearningGoal } from '@/lib/progress';
import type { ProgressData, LearningEventName } from '@/lib/types';
import migrationSql from '../../supabase/migrations/20260827000000_expand_chk_event_name.sql?raw';

const emptyProgress = (): ProgressData => ({ passedKnowledgePoints: [], stars: {} });

// Canonical 16 event names — must stay in lockstep with the DB chk_event_name constraint.
const EXPECTED_EVENT_NAMES: LearningEventName[] = [
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
  'repair_unavailable_shown',
];

describe('parseLearningGoal — backward compatibility', () => {
  it('backfills startedAt from updatedAt and defaults source to map for legacy {skillId, updatedAt}', () => {
    const parsed = parseLearningGoal({ skillId: 'frac.notation', updatedAt: 1000 });
    expect(parsed).toEqual({
      skillId: 'frac.notation',
      startedAt: 1000,
      updatedAt: 1000,
      source: 'map',
    });
  });

  it('fails closed: invalid source falls back to map', () => {
    const parsed = parseLearningGoal({ skillId: 'frac.notation', updatedAt: 1000, startedAt: 500, source: 'bogus' });
    expect(parsed?.source).toBe('map');
    expect(parsed?.startedAt).toBe(500);
  });

  it('fails closed: invalid startedAt falls back to updatedAt', () => {
    const parsed = parseLearningGoal({ skillId: 'frac.notation', updatedAt: 1000, startedAt: 'bad' });
    expect(parsed?.startedAt).toBe(1000);
  });

  it('rejects illegal values entirely', () => {
    expect(parseLearningGoal(null)).toBeUndefined();
    expect(parseLearningGoal({ skillId: '', updatedAt: 1000 })).toBeUndefined();
    expect(parseLearningGoal({ skillId: 'frac.notation', updatedAt: -1 })).toBeUndefined();
    expect(parseLearningGoal({ skillId: 'frac.notation' })).toBeUndefined();
  });
});

describe('setLearningGoal — startedAt / source / target switching', () => {
  it('same target preserves startedAt while updating updatedAt and source', () => {
    let p = setLearningGoal(emptyProgress(), 'frac.notation', 1000, 'map');
    expect(p.learningGoal).toEqual({ skillId: 'frac.notation', startedAt: 1000, updatedAt: 1000, source: 'map' });

    p = setLearningGoal(p, 'frac.notation', 2000, 'home');
    expect(p.learningGoal).toEqual({ skillId: 'frac.notation', startedAt: 1000, updatedAt: 2000, source: 'home' });
  });

  it('switching to a different target resets startedAt to now', () => {
    let p = setLearningGoal(emptyProgress(), 'frac.notation', 1000, 'map');
    p = setLearningGoal(p, 'frac.whole', 3000, 'course');
    expect(p.learningGoal).toEqual({ skillId: 'frac.whole', startedAt: 3000, updatedAt: 3000, source: 'course' });
  });

  it('defaults source to map when omitted', () => {
    const p = setLearningGoal(emptyProgress(), 'frac.notation', 1000);
    expect(p.learningGoal?.source).toBe('map');
  });
});

describe('LearningEventName vs DB chk_event_name', () => {
  it('16 canonical names exactly match the latest migration constraint', () => {
    expect(EXPECTED_EVENT_NAMES).toHaveLength(16);
    expect(new Set(EXPECTED_EVENT_NAMES).size).toBe(16);

    const inConstraint = (() => {
      // 只解析 CHECK (event_name IN (...)) 片段内的单引号事件名，
      // 不扫全文，避免误匹配迁移文件里的注释或其它字符串。
      const check = migrationSql.match(/CHECK\s*\(\s*event_name\s+IN\s*\(([\s\S]*?)\)\s*\)/);
      const fragment = check?.[1] ?? '';
      return fragment.match(/'([a-z_]+)'/g)?.map((m) => m.slice(1, -1)) ?? [];
    })();
    expect(inConstraint).toHaveLength(16);
    expect(inConstraint.slice().sort()).toEqual(EXPECTED_EVENT_NAMES.slice().sort());
  });
});
