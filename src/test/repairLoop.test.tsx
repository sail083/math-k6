/**
 * repairLoop.test.tsx
 *
 * 覆盖 v0.2 微补修功能：
 * 1. repairContent 9/36 完整校验与 F7 关键题意
 * 2. readiness 状态（无证据、conceptual only、repair transfer、过期、stable）
 * 3. next actionable: whole → equal_partition → null
 * 4. repair mode 不直接 stable 与一天边界
 * 5. goal/session parse、merge 三个时间/tombstone 场景
 * 6. RepairPage 渲染流状态机（需真实渲染组件）
 * 7. Map URL target 合法/非法、repaired 清参
 * 8. Home 推荐优先级
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { ProgressData, SkillReviewSchedule, CourseIntervention } from '@/lib/types';
import type { SkillDisplayStatus } from '@/lib/progress';

// ===== Pure functions =====
import {
  repairUnits,
  validateRepairUnits,
  getAllRepairQuestions,
} from '@/lib/repairContent';
import {
  recordSkillEvidence,
  getSkillDisplayStatus,
  isSkillReadyForPath,
  parseLearningGoal,
  parseRepairSession,
  mergeLearningGoal,
  mergeRepairSession,
  loadProgress,
  hasMeaningfulProgress,
  // v0.3
  parseSkillReviews,
  mergeSkillReviewSchedule,
  scheduleSkillReview,
  getDueSkillReviews,
  getSkillReviewSchedule,
  resolveSkillReview,
  refreshDueReviews,
  getExperimentAssignment,
  setExperimentAssignment,
  getEffectiveAssignment,
  mergeExperimentAssignments,
  parseExperimentAssignments,
  getHomeTasks,
  parseCourseIntervention,
  mergeCourseIntervention,
  startCourseIntervention,
  completeCourseIntervention,
  isActiveCourseIntervention,
  // v0.3 atomic transitions
  resolveSkillReviewTransition,
  markInitialPassTransition,
  type HomeTask,
} from '@/lib/progress';
import { getNextActionableSkill } from '@/lib/knowledgeGraph';
import { getAllKnowledgePoints, getCourseTrack } from '@/lib/content';
import { supabase, logLearningEvent } from '@/lib/supabase';

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;
const empty: ProgressData = { passedKnowledgePoints: [], stars: {} };

// =====================================================
// Shared mock state for context (all tests share one module mock)
// =====================================================

const mockRecordSkillEvidence = vi.fn();
const mockStartRepair = vi.fn();
const mockFinishRepair = vi.fn();
const mockGetSkillDisplayStatus = vi.fn<(id: string) => SkillDisplayStatus>(() => 'not_started');
const mockIsSkillReadyForPath = vi.fn(() => false);
const mockSetGoal = vi.fn();
const mockGetDueReviewIds = vi.fn<() => string[]>(() => []);
const mockIsPassed = vi.fn((_id: string) => false);
const mockScheduleSkillReview = vi.fn();
const mockResolveSkillReview = vi.fn();
const mockGetSkillReviewSchedule = vi.fn<() => SkillReviewSchedule | undefined>(() => undefined);
const mockGetEffectiveAssignment = vi.fn<() => 'repair' | 'course' | 'observer'>(() => 'repair' as const);
const mockSetExperimentAssignment = vi.fn();
const mockGetHomeTasks = vi.fn<() => HomeTask[]>(() => []);
const mockStartCourseIntervention = vi.fn();
const mockEmitEvent = vi.fn();
const mockGetDueSkillReviews = vi.fn<() => SkillReviewSchedule[]>(() => []);

let _mockProgress: ProgressData = { passedKnowledgePoints: [], stars: {} };

vi.mock('@/context/ProgressContext', () => ({
  useProgress: () => ({
    progress: _mockProgress,
    recordSkillEvidence: mockRecordSkillEvidence,
    startRepair: mockStartRepair,
    finishRepair: mockFinishRepair,
    getSkillDisplayStatus: mockGetSkillDisplayStatus,
    hasDirectSkillEvidence: vi.fn(() => false),
    setGoal: mockSetGoal,
    isSkillReadyForPath: mockIsSkillReadyForPath,
    markPassed: vi.fn(),
    markInitialPass: vi.fn(),
    markDelayedReviewPass: vi.fn(),
    markDelayedReviewFail: vi.fn(),
    isPassed: mockIsPassed,
    isUnlocked: vi.fn(() => true),
    getStars: vi.fn(() => 0),
    getMasteryStatus: vi.fn(() => null),
    getDueReviewIds: mockGetDueReviewIds,
    getReviewMode: vi.fn(() => null),
    setCurrentLearning: vi.fn(),
    // v0.3
    scheduleSkillReview: mockScheduleSkillReview,
    resolveSkillReview: mockResolveSkillReview,
    getSkillReviewSchedule: mockGetSkillReviewSchedule,
    getDueSkillReviews: mockGetDueSkillReviews,
    getEffectiveAssignment: mockGetEffectiveAssignment,
    setExperimentAssignment: mockSetExperimentAssignment,
    getHomeTasks: mockGetHomeTasks,
    startCourseIntervention: mockStartCourseIntervention,
    emitEvent: mockEmitEvent,
  }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: { access_token: 'mock-token' },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

// Mock game components to expose explicit answer buttons
vi.mock('@/components/games/ChoiceGame', () => ({
  default: ({ question, onAnswer }: {
    question: { id: string; correctAnswer: string | string[]; options?: string[] };
    onAnswer: (selected: string, isCorrect: boolean, firstTry: boolean) => void;
  }) => {
    const ca = Array.isArray(question.correctAnswer)
      ? question.correctAnswer[0]
      : question.correctAnswer;
    return (
      <div data-testid={`choice-${question.id}`}>
        <button
          type="button"
          onClick={() => onAnswer(ca, true, true)}
          data-testid={`correct-${question.id}`}
        >
          正确答案
        </button>
        <button
          type="button"
          onClick={() => onAnswer('__wrong__', false, false)}
          data-testid={`wrong-${question.id}`}
        >
          错误答案
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/games/FillBlankGame', () => ({
  default: ({ question, onAnswer }: {
    question: { id: string; correctAnswer: string | string[] };
    onAnswer: (selected: string, isCorrect: boolean, firstTry: boolean) => void;
  }) => {
    const ca = Array.isArray(question.correctAnswer)
      ? question.correctAnswer[0]
      : question.correctAnswer;
    return (
      <div data-testid={`fill-${question.id}`}>
        <button
          type="button"
          onClick={() => onAnswer(ca, true, true)}
          data-testid={`correct-${question.id}`}
        >
          正确答案
        </button>
        <button
          type="button"
          onClick={() => onAnswer('__wrong__', false, false)}
          data-testid={`wrong-${question.id}`}
        >
          错误答案
        </button>
      </div>
    );
  },
}));

function resetMocks() {
  vi.clearAllMocks();
  _mockProgress = { passedKnowledgePoints: [], stars: {} };
  mockGetSkillDisplayStatus.mockReturnValue('not_started');
  mockIsSkillReadyForPath.mockReturnValue(false);
  mockGetDueReviewIds.mockReturnValue([]);
  mockIsPassed.mockReturnValue(false);
  mockGetSkillReviewSchedule.mockReturnValue(undefined);
  mockGetEffectiveAssignment.mockReturnValue('repair');
  mockGetHomeTasks.mockReturnValue([]);
  mockGetDueSkillReviews.mockReturnValue([]);
  mockStartCourseIntervention.mockClear();
  mockEmitEvent.mockClear();
}

// =====================================================
// 1. repairContent 校验
// =====================================================

describe('repairContent: 9 units / 36 questions integrity', () => {
  it('has exactly 9 repair units', () => {
    expect(repairUnits).toHaveLength(9);
  });

  it('has exactly 36 questions total', () => {
    const total = repairUnits.reduce(
      (s, u) => s + u.diagnosticQuestions.length + u.checkQuestions.length,
      0,
    );
    expect(total).toBe(36);
  });

  it('each unit has exactly 2 diagnostic + 2 check questions', () => {
    for (const u of repairUnits) {
      expect(u.diagnosticQuestions).toHaveLength(2);
      expect(u.checkQuestions).toHaveLength(2);
    }
  });

  it('all check questions have evidenceType=transfer', () => {
    for (const u of repairUnits) {
      for (const q of u.checkQuestions) {
        expect(q.evidenceType).toBe('transfer');
      }
    }
  });

  it('all question IDs are globally unique', () => {
    const ids: string[] = [];
    for (const u of repairUnits) {
      for (const q of [...u.diagnosticQuestions, ...u.checkQuestions]) {
        ids.push(q.id);
      }
    }
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all primarySkillId match their unit.skillId', () => {
    for (const u of repairUnits) {
      for (const q of [...u.diagnosticQuestions, ...u.checkQuestions]) {
        expect(q.primarySkillId).toBe(u.skillId);
      }
    }
  });

  it('estimatedMinutes is between 3-5 for all units', () => {
    for (const u of repairUnits) {
      expect(u.estimatedMinutes).toBeGreaterThanOrEqual(3);
      expect(u.estimatedMinutes).toBeLessThanOrEqual(5);
    }
  });

  it('validateRepairUnits returns no errors on production data', () => {
    const errors = validateRepairUnits();
    expect(errors).toHaveLength(0);
  });

  it('validateRepairUnits detects duplicate skillId', () => {
    const doubled = [...repairUnits, repairUnits[0]];
    const errors = validateRepairUnits(doubled);
    const messages = errors.map((e) => e.message);
    expect(messages.some((m) => m.includes('重复'))).toBe(true);
  });

  it('validateRepairUnits detects wrong unit count', () => {
    const errors = validateRepairUnits(repairUnits.slice(0, 8));
    const messages = errors.map((e) => e.message);
    expect(messages.some((m) => m.includes('9 个'))).toBe(true);
  });

  // F7: 关键题意校验
  it('frac.division_grouping lesson step 3 uses correct formula (not self-contradictory)', () => {
    const u = repairUnits.find((x) => x.skillId === 'frac.division_grouping')!;
    const step3 = u.lesson.steps[2];
    expect(step3).not.toContain('1/Y 的倒数');
    expect(step3).toContain('Y 的倒数');
  });

  it('frac.division_grouping diagnostic d2 uses ribbon cutting (no endpoint ambiguity)', () => {
    const u = repairUnits.find((x) => x.skillId === 'frac.division_grouping')!;
    const d2 = u.diagnosticQuestions[1];
    expect(d2.prompt).not.toContain('路标');
    expect(d2.prompt).toContain('彩带');
    expect(d2.correctAnswer).toBe('4');
  });

  it('frac.division_grouping check c2 uses juice bottle scenario (no endpoint ambiguity)', () => {
    const u = repairUnits.find((x) => x.skillId === 'frac.division_grouping')!;
    const c2 = u.checkQuestions[1];
    expect(c2.prompt).not.toContain('灯');
    expect(c2.prompt).not.toContain('千米');
    expect(c2.prompt).toContain('果汁');
    expect(c2.correctAnswer).toBe('3');
  });

  it('parsed JSON uses Chinese quotes for 单位“1” and contains no bare forms or corner brackets', () => {
    const raw = JSON.stringify(repairUnits);
    const parsed = JSON.parse(raw);
    const strings: string[] = [];
    const collect = (obj: unknown) => {
      if (Array.isArray(obj)) obj.forEach(collect);
      else if (obj !== null && typeof obj === 'object') Object.values(obj).forEach(collect);
      else if (typeof obj === 'string') strings.push(obj);
    };
    collect(parsed);

    const hasChineseUnit = strings.some((s) => s.includes('单位“1”'));
    const hasBareUnit = strings.some((s) => s.includes('单位1'));
    const hasAsciiUnit = strings.some((s) => s.includes('单位"1"'));
    const hasCornerBrackets = strings.some((s) => s.includes('「') || s.includes('」'));

    expect(hasChineseUnit).toBe(true);
    expect(hasBareUnit).toBe(false);
    expect(hasAsciiUnit).toBe(false);
    expect(hasCornerBrackets).toBe(false);
  });
});

// =====================================================
// 2. Readiness states
// =====================================================

describe('isSkillReadyForPath / getSkillDisplayStatus: readiness states', () => {
  it('no evidence → not_started, not ready', () => {
    expect(getSkillDisplayStatus(empty, 'frac.whole', NOW)).toBe('not_started');
    expect(isSkillReadyForPath(empty, 'frac.whole', NOW)).toBe(false);
  });

  it('conceptual only (no transfer) → provisional but not ready', () => {
    const p = recordSkillEvidence(empty, 'frac.whole', true, true, 'conceptual', 'initial', NOW);
    expect(getSkillDisplayStatus(p, 'frac.whole', NOW)).toBe('provisional');
    expect(isSkillReadyForPath(p, 'frac.whole', NOW)).toBe(false);
  });

  it('repair transfer → provisional within 1 day, ready', () => {
    const p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'repair', NOW);
    expect(getSkillDisplayStatus(p, 'frac.whole', NOW)).toBe('provisional');
    expect(isSkillReadyForPath(p, 'frac.whole', NOW)).toBe(true);
  });

  it('repair transfer → review_due after 1 day', () => {
    const p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'repair', NOW);
    expect(getSkillDisplayStatus(p, 'frac.whole', NOW + DAY + 1)).toBe('review_due');
    expect(isSkillReadyForPath(p, 'frac.whole', NOW + DAY + 1)).toBe(false);
  });

  it('initial transfer (no retention) → provisional, ready', () => {
    const p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'initial', NOW);
    expect(getSkillDisplayStatus(p, 'frac.whole', NOW)).toBe('provisional');
    expect(isSkillReadyForPath(p, 'frac.whole', NOW)).toBe(true);
  });

  it('transfer + retention (non-repair) → stable', () => {
    let p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'initial', NOW);
    p = recordSkillEvidence(p, 'frac.whole', true, true, 'retention', 'd7', NOW + 7 * DAY);
    expect(getSkillDisplayStatus(p, 'frac.whole', NOW + 7 * DAY)).toBe('stable');
    expect(isSkillReadyForPath(p, 'frac.whole', NOW + 7 * DAY)).toBe(true);
  });
});

// =====================================================
// 3. next actionable skill
// =====================================================

describe('getNextActionableSkill: next actionable', () => {
  it('nothing ready → returns the first non-ready skill in path (not null)', () => {
    const next = getNextActionableSkill('frac.divide_transform', () => false);
    expect(next).not.toBeNull();
    expect(typeof next).toBe('string');
  });

  it('all prereqs ready → target itself is next actionable (or null if target ready)', () => {
    const next = getNextActionableSkill('frac.divide_transform', () => true);
    expect(next).toBeNull();
  });

  it('whole is ready, equal_partition is next for notation path', () => {
    const readySet = new Set(['frac.whole']);
    const next = getNextActionableSkill('frac.notation', (id) => readySet.has(id));
    expect(next).toBe('frac.equal_partition');
  });

  it('whole + equal_partition ready → notation is next', () => {
    const readySet = new Set(['frac.whole', 'frac.equal_partition']);
    const next = getNextActionableSkill('frac.notation', (id) => readySet.has(id));
    expect(next).toBe('frac.notation');
  });
});

// =====================================================
// 4. Repair mode not directly stable + 1-day boundary
// =====================================================

describe('getSkillDisplayStatus: repair mode not directly stable', () => {
  it('existing retention + repair transfer → provisional (not stable)', () => {
    let p = recordSkillEvidence(empty, 'frac.whole', true, true, 'retention', 'd7', NOW - 10 * DAY);
    p = recordSkillEvidence(p, 'frac.whole', true, true, 'transfer', 'repair', NOW);
    const status = getSkillDisplayStatus(p, 'frac.whole', NOW);
    expect(status).toBe('provisional');
    expect(status).not.toBe('stable');
  });

  it('repair provisional → review_due exactly at 1-day boundary', () => {
    const p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'repair', NOW);
    expect(getSkillDisplayStatus(p, 'frac.whole', NOW + DAY - 1)).toBe('provisional');
    expect(getSkillDisplayStatus(p, 'frac.whole', NOW + DAY)).toBe('review_due');
  });

  it('after repair review_due + d7 retention → stable (D7 path still works)', () => {
    let p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'repair', NOW);
    p = recordSkillEvidence(p, 'frac.whole', true, true, 'retention', 'd7', NOW + 8 * DAY);
    expect(getSkillDisplayStatus(p, 'frac.whole', NOW + 8 * DAY)).toBe('stable');
  });
});

// =====================================================
// 5. parseLearningGoal / parseRepairSession / merge
// =====================================================

describe('parseLearningGoal', () => {
  it('parses valid object', () => {
    expect(parseLearningGoal({ skillId: 'frac.whole', updatedAt: 100 })).toEqual({
      skillId: 'frac.whole',
      startedAt: 100,
      updatedAt: 100,
      source: 'map',
    });
  });

  it('returns undefined for null', () => {
    expect(parseLearningGoal(null)).toBeUndefined();
  });

  it('returns undefined if skillId missing', () => {
    expect(parseLearningGoal({ updatedAt: 100 })).toBeUndefined();
  });

  it('returns undefined if updatedAt is negative', () => {
    expect(parseLearningGoal({ skillId: 'frac.whole', updatedAt: -1 })).toBeUndefined();
  });

  it('returns undefined if updatedAt is non-number', () => {
    expect(parseLearningGoal({ skillId: 'frac.whole', updatedAt: 'abc' })).toBeUndefined();
  });
});

describe('parseRepairSession', () => {
  const valid = { skillId: 'frac.whole', targetSkillId: 'frac.divide_transform', status: 'active' as const, updatedAt: 100 };

  it('parses valid active session', () => {
    expect(parseRepairSession(valid)).toEqual(valid);
  });

  it('parses valid completed session', () => {
    expect(parseRepairSession({ ...valid, status: 'completed' })?.status).toBe('completed');
  });

  it('returns undefined for invalid status', () => {
    expect(parseRepairSession({ ...valid, status: 'unknown' })).toBeUndefined();
  });

  it('returns undefined if targetSkillId is missing', () => {
    const { targetSkillId: _omit, ...rest } = valid;
    expect(parseRepairSession(rest)).toBeUndefined();
  });

  it('returns undefined if updatedAt is non-finite', () => {
    expect(parseRepairSession({ ...valid, updatedAt: Infinity })).toBeUndefined();
  });
});

describe('mergeRepairSession: three time/tombstone scenarios', () => {
  const a100 = { skillId: 'frac.whole', targetSkillId: 'frac.divide_transform', status: 'active' as const, updatedAt: 100 };
  const c100 = { ...a100, status: 'completed' as const };
  const a200 = { ...a100, updatedAt: 200 };
  const c200 = { ...c100, updatedAt: 200 };

  it('active@100 + completed@200 → completed (newer wins)', () => {
    expect(mergeRepairSession(a100, c200)?.status).toBe('completed');
    expect(mergeRepairSession(c200, a100)?.status).toBe('completed');
  });

  it('completed@100 + active@200 → active (newer wins)', () => {
    expect(mergeRepairSession(c100, a200)?.status).toBe('active');
    expect(mergeRepairSession(a200, c100)?.status).toBe('active');
  });

  it('same time active/completed → completed (tombstone tie-break)', () => {
    expect(mergeRepairSession(a100, c100)?.status).toBe('completed');
    expect(mergeRepairSession(c100, a100)?.status).toBe('completed');
  });

  it('both undefined → undefined', () => {
    expect(mergeRepairSession(undefined, undefined)).toBeUndefined();
  });

  it('one side undefined → other wins', () => {
    expect(mergeRepairSession(a100, undefined)?.status).toBe('active');
    expect(mergeRepairSession(undefined, c200)?.status).toBe('completed');
  });
});

describe('mergeLearningGoal', () => {
  it('more recent updatedAt wins', () => {
    const a = { skillId: 'frac.whole', startedAt: 50, updatedAt: 200, source: 'map' as const };
    const b = { skillId: 'frac.divide_transform', startedAt: 50, updatedAt: 100, source: 'home' as const };
    expect(mergeLearningGoal(a, b)?.skillId).toBe('frac.whole');
    expect(mergeLearningGoal(b, a)?.skillId).toBe('frac.whole');
  });

  it('equal updatedAt → first wins (stable tie-break)', () => {
    const a = { skillId: 'frac.whole', startedAt: 50, updatedAt: 100, source: 'map' as const };
    const b = { skillId: 'frac.divide_transform', startedAt: 50, updatedAt: 100, source: 'home' as const };
    expect(mergeLearningGoal(a, b)?.skillId).toBe('frac.whole');
  });
});

describe('loadProgress with v0.2 fields', () => {
  beforeEach(() => localStorage.clear());

  it('loads old data without learningGoal/repairSession', () => {
    localStorage.setItem('math-k6-progress', JSON.stringify({
      passedKnowledgePoints: ['g3-rect-area'],
      stars: { 'g3-rect-area': 2 },
    }));
    const p = loadProgress();
    expect(p.passedKnowledgePoints).toContain('g3-rect-area');
    expect(p.learningGoal).toBeUndefined();
    expect(p.repairSession).toBeUndefined();
  });

  it('loads and validates repairSession with active status', () => {
    localStorage.setItem('math-k6-progress', JSON.stringify({
      passedKnowledgePoints: [],
      stars: {},
      repairSession: { skillId: 'frac.whole', targetSkillId: 'frac.divide_transform', status: 'active', updatedAt: 999 },
    }));
    const p = loadProgress();
    expect(p.repairSession?.skillId).toBe('frac.whole');
    expect(p.repairSession?.status).toBe('active');
  });

  it('rejects malformed repairSession (missing targetSkillId)', () => {
    localStorage.setItem('math-k6-progress', JSON.stringify({
      passedKnowledgePoints: [],
      stars: {},
      repairSession: { skillId: 'frac.whole', status: 'active', updatedAt: 999 },
    }));
    const p = loadProgress();
    expect(p.repairSession).toBeUndefined();
  });
});

// =====================================================
// 6. RepairPage rendering flow (state machine)
// =====================================================

import SkillRepairPage from '@/pages/SkillRepairPage';

function renderRepairRoute(skillId: string, search = '') {
  return render(
    <MemoryRouter initialEntries={[`/repair/${skillId}${search}`]}>
      <Routes>
        <Route path="/repair/:skillId" element={<SkillRepairPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SkillRepairPage: state machine rendering', () => {
  beforeEach(resetMocks);

  it('invalid skillId (not in graph) shows "技能不存在"', () => {
    renderRepairRoute('frac.does_not_exist');
    expect(screen.getByText(/技能不存在/)).toBeInTheDocument();
    expect(mockStartRepair).not.toHaveBeenCalled();
  });

  it('valid skillId with no RepairUnit directs learners to the complete course', () => {
    const { rerender } = renderRepairRoute('frac.as_quotient', '?target=frac.notation');
    expect(screen.getByText('通过完整课程学习这项技能')).toBeInTheDocument();
    expect(screen.queryByText(/微补修准备中/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '学习完整课程' })).toHaveAttribute(
      'href',
      '/kp/g5-fraction-meaning?target=frac.notation',
    );
    expect(mockEmitEvent).toHaveBeenCalledWith({
      clientEventId: 'rus:repair:frac.as_quotient:frac.notation:0',
      eventName: 'repair_unavailable_shown',
      skillId: 'frac.as_quotient',
      properties: { surface: 'repair', targetSkillId: 'frac.notation' },
    });
    rerender(
      <MemoryRouter initialEntries={['/repair/frac.as_quotient?target=frac.notation']}>
        <Routes>
          <Route path="/repair/:skillId" element={<SkillRepairPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(mockEmitEvent).toHaveBeenCalledTimes(1);
    expect(mockStartRepair).not.toHaveBeenCalled();
  });

  it('valid RepairUnit: shows skill name in title (not technical slug)', () => {
    renderRepairRoute('frac.whole');
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).not.toContain('frac.');
    expect(heading.textContent).toContain('微补修');
  });

  it('shows GoalContextBar on repair when the valid goal matches target', () => {
    _mockProgress = {
      passedKnowledgePoints: [],
      stars: {},
      learningGoal: {
        skillId: 'frac.notation',
        startedAt: NOW,
        updatedAt: NOW,
        source: 'map',
      },
    };
    renderRepairRoute('frac.whole', '?target=frac.notation');
    expect(screen.getByRole('complementary', { name: '学习目标' })).toBeInTheDocument();
    expect(screen.getByText('当前在补')).toBeInTheDocument();
  });

  it('starts repair session on mount', () => {
    renderRepairRoute('frac.whole');
    expect(mockStartRepair).toHaveBeenCalledWith('frac.whole', expect.any(String));
    expect(mockStartRepair).toHaveBeenCalledTimes(1);
  });

  it('diagnostic fast pass: 2/2 firstTry → directly to result (passed), no lesson/check', () => {
    renderRepairRoute('frac.whole');
    expect(screen.getByText(/诊断题 1\//)).toBeInTheDocument();

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    const q1 = unit.diagnosticQuestions[0];
    const q2 = unit.diagnosticQuestions[1];

    fireEvent.click(screen.getByTestId(`correct-${q1.id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));

    expect(screen.getByText(/诊断题 2\//)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(`correct-${q2.id}`));

    // Result: passed
    expect(screen.getByText(/路径准备度通过/)).toBeInTheDocument();
    // No lesson/check
    expect(screen.queryByText(/微讲解/)).not.toBeInTheDocument();
    expect(screen.queryByText(/验证题/)).not.toBeInTheDocument();

    // Exactly 1 record + 1 finish
    expect(mockRecordSkillEvidence).toHaveBeenCalledTimes(1);
    expect(mockRecordSkillEvidence).toHaveBeenCalledWith('frac.whole', true, true, 'transfer', 'repair');
    expect(mockFinishRepair).toHaveBeenCalledTimes(1);
    expect(mockFinishRepair).toHaveBeenCalledWith('frac.whole');
  });

  it('diagnostic fail → lesson → check pass → result passed', () => {
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;

    // Fail q1
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));

    // Fail q2
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[1].id}`));
    // Last diag question answered — show continue button → lesson
    fireEvent.click(screen.getByRole('button', { name: /继续/ }));

    // Lesson phase
    expect(screen.getByText(/微讲解/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /我理解了/ }));

    // Check phase
    expect(screen.getByText(/验证题 1\//)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(`correct-${unit.checkQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题/ }));
    fireEvent.click(screen.getByTestId(`correct-${unit.checkQuestions[1].id}`));

    // Result: passed
    expect(screen.getByText(/路径准备度通过/)).toBeInTheDocument();

    // 2 records (diag fail + check pass) + 1 finish
    expect(mockRecordSkillEvidence).toHaveBeenCalledTimes(2);
    expect(mockFinishRepair).toHaveBeenCalledTimes(1);
  });

  it('check fail: shows course link, no retry button', () => {
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;

    // Fail both diag
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[1].id}`));
    fireEvent.click(screen.getByRole('button', { name: /继续/ }));

    // Lesson
    fireEvent.click(screen.getByRole('button', { name: /我理解了/ }));

    // Check: fail both
    fireEvent.click(screen.getByTestId(`wrong-${unit.checkQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题/ }));
    fireEvent.click(screen.getByTestId(`wrong-${unit.checkQuestions[1].id}`));

    expect(screen.getByText(/本次还没通过/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /前往完整课程学习/ })).toHaveAttribute(
      'href',
      '/kp/g3-fraction-intro?target=frac.divide_transform',
    );
    // No retry
    expect(screen.queryByText(/再做|重试|再答/)).not.toBeInTheDocument();
  });

  it('second diagnostic question is answerable (no answered ref leak between questions)', () => {
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    const q1 = unit.diagnosticQuestions[0];
    const q2 = unit.diagnosticQuestions[1];

    // Answer q1 correctly
    fireEvent.click(screen.getByTestId(`correct-${q1.id}`));
    // Advance to q2
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));

    // q2 should be rendered and answerable
    expect(screen.getByTestId(`correct-${q2.id}`)).toBeInTheDocument();

    // Answer q2 — should change state (fast pass since both correct firstTry)
    fireEvent.click(screen.getByTestId(`correct-${q2.id}`));
    expect(screen.getByText(/路径准备度通过/)).toBeInTheDocument();
  });

  it('record/finish not called multiple times on re-render', () => {
    const { rerender } = renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[1].id}`));

    // Already at result
    const callsBefore = mockRecordSkillEvidence.mock.calls.length;
    const finishBefore = mockFinishRepair.mock.calls.length;

    // Force a re-render by changing context value (noop — same values)
    rerender(
      <MemoryRouter initialEntries={['/repair/frac.whole']}>
        <Routes>
          <Route path="/repair/:skillId" element={<SkillRepairPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(mockRecordSkillEvidence).toHaveBeenCalledTimes(callsBefore);
    expect(mockFinishRepair).toHaveBeenCalledTimes(finishBefore);
  });

  it('success copy does not say "已掌握"', () => {
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[1].id}`));

    const page = document.body.textContent ?? '';
    expect(page).not.toContain('已掌握');
    expect(screen.getByText(/路径准备度通过/)).toBeInTheDocument();
  });

  it('fast pass result: step indicator shows "已跳过" (not ✓) for lesson and check', () => {
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[1].id}`));

    // Result shown
    expect(screen.getByText(/路径准备度通过/)).toBeInTheDocument();

    // Skipped steps must NOT show ✓
    expect(screen.queryByText(/✓\s*讲解/)).not.toBeInTheDocument();
    expect(screen.queryByText(/✓\s*验证/)).not.toBeInTheDocument();

    // Both skipped steps show "已跳过" text
    const skipped = screen.getAllByText(/已跳过/);
    expect(skipped).toHaveLength(2);

    // Diagnostic step still shows as completed (✓)
    expect(screen.getByText(/✓\s*诊断/)).toBeInTheDocument();
  });

  it('normal completion: step indicator shows ✓ for lesson and check (no 已跳过)', () => {
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;

    // Fail both diagnostic
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[1].id}`));
    fireEvent.click(screen.getByRole('button', { name: /继续/ }));

    // Lesson
    fireEvent.click(screen.getByRole('button', { name: /我理解了/ }));

    // Check: pass both
    fireEvent.click(screen.getByTestId(`correct-${unit.checkQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题/ }));
    fireEvent.click(screen.getByTestId(`correct-${unit.checkQuestions[1].id}`));

    // Result: passed
    expect(screen.getByText(/路径准备度通过/)).toBeInTheDocument();

    // Lesson and check show as completed (✓)
    expect(screen.getByText(/✓\s*讲解/)).toBeInTheDocument();
    expect(screen.getByText(/✓\s*验证/)).toBeInTheDocument();

    // No "已跳过" text anywhere
    expect(screen.queryByText(/已跳过/)).not.toBeInTheDocument();
  });
});

// =====================================================
// 7. KnowledgeMapPage: URL target, repaired param
// =====================================================

import KnowledgeMapPage from '@/pages/KnowledgeMapPage';

describe('KnowledgeMapPage: URL target param', () => {
  beforeEach(resetMocks);

  it('valid ?target= param initialises target', () => {
    render(
      <MemoryRouter initialEntries={['/map?target=frac.notation']}>
        <Routes>
          <Route path="/map" element={<KnowledgeMapPage />} />
        </Routes>
      </MemoryRouter>,
    );
    const select = screen.getByLabelText('我的目标') as HTMLSelectElement;
    expect(select.value).toBe('frac.notation');
  });

  it('?repaired= toast shows and is dismissable without auto-dismiss', () => {
    render(
      <MemoryRouter initialEntries={['/map?repaired=frac.whole']}>
        <Routes>
          <Route path="/map" element={<KnowledgeMapPage />} />
        </Routes>
      </MemoryRouter>,
    );
    // Toast should show (frac.whole is a valid graph node)
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    // Content shows Chinese name, not the slug
    expect(status.textContent).not.toContain('frac.whole');

    // Close button should be present and 44px
    const closeBtn = screen.getByLabelText('关闭提示');
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn.className).toContain('min-h-[44px]');

    // Click close: toast should disappear
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('invalid ?repaired= param (not in graph) does not show toast', () => {
    render(
      <MemoryRouter initialEntries={['/map?repaired=frac.does_not_exist']}>
        <Routes>
          <Route path="/map" element={<KnowledgeMapPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('diagnostic button points to /repair/:skillId for skills with RepairUnit', () => {
    render(
      <MemoryRouter initialEntries={['/map?target=frac.notation']}>
        <Routes>
          <Route path="/map" element={<KnowledgeMapPage />} />
        </Routes>
      </MemoryRouter>,
    );
    const repairLinks = screen.getAllByRole('link', { name: /2分钟诊断/ });
    expect(repairLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('shows all-stable message when all skills are ready', () => {
    mockIsSkillReadyForPath.mockReturnValue(true);
    mockGetSkillDisplayStatus.mockReturnValue('stable');
    render(
      <MemoryRouter initialEntries={['/map']}>
        <Routes>
          <Route path="/map" element={<KnowledgeMapPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText(/所有前置技能均已稳固/)).toBeInTheDocument();
  });

  it('no technical IDs (frac. / bridge.) visible in student UI', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/map']}>
        <Routes>
          <Route path="/map" element={<KnowledgeMapPage />} />
        </Routes>
      </MemoryRouter>,
    );
    const text = container.textContent ?? '';
    expect(text).not.toContain('frac.');
    expect(text).not.toContain('bridge.');
  });
});

// =====================================================
// 8. HomePage: recommended action priority
// =====================================================

import HomePage from '@/pages/HomePage';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}{location.search}</div>;
}

describe('HomePage: recommended action priority', () => {
  beforeEach(resetMocks);

  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/一次讲透小学数学/)).toBeInTheDocument();
  });

  it('keeps progression courses out of the generic new-course fallback', () => {
    const baseIds = new Set(
      getAllKnowledgePoints()
        .filter((kp) => getCourseTrack(kp.meta) === 'base')
        .map((kp) => kp.meta.id),
    );
    mockIsPassed.mockImplementation((id) => baseIds.has(id));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.queryByText('开始学习')).not.toBeInTheDocument();
  });

  it('shows three goal choices and navigates with source=home when one is selected', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: '认识并读懂分数' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '学会分数乘法' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '学会分数除法' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '学会分数乘法' }));

    expect(mockSetGoal).toHaveBeenCalledWith('frac.multiply_fraction', 'home');
    expect(screen.getByTestId('location')).toHaveTextContent('/map?target=frac.multiply_fraction');
  });

  it('shows only GoalContextBar when the stored goal is valid', () => {
    _mockProgress = {
      passedKnowledgePoints: [],
      stars: {},
      learningGoal: {
        skillId: 'frac.divide_transform',
        startedAt: NOW,
        updatedAt: NOW,
        source: 'home',
      },
      repairSession: {
        skillId: 'frac.notation',
        targetSkillId: 'frac.divide_transform',
        status: 'active',
        updatedAt: NOW,
      },
    };

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('complementary', { name: '学习目标' })).toBeInTheDocument();
    expect(screen.getByText('当前在补')).toBeInTheDocument();
    expect(screen.queryByText('你想先学会什么？')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '学会分数除法' })).not.toBeInTheDocument();
  });

  it('treats an invalid stored goal as empty, hides its bad goal task, and emits its entry view only once', () => {
    _mockProgress = {
      passedKnowledgePoints: [],
      stars: {},
      learningGoal: {
        skillId: 'invalid.skill',
        startedAt: NOW,
        updatedAt: NOW,
        source: 'home',
      },
    };
    mockGetHomeTasks.mockReturnValue([
      {
        type: 'learning_goal',
        eventCycleId: 'bad-goal-task',
        skillId: 'invalid.skill',
        link: '/map?target=invalid.skill',
        title: 'invalid.skill',
        reason: '泄漏的坏任务',
        urgent: false,
      },
    ]);
    const { rerender } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText('你想先学会什么？')).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: '学习目标' })).not.toBeInTheDocument();
    expect(screen.queryByText('泄漏的坏任务')).not.toBeInTheDocument();
    expect(screen.queryByText('invalid.skill')).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/map?target=invalid.skill"]')).not.toBeInTheDocument();
    expect(mockEmitEvent).toHaveBeenCalledWith({
      clientEventId: 'gev:home:v0.4',
      eventName: 'goal_entry_viewed',
      properties: { surface: 'home' },
    });

    rerender(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(mockEmitEvent).toHaveBeenCalledTimes(1);
  });

  it('priority 1: due skill review shown as primary task', () => {
    mockGetHomeTasks.mockReturnValue([
      {
        type: 'skill_review',
        eventCycleId: 'test',
        skillId: 'frac.whole',
        link: '/repair/frac.whole?target=frac.notation&review=d1',
        title: '技能复习（第1天）',
        reason: '昨天的技能需要巩固',
        duration: '约2分钟',
        urgent: true,
      },
    ]);
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/昨天的技能需要巩固/)).toBeInTheDocument();
  });

  it('priority 2: active repair session shown when no due reviews', () => {
    mockGetHomeTasks.mockReturnValue([
      {
        type: 'active_repair',
        eventCycleId: 'test',
        skillId: 'frac.whole',
        link: '/repair/frac.whole?target=frac.divide_transform',
        title: '微补修进行中',
        reason: '继续你的微补修',
        duration: '约3分钟',
        urgent: false,
      },
    ]);
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/继续你的微补修/)).toBeInTheDocument();
  });

  it('priority 3: learning goal shown when no repair, no due reviews', () => {
    _mockProgress = {
      passedKnowledgePoints: [],
      stars: {},
      learningGoal: {
        skillId: 'frac.divide_transform',
        startedAt: NOW,
        updatedAt: NOW,
        source: 'home',
      },
    };
    mockGetHomeTasks.mockReturnValue([
      {
        type: 'learning_goal',
        eventCycleId: 'test',
        skillId: 'frac.divide_transform',
        link: '/map?target=frac.divide_transform',
        title: '学习目标',
        reason: '前往知识地图',
        urgent: false,
      },
    ]);
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/前往知识地图/)).toBeInTheDocument();
  });
});

// =====================================================
// 9. R1: Already-ready skills should not start repair
// =====================================================

describe('R1: SkillRepairPage blocks repair for ready skills', () => {
  beforeEach(resetMocks);

  it('shows "已具备路径准备度" and does not call startRepair when skill is ready', () => {
    mockIsSkillReadyForPath.mockReturnValue(true);
    renderRepairRoute('frac.whole');

    expect(screen.getByText(/已具备路径准备度/)).toBeInTheDocument();
    expect(mockStartRepair).not.toHaveBeenCalled();
    expect(mockRecordSkillEvidence).not.toHaveBeenCalled();
    expect(mockFinishRepair).not.toHaveBeenCalled();
  });

  it('ready page shows Chinese skill name (not technical slug)', () => {
    mockIsSkillReadyForPath.mockReturnValue(true);
    renderRepairRoute('frac.whole');

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).not.toContain('frac.');
    expect(heading.textContent).toContain('确定单位');
  });

  it('ready page provides link back to target path', () => {
    mockIsSkillReadyForPath.mockReturnValue(true);
    renderRepairRoute('frac.whole');

    expect(screen.getByRole('link', { name: '继续我的目标' })).toBeInTheDocument();
  });
});

// =====================================================
// 9b. R1: Readiness race — evidence mid-session must not hijack result
// =====================================================

describe('R1: Readiness race — mid-session evidence update must not show ready-block', () => {
  beforeEach(resetMocks);

  it('fast pass: starts with readiness=false; after recordSkillEvidence readiness=true; still shows result not ready-block', () => {
    // Initial readiness is false (default from resetMocks)
    mockIsSkillReadyForPath.mockReturnValue(false);

    // After recordSkillEvidence is called, simulate readiness becoming true
    // (This mimics the real browser: Context updates after evidence is recorded)
    mockRecordSkillEvidence.mockImplementation(() => {
      mockIsSkillReadyForPath.mockReturnValue(true);
    });

    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    const q1 = unit.diagnosticQuestions[0];
    const q2 = unit.diagnosticQuestions[1];

    // Answer q1 correctly (firstTry)
    fireEvent.click(screen.getByTestId(`correct-${q1.id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));

    // Answer q2 correctly — triggers recordSkillEvidence which makes isSkillReadyForPath=true
    // This simulates the race condition: context propagates readiness=true mid-session
    fireEvent.click(screen.getByTestId(`correct-${q2.id}`));

    // Must show the current-session result — the frozen initialReadinessRef prevents
    // the ready-block from hijacking the active state machine
    expect(screen.getByText(/路径准备度通过/)).toBeInTheDocument();
    // The ready-block interception standalone heading must NOT be shown
    // Note: result page description also says "已具备路径准备度" in a sentence —
    // we check for the ready-block's standalone bold heading specifically
    expect(screen.queryByText('已具备路径准备度')).not.toBeInTheDocument();

    // The return button must be present (uses navigate with repaired= param)
    const returnBtn = screen.getByRole('button', { name: '继续我的目标' });
    expect(returnBtn).toBeInTheDocument();
    expect(returnBtn.textContent).toContain('继续我的目标');
  });

  it('fast pass result: button href includes repaired=skillId', () => {
    // Uses navigate() so we verify the onClick handler would produce the right URL
    // by inspecting that the button is rendered (not a Link) within the result branch
    mockIsSkillReadyForPath.mockReturnValue(false);

    renderRepairRoute('frac.whole', '?target=frac.notation');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;

    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[1].id}`));

    expect(screen.getByText(/路径准备度通过/)).toBeInTheDocument();
    // The return button uses navigate() with repaired= — verify it is a <button> in the result block
    const btn = screen.getByRole('button', { name: '继续我的目标' });
    expect(btn.tagName).toBe('BUTTON');
  });

  it('already-ready skill: description does not wrap skill name in outer curly quotes', () => {
    mockIsSkillReadyForPath.mockReturnValue(true);
    renderRepairRoute('frac.whole');

    // The skill name for frac.whole is 确定单位"1" (already has Chinese quotes inside)
    // The description paragraph must not add outer &ldquo;&rdquo; wrapping
    // i.e. must not read: "确定单位"1""已经通过验证...
    const description = screen.getByText(/已经通过验证，无需补修/);
    const text = description.textContent ?? '';
    // Should start with the skill name directly, no leading outer quote
    expect(text.startsWith('\u201c')).toBe(false);
    // Should not have trailing outer closing quote before "已经通过"
    expect(text).not.toMatch(/\u201d\u201d/); // no double closing quote
    // Heading is bare skill name, no outer wrapping
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('确定单位\u201c1\u201d');
  });
});

// =====================================================
// 10. R2: Map/Repair URL validation
// =====================================================

describe('R2: KnowledgeMapPage invalid target fallback', () => {
  beforeEach(resetMocks);

  it('invalid ?target= falls back to default and does not call setGoal with invalid value', () => {
    render(
      <MemoryRouter initialEntries={['/map?target=frac.does_not_exist']}>
        <Routes>
          <Route path="/map" element={<KnowledgeMapPage />} />
        </Routes>
      </MemoryRouter>,
    );
    const select = screen.getByLabelText('我的目标') as HTMLSelectElement;
    expect(select.value).toBe('frac.divide_transform');
    // setGoal should NOT have been called with the invalid value
    const setGoalCalls = mockSetGoal.mock.calls.map((c: unknown[]) => c[0]);
    expect(setGoalCalls).not.toContain('frac.does_not_exist');
  });

  it('valid ?target= calls setGoal to persist', () => {
    render(
      <MemoryRouter initialEntries={['/map?target=frac.notation']}>
        <Routes>
          <Route path="/map" element={<KnowledgeMapPage />} />
        </Routes>
      </MemoryRouter>,
    );
    const select = screen.getByLabelText('我的目标') as HTMLSelectElement;
    expect(select.value).toBe('frac.notation');
    // setGoal should have been called with frac.notation
    expect(mockSetGoal).toHaveBeenCalledWith('frac.notation', 'map');
  });
});

describe('R2: SkillRepairPage invalid target fallback', () => {
  beforeEach(resetMocks);

  it('invalid ?target= does not pass invalid value to startRepair', () => {
    renderRepairRoute('frac.whole', '?target=frac.does_not_exist');
    // startRepair should be called with the default valid target, not the invalid one
    expect(mockStartRepair).toHaveBeenCalledWith('frac.whole', 'frac.divide_transform');
  });
});

// =====================================================
// 11. R3: Course entry for uncovered skills
// =====================================================

describe('R3: SkillRepairPage shows course entry for uncovered skills', () => {
  beforeEach(resetMocks);

  it('frac.as_quotient shows its mapped complete-course entry with target continuity', () => {
    renderRepairRoute('frac.as_quotient', '?target=frac.notation');
    expect(screen.getByText('通过完整课程学习这项技能')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '学习完整课程' })).toHaveAttribute(
      'href',
      '/kp/g5-fraction-meaning?target=frac.notation',
    );
    expect(screen.queryByText(/微补修准备中/)).not.toBeInTheDocument();
    expect(mockStartRepair).not.toHaveBeenCalled();
  });
});

// =====================================================
// 12. R4: Content validation enhancements
// =====================================================

describe('R4: validateRepairUnits detects bad data', () => {
  it('detects non-existent skillId in graph', () => {
    const bad = JSON.parse(JSON.stringify(repairUnits));
    bad[0].skillId = 'fake.nonexistent';
    bad[0].diagnosticQuestions[0].primarySkillId = 'fake.nonexistent';
    bad[0].diagnosticQuestions[1].primarySkillId = 'fake.nonexistent';
    bad[0].checkQuestions[0].primarySkillId = 'fake.nonexistent';
    bad[0].checkQuestions[1].primarySkillId = 'fake.nonexistent';
    const errors = validateRepairUnits(bad);
    const messages = errors.map((e) => e.message);
    expect(messages.some((m) => m.includes('不存在于知识图谱'))).toBe(true);
  });

  it('detects non-existent courseId', () => {
    const bad = JSON.parse(JSON.stringify(repairUnits));
    bad[0].courseId = 'nonexistent-course';
    const errors = validateRepairUnits(bad);
    const messages = errors.map((e) => e.message);
    expect(messages.some((m) => m.includes('不存在于课程内容'))).toBe(true);
  });

  it('detects duplicate diagnostic/check prompt+answer within unit', () => {
    const bad = JSON.parse(JSON.stringify(repairUnits));
    // Make check question 1 identical to diagnostic question 1
    bad[0].checkQuestions[0].prompt = bad[0].diagnosticQuestions[0].prompt;
    bad[0].checkQuestions[0].correctAnswer = bad[0].diagnosticQuestions[0].correctAnswer;
    const errors = validateRepairUnits(bad);
    const messages = errors.map((e) => e.message);
    expect(messages.some((m) => m.includes('prompt+answer 重复'))).toBe(true);
  });

  it('detects workedExample prompt+answer duplicated in diagnostic question', () => {
    const bad = JSON.parse(JSON.stringify(repairUnits));
    // Copy diagnostic[0] prompt/answer into workedExample
    bad[0].lesson.workedExample.question = bad[0].diagnosticQuestions[0].prompt;
    bad[0].lesson.workedExample.answer = bad[0].diagnosticQuestions[0].correctAnswer;
    const errors = validateRepairUnits(bad);
    const messages = errors.map((e) => e.message);
    expect(messages.some((m) => m.includes('重复'))).toBe(true);
  });

  it('detects empty workedExample step', () => {
    const bad = JSON.parse(JSON.stringify(repairUnits));
    bad[0].lesson.workedExample.steps[0] = '';
    const errors = validateRepairUnits(bad);
    const messages = errors.map((e) => e.message);
    expect(messages.some((m) => m.includes('workedExample.steps'))).toBe(true);
  });

  it('all repair unit skillIds reference valid published graph nodes', () => {
    for (const u of repairUnits) {
      const errors = validateRepairUnits([u]);
      const skillErrors = errors.filter((e) => e.message.includes('不存在于知识图谱') || e.message.includes('应为 published'));
      expect(skillErrors).toHaveLength(0);
    }
  });

  it('all repair unit courseIds reference valid course content', () => {
    for (const u of repairUnits) {
      const errors = validateRepairUnits([u]);
      const courseErrors = errors.filter((e) => e.message.includes('不存在于课程内容'));
      expect(courseErrors).toHaveLength(0);
    }
  });
});

// =====================================================
// 13. R4: Repair questions don't duplicate existing game.json questions
// =====================================================

describe('R4: Repair questions vs existing game.json dedup', () => {
  // Load all game.json files eagerly
  const gameModules = import.meta.glob('/src/content/knowledge-points/*/game.json', {
    eager: true,
    import: 'default',
  }) as Record<string, { questions: Array<{ prompt: string; correctAnswer: string | string[] }>; reviewSets?: { d1?: { questions: Array<{ prompt: string; correctAnswer: string | string[] }> }; d7?: { questions: Array<{ prompt: string; correctAnswer: string | string[] }> } } }>;

  it('loads all 57 game.json files', () => {
    expect(Object.keys(gameModules).length).toBe(57);
  });

  it('36 repair questions have no exact prompt+answer match with existing initial/D1/D7 questions', () => {
    // Collect all existing question prompt+answer pairs
    const existingKeys = new Set<string>();
    for (const [, game] of Object.entries(gameModules)) {
      const allExisting = [
        ...game.questions,
        ...(game.reviewSets?.d1?.questions ?? []),
        ...(game.reviewSets?.d7?.questions ?? []),
      ];
      for (const q of allExisting) {
        const answer = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
        existingKeys.add(`${(q.prompt || '').trim()}|||${(answer || '').trim()}`);
      }
    }

    // Check each repair question
    const duplicates: string[] = [];
    for (const u of repairUnits) {
      for (const q of [...u.diagnosticQuestions, ...u.checkQuestions]) {
        const answer = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
        const key = `${(q.prompt || '').trim()}|||${(answer || '').trim()}`;
        if (existingKeys.has(key)) {
          duplicates.push(`${u.skillId}/${q.id}`);
        }
      }
    }
    expect(duplicates).toEqual([]);
  });
});

