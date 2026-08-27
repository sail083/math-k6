/**
 * SkillRepairPage — v0.3 微补修闭环 + 技能复习
 *
 * 路由：/repair/:skillId
 * 普通模式状态机：
 *   diagnostic →
 *     2/2 firstTry 全对 → 直接 result (passed=true, 1次 summary + 1次 finish)
 *     否则 → lesson → check → result
 * 复习模式 (?review=d1|d7)：
 *   review → result (2/2 firstTry = pass, else fail)
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import ChoiceGame from '@/components/games/ChoiceGame';
import FillBlankGame from '@/components/games/FillBlankGame';
import GoalContextBar from '@/components/GoalContextBar';
import { useProgress } from '@/context/ProgressContext';
import { useAuth } from '@/context/AuthContext';
import { getRepairUnit } from '@/lib/repairContent';
import { getSkillById, getSkillContext } from '@/lib/knowledgeGraph';
import { getKnowledgePointById } from '@/lib/content';
import type { Question } from '@/lib/types';

/** Check if a skill ID corresponds to a published node in the graph */
function isValidPublishedTarget(id: string): boolean {
  const node = getSkillById(id);
  return !!node && node.status === 'published';
}

// ===== 题目组件选择器 =====

interface QuestionRendererProps {
  question: Question;
  onAnswer: (isCorrect: boolean, firstTry: boolean) => void;
}

/**
 * 渲染单道题。通过 key={question.id} 在调用处保证每道新题重新挂载，
 * answered ref 也随之从头初始化，避免跨题状态残留。
 */
function QuestionRenderer({ question, onAnswer }: QuestionRendererProps) {
  const answered = useRef(false);

  const handleAnswer = (_selected: string, isCorrect: boolean, firstTry?: boolean) => {
    if (answered.current) return;
    answered.current = true;
    onAnswer(isCorrect, firstTry ?? false);
  };

  if (question.type === 'choice') {
    return <ChoiceGame question={question} onAnswer={handleAnswer} />;
  }
  if (question.type === 'fill-blank') {
    return <FillBlankGame question={question} onAnswer={handleAnswer} />;
  }
  return (
    <p className="text-sm text-slate-500">（该题型暂不支持在补修中使用）</p>
  );
}

// ===== 主页面 =====

type RepairPhase = 'diagnostic' | 'lesson' | 'check' | 'result';
type ReviewPhase = 'review' | 'result';

interface AnswerRecord {
  isCorrect: boolean;
  firstTry: boolean;
}

// Substate for a phase: which question index we're on, and whether we're showing feedback
interface PhaseState {
  index: number;
  answered: boolean; // true = answered, showing feedback + "下一题" button
  answers: AnswerRecord[];
}

