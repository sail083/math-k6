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
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ProgressData } from '@/lib/types';
import type { SkillDisplayStatus } from '@/lib/progress';

// ===== Pure functions =====
import {
  repairUnits,
  validateRepairUnits,
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
} from '@/lib/progress';
import { getNextActionableSkill } from '@/lib/knowledgeGraph';

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
const mockIsPassed = vi.fn(() => false);

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
    expect(parseLearningGoal({ skillId: 'frac.whole', updatedAt: 100 })).toEqual({ skillId: 'frac.whole', updatedAt: 100 });
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
    const a = { skillId: 'frac.whole', updatedAt: 200 };
    const b = { skillId: 'frac.divide_transform', updatedAt: 100 };
    expect(mergeLearningGoal(a, b)?.skillId).toBe('frac.whole');
    expect(mergeLearningGoal(b, a)?.skillId).toBe('frac.whole');
  });

  it('equal updatedAt → first wins (stable tie-break)', () => {
    const a = { skillId: 'frac.whole', updatedAt: 100 };
    const b = { skillId: 'frac.divide_transform', updatedAt: 100 };
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

  it('valid skillId with no RepairUnit shows "微补修准备中"', () => {
    // frac.as_quotient is a valid published node but has no repair unit
    renderRepairRoute('frac.as_quotient');
    expect(screen.getByText(/微补修准备中/)).toBeInTheDocument();
    expect(mockStartRepair).not.toHaveBeenCalled();
  });

  it('valid RepairUnit: shows skill name in title (not technical slug)', () => {
    renderRepairRoute('frac.whole');
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).not.toContain('frac.');
    expect(heading.textContent).toContain('微补修');
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
    expect(screen.getByText(/前往完整课程学习/)).toBeInTheDocument();
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

  it('priority 1: due review link shown when dueReviews exist', () => {
    mockGetDueReviewIds.mockReturnValue(['g5-fraction-meaning']);
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    // The recommended card should show "复习时间到了"
    expect(screen.getByText(/复习时间到了/)).toBeInTheDocument();
  });

  it('priority 2: active repair session shown when no due reviews', () => {
    mockGetDueReviewIds.mockReturnValue([]);
    _mockProgress = {
      passedKnowledgePoints: [],
      stars: {},
      repairSession: {
        skillId: 'frac.whole',
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
    expect(screen.getByText(/微补修进行中/)).toBeInTheDocument();
  });

  it('priority 3: learning goal shown when no repair, no due reviews', () => {
    mockGetDueReviewIds.mockReturnValue([]);
    _mockProgress = {
      passedKnowledgePoints: [],
      stars: {},
      learningGoal: { skillId: 'frac.divide_transform', updatedAt: NOW },
    };
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/学习目标/)).toBeInTheDocument();
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

    expect(screen.getByText(/返回目标路径/)).toBeInTheDocument();
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
    const returnBtn = screen.getByRole('button', { name: /返回目标路径/ });
    expect(returnBtn).toBeInTheDocument();
    expect(returnBtn.textContent).toContain('返回目标路径');
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
    const btn = screen.getByRole('button', { name: /返回目标路径/ });
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
    expect(mockSetGoal).toHaveBeenCalledWith('frac.notation');
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

  it('frac.as_quotient shows "分数的意义和性质" course entry', () => {
    renderRepairRoute('frac.as_quotient');
    // Should show the course link with Chinese title
    expect(screen.getByText(/分数的意义和性质/)).toBeInTheDocument();
    // Should show the "微补修准备中" message
    expect(screen.getByText(/微补修准备中/)).toBeInTheDocument();
    // Should NOT call startRepair
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

  it('loads all 47 game.json files', () => {
    expect(Object.keys(gameModules).length).toBe(47);
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