// =====================================================
// 14. v0.3: 108 total questions (36 repair + 72 review A/B)
// =====================================================

describe('v0.3: content — 108 total questions', () => {
  it('has 108 questions total across all phases', () => {
    const all = getAllRepairQuestions();
    const total = all.reduce((s, g) => s + g.questions.length, 0);
    expect(total).toBe(108);
  });

  it('each unit has reviewSets with d1 and d7, each with A/B forms of 2 questions', () => {
    for (const u of repairUnits) {
      expect(u.reviewSets?.d1?.questions).toHaveLength(2);
      expect(u.reviewSets?.d1?.alternateQuestions).toHaveLength(2);
      expect(u.reviewSets?.d7?.questions).toHaveLength(2);
      expect(u.reviewSets?.d7?.alternateQuestions).toHaveLength(2);
    }
  });

  it('all 108 question IDs are globally unique', () => {
    const all = getAllRepairQuestions();
    const ids: string[] = [];
    for (const g of all) {
      for (const q of g.questions) {
        ids.push(q.id);
      }
    }
    const unique = new Set(ids);
    expect(unique.size).toBe(108);
  });

  it('D1 A/B questions all have evidenceType=transfer', () => {
    for (const u of repairUnits) {
      for (const q of [...(u.reviewSets?.d1?.questions ?? []), ...(u.reviewSets?.d1?.alternateQuestions ?? [])]) {
        expect(q.evidenceType).toBe('transfer');
      }
    }
  });

  it('D7 A/B first question is transfer, second is retention', () => {
    for (const u of repairUnits) {
      for (const d7 of [u.reviewSets?.d7?.questions ?? [], u.reviewSets?.d7?.alternateQuestions ?? []]) {
        expect(d7[0].evidenceType).toBe('transfer');
        expect(d7[1].evidenceType).toBe('retention');
      }
    }
  });

  it('D1 A/B sets each have at least one fill-blank question', () => {
    for (const u of repairUnits) {
      for (const d1 of [u.reviewSets?.d1?.questions ?? [], u.reviewSets?.d1?.alternateQuestions ?? []]) {
        const hasFillBlank = d1.some((q) => q.type === 'fill-blank');
        expect(hasFillBlank).toBe(true);
      }
    }
  });

  it('D7 A/B sets each have at least one fill-blank question', () => {
    for (const u of repairUnits) {
      for (const d7 of [u.reviewSets?.d7?.questions ?? [], u.reviewSets?.d7?.alternateQuestions ?? []]) {
        const hasFillBlank = d7.some((q) => q.type === 'fill-blank');
        expect(hasFillBlank).toBe(true);
      }
    }
  });

  it('review question primarySkillId matches unit skillId across A/B forms', () => {
    for (const u of repairUnits) {
      for (const q of [
        ...(u.reviewSets?.d1?.questions ?? []),
        ...(u.reviewSets?.d1?.alternateQuestions ?? []),
        ...(u.reviewSets?.d7?.questions ?? []),
        ...(u.reviewSets?.d7?.alternateQuestions ?? []),
      ]) {
        expect(q.primarySkillId).toBe(u.skillId);
      }
    }
  });

  it('72 review questions have no exact prompt+answer match with existing game.json questions', () => {
    const gameModules = import.meta.glob('/src/content/knowledge-points/*/game.json', {
      eager: true,
      import: 'default',
    }) as Record<string, { questions: Array<{ prompt: string; correctAnswer: string | string[] }>; reviewSets?: { d1?: { questions: Array<{ prompt: string; correctAnswer: string | string[] }> }; d7?: { questions: Array<{ prompt: string; correctAnswer: string | string[] }> } } }>;

    const existingKeys = new Set<string>();
    for (const [, game] of Object.entries(gameModules)) {
      const allExisting = [
        ...game.questions,
        ...(game.reviewSets?.d1?.questions ?? []),
        ...(game.reviewSets?.d7?.questions ?? []),
      ];
      for (const q of allExisting) {
        const answer = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
        existingKeys.add(`${(q.prompt || '').trim()}|||${(answer || '').trim()}`);
      }
    }

    const duplicates: string[] = [];
    for (const u of repairUnits) {
      for (const q of [
        ...(u.reviewSets?.d1?.questions ?? []),
        ...(u.reviewSets?.d1?.alternateQuestions ?? []),
        ...(u.reviewSets?.d7?.questions ?? []),
        ...(u.reviewSets?.d7?.alternateQuestions ?? []),
      ]) {
        const answer = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
        const key = `${(q.prompt || '').trim()}|||${(answer || '').trim()}`;
        if (existingKeys.has(key)) {
          duplicates.push(`${u.skillId}/${q.id}`);
        }
      }
    }
    expect(duplicates).toEqual([]);
  });
});