export default function SkillRepairPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    progress,
    recordSkillEvidence,
    startRepair,
    finishRepair,
    isSkillReadyForPath,
    // v0.3
    scheduleSkillReview,
    resolveSkillReview,
    getSkillReviewSchedule,
    getEffectiveAssignment,
    setExperimentAssignment,
    startCourseIntervention,
    emitEvent,
  } = useProgress();

  const repairUnit = skillId ? getRepairUnit(skillId) : undefined;
  const skillNode = skillId ? getSkillById(skillId) : undefined;

  // Check if skill exists in the graph (vs just no repair content)
  const skillExists = !!skillNode;

  // R2: Validate target from URL param and learningGoal — must be published nodes
  const rawUrlTarget = searchParams.get('target');
  const urlTarget = rawUrlTarget && isValidPublishedTarget(rawUrlTarget) ? rawUrlTarget : null;
  const goalTarget = progress.learningGoal?.skillId && isValidPublishedTarget(progress.learningGoal.skillId)
    ? progress.learningGoal.skillId
    : null;
  const DEFAULT_TARGET = 'frac.divide_transform';
  const targetSkillId = urlTarget ?? goalTarget ?? DEFAULT_TARGET;
  const encodedTargetSkillId = encodeURIComponent(targetSkillId);
  const activeGoal = progress.learningGoal?.skillId === targetSkillId
    && isValidPublishedTarget(progress.learningGoal.skillId)
    ? progress.learningGoal
    : undefined;

  // R2: Clean invalid target from URL (replace, no flicker)
  useEffect(() => {
    if (rawUrlTarget && !isValidPublishedTarget(rawUrlTarget)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('target');
      setSearchParams(newParams, { replace: true });
    }
  }, [rawUrlTarget, searchParams, setSearchParams]);

  // ===== v0.3: Review mode detection =====
  const rawReviewMode = searchParams.get('review');
  const reviewMode: 'd1' | 'd7' | null =
    rawReviewMode === 'd1' || rawReviewMode === 'd7' ? rawReviewMode : null;
  // F4: Non-null invalid review param → fail-closed (show invalid state, no repair)
  const isReviewParamInvalid = rawReviewMode !== null && reviewMode === null;

  // v0.3: Review form selection (A/B)
  const rawFormId = searchParams.get('form');
  const requestedFormId: 'a' | 'b' | null =
    rawFormId === 'a' || rawFormId === 'b' ? rawFormId : null;
  const isFormParamInvalid = rawFormId !== null && requestedFormId === null;

  // Validate review mode: must have a due schedule
  const reviewSchedule = skillId ? getSkillReviewSchedule(skillId) : undefined;
  const isReviewDue = reviewSchedule && (
    reviewSchedule.status === 'due' ||
    (reviewSchedule.status === 'scheduled' && reviewSchedule.dueAt <= Date.now())
  );
  const isReviewValid = reviewMode !== null && isReviewDue && reviewSchedule?.stage === reviewMode;
  // Form must match persisted schedule (fail-closed if mismatch)
  const effectiveFormId: 'a' | 'b' = requestedFormId ?? reviewSchedule?.formId ?? 'a';
  const isFormMismatch = requestedFormId !== null && reviewSchedule !== undefined && reviewSchedule.formId !== requestedFormId;
  const isReviewBlocked = isReviewParamInvalid || isFormParamInvalid || isFormMismatch;

  // ===== Experiment assignment (normal repair mode only) =====
  const experimentAssignment = skillId ? getEffectiveAssignment(skillId) : 'repair';

  // R1: Freeze initial readiness once on mount so that mid-session evidence updates
  // (which make isSkillReadyForPath return true) cannot hijack the active state machine.
  // In review mode, we bypass the ready check entirely.
  const initialReadinessRef = useRef<boolean | null>(null);
  if (initialReadinessRef.current === null) {
    initialReadinessRef.current = reviewMode !== null
      ? false // Review mode always bypasses ready-block
      : !!(skillId && skillExists && repairUnit && isSkillReadyForPath(skillId));
  }
  const isAlreadyReady = initialReadinessRef.current;

  // ===== State =====
  const [phase, setPhase] = useState<RepairPhase>('diagnostic');
  const [reviewPhase, setReviewPhase] = useState<ReviewPhase>('review');
  const [diagState, setDiagState] = useState<PhaseState>({ index: 0, answered: false, answers: [] });
  const [checkState, setCheckState] = useState<PhaseState>({ index: 0, answered: false, answers: [] });
  const [reviewState, setReviewState] = useState<PhaseState>({ index: 0, answered: false, answers: [] });
  const [passed, setPassed] = useState(false);
  const [fastPassed, setFastPassed] = useState(false);
  // F1: Post-diagnostic assignment — null = not yet computed, 'repair' | 'course'
  const [postDiagCourse, setPostDiagCourse] = useState(false);

  // Idempotency guards
  const sessionStarted = useRef(false);
  const diagSummaryRecorded = useRef(false);
  const checkSummaryRecorded = useRef(false);
  const finishCalled = useRef(false);
  const reviewRecorded = useRef(false);
  const reviewStartedRef = useRef(false);
  const reviewWasFirstExposureRef = useRef(false);
  const repairUnavailableShownRef = useRef(new Set<string>());

  // Start repair session on mount (once) — skip if already ready or review mode
  // F14: Do NOT persist repair|course assignment before diagnosis. All users start
  // diagnosis; only diagnostic failure persists repair|course; fast pass persists observer.
  useEffect(() => {
    if (!skillId || !repairUnit || isAlreadyReady || reviewMode || sessionStarted.current) return;
    if (isReviewBlocked) return; // F4: invalid review/form param → no session start
    sessionStarted.current = true;
    startRepair(skillId, targetSkillId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId, repairUnit, isAlreadyReady, reviewMode, isReviewBlocked]);

  // Published graph skills may not have a micro-repair unit. This hook remains
  // above every conditional return so direct unsupported routes are hook-safe.
  useEffect(() => {
    if (!skillId || !skillExists || repairUnit) return;

    const clientEventId = `rus:repair:${skillId}:${targetSkillId}:${activeGoal?.updatedAt ?? 0}`;
    if (repairUnavailableShownRef.current.has(clientEventId)) return;
    repairUnavailableShownRef.current.add(clientEventId);
    emitEvent?.({
      clientEventId,
      eventName: 'repair_unavailable_shown',
      skillId,
      properties: { surface: 'repair', targetSkillId },
    });
  }, [activeGoal?.updatedAt, emitEvent, repairUnit, skillExists, skillId, targetSkillId]);

  // ===== E: Review started effect — top-level, once per schedule cycle =====
  // F12: fire for every actual attempt (no firstExposure gate), gated on review phase,
  // valid/due schedule, and persisted schedule.updatedAt.
  useEffect(() => {
    if (
      !reviewStartedRef.current &&
      reviewPhase === 'review' &&
      reviewMode &&
      skillId &&
      isReviewValid &&
      !isReviewBlocked &&
      user &&
      reviewSchedule
    ) {
      reviewStartedRef.current = true;
      emitEvent({
        clientEventId: `review-start:${skillId}:${reviewMode}:${effectiveFormId}:${reviewSchedule.updatedAt}:${reviewSchedule.attemptNo}`,
        eventName: 'skill_review_started',
        skillId,
        mode: reviewMode,
        dueAt: new Date(reviewSchedule.dueAt).toISOString(),
        properties: {
          reviewCycleId: `rc:${skillId}:${reviewMode}:${effectiveFormId}:${reviewSchedule.updatedAt}`,
          attemptNo: reviewSchedule.attemptNo,
          firstExposure: reviewSchedule.firstExposure,
          evidenceEligible: reviewSchedule.firstExposure,
          formId: effectiveFormId,
        },
      });
    }
  }, [reviewPhase, reviewMode, skillId, reviewSchedule, isReviewValid, isReviewBlocked, effectiveFormId, user, emitEvent]);

  // ===== Error states =====

  if (!skillId) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <section className="rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 px-6 py-7 text-white shadow-lg">
          <h1 className="text-2xl font-bold mb-1">微补修</h1>
        </section>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center space-y-4">
          <p className="text-slate-600">无效的技能地址。</p>
          <Link
            to="/map"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
          >
            返回知识地图 →
          </Link>
        </div>
      </div>
    );
  }

  if (!skillExists) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <section className="rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 px-6 py-7 text-white shadow-lg">
          <h1 className="text-2xl font-bold mb-1">微补修</h1>
        </section>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center space-y-4">
          <p className="text-slate-600">技能不存在，请返回地图选择。</p>
          <Link
            to={`/map?target=${targetSkillId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
          >
            返回知识地图 →
          </Link>
        </div>
      </div>
    );
  }

  if (!repairUnit) {
    const ctx = getSkillContext(skillId);
    const sortedCourses = [...ctx.mappedCourses].sort((a, b) => {
      const order = { core: 0, review: 1, transfer: 2 };
      return order[a.role] - order[b.role];
    });
    const primaryCourse = sortedCourses[0];
    const primaryKp = primaryCourse ? getKnowledgePointById(primaryCourse.courseId) : undefined;

    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-7 text-white shadow-lg">
          <div className="flex items-center gap-2 text-violet-200 text-xs mb-2">
            <Link to={`/map?target=${targetSkillId}`} className="hover:text-white transition-colors">知识地图</Link>
            <span>›</span>
            <span>微补修</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">{skillNode.name} 微补修</h1>
        </section>
        {activeGoal && (
          <GoalContextBar
            targetSkillId={targetSkillId}
            goalUpdatedAt={activeGoal.updatedAt}
            surface="repair"
            mode="repair"
            currentSkillId={skillId}
          />
        )}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center space-y-4">
          <p className="text-2xl">📚</p>
          {primaryKp && (
            <>
              <p className="text-slate-700 font-semibold">通过完整课程学习这项技能</p>
              <p className="text-sm text-slate-500">完整课程会一步一步带你学会“{skillNode.name}”。</p>
              <Link
                to={`/kp/${primaryCourse.courseId}?target=${encodedTargetSkillId}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
              >
                学习完整课程
              </Link>
            </>
          )}
          {!primaryKp && (
            <p className="text-sm text-slate-600">这项技能暂时没有可以学习的课程，先回目标地图看看下一步吧。</p>
          )}
          <Link
            to={`/map?target=${encodedTargetSkillId}`}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
              primaryKp
                ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {primaryKp ? '继续我的目标' : '返回目标地图'}
          </Link>
        </div>
      </div>
    );
  }

  const hasRepairCourse = !!getKnowledgePointById(repairUnit.courseId);

  // F4: Invalid review/form param or mismatch — show safe invalid/not-due state (fail-closed)
  if (isReviewBlocked) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <section className="rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 px-6 py-7 text-white shadow-lg">
          <h1 className="text-2xl font-bold mb-1">技能复习</h1>
        </section>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center space-y-4">
          <p className="text-slate-600">该复习任务尚未到期或已完成。</p>
          <Link
            to={`/map?target=${targetSkillId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
          >
            返回知识地图 →
          </Link>
        </div>
      </div>
    );
  }

  // R1: Skill is already ready — no repair needed (not in review mode)
  if (isAlreadyReady && !reviewMode) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-7 text-white shadow-lg">
          <div className="flex items-center gap-2 text-emerald-200 text-xs mb-2">
            <Link to={`/map?target=${targetSkillId}`} className="hover:text-white transition-colors">知识地图</Link>
            <span>›</span>
            <span>微补修</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">{skillNode.name}</h1>
        </section>
        {activeGoal && (
          <GoalContextBar
            targetSkillId={targetSkillId}
            goalUpdatedAt={activeGoal.updatedAt}
            surface="repair"
            mode="repair"
            currentSkillId={skillId}
          />
        )}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-4">
          <p className="text-3xl">✅</p>
          <p className="text-lg font-bold text-emerald-700">已具备路径准备度</p>
          <p className="text-sm text-emerald-600">
            {skillNode.name}已经通过验证，无需补修，继续向目标推进！
          </p>
          <Link
            to={`/map?target=${targetSkillId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors min-h-[44px]"
          >
            继续我的目标
          </Link>
        </div>
      </div>
    );
  }

  // ===== v0.3: Review mode flow =====
  if (reviewMode && repairUnit.reviewSets) {
    const reviewSet = reviewMode === 'd1'
      ? repairUnit.reviewSets.d1
      : repairUnit.reviewSets.d7;
    const reviewQuestions = effectiveFormId === 'b'
      ? (reviewSet?.alternateQuestions ?? [])
      : (reviewSet?.questions ?? []);

    // Invalid/not-due review mode or missing form content — fall back.
    // F20: live schedule may advance (D1→D7, D7→passed) once the current attempt
    // transitions to 'result'; the not-due check must only block entry while still
    // reviewing. Param/identity mismatches and missing content stay fail-closed.
    const reviewEntryBlocked = isReviewBlocked || reviewQuestions.length !== 2;
    if ((!isReviewValid && reviewPhase === 'review') || reviewEntryBlocked) {
      return (
        <div className="space-y-4 max-w-2xl mx-auto">
          <section className="rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 px-6 py-7 text-white shadow-lg">
            <h1 className="text-2xl font-bold mb-1">技能复习</h1>
          </section>
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center space-y-4">
            <p className="text-slate-600">该复习任务尚未到期或已完成。</p>
            <Link
              to={`/map?target=${targetSkillId}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
            >
              返回知识地图 →
            </Link>
          </div>
        </div>
      );
    }

    const stageLabel = reviewMode === 'd1' ? '第1天复习' : '第7天复习';
    const formLabel = effectiveFormId === 'b' ? 'B卷（新题组）' : 'A卷';

    const handleReviewAnswer = (isCorrect: boolean, firstTry: boolean) => {
      const newAnswers = [...reviewState.answers, { isCorrect, firstTry }];

      if (reviewState.index < reviewQuestions.length - 1) {
        setReviewState({ index: reviewState.index, answered: true, answers: newAnswers });
      } else {
        // All review questions answered
        const allCorrectFirstTry = newAnswers.every((a) => a.isCorrect && a.firstTry);

        if (!reviewRecorded.current) {
          reviewRecorded.current = true;
          const wasFirstExposure = !!reviewSchedule?.firstExposure;
          reviewWasFirstExposureRef.current = wasFirstExposure;
          // Context's resolveSkillReview atomically records evidence, resolves schedule, and emits events
          resolveSkillReview(skillId, allCorrectFirstTry);

          // v0.3: Only form A first-exposure failure may start course remediation with nextForm='b'.
          // Form B failure stays due/practice-only — no new B evidence cycle.
          if (!allCorrectFirstTry && wasFirstExposure && effectiveFormId === 'a') {
            startCourseIntervention(skillId, targetSkillId, repairUnit.courseId, {
              reviewStage: reviewMode,
              nextForm: 'b',
              origin: 'review',
            });
          }
        }

        setPassed(allCorrectFirstTry);
        setReviewState({ index: reviewState.index, answered: true, answers: newAnswers });
        setReviewPhase('result');
      }
    };

    const handleReviewNext = () => {
      if (reviewState.index < reviewQuestions.length - 1) {
        setReviewState({ index: reviewState.index + 1, answered: false, answers: reviewState.answers });
      }
    };

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* 页面标题 */}
        <section className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-7 text-white shadow-lg">
          <div className="flex items-center gap-2 text-violet-200 text-xs mb-2">
            <Link to={`/map?target=${targetSkillId}`} className="hover:text-white transition-colors">知识地图</Link>
            <span>›</span>
            <span>技能复习</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {skillNode.name} · {stageLabel} · {formLabel}
          </h1>
          <p className="text-violet-100 text-sm mt-1">
            共 2 题，全部首次答对即通过
            {effectiveFormId === 'b' ? ' · 本题为新题组，答题结果可作为新证据' : ''}
          </p>
        </section>

        {activeGoal && (
          <GoalContextBar
            targetSkillId={targetSkillId}
            goalUpdatedAt={activeGoal.updatedAt}
            surface="review"
            mode="repair"
            currentSkillId={skillId}
          />
        )}

        {/* 进度指示 */}
        {reviewPhase === 'review' && (
          <div className="flex items-center gap-1" aria-label="复习进度">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div
                  className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-medium transition-colors ${
                    i === reviewState.index
                      ? 'bg-indigo-600 text-white'
                      : i < reviewState.index
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {i < reviewState.index ? '✓ ' : ''}第{i + 1}题
                </div>
                {i < 1 && <span className="text-slate-300 text-xs">›</span>}
              </div>
            ))}
          </div>
        )}

        {/* 复习答题 */}
        {reviewPhase === 'review' && (
          <div className="rounded-xl border border-indigo-200 bg-white p-5 space-y-4">
            <p className="text-xs font-semibold text-indigo-600">📝 {stageLabel} · {formLabel} {reviewState.index + 1}/2</p>
            <QuestionRenderer
              key={reviewQuestions[reviewState.index].id}
              question={reviewQuestions[reviewState.index]}
              onAnswer={handleReviewAnswer}
            />
            {reviewState.answered && reviewState.index < reviewQuestions.length - 1 && (
              <button
                type="button"
                onClick={handleReviewNext}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
              >
                下一题 →
              </button>
            )}
          </div>
        )}

        {/* 复习结果 */}
        {reviewPhase === 'result' && (
          <div className="space-y-4">
            {passed ? (
              reviewMode === 'd7' && !reviewSchedule?.firstExposure ? (
                // F11: repeated D7 is practice only; no new stable evidence
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-6 space-y-4">
                  <p className="text-2xl">📝</p>
                  <p className="text-lg font-bold text-sky-700">复习练习完成</p>
                  <p className="text-sm text-sky-600">
                    本次是复习练习，尚未产生新的稳固证据。建议完成完整课程后再来尝试。
                  </p>
                  {hasRepairCourse && (
                    <Link
                      to={`/kp/${repairUnit.courseId}?target=${encodedTargetSkillId}`}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
                    >
                      前往完整课程学习 →
                    </Link>
                  )}
                  <Link
                    to={`/map?target=${targetSkillId}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors min-h-[44px]"
                  >
                    继续我的目标
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-center space-y-3">
                  <p className="text-3xl">🎉</p>
                  <p className="text-lg font-bold text-emerald-700">
                    {reviewMode === 'd1' ? '第1天复习通过！' : '第7天复习通过！'}
                  </p>
                  <p className="text-sm text-emerald-600">
                    {reviewMode === 'd1'
                      ? '6天后会有一次巩固复习，继续加油！'
                      : '已记录第7天保持证据，继续保持！'}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/map?target=${targetSkillId}`)}
                    className="w-full py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors min-h-[44px]"
                  >
                    继续我的目标
                  </button>
                </div>
              )
            ) : (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 space-y-4">
                {reviewWasFirstExposureRef.current ? (
                  <>
                    <p className="text-lg font-bold text-amber-700">
                      {effectiveFormId === 'b'
                        ? '本题组还没通过，没有产生新证据'
                        : '本次复习还没通过'}
                    </p>
                    <p className="text-sm text-amber-600">
                      {effectiveFormId === 'b'
                        ? '建议复习完整课程后再练习。本题组已结束，再次练习只作为巩固，不再产生新的计分证据。'
                        : '没关系！完成完整课程后会有B卷新题组。也可以现在再练习一次A卷（再练不计分）。'}
                    </p>
                    {effectiveFormId === 'a' && (
                      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                        <p className="text-sm text-indigo-700">
                          已为你安排完整课程巩固，完成后解锁B卷新题组。
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-amber-700">本次是练习，不计入新证据</p>
                    <p className="text-sm text-amber-600">
                      可以再练习一次巩固手感，或前往完整课程复习。
                    </p>
                  </>
                )}
                {hasRepairCourse && (
                  <Link
                    to={`/kp/${repairUnit.courseId}?target=${encodedTargetSkillId}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
                  >
                    前往完整课程学习 →
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    // F5: Reset review state in place instead of navigating to same URL
                    // F12: reset started ref so the next attempt cycle emits skill_review_started
                    reviewRecorded.current = false;
                    reviewStartedRef.current = false;
                    reviewWasFirstExposureRef.current = false;
                    setReviewState({ index: 0, answered: false, answers: [] });
                    setReviewPhase('review');
                    setPassed(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  {reviewWasFirstExposureRef.current && effectiveFormId === 'a'
                    ? '再练一次 A卷（不计分）→'
                    : '再练一次（不计分）→'}
                </button>
                <Link
                  to={`/map?target=${targetSkillId}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  继续我的目标
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ===== Normal repair flow =====

  const diagQuestions = repairUnit.diagnosticQuestions;
  const checkQuestions = repairUnit.checkQuestions;
  const lesson = repairUnit.lesson;

  // ===== 诊断阶段 =====

  const handleDiagAnswer = (isCorrect: boolean, firstTry: boolean) => {
    const newAnswers = [...diagState.answers, { isCorrect, firstTry }];

    if (diagState.index < diagQuestions.length - 1) {
      setDiagState({ index: diagState.index, answered: true, answers: newAnswers });
    } else {
      const allCorrectFirstTry = newAnswers.every((a) => a.isCorrect && a.firstTry);

      if (allCorrectFirstTry) {
        // Fast pass
        if (!diagSummaryRecorded.current) {
          diagSummaryRecorded.current = true;
          recordSkillEvidence(skillId, true, true, 'transfer', 'repair');
        }
        if (!finishCalled.current) {
          finishCalled.current = true;
          finishRepair(skillId);
          // v0.3: Schedule D1 after successful repair (including fast pass)
          // Context's scheduleSkillReview emits skill_review_scheduled
          scheduleSkillReview(skillId, targetSkillId, 'd1');
          // Fast pass users are observers
          if (user && experimentAssignment !== 'observer') {
            setExperimentAssignment(skillId, 'observer');
          }
          // C: intervention_completed for fast pass (observer variant)
          if (user && progress.repairSession?.status === 'active') {
            emitEvent({
              clientEventId: `ic:${skillId}:observer:${progress.repairSession.updatedAt}`,
              eventName: 'intervention_completed',
              skillId,
              variant: 'observer',
            });
          }
        }
        setPassed(true);
        setFastPassed(true);
        setDiagState({ index: diagState.index, answered: true, answers: newAnswers });
        setPhase('result');
      } else {
        // Diagnostic failure — compute assignment (F1)
        if (!diagSummaryRecorded.current) {
          diagSummaryRecorded.current = true;
          recordSkillEvidence(skillId, false, false, 'transfer', 'repair');
        }
        setDiagState({ index: diagState.index, answered: true, answers: newAnswers });

        // F1: Compute and persist assignment after diagnostic failure
        const assignment = experimentAssignment === 'observer' ? 'repair' : experimentAssignment;
        if (user && skillId && !progress.experimentAssignments?.[skillId]) {
          setExperimentAssignment(skillId, assignment as 'repair' | 'course');
        }

        // C: intervention_assigned for BOTH variants after diagnostic failure
        const repairCycleId = progress.repairSession?.updatedAt ?? 0;

        if (assignment === 'course') {
          // Course group: emit intervention_assigned, start intervention, show course CTA
          if (user) {
            emitEvent({
              clientEventId: `ia:${skillId}:course:${repairCycleId}`,
              eventName: 'intervention_assigned',
              skillId,
              courseId: repairUnit.courseId,
              variant: 'course',
            });
          }
          startCourseIntervention(skillId, targetSkillId, repairUnit.courseId);
          setPostDiagCourse(true);
          setPassed(false);
          setPhase('result');
        } else {
          // Repair group: emit intervention_assigned, continue to lesson
          if (user) {
            emitEvent({
              clientEventId: `ia:${skillId}:repair:${repairCycleId}`,
              eventName: 'intervention_assigned',
              skillId,
              variant: 'repair',
            });
          }
        }
      }
    }
  };

  const handleDiagNext = () => {
    if (diagState.index < diagQuestions.length - 1) {
      setDiagState({ index: diagState.index + 1, answered: false, answers: diagState.answers });
    } else {
      setPhase('lesson');
    }
  };

  // ===== 验证阶段 =====

  const handleCheckAnswer = (isCorrect: boolean, firstTry: boolean) => {
    const newAnswers = [...checkState.answers, { isCorrect, firstTry }];

    if (checkState.index < checkQuestions.length - 1) {
      setCheckState({ index: checkState.index, answered: true, answers: newAnswers });
    } else {
      const allCorrectFirstTry = newAnswers.every((a) => a.isCorrect && a.firstTry);
      if (!checkSummaryRecorded.current) {
        checkSummaryRecorded.current = true;
        recordSkillEvidence(skillId, allCorrectFirstTry, allCorrectFirstTry, 'transfer', 'repair');
      }
      if (!finishCalled.current) {
        finishCalled.current = true;
        finishRepair(skillId);
        // v0.3: Schedule D1 only if check passed (repair was successful)
        if (allCorrectFirstTry) {
          // Context's scheduleSkillReview emits skill_review_scheduled
          scheduleSkillReview(skillId, targetSkillId, 'd1');
          // C: intervention_completed for repair check pass
          if (user && progress.repairSession?.status === 'active') {
            emitEvent({
              clientEventId: `ic:${skillId}:repair:${progress.repairSession.updatedAt}`,
              eventName: 'intervention_completed',
              skillId,
              variant: 'repair',
            });
          }
        }
      }
      setPassed(allCorrectFirstTry);
      setCheckState({ index: checkState.index, answered: true, answers: newAnswers });
      setPhase('result');
    }
  };

  const handleCheckNext = () => {
    if (checkState.index < checkQuestions.length - 1) {
      setCheckState({ index: checkState.index + 1, answered: false, answers: checkState.answers });
    }
  };

  // ===== 渲染 =====

  const progressSteps = [
    { label: '诊断', key: 'diagnostic' },
    { label: '讲解', key: 'lesson' },
    { label: '验证', key: 'check' },
    { label: '结果', key: 'result' },
  ];
  const currentStepIndex = progressSteps.findIndex((s) => s.key === phase);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* 页面标题 */}
      <section className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-7 text-white shadow-lg">
        <div className="flex items-center gap-2 text-violet-200 text-xs mb-2">
          <Link to={`/map?target=${targetSkillId}`} className="hover:text-white transition-colors">知识地图</Link>
          <span>›</span>
          <span>微补修</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold">
          {skillNode.name} 微补修
        </h1>
        <p className="text-violet-100 text-sm mt-1">预计 {repairUnit.estimatedMinutes} 分钟</p>
      </section>

      {activeGoal && (
        <GoalContextBar
          targetSkillId={targetSkillId}
          goalUpdatedAt={activeGoal.updatedAt}
          surface="repair"
          mode="repair"
          currentSkillId={skillId}
        />
      )}

      {/* 进度步骤条 */}
      <div className="flex items-center gap-1" aria-label="补修进度">
        {progressSteps.map((step, i) => {
          const isActive = i === currentStepIndex;
          // F19: course assignment after diagnostic failure also skips lesson/check,
          // mirroring the diagnostic fast-pass skipped semantics.
          const isSkipped = (fastPassed || postDiagCourse) && (step.key === 'lesson' || step.key === 'check');
          const isDone = i < currentStepIndex && !isSkipped;
          return (
            <div key={step.key} className="flex items-center gap-1 flex-1">
              <div
                className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : isSkipped
                      ? 'bg-slate-100 text-slate-400'
                      : isDone
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? '✓ ' : ''}{step.label}{isSkipped ? '（已跳过）' : ''}
              </div>
              {i < progressSteps.length - 1 && (
                <span className="text-slate-300 text-xs">›</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 诊断阶段 */}
      {phase === 'diagnostic' && (
        <div className="rounded-xl border border-indigo-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-indigo-600">🔍 诊断题 {diagState.index + 1}/{diagQuestions.length}</p>
          </div>
          <QuestionRenderer
            key={diagQuestions[diagState.index].id}
            question={diagQuestions[diagState.index]}
            onAnswer={handleDiagAnswer}
          />
          {diagState.answered && (
            <button
              type="button"
              onClick={handleDiagNext}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
            >
              {diagState.index < diagQuestions.length - 1 ? '下一题 →' : '继续 →'}
            </button>
          )}
        </div>
      )}

      {/* 讲解阶段 */}
      {phase === 'lesson' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 space-y-5">
          <p className="text-xs font-semibold text-amber-700">📖 微讲解（约 {repairUnit.estimatedMinutes - 1} 分钟）</p>

          <div className="rounded-lg bg-white border border-amber-200 p-4">
            <p className="text-sm font-semibold text-slate-700 mb-1">核心要点</p>
            <p className="text-base text-slate-800 leading-relaxed">{lesson.coreExplanation}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">方法步骤</p>
            <ol className="space-y-1.5">
              {lesson.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4 space-y-2">
            <p className="text-xs font-semibold text-indigo-700">🔦 例题</p>
            <p className="text-sm font-medium text-slate-800">{lesson.workedExample.question}</p>
            <ol className="space-y-1">
              {lesson.workedExample.steps.map((s, i) => (
                <li key={i} className="text-sm text-slate-600">第{i + 1}步：{s}</li>
              ))}
            </ol>
            <p className="text-sm font-semibold text-emerald-700">答案：{lesson.workedExample.answer}</p>
          </div>

          <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-1">
            <p className="text-xs font-semibold text-red-700">⚠ 常见错误</p>
            <p className="text-sm text-red-800">错误：{lesson.misconception.mistake}</p>
            <p className="text-sm text-emerald-700">纠正：{lesson.misconception.correction}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCheckState({ index: 0, answered: false, answers: [] });
              setPhase('check');
            }}
            className="w-full py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors min-h-[44px]"
          >
            我理解了，开始新题验证 →
          </button>
        </div>
      )}

      {/* 验证阶段 */}
      {phase === 'check' && (
        <div className="rounded-xl border border-violet-200 bg-white p-5 space-y-4">
          <p className="text-xs font-semibold text-violet-600">✅ 验证题 {checkState.index + 1}/{checkQuestions.length}</p>
          <QuestionRenderer
            key={checkQuestions[checkState.index].id}
            question={checkQuestions[checkState.index]}
            onAnswer={handleCheckAnswer}
          />
          {checkState.answered && checkState.index < checkQuestions.length - 1 && (
            <button
              type="button"
              onClick={handleCheckNext}
              className="w-full py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors min-h-[44px]"
            >
              下一题 →
            </button>
          )}
        </div>
      )}

      {/* 结果阶段 */}
      {phase === 'result' && (
        <div className="space-y-4">
          {postDiagCourse ? (
            /* F1: Course assignment after diagnostic failure */
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center space-y-4">
              <p className="text-2xl">📚</p>
              <p className="text-lg font-bold text-indigo-700">建议通过完整课程巩固</p>
              <p className="text-sm text-indigo-600">
                完成完整课程后，系统会为你安排复习计划，确保真正掌握。
              </p>
              {(() => {
                const courseKp = getKnowledgePointById(repairUnit.courseId);
                return courseKp ? (
                  <Link
                    to={`/kp/${repairUnit.courseId}?target=${encodedTargetSkillId}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
                  >
                    前往完整课程：{courseKp.meta.title} →
                  </Link>
                ) : null;
              })()}
              <Link
                to={`/map?target=${targetSkillId}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
              >
                继续我的目标
              </Link>
            </div>
          ) : passed ? (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-center space-y-3">
              <p className="text-3xl">🎉</p>
              <p className="text-lg font-bold text-emerald-700">路径准备度通过 / 当堂会</p>
              <p className="text-sm text-emerald-600">
                你的答题表现说明这项技能已具备路径准备度，继续向目标推进！
              </p>
              <p className="text-xs text-emerald-500">明天会有一次复习，帮助你真正记住。</p>
              <button
                type="button"
                onClick={() => navigate(`/map?target=${targetSkillId}&repaired=${skillId}`)}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors min-h-[44px]"
              >
                继续我的目标
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 space-y-4">
              <p className="text-lg font-bold text-amber-700">本次还没通过</p>
              <p className="text-sm text-amber-600">
                这次没能全部首次答对，没关系！可以先去完整课程巩固，或者返回目标路径。
              </p>
              {hasRepairCourse && (
                <Link
                  to={`/kp/${repairUnit.courseId}?target=${encodedTargetSkillId}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
                >
                  前往完整课程学习 →
                </Link>
              )}
              <Link
                to={`/map?target=${targetSkillId}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
              >
                继续我的目标
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
