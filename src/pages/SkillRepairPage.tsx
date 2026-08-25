/**
 * SkillRepairPage — v0.2 微补修闭环
 *
 * 路由：/repair/:skillId
 * 状态机：
 *   diagnostic →
 *     2/2 firstTry 全对 → 直接 result (passed=true, 1次 summary + 1次 finish)
 *     否则 → lesson → check → result
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import ChoiceGame from '@/components/games/ChoiceGame';
import FillBlankGame from '@/components/games/FillBlankGame';
import { useProgress } from '@/context/ProgressContext';
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
  const { progress, recordSkillEvidence, startRepair, finishRepair, isSkillReadyForPath } = useProgress();

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

  // R2: Clean invalid target from URL (replace, no flicker)
  useEffect(() => {
    if (rawUrlTarget && !isValidPublishedTarget(rawUrlTarget)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('target');
      setSearchParams(newParams, { replace: true });
    }
  }, [rawUrlTarget, searchParams, setSearchParams]);

  // R1: Freeze initial readiness once on mount so that mid-session evidence updates
  // (which make isSkillReadyForPath return true) cannot hijack the active state machine.
  const initialReadinessRef = useRef<boolean | null>(null);
  if (initialReadinessRef.current === null) {
    initialReadinessRef.current = !!(skillId && skillExists && repairUnit && isSkillReadyForPath(skillId));
  }
  const isAlreadyReady = initialReadinessRef.current;

  const [phase, setPhase] = useState<RepairPhase>('diagnostic');
  const [diagState, setDiagState] = useState<PhaseState>({ index: 0, answered: false, answers: [] });
  const [checkState, setCheckState] = useState<PhaseState>({ index: 0, answered: false, answers: [] });
  const [passed, setPassed] = useState(false);
  // Tracks whether this session was a fast pass (diagnostic 2/2 firstTry).
  // Used by the step indicator to show lesson/check as "skipped" instead of "✓ done".
  const [fastPassed, setFastPassed] = useState(false);

  // Idempotency guards — separate per phase to avoid cross-contamination
  const sessionStarted = useRef(false);
  const diagSummaryRecorded = useRef(false);
  const checkSummaryRecorded = useRef(false);
  const finishCalled = useRef(false);

  // Start repair session on mount (once) — skip if already ready (R1)
  useEffect(() => {
    if (!skillId || !repairUnit || isAlreadyReady || sessionStarted.current) return;
    sessionStarted.current = true;
    startRepair(skillId, targetSkillId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId, repairUnit, isAlreadyReady]);

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
    // skillId not found in knowledge graph at all
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
    // Valid skill in graph but no repair content — show course entries (R3)
    const ctx = getSkillContext(skillId);
    // Prioritize: core first, then review, then transfer
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
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center space-y-4">
          <p className="text-2xl">🔧</p>
          <p className="text-slate-700 font-semibold">微补修准备中</p>
          <p className="text-sm text-slate-500">&ldquo;{skillNode.name}&rdquo;的微补修内容正在教研团队准备中，请稍后再来。</p>
          {primaryKp && (
            <Link
              to={`/kp/${primaryCourse.courseId}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
            >
              前往完整课程：{primaryKp.meta.title} →
            </Link>
          )}
          <Link
            to={`/map?target=${targetSkillId}`}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
              primaryKp
                ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            返回目标路径 →
          </Link>
        </div>
      </div>
    );
  }

  // R1: Skill is already ready — no repair needed
  if (isAlreadyReady) {
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
            返回目标路径 →
          </Link>
        </div>
      </div>
    );
  }

  const diagQuestions = repairUnit.diagnosticQuestions;
  const checkQuestions = repairUnit.checkQuestions;
  const lesson = repairUnit.lesson;

  // ===== 诊断阶段 =====

  const handleDiagAnswer = (isCorrect: boolean, firstTry: boolean) => {
    const newAnswers = [...diagState.answers, { isCorrect, firstTry }];

    if (diagState.index < diagQuestions.length - 1) {
      // More diagnostic questions: show feedback + "下一题" button on this same question
      setDiagState({ index: diagState.index, answered: true, answers: newAnswers });
    } else {
      // All diagnostic questions answered
      const allCorrectFirstTry = newAnswers.every((a) => a.isCorrect && a.firstTry);

      if (allCorrectFirstTry) {
        // Fast pass: record 1 successful summary + finish, go directly to result
        if (!diagSummaryRecorded.current) {
          diagSummaryRecorded.current = true;
          recordSkillEvidence(skillId, true, true, 'transfer', 'repair');
        }
        if (!finishCalled.current) {
          finishCalled.current = true;
          finishRepair(skillId);
        }
        setPassed(true);
        setFastPassed(true);
        setDiagState({ index: diagState.index, answered: true, answers: newAnswers });
        setPhase('result');
      } else {
        // Record failure evidence, show feedback on last diag question, then → lesson
        if (!diagSummaryRecorded.current) {
          diagSummaryRecorded.current = true;
          recordSkillEvidence(skillId, false, false, 'transfer', 'repair');
        }
        setDiagState({ index: diagState.index, answered: true, answers: newAnswers });
        // Proceed to lesson after user sees feedback (button)
      }
    }
  };

  const handleDiagNext = () => {
    if (diagState.index < diagQuestions.length - 1) {
      // Advance to next diagnostic question
      setDiagState({ index: diagState.index + 1, answered: false, answers: diagState.answers });
    } else {
      // Last diagnostic done, not fast pass → go to lesson
      setPhase('lesson');
    }
  };

  // ===== 验证阶段 =====

  const handleCheckAnswer = (isCorrect: boolean, firstTry: boolean) => {
    const newAnswers = [...checkState.answers, { isCorrect, firstTry }];

    if (checkState.index < checkQuestions.length - 1) {
      setCheckState({ index: checkState.index, answered: true, answers: newAnswers });
    } else {
      // All check questions done
      const allCorrectFirstTry = newAnswers.every((a) => a.isCorrect && a.firstTry);
      if (!checkSummaryRecorded.current) {
        checkSummaryRecorded.current = true;
        recordSkillEvidence(skillId, allCorrectFirstTry, allCorrectFirstTry, 'transfer', 'repair');
      }
      if (!finishCalled.current) {
        finishCalled.current = true;
        finishRepair(skillId);
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

      {/* 进度步骤条 */}
      <div className="flex items-center gap-1" aria-label="补修进度">
        {progressSteps.map((step, i) => {
          const isActive = i === currentStepIndex;
          // Fast pass skips lesson & check — they must show as "skipped", not "✓ done"
          const isSkipped = fastPassed && (step.key === 'lesson' || step.key === 'check');
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
          {/* key=question.id ensures QuestionRenderer remounts for each new question */}
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

          {/* 核心解释 */}
          <div className="rounded-lg bg-white border border-amber-200 p-4">
            <p className="text-sm font-semibold text-slate-700 mb-1">核心要点</p>
            <p className="text-base text-slate-800 leading-relaxed">{lesson.coreExplanation}</p>
          </div>

          {/* 步骤 */}
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

          {/* Worked Example */}
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

          {/* 误区 */}
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
          {passed ? (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-center space-y-3">
              <p className="text-3xl">🎉</p>
              <p className="text-lg font-bold text-emerald-700">路径准备度通过 / 当堂会</p>
              <p className="text-sm text-emerald-600">
                你的答题表现说明这项技能已具备路径准备度，继续向目标推进！
              </p>
              <button
                type="button"
                onClick={() => navigate(`/map?target=${targetSkillId}&repaired=${skillId}`)}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors min-h-[44px]"
              >
                返回目标路径，看下一步 →
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 space-y-4">
              <p className="text-lg font-bold text-amber-700">本次还没通过</p>
              <p className="text-sm text-amber-600">
                这次没能全部首次答对，没关系！可以先去完整课程巩固，或者返回目标路径。
              </p>
              <Link
                to={`/kp/${repairUnit.courseId}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
              >
                前往完整课程学习 →
              </Link>
              <Link
                to={`/map?target=${targetSkillId}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
              >
                返回目标路径
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