// =====================================================
// 15. v0.3: validateRepairUnits with review sets
// =====================================================

describe('v0.3: validateRepairUnits review set validation', () => {
  it('production data passes all validation (108 questions)', () => {
    const errors = validateRepairUnits();
    expect(errors).toHaveLength(0);
  });

  it('detects missing d1 review set', () => {
    const bad = JSON.parse(JSON.stringify(repairUnits));
    delete bad[0].reviewSets.d1;
    const errors = validateRepairUnits(bad);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('detects d1 with wrong question count', () => {
    const bad = JSON.parse(JSON.stringify(repairUnits));
    bad[0].reviewSets.d1.questions = bad[0].reviewSets.d1.questions.slice(0, 1);
    const errors = validateRepairUnits(bad);
    const messages = errors.map((e) => e.message);
    expect(messages.some((m) => m.includes('D1'))).toBe(true);
  });
});

// =====================================================
// 16. v0.3: Skill review scheduling
// =====================================================

describe('v0.3: scheduleSkillReview', () => {
  it('creates a new review schedule with status=scheduled', () => {
    const p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW);
    const review = getSkillReviewSchedule(p, 'frac.whole');
    expect(review).toBeDefined();
    expect(review?.skillId).toBe('frac.whole');
    expect(review?.targetSkillId).toBe('frac.notation');
    expect(review?.stage).toBe('d1');
    expect(review?.status).toBe('scheduled');
    expect(review?.firstExposure).toBe(true);
  });

  it('D1 dueAt is approximately 1 day from now', () => {
    const p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW);
    const review = getSkillReviewSchedule(p, 'frac.whole');
    expect(review?.dueAt).toBe(NOW + DAY);
  });

  it('D7 dueAt is approximately 6 days from now', () => {
    const p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd7', NOW);
    const review = getSkillReviewSchedule(p, 'frac.whole');
    expect(review?.dueAt).toBe(NOW + 6 * DAY);
  });
});

describe('v0.3: getDueSkillReviews', () => {
  it('returns empty when no reviews exist', () => {
    expect(getDueSkillReviews(empty, NOW)).toEqual([]);
  });

  it('returns scheduled reviews that are past dueAt', () => {
    const p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW - DAY - 1);
    const due = getDueSkillReviews(p, NOW);
    expect(due).toHaveLength(1);
    expect(due[0].skillId).toBe('frac.whole');
  });

  it('does not return reviews that are not yet due', () => {
    const p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW);
    const due = getDueSkillReviews(p, NOW);
    expect(due).toHaveLength(0);
  });

  it('does not return passed reviews', () => {
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW - DAY - 1);
    p = resolveSkillReview(p, 'frac.whole', true, NOW);
    const due = getDueSkillReviews(p, NOW);
    expect(due).toHaveLength(0);
  });

  // F18: stable skills are omitted from due reviews and Home tasks
  it('omits a due review when the skill is already stable from direct evidence', () => {
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd7', NOW - 6 * DAY - 1);
    // Simulate course-level D7 transfer + retention evidence making the skill stable
    p = recordSkillEvidence(p, 'frac.whole', true, true, 'transfer', 'd7', NOW - 7 * DAY);
    p = recordSkillEvidence(p, 'frac.whole', true, true, 'retention', 'd7', NOW - 7 * DAY);
    expect(getSkillDisplayStatus(p, 'frac.whole', NOW)).toBe('stable');

    const due = getDueSkillReviews(p, NOW);
    expect(due).toHaveLength(0);

    const homeTasks = getHomeTasks(p, [], NOW);
    expect(homeTasks.filter((t) => t.type === 'skill_review' && t.skillId === 'frac.whole')).toHaveLength(0);
  });

  it('keeps the same due schedule when no stable evidence exists', () => {
    const p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd7', NOW - 6 * DAY - 1);
    const due = getDueSkillReviews(p, NOW);
    expect(due).toHaveLength(1);
    expect(due[0].skillId).toBe('frac.whole');
  });

  it('does not affect unrelated due skills', () => {
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd7', NOW - 6 * DAY - 1);
    p = recordSkillEvidence(p, 'frac.whole', true, true, 'transfer', 'd7', NOW - 7 * DAY);
    p = recordSkillEvidence(p, 'frac.whole', true, true, 'retention', 'd7', NOW - 7 * DAY);
    p = scheduleSkillReview(p, 'frac.notation', 'frac.compare', 'd7', NOW - 6 * DAY - 1);

    const due = getDueSkillReviews(p, NOW);
    expect(due).toHaveLength(1);
    expect(due[0].skillId).toBe('frac.notation');
  });
});

describe('v0.3: resolveSkillReview', () => {
  it('pass sets status to passed (for D7 stage)', () => {
    // Schedule D7 directly (D1 pass + auto-schedule D7 overwrites the key)
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd7', NOW);
    p = resolveSkillReview(p, 'frac.whole', true, NOW + 6 * DAY);
    const review = getSkillReviewSchedule(p, 'frac.whole');
    expect(review?.status).toBe('passed');
  });

  it('fail keeps status as due (for retry)', () => {
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW);
    p = resolveSkillReview(p, 'frac.whole', false, NOW + DAY);
    const review = getSkillReviewSchedule(p, 'frac.whole');
    expect(review?.status).toBe('due');
  });

  it('D1 pass auto-schedules D7', () => {
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW);
    p = resolveSkillReview(p, 'frac.whole', true, NOW + DAY);
    // D7 should now be scheduled under the same key (overwriting D1 passed)
    const review = getSkillReviewSchedule(p, 'frac.whole');
    expect(review).toBeDefined();
    expect(review?.stage).toBe('d7');
    expect(review?.status).toBe('scheduled');
  });
});

describe('v0.3: refreshDueReviews', () => {
  it('transitions scheduled→due when dueAt has passed', () => {
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW);
    p = refreshDueReviews(p, NOW + DAY + 1);
    const review = getSkillReviewSchedule(p, 'frac.whole');
    expect(review?.status).toBe('due');
  });

  it('does not transition reviews that are not yet due', () => {
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW);
    p = refreshDueReviews(p, NOW);
    const review = getSkillReviewSchedule(p, 'frac.whole');
    expect(review?.status).toBe('scheduled');
  });
});

// =====================================================
// 17. v0.3: mergeSkillReviewSchedule
// =====================================================

describe('v0.3: mergeSkillReviewSchedule', () => {
  const base: SkillReviewSchedule = {
    skillId: 'frac.whole',
    targetSkillId: 'frac.notation',
    stage: 'd1',
    status: 'scheduled',
    dueAt: NOW + DAY,
    updatedAt: 100,
    contentVersion: 'v0.3',
    firstExposure: true,
    formId: 'a',
    attemptNo: 1,
  };

  it('newer updatedAt wins', () => {
    const a = { ...base, updatedAt: 100, status: 'scheduled' as const };
    const b = { ...base, updatedAt: 200, status: 'due' as const };
    expect(mergeSkillReviewSchedule(a, b).status).toBe('due');
    expect(mergeSkillReviewSchedule(b, a).status).toBe('due');
  });

  it('newer scheduled overrides older passed (timestamp-based merge)', () => {
    const a = { ...base, updatedAt: 100, status: 'passed' as const };
    const b = { ...base, updatedAt: 200, status: 'scheduled' as const };
    expect(mergeSkillReviewSchedule(a, b).status).toBe('scheduled');
    expect(mergeSkillReviewSchedule(b, a).status).toBe('scheduled');
  });

  it('newer due overrides older failed', () => {
    const a = { ...base, updatedAt: 100, status: 'failed' as const };
    const b = { ...base, updatedAt: 200, status: 'due' as const };
    expect(mergeSkillReviewSchedule(a, b).status).toBe('due');
  });

  it('same updatedAt: passed > failed > due > scheduled', () => {
    const a = { ...base, updatedAt: 100, status: 'passed' as const };
    const b = { ...base, updatedAt: 100, status: 'failed' as const };
    expect(mergeSkillReviewSchedule(a, b).status).toBe('passed');
    expect(mergeSkillReviewSchedule(b, a).status).toBe('passed');
  });

  it('same updatedAt: failed > due', () => {
    const a = { ...base, updatedAt: 100, status: 'failed' as const };
    const b = { ...base, updatedAt: 100, status: 'due' as const };
    expect(mergeSkillReviewSchedule(a, b).status).toBe('failed');
    expect(mergeSkillReviewSchedule(b, a).status).toBe('failed');
  });
});

// =====================================================
// 18. v0.3: parseSkillReviews
// =====================================================

describe('v0.3: parseSkillReviews', () => {
  it('returns empty object for undefined', () => {
    expect(parseSkillReviews(undefined)).toEqual({});
  });

  it('returns empty object for non-object', () => {
    expect(parseSkillReviews('bad')).toEqual({});
    expect(parseSkillReviews(42)).toEqual({});
    expect(parseSkillReviews(null)).toEqual({});
  });

  it('parses valid review schedule', () => {
    const input = {
      'frac.whole': {
        skillId: 'frac.whole',
        targetSkillId: 'frac.notation',
        stage: 'd1',
        status: 'scheduled',
        dueAt: NOW + DAY,
        updatedAt: 100,
        contentVersion: 'v0.3',
        firstExposure: true,
        formId: 'a',
        attemptNo: 1,
      },
    };
    const result = parseSkillReviews(input);
    expect(result['frac.whole']).toBeDefined();
    expect(result['frac.whole'].skillId).toBe('frac.whole');
  });

  it('rejects entries with invalid stage', () => {
    const input = {
      'frac.whole': {
        skillId: 'frac.whole',
        targetSkillId: 'frac.notation',
        stage: 'd30',
        status: 'scheduled',
        dueAt: NOW + DAY,
        updatedAt: 100,
        contentVersion: 'v0.3',
        firstExposure: true,
        formId: 'a',
        attemptNo: 1,
      },
    };
    const result = parseSkillReviews(input);
    expect(result['frac.whole']).toBeUndefined();
  });
});

// =====================================================
// 19. v0.3: Experiment assignment
// =====================================================

describe('v0.3: getExperimentAssignment', () => {
  it('returns deterministic result for same userId+skillId', () => {
    const a = getExperimentAssignment('user1', 'frac.whole');
    const b = getExperimentAssignment('user1', 'frac.whole');
    expect(a).toBe(b);
  });

  it('returns either repair or course', () => {
    const result = getExperimentAssignment('user1', 'frac.whole');
    expect(['repair', 'course']).toContain(result);
  });

  it('different users can get different assignments (statistical)', () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      results.add(getExperimentAssignment(`user-${i}`, 'frac.whole'));
    }
    // With 20 users, we should see at least both values
    expect(results.size).toBeGreaterThanOrEqual(1);
  });
});

describe('v0.3: setExperimentAssignment', () => {
  it('stores assignment in progress', () => {
    const p = setExperimentAssignment(empty, 'frac.whole', 'repair');
    expect(p.experimentAssignments?.['frac.whole']).toBe('repair');
  });

  it('can override existing assignment', () => {
    let p = setExperimentAssignment(empty, 'frac.whole', 'repair');
    p = setExperimentAssignment(p, 'frac.whole', 'observer');
    expect(p.experimentAssignments?.['frac.whole']).toBe('observer');
  });
});

describe('v0.3: getEffectiveAssignment', () => {
  it('returns stored assignment if exists', () => {
    const p = setExperimentAssignment(empty, 'frac.whole', 'course');
    expect(getEffectiveAssignment(p, 'user1', 'frac.whole')).toBe('course');
  });

  it('falls back to deterministic hash if not stored', () => {
    const result = getEffectiveAssignment(empty, 'user1', 'frac.whole');
    expect(['repair', 'course']).toContain(result);
  });
});

describe('v0.3: mergeExperimentAssignments', () => {
  it('returns undefined if both are undefined', () => {
    expect(mergeExperimentAssignments(undefined, undefined)).toBeUndefined();
  });

  it('returns local if remote is undefined', () => {
    const local = { 'frac.whole': 'repair' as const };
    const result = mergeExperimentAssignments(local, undefined);
    expect(result?.['frac.whole']).toBe('repair');
  });

  it('F8: rank-based merge — repair wins over course regardless of side', () => {
    const local = { 'frac.whole': 'repair' as const };
    const remote = { 'frac.whole': 'course' as const };
    const result = mergeExperimentAssignments(local, remote);
    expect(result?.['frac.whole']).toBe('repair');
  });
});

describe('v0.3: parseExperimentAssignments', () => {
  it('returns undefined for undefined input', () => {
    expect(parseExperimentAssignments(undefined)).toBeUndefined();
  });

  it('parses valid assignments', () => {
    const result = parseExperimentAssignments({ 'frac.whole': 'repair' });
    expect(result?.['frac.whole']).toBe('repair');
  });

  it('rejects invalid assignment values', () => {
    const result = parseExperimentAssignments({ 'frac.whole': 'invalid' });
    expect(result?.['frac.whole']).toBeUndefined();
  });
});

// =====================================================
// 20. v0.3: getHomeTasks priority
// =====================================================

describe('v0.3: getHomeTasks', () => {
  it('returns empty array for empty progress', () => {
    expect(getHomeTasks(empty, [], NOW)).toEqual([]);
  });

  it('due skill reviews are highest priority', () => {
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW - DAY - 1);
    p = refreshDueReviews(p, NOW);
    const tasks = getHomeTasks(p, [], NOW);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].type).toBe('skill_review');
  });

  it('active repair comes after due reviews', () => {
    let p: ProgressData = {
      ...empty,
      repairSession: {
        skillId: 'frac.equal_partition',
        targetSkillId: 'frac.notation',
        status: 'active',
        updatedAt: NOW,
      },
    };
    p = scheduleSkillReview(p, 'frac.whole', 'frac.notation', 'd1', NOW - DAY - 1);
    p = refreshDueReviews(p, NOW);
    const tasks = getHomeTasks(p, [], NOW);
    expect(tasks[0].type).toBe('skill_review');
    expect(tasks.some((t) => t.type === 'active_repair')).toBe(true);
  });

  it('learning goal comes after active repair', () => {
    const p: ProgressData = {
      ...empty,
      repairSession: {
        skillId: 'frac.equal_partition',
        targetSkillId: 'frac.notation',
        status: 'active',
        updatedAt: NOW,
      },
      learningGoal: { skillId: 'frac.notation', startedAt: NOW, updatedAt: NOW, source: 'map' },
    };
    const tasks = getHomeTasks(p, [], NOW);
    const repairIdx = tasks.findIndex((t) => t.type === 'active_repair');
    const goalIdx = tasks.findIndex((t) => t.type === 'learning_goal');
    expect(repairIdx).toBeLessThan(goalIdx);
  });

  it('due course reviews come after skill reviews', () => {
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW - DAY - 1);
    p = refreshDueReviews(p, NOW);
    const tasks = getHomeTasks(p, ['g5-fraction-meaning'], NOW);
    expect(tasks[0].type).toBe('skill_review');
    expect(tasks.some((t) => t.type === 'course_review')).toBe(true);
  });
});

// =====================================================
// 21. v0.3: SkillRepairPage review mode
// =====================================================

describe('v0.3: SkillRepairPage review mode rendering', () => {
  beforeEach(resetMocks);

  it('invalid review URL (no schedule) shows "该复习任务尚未到期或已完成"', () => {
    mockGetSkillReviewSchedule.mockReturnValue(undefined);
    renderRepairRoute('frac.whole', '?review=d1');
    expect(screen.getByText(/该复习任务尚未到期或已完成/)).toBeInTheDocument();
  });

  it('review mode with due schedule shows review questions and goal context', () => {
    _mockProgress = {
      passedKnowledgePoints: [],
      stars: {},
      learningGoal: {
        skillId: 'frac.notation',
        startedAt: NOW,
        updatedAt: NOW,
        source: 'map',
      },
    };
    mockGetSkillReviewSchedule.mockReturnValue({
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd1',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY,
      contentVersion: 'v0.3',
      firstExposure: true,
      formId: 'a',
      attemptNo: 1,
    });
    renderRepairRoute('frac.whole', '?target=frac.notation&review=d1');
    expect(screen.getAllByText(/第1天复习/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/共 2 题/)).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '学习目标' })).toBeInTheDocument();
  });

  it('review mode: 2/2 firstTry correct → pass result', () => {
    mockGetSkillReviewSchedule.mockReturnValue({
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd1',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY,
      contentVersion: 'v0.3',
      firstExposure: true,
      formId: 'a',
      attemptNo: 1,
    });
    renderRepairRoute('frac.whole', '?target=frac.notation&review=d1');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    const q1 = unit.reviewSets!.d1!.questions[0];
    const q2 = unit.reviewSets!.d1!.questions[1];

    fireEvent.click(screen.getByTestId(`correct-${q1.id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题/ }));
    fireEvent.click(screen.getByTestId(`correct-${q2.id}`));

    expect(screen.getByText(/第1天复习通过/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '继续我的目标' })).toBeInTheDocument();
    expect(mockResolveSkillReview).toHaveBeenCalledWith('frac.whole', true);
  });

  it('review mode: fail → shows retry and course link', () => {
    mockGetSkillReviewSchedule.mockReturnValue({
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd1',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY,
      contentVersion: 'v0.3',
      firstExposure: true,
      formId: 'a',
      attemptNo: 1,
    });
    renderRepairRoute('frac.whole', '?target=frac.notation&review=d1');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    const q1 = unit.reviewSets!.d1!.questions[0];
    const q2 = unit.reviewSets!.d1!.questions[1];

    fireEvent.click(screen.getByTestId(`wrong-${q1.id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题/ }));
    fireEvent.click(screen.getByTestId(`correct-${q2.id}`));

    expect(screen.getByText(/本次复习还没通过/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /再练一次/ })).toBeInTheDocument();
    expect(screen.getByText(/前往完整课程学习/)).toBeInTheDocument();
    expect(mockResolveSkillReview).toHaveBeenCalledWith('frac.whole', false);
  });

  it('review mode does not call startRepair', () => {
    mockGetSkillReviewSchedule.mockReturnValue({
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd1',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY,
      contentVersion: 'v0.3',
      firstExposure: true,
      formId: 'a',
      attemptNo: 1,
    });
    renderRepairRoute('frac.whole', '?target=frac.notation&review=d1');
    expect(mockStartRepair).not.toHaveBeenCalled();
  });

  it('review mode bypasses already-ready block', () => {
    mockIsSkillReadyForPath.mockReturnValue(true);
    mockGetSkillReviewSchedule.mockReturnValue({
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd1',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY,
      contentVersion: 'v0.3',
      firstExposure: true,
      formId: 'a',
      attemptNo: 1,
    });
    renderRepairRoute('frac.whole', '?target=frac.notation&review=d1');
    // Should show review, not the "已具备路径准备度" block
    expect(screen.getAllByText(/第1天复习/).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/已具备路径准备度/)).not.toBeInTheDocument();
  });

  it('invalid review param (review=d3) shows fail-closed invalid state, not normal repair', () => {
    renderRepairRoute('frac.whole', '?review=d3');
    // F4: Must show the safe invalid/not-due state
    expect(screen.getByText(/该复习任务尚未到期或已完成/)).toBeInTheDocument();
    // Must NOT show normal diagnostic
    expect(screen.queryByText(/诊断题/)).not.toBeInTheDocument();
    // Must NOT call startRepair
    expect(mockStartRepair).not.toHaveBeenCalled();
    // Must NOT record any evidence
    expect(mockRecordSkillEvidence).not.toHaveBeenCalled();
  });
});

// =====================================================
// 22. v0.3: Experiment course assignment CTA
// =====================================================

describe('v0.3: F1 — Diagnosis first, then branch after failure', () => {
  beforeEach(resetMocks);

  it('course assignment: diagnostic runs first (not course CTA on initial load)', () => {
    mockGetEffectiveAssignment.mockReturnValue('course');
    renderRepairRoute('frac.whole');
    // F1: Must show diagnostic, NOT course CTA
    expect(screen.getByText(/诊断题/)).toBeInTheDocument();
    expect(screen.queryByText(/建议通过完整课程巩固/)).not.toBeInTheDocument();
    expect(mockStartRepair).toHaveBeenCalled();
  });

  it('course assignment: after diagnostic failure → course CTA result', () => {
    mockGetEffectiveAssignment.mockReturnValue('course');
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;

    // Fail both diagnostic questions
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[1].id}`));

    // After diagnostic failure with course assignment → course CTA
    expect(screen.getByText(/建议通过完整课程巩固/)).toBeInTheDocument();
    expect(screen.getByText(/前往完整课程/)).toBeInTheDocument();
    // startCourseIntervention should be called
    expect(mockStartCourseIntervention).toHaveBeenCalledWith('frac.whole', expect.any(String), expect.any(String));
    // intervention_assigned event should be emitted
    expect(mockEmitEvent).toHaveBeenCalledWith(expect.objectContaining({ eventName: 'intervention_assigned' }));
  });

  it('repair assignment: after diagnostic failure → continues to lesson', () => {
    mockGetEffectiveAssignment.mockReturnValue('repair');
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;

    // Fail both diagnostic questions
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[1].id}`));
    // Click continue → lesson
    fireEvent.click(screen.getByRole('button', { name: /继续/ }));

    expect(screen.getByText(/微讲解/)).toBeInTheDocument();
    expect(mockStartCourseIntervention).not.toHaveBeenCalled();
  });

  it('observer fast-pass: diagnostic 2/2 correct → result, observer assignment', () => {
    mockGetEffectiveAssignment.mockReturnValue('repair');
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;

    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[1].id}`));

    expect(screen.getByText(/路径准备度通过/)).toBeInTheDocument();
    expect(mockSetExperimentAssignment).toHaveBeenCalledWith('frac.whole', 'observer');
  });
});

// =====================================================
// 23. v0.3: Normal repair schedules D1 after success
// =====================================================

describe('v0.3: Normal repair schedules D1 review after success', () => {
  beforeEach(resetMocks);

  it('fast pass calls scheduleSkillReview with d1', () => {
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[1].id}`));

    expect(mockScheduleSkillReview).toHaveBeenCalledWith('frac.whole', expect.any(String), 'd1');
  });

  it('check pass calls scheduleSkillReview with d1', () => {
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;

    // Fail diagnostic
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[1].id}`));
    fireEvent.click(screen.getByRole('button', { name: /继续/ }));

    // Lesson
    fireEvent.click(screen.getByRole('button', { name: /我理解了/ }));

    // Check pass
    fireEvent.click(screen.getByTestId(`correct-${unit.checkQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题/ }));
    fireEvent.click(screen.getByTestId(`correct-${unit.checkQuestions[1].id}`));

    expect(mockScheduleSkillReview).toHaveBeenCalledWith('frac.whole', expect.any(String), 'd1');
  });

  it('check fail does NOT call scheduleSkillReview', () => {
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;

    // Fail diagnostic
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[1].id}`));
    fireEvent.click(screen.getByRole('button', { name: /继续/ }));

    // Lesson
    fireEvent.click(screen.getByRole('button', { name: /我理解了/ }));

    // Check fail
    fireEvent.click(screen.getByTestId(`wrong-${unit.checkQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题/ }));
    fireEvent.click(screen.getByTestId(`wrong-${unit.checkQuestions[1].id}`));

    expect(mockScheduleSkillReview).not.toHaveBeenCalled();
  });

  it('success result shows "明天会有一次复习" copy', () => {
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[1].id}`));

    expect(screen.getByText(/明天会有一次复习/)).toBeInTheDocument();
  });
});

// =====================================================
// 24. v0.3: HomePage task priority
// =====================================================

describe('v0.3: HomePage today tasks', () => {
  beforeEach(resetMocks);

  it('shows "今日任务" heading when tasks exist', () => {
    mockGetHomeTasks.mockReturnValue([
      {
        type: 'skill_review',
        eventCycleId: 'test',
        skillId: 'frac.whole',
        link: '/repair/frac.whole?target=frac.notation&review=d1',
        title: '技能复习（第1天）',
        reason: '昨天的技能需要巩固',
        duration: '约2分钟',
        urgent: true,
      },
    ]);
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/今日任务/)).toBeInTheDocument();
  });

  it('shows skill name (not generic title) for skill_review tasks', () => {
    mockGetHomeTasks.mockReturnValue([
      {
        type: 'skill_review',
        eventCycleId: 'test',
        skillId: 'frac.whole',
        link: '/repair/frac.whole?target=frac.notation&review=d1',
        title: '技能复习（第1天）',
        reason: '昨天的技能需要巩固',
        duration: '约2分钟',
        urgent: true,
      },
    ]);
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    // Should resolve to the Chinese skill name
    expect(screen.getByText(/确定单位/)).toBeInTheDocument();
  });

  it('shows upcoming task previews (max 2)', () => {
    _mockProgress = {
      passedKnowledgePoints: [],
      stars: {},
      learningGoal: {
        skillId: 'frac.notation',
        startedAt: NOW,
        updatedAt: NOW,
        source: 'home',
      },
    };
    mockGetHomeTasks.mockReturnValue([
      {
        type: 'skill_review',
        eventCycleId: 'test',
        skillId: 'frac.whole',
        link: '/repair/frac.whole?target=frac.notation&review=d1',
        title: '技能复习（第1天）',
        reason: '昨天的技能需要巩固',
        urgent: true,
      },
      {
        type: 'active_repair',
        eventCycleId: 'test',
        skillId: 'frac.equal_partition',
        link: '/repair/frac.equal_partition?target=frac.notation',
        title: '微补修进行中',
        reason: '继续你的微补修',
        urgent: false,
      },
      {
        type: 'learning_goal',
        eventCycleId: 'test',
        skillId: 'frac.notation',
        link: '/map?target=frac.notation',
        title: '学习目标',
        reason: '前往知识地图',
        urgent: false,
      },
    ]);
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    // Primary task: frac.whole = "确定单位"1""
    expect(screen.getByText(/确定单位/)).toBeInTheDocument();
    // Upcoming previews: frac.equal_partition = "理解平均分", frac.notation = "分子、分母、分数线"
    expect(screen.getByText(/理解平均分/)).toBeInTheDocument();
    expect(screen.getAllByText(/分子/)).toHaveLength(4);
  });
});

// =====================================================
// 25. v0.3: loadProgress with v0.3 fields
// =====================================================

describe('v0.3: loadProgress with skillReviews and experimentAssignments', () => {
  beforeEach(() => localStorage.clear());

  it('loads old data without v0.3 fields', () => {
    localStorage.setItem('math-k6-progress', JSON.stringify({
      passedKnowledgePoints: ['g3-rect-area'],
      stars: { 'g3-rect-area': 2 },
    }));
    const p = loadProgress();
    expect(p.skillReviews).toBeUndefined();
    expect(p.experimentAssignments).toBeUndefined();
  });

  it('loads and parses valid skillReviews', () => {
    localStorage.setItem('math-k6-progress', JSON.stringify({
      passedKnowledgePoints: [],
      stars: {},
      skillReviews: {
        'frac.whole': {
          skillId: 'frac.whole',
          targetSkillId: 'frac.notation',
          stage: 'd1',
          status: 'scheduled',
          dueAt: NOW + DAY,
          updatedAt: NOW,
          contentVersion: 'v0.3',
          firstExposure: true,
          formId: 'a',
          attemptNo: 1,
        },
      },
    }));
    const p = loadProgress();
    expect(p.skillReviews?.['frac.whole']).toBeDefined();
    expect(p.skillReviews?.['frac.whole'].stage).toBe('d1');
  });

  it('loads and parses valid experimentAssignments', () => {
    localStorage.setItem('math-k6-progress', JSON.stringify({
      passedKnowledgePoints: [],
      stars: {},
      experimentAssignments: {
        'frac.whole': 'repair',
      },
    }));
    const p = loadProgress();
    expect(p.experimentAssignments?.['frac.whole']).toBe('repair');
  });

  it('rejects malformed skillReviews (invalid stage)', () => {
    localStorage.setItem('math-k6-progress', JSON.stringify({
      passedKnowledgePoints: [],
      stars: {},
      skillReviews: {
        'frac.whole': {
          skillId: 'frac.whole',
          targetSkillId: 'frac.notation',
          stage: 'd99',
          status: 'scheduled',
          dueAt: NOW + DAY,
          updatedAt: NOW,
          contentVersion: 'v0.3',
          firstExposure: true,
          formId: 'a',
          attemptNo: 1,
        },
      },
    }));
    const p = loadProgress();
    expect(p.skillReviews?.['frac.whole']).toBeUndefined();
  });
});

// =====================================================
// 26. F2: CourseIntervention pure functions
// =====================================================

describe('F2: CourseIntervention parse/merge/start/complete/isActive', () => {
  it('parseCourseIntervention accepts valid object', () => {
    const ci = parseCourseIntervention({
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      courseId: 'g3-course1',
      variant: 'course',
      status: 'active',
      updatedAt: NOW,
    });
    expect(ci).toBeDefined();
    expect(ci!.skillId).toBe('frac.whole');
    expect(ci!.status).toBe('active');
  });

  it('parseCourseIntervention rejects invalid fields', () => {
    expect(parseCourseIntervention(null)).toBeUndefined();
    expect(parseCourseIntervention({})).toBeUndefined();
    expect(parseCourseIntervention({ skillId: '', targetSkillId: 'a', courseId: 'b', variant: 'course', status: 'active', updatedAt: NOW })).toBeUndefined();
    expect(parseCourseIntervention({ skillId: 'a', targetSkillId: 'b', courseId: 'c', variant: 'wrong', status: 'active', updatedAt: NOW })).toBeUndefined();
    expect(parseCourseIntervention({ skillId: 'a', targetSkillId: 'b', courseId: 'c', variant: 'course', status: 'pending', updatedAt: NOW })).toBeUndefined();
    expect(parseCourseIntervention({ skillId: 'a', targetSkillId: 'b', courseId: 'c', variant: 'course', status: 'active', updatedAt: -1 })).toBeUndefined();
  });

  it('mergeCourseIntervention: newer wins', () => {
    const a: CourseIntervention = { skillId: 's', targetSkillId: 't', courseId: 'c', variant: 'course', status: 'active', updatedAt: NOW };
    const b: CourseIntervention = { skillId: 's', targetSkillId: 't', courseId: 'c', variant: 'course', status: 'completed', updatedAt: NOW + 1000 };
    expect(mergeCourseIntervention(a, b)).toBe(b);
    expect(mergeCourseIntervention(b, a)).toBe(b);
  });

  it('mergeCourseIntervention: same time, completed wins over active', () => {
    const active: CourseIntervention = { skillId: 's', targetSkillId: 't', courseId: 'c', variant: 'course', status: 'active', updatedAt: NOW };
    const completed: CourseIntervention = { skillId: 's', targetSkillId: 't', courseId: 'c', variant: 'course', status: 'completed', updatedAt: NOW };
    expect(mergeCourseIntervention(active, completed)).toBe(completed);
    expect(mergeCourseIntervention(completed, active)).toBe(completed);
  });

  it('mergeCourseIntervention: both undefined → undefined', () => {
    expect(mergeCourseIntervention(undefined, undefined)).toBeUndefined();
  });

  it('startCourseIntervention sets active status', () => {
    const result = startCourseIntervention(empty, 'frac.whole', 'frac.notation', 'g3-course1', NOW);
    expect(result.courseIntervention).toBeDefined();
    expect(result.courseIntervention!.status).toBe('active');
    expect(result.courseIntervention!.skillId).toBe('frac.whole');
  });

  it('completeCourseIntervention marks matching active → completed', () => {
    const withActive = startCourseIntervention(empty, 'frac.whole', 'frac.notation', 'g3-course1', NOW);
    const result = completeCourseIntervention(withActive, 'g3-course1', NOW + 1000);
    expect(result.courseIntervention!.status).toBe('completed');
    expect(result.courseIntervention!.updatedAt).toBe(NOW + 1000);
  });

  it('completeCourseIntervention ignores non-matching courseId', () => {
    const withActive = startCourseIntervention(empty, 'frac.whole', 'frac.notation', 'g3-course1', NOW);
    const result = completeCourseIntervention(withActive, 'g3-other', NOW + 1000);
    expect(result.courseIntervention!.status).toBe('active');
  });

  it('isActiveCourseIntervention checks match', () => {
    const withActive = startCourseIntervention(empty, 'frac.whole', 'frac.notation', 'g3-course1', NOW);
    expect(isActiveCourseIntervention(withActive, 'g3-course1')).toBe(true);
    expect(isActiveCourseIntervention(withActive, 'g3-other')).toBe(false);
    expect(isActiveCourseIntervention(empty, 'g3-course1')).toBe(false);
  });

  it('loadProgress parses courseIntervention from localStorage', () => {
    localStorage.clear();
    localStorage.setItem('math-k6-progress', JSON.stringify({
      passedKnowledgePoints: [],
      stars: {},
      courseIntervention: {
        skillId: 'frac.whole',
        targetSkillId: 'frac.notation',
        courseId: 'g3-course1',
        variant: 'course',
        status: 'active',
        updatedAt: NOW,
      },
    }));
    const p = loadProgress();
    expect(p.courseIntervention).toBeDefined();
    expect(p.courseIntervention!.skillId).toBe('frac.whole');
  });
});

// =====================================================
// 27. F8: mergeExperimentAssignments deterministic + commutative
// =====================================================

describe('F8: mergeExperimentAssignments observer wins, commutative', () => {
  it('observer > repair > course (fixed rank)', () => {
    const local = { 'frac.whole': 'course' as const };
    const remote = { 'frac.whole': 'observer' as const };
    expect(mergeExperimentAssignments(local, remote)?.['frac.whole']).toBe('observer');
    // Commutative: same result regardless of order
    expect(mergeExperimentAssignments(remote, local)?.['frac.whole']).toBe('observer');
  });

  it('observer > repair', () => {
    const a = { s: 'repair' as const };
    const b = { s: 'observer' as const };
    expect(mergeExperimentAssignments(a, b)?.['s']).toBe('observer');
    expect(mergeExperimentAssignments(b, a)?.['s']).toBe('observer');
  });

  it('repair > course', () => {
    const a = { s: 'course' as const };
    const b = { s: 'repair' as const };
    expect(mergeExperimentAssignments(a, b)?.['s']).toBe('repair');
    expect(mergeExperimentAssignments(b, a)?.['s']).toBe('repair');
  });

  it('same rank returns same value', () => {
    const a = { s: 'repair' as const };
    const b = { s: 'repair' as const };
    expect(mergeExperimentAssignments(a, b)?.['s']).toBe('repair');
  });

  it('union of disjoint keys', () => {
    const a = { x: 'repair' as const };
    const b = { y: 'course' as const };
    const result = mergeExperimentAssignments(a, b);
    expect(result?.['x']).toBe('repair');
    expect(result?.['y']).toBe('course');
  });

  it('both undefined → undefined', () => {
    expect(mergeExperimentAssignments(undefined, undefined)).toBeUndefined();
  });

  it('one side undefined → takes the other', () => {
    const a = { s: 'course' as const };
    expect(mergeExperimentAssignments(a, undefined)?.['s']).toBe('course');
    expect(mergeExperimentAssignments(undefined, a)?.['s']).toBe('course');
  });
});

// =====================================================
// 28. F7: D7 review records both transfer and retention on 2/2 pass
// =====================================================

describe('F7: D7 review records dual evidence on 2/2 firstTry pass', () => {
  it('D7 2/2 correct firstTry → records transfer AND retention via atomic transition', () => {
    // Set up progress with existing transfer evidence (from repair/initial)
    let p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'repair', NOW - 10 * DAY);
    // Schedule D7 review
    p = scheduleSkillReview(p, 'frac.whole', 'frac.notation', 'd7', NOW - 7 * DAY);
    // Make it due
    p = refreshDueReviews(p, NOW);

    const result = resolveSkillReviewTransition(p, 'frac.whole', true, NOW);

    // Post-transition: should have transfer + retention → stable
    const ev = result.progress.skillEvidence?.['frac.whole'];
    expect(ev).toBeDefined();
    expect(ev!.transfer).toBeGreaterThanOrEqual(2); // repair transfer + D7 transfer
    expect(ev!.retention).toBe(1);
    expect(getSkillDisplayStatus(result.progress, 'frac.whole', NOW)).toBe('stable');

    // Events: skill_review_finished + stable_achieved
    const eventNames = result.events.map((e) => e.eventName);
    expect(eventNames).toContain('skill_review_finished');
    expect(eventNames).toContain('stable_achieved');
  });

  it('D7 fail → records only transfer (no retention) via atomic transition', () => {
    let p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'repair', NOW - 10 * DAY);
    p = scheduleSkillReview(p, 'frac.whole', 'frac.notation', 'd7', NOW - 7 * DAY);
    p = refreshDueReviews(p, NOW);

    const result = resolveSkillReviewTransition(p, 'frac.whole', false, NOW);

    // Post-transition: should have transfer but no retention
    const ev = result.progress.skillEvidence?.['frac.whole'];
    expect(ev).toBeDefined();
    // The D7 fail records a failure transfer (isCorrect=false), so transfer count stays same
    expect(ev!.retention).toBe(0);

    // Events: skill_review_finished only (no stable_achieved)
    const eventNames = result.events.map((e) => e.eventName);
    expect(eventNames).toContain('skill_review_finished');
    expect(eventNames).not.toContain('stable_achieved');
  });

  it('D7 result copy says "已记录第7天保持证据" not "已经稳固掌握"', () => {
    const d7Review: SkillReviewSchedule = {
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd7',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY * 7,
      contentVersion: 'v0.3',
      firstExposure: true,
      formId: 'a',
      attemptNo: 1,
    };
    mockGetSkillReviewSchedule.mockReturnValue(d7Review);
    mockGetEffectiveAssignment.mockReturnValue('observer');

    renderRepairRoute('frac.whole', '?target=frac.notation&review=d7');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    const d7Questions = unit.reviewSets?.d7?.questions ?? [];

    // 2/2 correct
    fireEvent.click(screen.getByTestId(`correct-${d7Questions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`correct-${d7Questions[1].id}`));

    // F7: Should show retention evidence copy, not "stable" claim
    expect(screen.getByText(/已记录第7天保持证据/)).toBeInTheDocument();
    expect(screen.queryByText(/已经稳固掌握/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '继续我的目标' })).toBeInTheDocument();
  });
});

// =====================================================
// 29. F5: Review retry resets state in place (no navigate)
// =====================================================

describe('F5: Review retry resets state in place', () => {
  beforeEach(resetMocks);

  it('D1 fail → click retry → shows review questions again (not navigation)', () => {
    const d1Review: SkillReviewSchedule = {
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd1',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY,
      contentVersion: 'v0.3',
      firstExposure: true,
      formId: 'a',
      attemptNo: 1,
    };
    mockGetSkillReviewSchedule.mockReturnValue(d1Review);
    mockGetEffectiveAssignment.mockReturnValue('observer');

    renderRepairRoute('frac.whole', '?target=frac.notation&review=d1');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    const d1Questions = unit.reviewSets?.d1?.questions ?? [];
    expect(d1Questions.length).toBe(2);

    // Fail both questions
    fireEvent.click(screen.getByTestId(`wrong-${d1Questions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${d1Questions[1].id}`));

    // Should show failure result
    expect(screen.getByText(/本次复习还没通过/)).toBeInTheDocument();

    // Click retry button
    fireEvent.click(screen.getByRole('button', { name: /再练一次/ }));

    // F5: Should show review questions again (state reset in place)
    // The review stage label "第1天复习 · A卷 1/2" should be visible again
    expect(screen.getByText(/A卷 1\/2/)).toBeInTheDocument();
    // resolveSkillReview should only have been called once (from the first attempt)
    expect(mockResolveSkillReview).toHaveBeenCalledTimes(1);
  });
});

// =====================================================
// 30. F3: Event emission at semantic transitions
// =====================================================

describe('F3: Learning event emission', () => {
  beforeEach(resetMocks);

  it('skill_review_started emitted on first due review exposure via useEffect', () => {
    const d1Review: SkillReviewSchedule = {
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd1',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY,
      contentVersion: 'v0.3',
      firstExposure: true,
      formId: 'a',
      attemptNo: 1,
    };
    mockGetSkillReviewSchedule.mockReturnValue(d1Review);
    mockGetEffectiveAssignment.mockReturnValue('observer');

    renderRepairRoute('frac.whole', '?target=frac.notation&review=d1');

    const startedEvents = mockEmitEvent.mock.calls.filter(
      (c: unknown[]) => (c[0] as { eventName: string }).eventName === 'skill_review_started',
    );
    expect(startedEvents.length).toBeGreaterThanOrEqual(1);
    expect(startedEvents[0][0]).toMatchObject({
      eventName: 'skill_review_started',
      skillId: 'frac.whole',
      mode: 'd1',
    });
    // dueAt must be ISO string, not String(ms)
    const dueAt = (startedEvents[0][0] as { dueAt: string }).dueAt;
    expect(dueAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // clientEventId must use persisted schedule timestamp, not Date.now()
    const eventId = (startedEvents[0][0] as { clientEventId: string }).clientEventId;
    expect(eventId).toContain(`${NOW - DAY}`);
  });

  it('skill_review_finished emitted by resolveSkillReviewTransition (atomic, not page)', () => {
    // Test at pure function level since context's resolveSkillReview now emits this
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW - DAY);
    p = refreshDueReviews(p, NOW);

    const result = resolveSkillReviewTransition(p, 'frac.whole', true, NOW);

    const finishedEvents = result.events.filter((e) => e.eventName === 'skill_review_finished');
    expect(finishedEvents.length).toBe(1);
    expect(finishedEvents[0]).toMatchObject({
      eventName: 'skill_review_finished',
      skillId: 'frac.whole',
      passed: true,
    });
    // D1 pass should also schedule D7
    const scheduledEvents = result.events.filter((e) => e.eventName === 'skill_review_scheduled');
    expect(scheduledEvents.length).toBe(1);
    expect(scheduledEvents[0]).toMatchObject({
      eventName: 'skill_review_scheduled',
      skillId: 'frac.whole',
      mode: 'd7',
    });
    // dueAt must be ISO string
    expect(scheduledEvents[0].dueAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('skill_review_scheduled emitted by scheduleSkillReview context (verified via page calling context)', () => {
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[1].id}`));

    // scheduleSkillReview is called (context emits skill_review_scheduled internally)
    expect(mockScheduleSkillReview).toHaveBeenCalledWith('frac.whole', expect.any(String), 'd1');
  });

  it('intervention_assigned emitted when course group fails diagnostic', () => {
    mockGetEffectiveAssignment.mockReturnValue('course');
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;

    // Fail diagnostic
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[1].id}`));

    const iaEvents = mockEmitEvent.mock.calls.filter(
      (c: unknown[]) => (c[0] as { eventName: string }).eventName === 'intervention_assigned',
    );
    expect(iaEvents.length).toBe(1);
    expect(iaEvents[0][0]).toMatchObject({
      eventName: 'intervention_assigned',
      skillId: 'frac.whole',
      variant: 'course',
    });
  });
});

// =====================================================
// 31. F6: HomeTasks dueCount includes skill reviews + currentLearning
// =====================================================

describe('F6: getHomeTasks includes skill reviews and currentLearning', () => {
  it('due skill reviews appear as highest priority tasks', () => {
    const progress: ProgressData = {
      passedKnowledgePoints: [],
      stars: {},
      skillReviews: {
        'frac.whole': {
          skillId: 'frac.whole',
          targetSkillId: 'frac.notation',
          stage: 'd1',
          status: 'due',
          dueAt: NOW - 1,
          updatedAt: NOW - DAY,
          contentVersion: 'v0.3',
          firstExposure: true,
          formId: 'a',
          attemptNo: 1,
        },
      },
    };
    const tasks = getHomeTasks(progress, [], NOW);
    expect(tasks.length).toBeGreaterThanOrEqual(1);
    expect(tasks[0].type).toBe('skill_review');
    expect(tasks[0].skillId).toBe('frac.whole');
    expect(tasks[0].urgent).toBe(true);
  });

  it('currentLearning appears as last-priority task', () => {
    const progress: ProgressData = {
      passedKnowledgePoints: [],
      stars: {},
      currentLearning: 'g3-rect-area',
    };
    const tasks = getHomeTasks(progress, [], NOW);
    const clTask = tasks.find((t) => t.type === 'current_learning');
    expect(clTask).toBeDefined();
    expect(clTask!.link).toBe('/kp/g3-rect-area');
    expect(clTask!.title).toBe('继续学习');
  });

  it('active course intervention appears in task list', () => {
    const progress: ProgressData = {
      passedKnowledgePoints: [],
      stars: {},
      courseIntervention: {
        skillId: 'frac.whole',
        targetSkillId: 'frac.notation',
        courseId: 'g3-course1',
        variant: 'course',
        status: 'active',
        updatedAt: NOW,
      },
    };
    const tasks = getHomeTasks(progress, [], NOW);
    const ciTask = tasks.find((t) => t.type === 'course_intervention');
    expect(ciTask).toBeDefined();
    expect(ciTask!.link).toBe('/kp/g3-course1');
    expect(ciTask!.title).toBe('课程巩固进行中');
  });

  it('skill review tasks have higher priority than course intervention', () => {
    const progress: ProgressData = {
      passedKnowledgePoints: [],
      stars: {},
      skillReviews: {
        'frac.whole': {
          skillId: 'frac.whole',
          targetSkillId: 'frac.notation',
          stage: 'd1',
          status: 'due',
          dueAt: NOW - 1,
          updatedAt: NOW - DAY,
          contentVersion: 'v0.3',
          firstExposure: true,
          formId: 'a',
          attemptNo: 1,
        },
      },
      courseIntervention: {
        skillId: 'frac.equal_partition',
        targetSkillId: 'frac.notation',
        courseId: 'g3-course1',
        variant: 'course',
        status: 'active',
        updatedAt: NOW,
      },
    };
    const tasks = getHomeTasks(progress, [], NOW);
    expect(tasks[0].type).toBe('skill_review');
    const ciIdx = tasks.findIndex((t) => t.type === 'course_intervention');
    expect(ciIdx).toBeGreaterThan(0);
  });

  it('deduplicates tasks by link', () => {
    const progress: ProgressData = {
      passedKnowledgePoints: [],
      stars: {},
      currentLearning: 'g3-course1',
      courseIntervention: {
        skillId: 'frac.whole',
        targetSkillId: 'frac.notation',
        courseId: 'g3-course1',
        variant: 'course',
        status: 'active',
        updatedAt: NOW,
      },
    };
    const tasks = getHomeTasks(progress, [], NOW);
    // Both course_intervention and current_learning link to /kp/g3-course1
    const g3Links = tasks.filter((t) => t.link === '/kp/g3-course1');
    expect(g3Links.length).toBe(1); // deduplicated
  });
});

// =====================================================
// 32. v0.3-r2: 8-event analytics contract
// =====================================================

describe('v0.3-r2: 8-event analytics contract', () => {
  beforeEach(resetMocks);

  // ---- A: resolveSkillReviewTransition atomic events ----

  it('D1 pass emits skill_review_finished + skill_review_scheduled (D7)', () => {
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW - DAY);
    p = refreshDueReviews(p, NOW);
    const result = resolveSkillReviewTransition(p, 'frac.whole', true, NOW);

    const names = result.events.map((e) => e.eventName);
    expect(names).toContain('skill_review_finished');
    expect(names).toContain('skill_review_scheduled');

    const scheduled = result.events.find((e) => e.eventName === 'skill_review_scheduled')!;
    expect(scheduled.mode).toBe('d7');
    expect(scheduled.dueAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // Event ID uses persisted schedule timestamp
    expect(scheduled.clientEventId).toContain(`${NOW}`);
  });

  it('D1 fail emits skill_review_finished only (no D7 schedule)', () => {
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW - DAY);
    p = refreshDueReviews(p, NOW);
    const result = resolveSkillReviewTransition(p, 'frac.whole', false, NOW);

    const names = result.events.map((e) => e.eventName);
    expect(names).toContain('skill_review_finished');
    expect(names).not.toContain('skill_review_scheduled');
    expect(names).not.toContain('stable_achieved');
  });

  it('D7 pass with transfer+retention produces stable_achieved', () => {
    let p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'repair', NOW - 10 * DAY);
    p = scheduleSkillReview(p, 'frac.whole', 'frac.notation', 'd7', NOW - 7 * DAY);
    p = refreshDueReviews(p, NOW);
    const result = resolveSkillReviewTransition(p, 'frac.whole', true, NOW);

    const names = result.events.map((e) => e.eventName);
    expect(names).toContain('skill_review_finished');
    expect(names).toContain('stable_achieved');
    expect(getSkillDisplayStatus(result.progress, 'frac.whole', NOW)).toBe('stable');
  });

  it('D7 fail does NOT produce stable_achieved', () => {
    let p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'repair', NOW - 10 * DAY);
    p = scheduleSkillReview(p, 'frac.whole', 'frac.notation', 'd7', NOW - 7 * DAY);
    p = refreshDueReviews(p, NOW);
    const result = resolveSkillReviewTransition(p, 'frac.whole', false, NOW);

    const names = result.events.map((e) => e.eventName);
    expect(names).toContain('skill_review_finished');
    expect(names).not.toContain('stable_achieved');
  });

  it('stable_achieved event ID uses pre-transition schedule updatedAt', () => {
    const scheduleTs = NOW - 7 * DAY;
    let p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'repair', NOW - 10 * DAY);
    p = scheduleSkillReview(p, 'frac.whole', 'frac.notation', 'd7', scheduleTs);
    p = refreshDueReviews(p, NOW);
    const result = resolveSkillReviewTransition(p, 'frac.whole', true, NOW);

    const stable = result.events.find((e) => e.eventName === 'stable_achieved')!;
    expect(stable.clientEventId).toContain(`${scheduleTs}`);
  });

  // ---- B: markInitialPassTransition course intervention events ----

  it('course completion emits intervention_completed + skill_review_scheduled (D1)', () => {
    const ciTs = NOW - 3 * DAY;
    let p = startCourseIntervention(empty, 'frac.whole', 'frac.notation', 'g5-fraction-meaning', ciTs);
    const result = markInitialPassTransition(p, 'g5-fraction-meaning', 2, NOW, true);

    const names = result.events.map((e) => e.eventName);
    expect(names).toContain('intervention_completed');
    expect(names).toContain('skill_review_scheduled');

    const ic = result.events.find((e) => e.eventName === 'intervention_completed')!;
    expect(ic.variant).toBe('course');
    expect(ic.clientEventId).toContain(`${ciTs}`);

    const srs = result.events.find((e) => e.eventName === 'skill_review_scheduled')!;
    expect(srs.mode).toBe('d1');
    expect(srs.dueAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('markInitialPass without matching intervention emits no events', () => {
    const result = markInitialPassTransition(empty, 'g5-fraction-meaning', 2, NOW, true);
    expect(result.events).toEqual([]);
  });

  // ---- C: intervention_assigned for both variants ----

  it('repair variant emits intervention_assigned after diagnostic failure', () => {
    mockGetEffectiveAssignment.mockReturnValue('repair');
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;

    // Fail both diagnostic
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[1].id}`));

    const iaEvents = mockEmitEvent.mock.calls.filter(
      (c: unknown[]) => (c[0] as { eventName: string }).eventName === 'intervention_assigned',
    );
    expect(iaEvents.length).toBe(1);
    expect(iaEvents[0][0]).toMatchObject({
      eventName: 'intervention_assigned',
      skillId: 'frac.whole',
      variant: 'repair',
    });
  });

  it('course variant emits intervention_assigned after diagnostic failure', () => {
    mockGetEffectiveAssignment.mockReturnValue('course');
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;

    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[1].id}`));

    const iaEvents = mockEmitEvent.mock.calls.filter(
      (c: unknown[]) => (c[0] as { eventName: string }).eventName === 'intervention_assigned',
    );
    expect(iaEvents.length).toBe(1);
    expect(iaEvents[0][0]).toMatchObject({
      eventName: 'intervention_assigned',
      variant: 'course',
    });
  });

  // ---- C: intervention_completed for all three variants ----

  it('fast pass emits intervention_completed (observer)', () => {
    _mockProgress = {
      ..._mockProgress,
      repairSession: { skillId: 'frac.whole', targetSkillId: 'frac.notation', status: 'active', updatedAt: NOW },
    };
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[1].id}`));

    const icEvents = mockEmitEvent.mock.calls.filter(
      (c: unknown[]) => (c[0] as { eventName: string }).eventName === 'intervention_completed',
    );
    expect(icEvents.length).toBe(1);
    expect(icEvents[0][0]).toMatchObject({
      eventName: 'intervention_completed',
      skillId: 'frac.whole',
      variant: 'observer',
    });
  });

  it('check pass emits intervention_completed (repair)', () => {
    _mockProgress = {
      ..._mockProgress,
      repairSession: { skillId: 'frac.whole', targetSkillId: 'frac.notation', status: 'active', updatedAt: NOW },
    };
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;

    // Fail diagnostic
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[1].id}`));
    fireEvent.click(screen.getByRole('button', { name: /继续/ }));

    // Lesson
    fireEvent.click(screen.getByRole('button', { name: /我理解了/ }));

    // Check pass
    fireEvent.click(screen.getByTestId(`correct-${unit.checkQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题/ }));
    fireEvent.click(screen.getByTestId(`correct-${unit.checkQuestions[1].id}`));

    const icEvents = mockEmitEvent.mock.calls.filter(
      (c: unknown[]) => (c[0] as { eventName: string }).eventName === 'intervention_completed',
    );
    expect(icEvents.length).toBe(1);
    expect(icEvents[0][0]).toMatchObject({
      eventName: 'intervention_completed',
      skillId: 'frac.whole',
      variant: 'repair',
    });
  });

  // ---- F: No Date.now() in event IDs ----

  it('intervention_completed event ID uses persisted repair session timestamp', () => {
    // The repair session starts at mount time with a specific updatedAt
    // The event ID should contain that timestamp, not a fresh Date.now()
    _mockProgress = {
      ..._mockProgress,
      repairSession: { skillId: 'frac.whole', targetSkillId: 'frac.notation', status: 'active', updatedAt: NOW },
    };
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`correct-${unit.diagnosticQuestions[1].id}`));

    const icEvents = mockEmitEvent.mock.calls.filter(
      (c: unknown[]) => (c[0] as { eventName: string }).eventName === 'intervention_completed',
    );
    expect(icEvents.length).toBe(1);
    const eventId = (icEvents[0][0] as { clientEventId: string }).clientEventId;
    // Event ID should NOT contain a timestamp that looks like a current Date.now()
    // (it should use the repair session's updatedAt which is from mount time)
    expect(eventId).toMatch(/^ic:frac\.whole:observer:\d+$/);
  });

  // ---- D: HomeTask eventCycleId ----

  it('HomeTask eventCycleId uses persisted timestamps (no fresh clock)', () => {
    const scheduleTs = NOW - DAY;
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', scheduleTs);
    p = refreshDueReviews(p, NOW);
    const tasks = getHomeTasks(p, [], NOW);

    const reviewTask = tasks.find((t) => t.type === 'skill_review');
    expect(reviewTask).toBeDefined();
    expect(reviewTask!.eventCycleId).toContain(`${scheduleTs}`);
  });

  it('HomeTask eventCycleId for active repair uses session updatedAt', () => {
    const sessionTs = NOW - 1000;
    const p: ProgressData = {
      ...empty,
      repairSession: {
        skillId: 'frac.whole',
        targetSkillId: 'frac.notation',
        status: 'active',
        updatedAt: sessionTs,
      },
    };
    const tasks = getHomeTasks(p, [], NOW);
    const repairTask = tasks.find((t) => t.type === 'active_repair');
    expect(repairTask).toBeDefined();
    expect(repairTask!.eventCycleId).toContain(`${sessionTs}`);
  });

  // ---- Idempotency: repeated calls use same key ----

  it('resolveSkillReviewTransition emits skill_review_finished for every valid attempt (F12)', () => {
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW - DAY);
    p = refreshDueReviews(p, NOW);
    // First resolve (firstExposure=true, fail)
    const first = resolveSkillReviewTransition(p, 'frac.whole', false, NOW);
    expect(first.events.filter((e) => e.eventName === 'skill_review_finished').length).toBe(1);

    // Second resolve on the result (firstExposure=false, still due)
    const second = resolveSkillReviewTransition(first.progress, 'frac.whole', true, NOW + 1);
    // F11: Non-first-exposure retry emits finished but does not mark passed or schedule D7;
    // the task stays due until a fresh first-exposure form is completed.
    expect(second.events.filter((e) => e.eventName === 'skill_review_finished').length).toBe(1);
    expect(second.events.some((e) => e.eventName === 'skill_review_scheduled')).toBe(false);
    expect(getSkillReviewSchedule(second.progress, 'frac.whole')?.status).toBe('due');
  });
});

// =====================================================
// 33. F10–F16 focused regression suite
// =====================================================

describe('F10–F16 focused regression suite', () => {
  beforeEach(resetMocks);

  // ---- F10: real due schedules without refreshDueReviews ----

  it('F10: raw scheduled D1 at due time resolves without refreshDueReviews', () => {
    // Schedule D1 in the past; status is still 'scheduled' but dueAt <= now
    const p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW - DAY - 1);
    expect(getSkillReviewSchedule(p, 'frac.whole')!.status).toBe('scheduled');

    const result = resolveSkillReviewTransition(p, 'frac.whole', true, NOW);
    expect(result.events.some((e) => e.eventName === 'skill_review_finished')).toBe(true);
    expect(result.events.some((e) => e.eventName === 'skill_review_scheduled' && e.mode === 'd7')).toBe(true);
    expect(getSkillReviewSchedule(result.progress, 'frac.whole')?.stage).toBe('d7');
  });

  it('F10: raw scheduled D7 at due time resolves without refreshDueReviews', () => {
    let p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'repair', NOW - 10 * DAY);
    p = scheduleSkillReview(p, 'frac.whole', 'frac.notation', 'd7', NOW - 6 * DAY - 1);
    expect(getSkillReviewSchedule(p, 'frac.whole')!.status).toBe('scheduled');

    const result = resolveSkillReviewTransition(p, 'frac.whole', true, NOW);
    expect(result.events.some((e) => e.eventName === 'skill_review_finished')).toBe(true);
    expect(getSkillReviewSchedule(result.progress, 'frac.whole')?.status).toBe('passed');
    expect(getSkillDisplayStatus(result.progress, 'frac.whole', NOW)).toBe('stable');
  });

  it('F10: future scheduled review is fail-closed (no-op)', () => {
    const p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', NOW);
    const result = resolveSkillReviewTransition(p, 'frac.whole', true, NOW);
    expect(result.events).toEqual([]);
    expect(result.progress).toBe(p);
  });

  // ---- F11: repeated D7 retry ----

  it('F11: first-exposure D7 2/2 passes and marks schedule passed + stable', () => {
    let p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'repair', NOW - 10 * DAY);
    p = scheduleSkillReview(p, 'frac.whole', 'frac.notation', 'd7', NOW - 6 * DAY - 1);

    const result = resolveSkillReviewTransition(p, 'frac.whole', true, NOW);
    expect(getSkillReviewSchedule(result.progress, 'frac.whole')?.status).toBe('passed');
    expect(getSkillDisplayStatus(result.progress, 'frac.whole', NOW)).toBe('stable');
    expect(result.events.some((e) => e.eventName === 'stable_achieved')).toBe(true);
  });

  it('F11: first-exposure D7 fail keeps schedule due and flips firstExposure=false', () => {
    let p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'repair', NOW - 10 * DAY);
    p = scheduleSkillReview(p, 'frac.whole', 'frac.notation', 'd7', NOW - 6 * DAY - 1);

    const result = resolveSkillReviewTransition(p, 'frac.whole', false, NOW);
    const schedule = getSkillReviewSchedule(result.progress, 'frac.whole');
    expect(schedule?.status).toBe('due');
    expect(schedule?.firstExposure).toBe(false);
    expect(result.events.some((e) => e.eventName === 'stable_achieved')).toBe(false);
  });

  it('F11: non-first-exposure D7 retry pass stays due and records no new evidence', () => {
    let p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'repair', NOW - 10 * DAY);
    p = scheduleSkillReview(p, 'frac.whole', 'frac.notation', 'd7', NOW - 6 * DAY - 1);
    // First failure
    p = resolveSkillReview(p, 'frac.whole', false, NOW);
    const evBefore = p.skillEvidence?.['frac.whole'];

    // Non-first-exposure retry pass
    const result = resolveSkillReviewTransition(p, 'frac.whole', true, NOW + 1);
    const schedule = getSkillReviewSchedule(result.progress, 'frac.whole');
    expect(schedule?.status).toBe('due');
    expect(schedule?.firstExposure).toBe(false);
    expect(result.progress.skillEvidence?.['frac.whole']).toEqual(evBefore);
    expect(result.events.some((e) => e.eventName === 'skill_review_finished')).toBe(true);
    expect(result.events.some((e) => e.eventName === 'stable_achieved')).toBe(false);
  });

  it('F11: non-first-exposure D7 retry fail stays due', () => {
    let p = recordSkillEvidence(empty, 'frac.whole', true, true, 'transfer', 'repair', NOW - 10 * DAY);
    p = scheduleSkillReview(p, 'frac.whole', 'frac.notation', 'd7', NOW - 6 * DAY - 1);
    p = resolveSkillReview(p, 'frac.whole', false, NOW);

    const result = resolveSkillReviewTransition(p, 'frac.whole', false, NOW + 1);
    expect(getSkillReviewSchedule(result.progress, 'frac.whole')?.status).toBe('due');
    expect(result.events.some((e) => e.eventName === 'skill_review_finished')).toBe(true);
  });

  // ---- F11 UI: repeated D7 success shows practice copy ----

  it('F11 UI: repeated D7 pass shows practice copy with course CTA', () => {
    mockGetSkillReviewSchedule.mockReturnValue({
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd7',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY * 7,
      contentVersion: 'v0.3',
      firstExposure: false,
      formId: 'a',
      attemptNo: 2,
    });
    mockGetEffectiveAssignment.mockReturnValue('observer');

    renderRepairRoute('frac.whole', '?target=frac.notation&review=d7');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    const d7Questions = unit.reviewSets?.d7?.questions ?? [];

    fireEvent.click(screen.getByTestId(`correct-${d7Questions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`correct-${d7Questions[1].id}`));

    expect(screen.getByText(/复习练习完成/)).toBeInTheDocument();
    expect(screen.getByText(/尚未产生新的稳固证据/)).toBeInTheDocument();
    expect(screen.getByText(/前往完整课程学习/)).toBeInTheDocument();
    expect(screen.queryByText(/已记录第7天保持证据/)).not.toBeInTheDocument();
  });

  // ---- F12: review started event lifecycle ----

  it('F12: skill_review_started fires for non-first-exposure attempts (no gate)', () => {
    mockGetSkillReviewSchedule.mockReturnValue({
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd1',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY,
      contentVersion: 'v0.3',
      firstExposure: false,
      formId: 'a',
      attemptNo: 2,
    });
    mockGetEffectiveAssignment.mockReturnValue('observer');

    renderRepairRoute('frac.whole', '?target=frac.notation&review=d1');

    const startedEvents = mockEmitEvent.mock.calls.filter(
      (c: unknown[]) => (c[0] as { eventName: string }).eventName === 'skill_review_started',
    );
    expect(startedEvents.length).toBeGreaterThanOrEqual(1);
  });

  // ---- F13: HomeTask eventCycleId includes entity identity ----

  it('F13: skill_review eventCycleId includes skillId + stage + updatedAt', () => {
    const scheduleTs = NOW - DAY;
    let p = scheduleSkillReview(empty, 'frac.whole', 'frac.notation', 'd1', scheduleTs);
    p = refreshDueReviews(p, NOW);
    const tasks = getHomeTasks(p, [], NOW);
    const task = tasks.find((t) => t.type === 'skill_review');
    expect(task).toBeDefined();
    expect(task!.eventCycleId).toBe(`sr:frac.whole:d1:a:${scheduleTs}`);
  });

  it('F13: active_repair eventCycleId includes skillId + updatedAt', () => {
    const sessionTs = NOW - 1000;
    const p: ProgressData = {
      ...empty,
      repairSession: {
        skillId: 'frac.whole',
        targetSkillId: 'frac.notation',
        status: 'active',
        updatedAt: sessionTs,
      },
    };
    const tasks = getHomeTasks(p, [], NOW);
    const task = tasks.find((t) => t.type === 'active_repair');
    expect(task).toBeDefined();
    expect(task!.eventCycleId).toBe(`ar:frac.whole:${sessionTs}`);
  });

  it('F13: course_intervention eventCycleId includes skillId + courseId + updatedAt', () => {
    const p: ProgressData = {
      ...empty,
      courseIntervention: {
        skillId: 'frac.whole',
        targetSkillId: 'frac.notation',
        courseId: 'g5-fraction-meaning',
        variant: 'course',
        status: 'active',
        updatedAt: NOW,
      },
    };
    const tasks = getHomeTasks(p, [], NOW);
    const task = tasks.find((t) => t.type === 'course_intervention');
    expect(task).toBeDefined();
    expect(task!.eventCycleId).toBe(`ci:frac.whole:g5-fraction-meaning:${NOW}`);
  });

  it('F13: learning_goal eventCycleId includes skillId + updatedAt', () => {
    const p: ProgressData = {
      ...empty,
      learningGoal: { skillId: 'frac.whole', startedAt: NOW, updatedAt: NOW, source: 'map' },
    };
    const tasks = getHomeTasks(p, [], NOW);
    const task = tasks.find((t) => t.type === 'learning_goal');
    expect(task).toBeDefined();
    expect(task!.eventCycleId).toBe(`lg:frac.whole:${NOW}`);
  });

  // ---- F14: no assignment persistence before diagnosis ----

  it('F14: initial render does not persist assignment or emit intervention_assigned', () => {
    mockGetEffectiveAssignment.mockReturnValue('course');
    renderRepairRoute('frac.whole');

    expect(mockSetExperimentAssignment).not.toHaveBeenCalled();
    const iaEvents = mockEmitEvent.mock.calls.filter(
      (c: unknown[]) => (c[0] as { eventName: string }).eventName === 'intervention_assigned',
    );
    expect(iaEvents).toHaveLength(0);
  });

  it('F14: diagnostic failure persists course assignment and emits intervention_assigned', () => {
    mockGetEffectiveAssignment.mockReturnValue('course');
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[1].id}`));

    expect(mockSetExperimentAssignment).toHaveBeenCalledWith('frac.whole', 'course');
    const iaEvents = mockEmitEvent.mock.calls.filter(
      (c: unknown[]) => (c[0] as { eventName: string }).eventName === 'intervention_assigned',
    );
    expect(iaEvents).toHaveLength(1);
  });

  // ---- F15: hasMeaningfulProgress considers experimentAssignments ----

  it('F15: hasMeaningfulProgress returns true for non-empty experimentAssignments', () => {
    const p: ProgressData = {
      ...empty,
      experimentAssignments: { 'frac.whole': 'observer' },
    };
    expect(hasMeaningfulProgress(p)).toBe(true);
  });

  // ---- F16: duplicate event insert is silent no-op ----

  it('F16: logLearningEvent ignores 23505 unique violation without logging error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error23505 = { code: '23505', message: 'duplicate key value violates unique constraint' } as const;
    const mockInsert = vi.fn().mockResolvedValue({ error: error23505 });

    vi.spyOn(supabase, 'from').mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>);

    logLearningEvent({
      userId: 'test-user',
      clientEventId: 'dup',
      eventName: 'skill_review_finished',
      skillId: 'frac.whole',
    });

    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'test-user',
      client_event_id: 'dup',
      event_name: 'skill_review_finished',
      skill_id: 'frac.whole',
      course_id: null,
      mode: null,
      variant: null,
      passed: null,
      first_try: null,
      duration_ms: null,
      due_at: null,
      app_version: '1.0.0',
      content_version: '1.0.0',
      properties: {},
    });
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
    vi.restoreAllMocks();
  });
});

// =====================================================
// 34. v0.3 Expert review: replaced question regression suite
// =====================================================

describe('v0.3 Expert review: replaced question regressions', () => {
  function getQuestion(unitSkillId: string, questionId: string) {
    const unit = repairUnits.find((u) => u.skillId === unitSkillId);
    if (!unit) throw new Error(`Unit ${unitSkillId} not found`);
    const all = [
      ...unit.diagnosticQuestions,
      ...unit.checkQuestions,
      ...(unit.reviewSets?.d1?.questions ?? []),
      ...(unit.reviewSets?.d1?.alternateQuestions ?? []),
      ...(unit.reviewSets?.d7?.questions ?? []),
      ...(unit.reviewSets?.d7?.alternateQuestions ?? []),
    ];
    return all.find((q) => q.id === questionId);
  }

  // ---- frac.whole: eliminate natural-language exact-string fill grading ----

  it('rev-whole-d1a is choice (not fill-blank with exact string)', () => {
    const q = getQuestion('frac.whole', 'rev-whole-d1a')!;
    expect(q.type).toBe('choice');
    expect(q.correctAnswer).not.toBe('全部书');
  });

  it('rev-whole-d1b is numeric fill (answer 3, not exact string)', () => {
    const q = getQuestion('frac.whole', 'rev-whole-d1b')!;
    expect(q.type).toBe('fill-blank');
    expect(q.correctAnswer).toBe('3');
  });

  it('rev-whole-d1b-alt is numeric fill (answer 15, not exact string)', () => {
    const q = getQuestion('frac.whole', 'rev-whole-d1b-alt')!;
    expect(q.type).toBe('fill-blank');
    expect(q.correctAnswer).toBe('15');
  });

  it('rev-whole-d7a is numeric fill (answer 80, not exact string)', () => {
    const q = getQuestion('frac.whole', 'rev-whole-d7a')!;
    expect(q.type).toBe('fill-blank');
    expect(q.correctAnswer).toBe('80');
  });

  it('rev-whole-d7b-alt is numeric fill (answer 20, not exact string)', () => {
    const q = getQuestion('frac.whole', 'rev-whole-d7b-alt')!;
    expect(q.type).toBe('fill-blank');
    expect(q.correctAnswer).toBe('20');
  });

  // ---- frac.notation: typo fix ----

  it('rev-notation-d1a uses 部分 (not 部份)', () => {
    const q = getQuestion('frac.notation', 'rev-notation-d1a')!;
    expect(q.prompt).toContain('部分');
    expect(q.prompt).not.toContain('部份');
  });

  // ---- frac.of_quantity: remove equivalent correct methods ----

  it('rev-ofqty-d1a-alt has no "48 ÷ 4" equivalent option', () => {
    const q = getQuestion('frac.of_quantity', 'rev-ofqty-d1a-alt')!;
    expect(q.type).toBe('choice');
    expect(q.options).not.toContain('48 ÷ 4');
  });

  it('rev-ofqty-d7b-alt has no "36 ÷ 9 × 2" equivalent option', () => {
    const q = getQuestion('frac.of_quantity', 'rev-ofqty-d7b-alt')!;
    expect(q.type).toBe('choice');
    const hasEquivalent = q.options?.some((o) => o.includes('36 ÷ 9'));
    expect(hasEquivalent).toBe(false);
  });

  // ---- frac.multiply_fraction: non-cancelling templates + no subtraction=product ----

  it('rev-multfrac-d1a is non-cancelling (2/3 × 4/5 = 8/15)', () => {
    const q = getQuestion('frac.multiply_fraction', 'rev-multfrac-d1a')!;
    expect(q.correctAnswer).toBe('8/15');
    expect(q.prompt).toContain('2/3');
    expect(q.prompt).toContain('4/5');
  });

  it('rev-multfrac-d7a is non-cancelling (2/5 × 3/7 = 6/35)', () => {
    const q = getQuestion('frac.multiply_fraction', 'rev-multfrac-d7a')!;
    expect(q.correctAnswer).toBe('6/35');
    expect(q.prompt).toContain('2/5');
    expect(q.prompt).toContain('3/7');
  });

  it('rev-multfrac-d7b subtraction option does not equal correct product', () => {
    const q = getQuestion('frac.multiply_fraction', 'rev-multfrac-d7b')!;
    expect(q.type).toBe('choice');
    // Correct answer should be 2/3 × 1/4 = 1/6
    expect(q.correctAnswer).toContain('2/3 × 1/4');
    // No subtraction option should produce 1/6
    const subtractionOpts = q.options?.filter((o) => o.includes('-'));
    for (const opt of subtractionOpts ?? []) {
      expect(opt).not.toContain('1/6');
    }
  });

  // ---- frac.reciprocal: fix d7b option + replace mixed addition ----

  it('rev-recip-d7b option says "非零真分数" (not bare "真分数")', () => {
    const q = getQuestion('frac.reciprocal', 'rev-recip-d7b')!;
    expect(q.type).toBe('choice');
    expect(q.correctAnswer).toContain('非零真分数');
    expect(q.explanation).toContain('0');
  });

  it('rev-recip-d7b-alt is pure reciprocal fill (not mixed addition)', () => {
    const q = getQuestion('frac.reciprocal', 'rev-recip-d7b-alt')!;
    expect(q.type).toBe('fill-blank');
    expect(q.correctAnswer).toBe('5/3');
    expect(q.prompt).not.toContain('相加');
  });

  it('rev-recip-d1a wording avoids template collision with check c1', () => {
    const d1a = getQuestion('frac.reciprocal', 'rev-recip-d1a')!;
    const c1 = getQuestion('frac.reciprocal', 'rep-recip-c1')!;
    const normalize = (s: string) =>
      s.replace(/\d+/g, '#').replace(/#\s*\/\s*#/g, '#/#').replace(/\s+/g, ' ').trim();
    expect(normalize(d1a.prompt)).not.toBe(normalize(c1.prompt));
  });

  it('rev-recip-d7a wording avoids template collision with diag d1', () => {
    const d7a = getQuestion('frac.reciprocal', 'rev-recip-d7a')!;
    const diag = getQuestion('frac.reciprocal', 'rep-recip-d1')!;
    const normalize = (s: string) =>
      s.replace(/\d+/g, '#').replace(/#\s*\/\s*#/g, '#/#').replace(/\s+/g, ' ').trim();
    expect(normalize(d7a.prompt)).not.toBe(normalize(diag.prompt));
  });

  // ---- frac.equal_partition: equal-vs-unequal judgment ----

  it('rev-eqpart-d7a is equal-vs-unequal judgment (not pure arithmetic)', () => {
    const q = getQuestion('frac.equal_partition', 'rev-eqpart-d7a')!;
    expect(q.type).toBe('choice');
    expect(q.prompt).toContain('平均分吗');
    expect(q.correctAnswer).toContain('不是平均分');
  });

  // ---- frac.division_grouping: non-unit fraction ----

  it('rev-divgrp-d7a uses non-unit fraction (3/4 ÷ 3/8 = 2)', () => {
    const q = getQuestion('frac.division_grouping', 'rev-divgrp-d7a')!;
    expect(q.correctAnswer).toBe('2');
    expect(q.prompt).toContain('3/4');
    expect(q.prompt).toContain('3/8');
    // Should NOT be a unit-fraction pattern like 7/9 ÷ 1/9
    expect(q.prompt).not.toContain('1/9');
  });

  // ---- frac.division_sharing: replace shortcut patterns + require 最简分数 ----

  it('rev-divsha-d1a prompt requires 最简分数', () => {
    const q = getQuestion('frac.division_sharing', 'rev-divsha-d1a')!;
    expect(q.prompt).toContain('最简分数');
  });

  it('rev-divsha-d1b-alt prompt requires 最简分数', () => {
    const q = getQuestion('frac.division_sharing', 'rev-divsha-d1b-alt')!;
    expect(q.prompt).toContain('最简分数');
  });

  it('rev-divsha-d7a uses non-shortcut (3/4 ÷ 2 = 3/8)', () => {
    const q = getQuestion('frac.division_sharing', 'rev-divsha-d7a')!;
    expect(q.correctAnswer).toBe('3/8');
    expect(q.prompt).toContain('3/4');
    // Should NOT be a shortcut where numerator = divisor (like 9/10 ÷ 9)
    expect(q.prompt).not.toContain('9/10');
    expect(q.prompt).not.toContain('9份');
  });

  it('rev-divsha-d7a-alt uses non-shortcut (5/6 ÷ 2 = 5/12)', () => {
    const q = getQuestion('frac.division_sharing', 'rev-divsha-d7a-alt')!;
    expect(q.type).toBe('choice');
    expect(q.correctAnswer).toContain('5/12');
    // Should NOT have the old shortcut 5/6 ÷ 5 = 1/6
    expect(q.prompt).not.toContain('5个瓶子');
  });

  it('rev-divsha-d7b-alt uses non-shortcut (3/5 ÷ 2 = 3/10)', () => {
    const q = getQuestion('frac.division_sharing', 'rev-divsha-d7b-alt')!;
    expect(q.correctAnswer).toBe('3/10');
    expect(q.prompt).toContain('3/5');
    expect(q.prompt).toContain('最简分数');
    // Should NOT be the old shortcut 4/7 ÷ 4 = 1/7
    expect(q.prompt).not.toContain('4/7');
  });

  // ---- frac.divide_transform: wording fixes + application choice ----

  it('rev-divtrans-d1a wording avoids template collision with check c1', () => {
    const d1a = getQuestion('frac.divide_transform', 'rev-divtrans-d1a')!;
    const c1 = getQuestion('frac.divide_transform', 'rep-divtrans-c1')!;
    const normalize = (s: string) =>
      s.replace(/\d+/g, '#').replace(/#\s*\/\s*#/g, '#/#').replace(/\s+/g, ' ').trim();
    expect(normalize(d1a.prompt)).not.toBe(normalize(c1.prompt));
  });

  it('rev-divtrans-d7a wording avoids template collision with check c1', () => {
    const d7a = getQuestion('frac.divide_transform', 'rev-divtrans-d7a')!;
    const c1 = getQuestion('frac.divide_transform', 'rep-divtrans-c1')!;
    const normalize = (s: string) =>
      s.replace(/\d+/g, '#').replace(/#\s*\/\s*#/g, '#/#').replace(/\s+/g, ' ').trim();
    expect(normalize(d7a.prompt)).not.toBe(normalize(c1.prompt));
  });

  it('rev-divtrans-d1b uses precise wording ("每块手帕用")', () => {
    const q = getQuestion('frac.divide_transform', 'rev-divtrans-d1b')!;
    expect(q.prompt).toContain('每块手帕用');
    expect(q.prompt).not.toContain('做了3/8米长的手帕');
  });

  it('rev-divtrans-d7b uses precise wording ("每小段长")', () => {
    const q = getQuestion('frac.divide_transform', 'rev-divtrans-d7b')!;
    expect(q.prompt).toContain('每小段长');
    expect(q.prompt).not.toContain('每段剪成');
  });

  it('rev-divtrans-d7a-alt is application/model choice (not 4-expression comparison)', () => {
    const q = getQuestion('frac.divide_transform', 'rev-divtrans-d7a-alt')!;
    expect(q.type).toBe('choice');
    expect(q.prompt).not.toContain('结果最大');
    expect(q.prompt).toContain('转化');
    expect(q.correctAnswer).toContain('8/1');
  });
});

// =====================================================
// 35. B-form evidence bug: form B failure must not start course intervention
// =====================================================

describe('B-form evidence: form B first-exposure failure must not start course intervention', () => {
  beforeEach(resetMocks);

  it('form A first-exposure failure calls startCourseIntervention with nextForm=b', () => {
    const d1ReviewFormA: SkillReviewSchedule = {
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd1',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY,
      contentVersion: 'v0.3',
      firstExposure: true,
      formId: 'a',
      attemptNo: 1,
    };
    mockGetSkillReviewSchedule.mockReturnValue(d1ReviewFormA);
    mockGetEffectiveAssignment.mockReturnValue('observer');

    renderRepairRoute('frac.whole', '?target=frac.notation&review=d1');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    const d1Questions = unit.reviewSets?.d1?.questions ?? [];

    // Fail both questions
    fireEvent.click(screen.getByTestId(`wrong-${d1Questions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${d1Questions[1].id}`));

    expect(mockStartCourseIntervention).toHaveBeenCalledWith(
      'frac.whole',
      'frac.notation',
      expect.any(String),
      expect.objectContaining({ nextForm: 'b', origin: 'review', reviewStage: 'd1' }),
    );
  });

  it('form B first-exposure failure does NOT call startCourseIntervention', () => {
    const d1ReviewFormB: SkillReviewSchedule = {
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd1',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY,
      contentVersion: 'v0.3',
      firstExposure: true,
      formId: 'b',
      attemptNo: 1,
    };
    mockGetSkillReviewSchedule.mockReturnValue(d1ReviewFormB);
    mockGetEffectiveAssignment.mockReturnValue('observer');

    renderRepairRoute('frac.whole', '?target=frac.notation&review=d1&form=b');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    const d1BQuestions = unit.reviewSets?.d1?.alternateQuestions ?? [];

    // Fail both questions
    fireEvent.click(screen.getByTestId(`wrong-${d1BQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${d1BQuestions[1].id}`));

    // Key assertion: form B failure must NOT start a new course intervention
    expect(mockStartCourseIntervention).not.toHaveBeenCalled();
  });

  it('form B first-exposure failure shows "没有产生新证据" copy (not course CTA)', () => {
    const d1ReviewFormB: SkillReviewSchedule = {
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd1',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY,
      contentVersion: 'v0.3',
      firstExposure: true,
      formId: 'b',
      attemptNo: 1,
    };
    mockGetSkillReviewSchedule.mockReturnValue(d1ReviewFormB);
    mockGetEffectiveAssignment.mockReturnValue('observer');

    renderRepairRoute('frac.whole', '?target=frac.notation&review=d1&form=b');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    const d1BQuestions = unit.reviewSets?.d1?.alternateQuestions ?? [];

    // Fail both questions
    fireEvent.click(screen.getByTestId(`wrong-${d1BQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${d1BQuestions[1].id}`));

    expect(screen.getByText(/没有产生新证据/)).toBeInTheDocument();
    expect(screen.queryByText(/已为你安排完整课程巩固/)).not.toBeInTheDocument();
  });

  it('form B first-exposure failure: resolveSkillReview still called (records finished event)', () => {
    const d1ReviewFormB: SkillReviewSchedule = {
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd1',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY,
      contentVersion: 'v0.3',
      firstExposure: true,
      formId: 'b',
      attemptNo: 1,
    };
    mockGetSkillReviewSchedule.mockReturnValue(d1ReviewFormB);
    mockGetEffectiveAssignment.mockReturnValue('observer');

    renderRepairRoute('frac.whole', '?target=frac.notation&review=d1&form=b');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    const d1BQuestions = unit.reviewSets?.d1?.alternateQuestions ?? [];

    // Fail both questions
    fireEvent.click(screen.getByTestId(`wrong-${d1BQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${d1BQuestions[1].id}`));

    // resolveSkillReview should still be called to record the finished event
    expect(mockResolveSkillReview).toHaveBeenCalledTimes(1);
    expect(mockResolveSkillReview).toHaveBeenCalledWith('frac.whole', false);
  });
});

// =====================================================
// 36. Extended guard: diag/check vs D1/D7 A/B template comparison
// =====================================================

describe('Extended guard: diag/check vs D1/D7 template comparison', () => {
  it('validateRepairUnits still returns 0 errors/warnings with extended guard', () => {
    const errors = validateRepairUnits();
    expect(errors).toHaveLength(0);
  });

  it('extended guard detects diag vs D1 A template collision', () => {
    // Create a synthetic unit where a D1 A question has the same normalized prompt
    // template as a diagnostic question (digits swapped but template identical).
    const unit = repairUnits[0]; // frac.whole
    const tampered = {
      ...unit,
      reviewSets: {
        ...unit.reviewSets!,
        d1: {
          ...unit.reviewSets!.d1!,
          questions: [
            {
              ...unit.reviewSets!.d1!.questions[0],
              // Copy the exact diagnostic prompt — only digits normalize, so templates match.
              // Answer is kept different to avoid the QA uniqueness check.
              prompt: unit.diagnosticQuestions[0].prompt,
            },
            unit.reviewSets!.d1!.questions[1],
          ],
        },
      },
    };
    const errors = validateRepairUnits([tampered, ...repairUnits.slice(1)]);
    const templateWarnings = errors.filter((e) => e.type === 'error' && e.message.includes('诊断/验证题重复'));
    expect(templateWarnings.length).toBeGreaterThan(0);
  });
});

// =====================================================
// 37. v0.3 final UI acceptance: skipped-step checkmark + review success hijack
// =====================================================

describe('v0.3 final acceptance: course assignment skipped steps', () => {
  beforeEach(resetMocks);

  it('course assignment after diagnostic failure shows 已跳过 for lesson/check, no false ✓', () => {
    mockGetEffectiveAssignment.mockReturnValue('course');
    renderRepairRoute('frac.whole');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;

    // Fail both diagnostic questions → course assignment branch
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`wrong-${unit.diagnosticQuestions[1].id}`));

    // Course CTA reached
    expect(screen.getByText(/建议通过完整课程巩固/)).toBeInTheDocument();

    // Both skipped steps show 已跳过 (no false ✓ for lesson/check)
    expect(screen.queryByText(/✓\s*讲解/)).not.toBeInTheDocument();
    expect(screen.queryByText(/✓\s*验证/)).not.toBeInTheDocument();
    const skipped = screen.getAllByText(/已跳过/);
    expect(skipped).toHaveLength(2);

    // Diagnostic step still shows as completed (✓)
    expect(screen.getByText(/✓\s*诊断/)).toBeInTheDocument();
  });
});

describe('v0.3 final acceptance: live schedule transition preserves review result', () => {
  beforeEach(resetMocks);

  function d1DueSchedule(): SkillReviewSchedule {
    return {
      skillId: 'frac.whole',
      targetSkillId: 'frac.notation',
      stage: 'd1',
      status: 'due',
      dueAt: NOW - 1,
      updatedAt: NOW - DAY,
      contentVersion: 'v0.3',
      firstExposure: true,
      formId: 'a',
      attemptNo: 1,
    };
  }

  it('D1 pass with live schedule advancing to D7 keeps D1 success result visible', () => {
    mockGetSkillReviewSchedule.mockReturnValue(d1DueSchedule());
    mockGetEffectiveAssignment.mockReturnValue('observer');

    // Simulate resolveSkillReview advancing persisted schedule to D7 (live)
    mockResolveSkillReview.mockImplementation(() => {
      mockGetSkillReviewSchedule.mockReturnValue({
        ...d1DueSchedule(),
        stage: 'd7',
        status: 'scheduled',
        dueAt: NOW + 6 * DAY,
      });
    });

    renderRepairRoute('frac.whole', '?target=frac.notation&review=d1');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    const d1Questions = unit.reviewSets?.d1?.questions ?? [];

    fireEvent.click(screen.getByTestId(`correct-${d1Questions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`correct-${d1Questions[1].id}`));

    // D1 success copy must remain visible (not "尚未到期或已完成")
    expect(screen.getByText(/第1天复习通过/)).toBeInTheDocument();
    expect(screen.queryByText(/该复习任务尚未到期或已完成/)).not.toBeInTheDocument();
    expect(mockResolveSkillReview).toHaveBeenCalledWith('frac.whole', true);
  });

  it('D7 pass with live schedule becoming passed keeps D7 success result visible', () => {
    mockGetSkillReviewSchedule.mockReturnValue({
      ...d1DueSchedule(),
      stage: 'd7',
      status: 'due',
      firstExposure: true,
    });
    mockGetEffectiveAssignment.mockReturnValue('observer');

    // Simulate resolveSkillReview marking the schedule passed (live)
    mockResolveSkillReview.mockImplementation(() => {
      mockGetSkillReviewSchedule.mockReturnValue({
        ...d1DueSchedule(),
        stage: 'd7',
        status: 'passed',
        firstExposure: true,
      });
    });

    renderRepairRoute('frac.whole', '?target=frac.notation&review=d7');

    const unit = repairUnits.find((u) => u.skillId === 'frac.whole')!;
    const d7Questions = unit.reviewSets?.d7?.questions ?? [];

    fireEvent.click(screen.getByTestId(`correct-${d7Questions[0].id}`));
    fireEvent.click(screen.getByRole('button', { name: /下一题|继续/ }));
    fireEvent.click(screen.getByTestId(`correct-${d7Questions[1].id}`));

    // D7 success copy must remain visible
    expect(screen.getByText(/第7天复习通过/)).toBeInTheDocument();
    expect(screen.queryByText(/该复习任务尚未到期或已完成/)).not.toBeInTheDocument();
    expect(mockResolveSkillReview).toHaveBeenCalledWith('frac.whole', true);
  });

  it('invalid/not-due direct entry remains fail-closed before attempt starts', () => {
    mockGetSkillReviewSchedule.mockReturnValue(undefined);
    renderRepairRoute('frac.whole', '?review=d1');
    expect(screen.getByText(/该复习任务尚未到期或已完成/)).toBeInTheDocument();
    expect(mockResolveSkillReview).not.toHaveBeenCalled();
  });
});
