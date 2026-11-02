import { useEffect, useRef, useState } from 'react';
import type { GameConfig, Question } from '@/lib/types';
import { useProgress } from '@/context/ProgressContext';
import ChoiceGame from '@/components/games/ChoiceGame';
import FillBlankGame from '@/components/games/FillBlankGame';
import TrueFalseGame from '@/components/games/TrueFalseGame';
import DragMatchGame from '@/components/games/DragMatchGame';
import DragAssembleGame from '@/components/games/DragAssembleGame';
import TimelineGame from '@/components/games/TimelineGame';
import TimedChallengeGame from '@/components/games/TimedChallengeGame';
import UiIcon from '@/components/UiIcon';

interface GameRunnerProps {
  game: GameConfig;
  knowledgePointId: string;
  className?: string;
  onPassed?: () => void;
  onReviewCourse?: () => void;
  onNextCourse?: () => void;
  nextCourseTitle?: string;
  nextActionLabel?: string;
  reviewMode?: 'd1' | 'd7' | null;
}

type GameStatus = 'playing' | 'passed' | 'failed' | 'practice';

export interface AnswerRecord {
  selected: string | string[];
  correct: boolean;
  firstTry: boolean;
}

export function calculateStars(correctRate: number, passThreshold: number): number {
  if (correctRate < passThreshold) return 0;
  if (correctRate >= 1.0) return 3;
  if (correctRate >= 0.9) return 2;
  return 1;
}

export function masteryThreshold(configuredThreshold: number): number {
  return Math.max(0.8, configuredThreshold);
}

export function isTransferQuestion(question: Question): boolean {
  return question.type !== 'choice' && question.type !== 'true-false' && question.type !== 'timed-challenge';
}

export function hasTransferEvidence(game: GameConfig, answers: Record<string, AnswerRecord>, questionSet?: Question[]): boolean {
  const questions = questionSet ?? game.questions;
  const transferQuestions = questions.filter(isTransferQuestion);
  return transferQuestions.length > 0 && transferQuestions.every((question) => {
    const a = answers[question.id];
    return a?.correct === true && a?.firstTry === true;
  });
}

function StarRow({ earned, total }: { earned: number; total: number }) {
  return (
    <div className="flex justify-center gap-2 text-4xl" role="img" aria-label={`获得 ${earned} 颗星，共 ${total} 颗`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={
            i < earned
              ? 'text-amber-400 result-star star-burst-anim'
              : 'text-slate-300'
          }
          style={{ animationDelay: `${i * 100}ms`, animationDuration: '0.6s' }}
        >
          {i < earned ? '\u2605' : '\u2606'}
        </span>
      ))}
    </div>
  );
}

function NextArrowIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const confettiColors = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function GameRunner(props: GameRunnerProps) {
  const { assessmentOwnerId } = useProgress();
  return <GameRunnerSession key={`${assessmentOwnerId ?? 'guest'}:${props.knowledgePointId}:${props.game.evidenceVersion ?? 'legacy'}`} {...props} />;
}

function GameRunnerSession({
  game,
  knowledgePointId,
  className,
  onPassed,
  onReviewCourse,
  onNextCourse,
  nextCourseTitle,
  nextActionLabel,
  reviewMode = null,
}: GameRunnerProps) {
  const { progress, beginCourseAttempt, finishCourseAttempt, markInitialPass, markDelayedReviewPass, markDelayedReviewFail, recordSkillEvidence } = useProgress();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [reviewOutdated, setReviewOutdated] = useState(false);
  const [form, setForm] = useState<'a' | 'b'>('a');
  const [run, setRun] = useState(0);
  const [showRepair, setShowRepair] = useState(false);
  const attemptClaim = useRef<string | null | undefined>(undefined);
  const answerGuard = useRef(new Set<string>());
  const resultGuard = useRef(false);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  // Freeze review mode for the lifetime of this course attempt.
  // Captured once when the component mounts; the React key on GameRunner
  // ensures a fresh mount for each course/attempt identity.
  const [frozenReviewMode] = useState<'d1' | 'd7' | null>(reviewMode);

  const isReview = frozenReviewMode === 'd1' || frozenReviewMode === 'd7';
  const reviewQuestions: Question[] = isReview
    ? game.reviewSets?.[frozenReviewMode]?.questions ?? []
    : [];
  const primaryQuestions = isReview ? reviewQuestions : game.questions;
  const alternateQuestions = isReview ? game.reviewSets?.[frozenReviewMode]?.alternateQuestions : game.alternateQuestions;
  const activeQuestions = form === 'b' ? alternateQuestions ?? [] : primaryQuestions;
  const strictEvidence = !!game.evidenceVersion;
  const attemptMode = frozenReviewMode ?? 'initial';
  const attemptKey = `${knowledgePointId}|${attemptMode}|${form}|${game.evidenceVersion}`;
  const bKey = `${knowledgePointId}|${attemptMode}|b|${game.evidenceVersion}`;
  const spent = !!progress?.courseAttempts?.[attemptKey];
  const bSpent = !!progress?.courseAttempts?.[bKey];
  const hasReviewSets = !!(game.reviewSets?.d1 && game.reviewSets?.d7);

  const maxScore = activeQuestions.reduce((sum, q) => sum + q.points, 0);
  const requiredRate = masteryThreshold(game.passThreshold);

  useEffect(() => {
    if (gameStatus !== 'playing') resultHeadingRef.current?.focus();
  }, [gameStatus]);

  const score = activeQuestions.reduce((sum, q) => {
        const answer = answers[q.id];
        return sum + (answer?.correct ? q.points : 0);
      }, 0);

  // 边界情况：没有题目
  if (activeQuestions.length === 0) {
    return (
      <div className={`text-center py-12${className ? ' ' + className : ''}`}>
        <UiIcon name="spark" size={38} className="mx-auto mb-3 text-indigo-500"/>
        <p className="text-slate-500 text-lg">暂无题目</p>
      </div>
    );
  }

  const currentQuestion = activeQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === activeQuestions.length - 1;
  const isAnswered = answers[currentQuestion.id] !== undefined;
  const progressPercent = ((currentQuestionIndex + 1) / activeQuestions.length) * 100;

  const handleAnswer = (selected: string, isCorrect: boolean, firstTry: boolean = true) => {
    if (answerGuard.current.has(currentQuestion.id)) return;
    answerGuard.current.add(currentQuestion.id);
    const claim = ensureAttempt();
    firstTry = firstTry && (!strictEvidence || !!claim);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { selected, correct: isCorrect, firstTry },
    }));
    // Record skill evidence once per question submission (guard above ensures no re-recording)
    if (currentQuestion.primarySkillId && currentQuestion.evidenceType) {
      const mode: 'initial' | 'd1' | 'd7' =
        frozenReviewMode === 'd1' ? 'd1' :
        frozenReviewMode === 'd7' ? 'd7' : 'initial';
      const args = [currentQuestion.primarySkillId, isCorrect, firstTry, currentQuestion.evidenceType, mode] as const;
      if (strictEvidence) recordSkillEvidence(...args, { key: attemptKey, id: claim });
      else recordSkillEvidence(...args);
    }
  };

  function ensureAttempt(): string | null {
    if (!strictEvidence) return null;
    if (attemptClaim.current === undefined) attemptClaim.current = beginCourseAttempt(attemptKey);
    return attemptClaim.current;
  }

  const handleNext = () => {
    if (!isAnswered || resultGuard.current) return;
    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      resultGuard.current = true;
      const correctRate = maxScore > 0 ? score / maxScore : 0;
      if (strictEvidence) {
        if (!attemptClaim.current) { setGameStatus('practice'); return; }
        const passed = correctRate >= requiredRate && hasTransferEvidence(game, answers, activeQuestions);
        const accepted = finishCourseAttempt(attemptKey, attemptClaim.current, passed, calculateStars(correctRate, requiredRate), hasReviewSets);
        if (!accepted) { setReviewOutdated(true); return; }
        setGameStatus(passed ? 'passed' : 'failed');
        if (passed) onPassed?.();
      } else if (isReview) {
        // Review pass requires: score >= threshold AND first-try transfer evidence on review questions
        if (correctRate >= requiredRate && hasTransferEvidence(game, answers, activeQuestions)) {
          if (markDelayedReviewPass(knowledgePointId, frozenReviewMode)) {
            setGameStatus('passed');
            onPassed?.();
          } else {
            setReviewOutdated(true);
          }
        } else {
          setGameStatus('failed');
          markDelayedReviewFail(knowledgePointId, frozenReviewMode);
        }
      } else {
        // Initial challenge: pass requires correct rate + transfer evidence
        if (correctRate >= requiredRate && hasTransferEvidence(game, answers)) {
          const stars = calculateStars(correctRate, requiredRate);
          setGameStatus('passed');
          markInitialPass(knowledgePointId, stars, hasReviewSets);
          onPassed?.();
        } else {
          setGameStatus('failed');
        }
      }
    }
  };

  const handleRestart = (nextForm = form) => {
    setForm(nextForm);
    setRun(value => value + 1);
    setShowRepair(false);
    setReviewOutdated(false);
    attemptClaim.current = undefined;
    answerGuard.current.clear();
    resultGuard.current = false;
    setCurrentQuestionIndex(0);
    setAnswers({});
    setGameStatus('playing');
    setRun((value) => value + 1);
  };

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'choice':
        return (
          <ChoiceGame
            key={`${currentQuestion.id}:${run}`}
            question={currentQuestion}
            onAttempt={ensureAttempt}
            onAnswer={handleAnswer}
          />
        );
      case 'fill-blank':
        return (
          <FillBlankGame
            key={`${currentQuestion.id}:${run}`}
            question={currentQuestion}
            onAttempt={ensureAttempt}
            onAnswer={handleAnswer}
          />
        );
      case 'true-false':
        return (
          <TrueFalseGame
            key={`${currentQuestion.id}:${run}`}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      case 'drag-match':
        return (
          <DragMatchGame
            key={`${currentQuestion.id}:${run}`}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      case 'drag-assemble':
        return (
          <DragAssembleGame
            key={`${currentQuestion.id}:${run}`}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      case 'timeline':
        return (
          <TimelineGame
            key={`${currentQuestion.id}:${run}`}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      case 'timed-challenge':
        return (
          <TimedChallengeGame
            key={`${currentQuestion.id}:${run}`}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      default:
        return (
          <div className="text-center py-8 text-slate-500">该题型即将上线</div>
        );
    }
  };

  // Determine result copy based on mode and outcome
  const resultTitle = (passed: boolean): string => {
    if (gameStatus === 'practice') return '原题练习完成';
    if (isReview) {
      if (passed && frozenReviewMode === 'd7') return '已稳固';
      if (passed && frozenReviewMode === 'd1') return '第一次复习通过';
      return '待复习';
    }
    if (passed) return hasReviewSets ? '当堂会' : '本次通过';
    return '最后再练一下';
  };

  const resultSubtitle = (passed: boolean): string => {
    if (isReview) {
      if (passed && frozenReviewMode === 'd7') return '两次复习都通过了，这个知识点已经稳固了。';
      if (passed && frozenReviewMode === 'd1') return '第一次复习通过，六天后再来练一次就能稳固。';
      return '这次没有通过，知识点仍在待复习状态，可以再试。';
    }
    if (passed) {
      return hasReviewSets
        ? '你当堂学会了这个办法。明天来练一次复习题，会记得更牢。'
        : '本次练习通过。';
    }
    return '回到"为什么"看一眼，再来试试。';
  };

  // ===== 结果界面 =====
  if (reviewOutdated) return <section role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-6">
    <h2 className="text-xl font-bold">{strictEvidence ? '本次记录未更新' : '复习状态已更新'}</h2>
    <p className="mt-2">本次练习没有重复计入复习进度。请返回课程，查看当前需要完成的复习。</p>
    {strictEvidence && <p>存储失败、题组已经结算或复习阶段改变时，都不会重复发放掌握记录。</p>}
    <a href={`/math/kp/${knowledgePointId}`} className="mt-4 inline-flex min-h-11 items-center rounded-lg border px-4">返回课程</a>
  </section>;

  const alternateAction = strictEvidence && alternateQuestions?.length ? form === 'a'
    ? <button type="button" className="min-h-12 rounded-lg border border-indigo-300 px-4 py-2" onClick={() => setShowRepair(true)}>{bSpent ? '练习B组原题' : '补学后换B组新题'}</button>
    : <button type="button" className="min-h-12 rounded-lg border border-indigo-300 px-4 py-2" onClick={() => handleRestart('a')}>练习A组原题</button> : null;

  if (showRepair) return <section className="space-y-4 rounded-xl border bg-white p-6">
    <h2 className="text-xl font-bold">先对照解析补学</h2>
    <p>找出原来哪一步不清楚，试着用自己的话解释。下一组会换数字和情境，不照搬答案。</p>
    {primaryQuestions.map(question => <p key={question.id} className="text-sm leading-7">{question.explanation}</p>)}
    <button type="button" className="min-h-12 rounded-lg bg-indigo-600 px-4 text-white" onClick={() => handleRestart('b')}>{bSpent ? '开始B组原题练习' : '开始B组新题验证'}</button>
  </section>;

  if (gameStatus !== 'playing') {
    const correctRate = maxScore > 0 ? score / maxScore : 0;
    const passed = gameStatus === 'passed';
    const transferPassed = hasTransferEvidence(game, answers, activeQuestions);
    const stars = passed && !isReview ? calculateStars(correctRate, requiredRate) : 0;

    return (
      <div className={`space-y-6${className ? ' ' + className : ''}`}>
        {/* 庆祝彩纸 */}
        {passed && (
          <div className="relative h-0 overflow-visible" aria-hidden="true">
            {confettiColors.map((color, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${10 + i * 11}%`,
                  backgroundColor: color,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* 结果卡片 */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center celebrate-enter">
          {passed ? (
            <>
              <div className="result-icon is-success"><UiIcon name="spark" size={32}/></div>
              <h2 ref={resultHeadingRef} tabIndex={-1} className="text-2xl font-bold text-indigo-600 mb-2">{resultTitle(true)}</h2>
              <p className="text-sm text-slate-500">{resultSubtitle(true)}</p>
            </>
          ) : (
            <>
              <div className="result-icon"><UiIcon name="progress" size={32}/></div>
              <h2 ref={resultHeadingRef} tabIndex={-1} className="text-2xl font-bold text-slate-700 mb-2">{resultTitle(false)}</h2>
              <p className="text-sm text-slate-500">{gameStatus === 'practice' ? '这套题已接触过，或首次记录未能保存。本轮得分保留为练习结果，不新增迁移、复习或掌握证据。' : isReview ? resultSubtitle(false) : (correctRate < requiredRate && !transferPassed
                ? `再答对一些（需要达到 ${Math.round(requiredRate * 100)}%），同时把填空题也独立完成。`
                : correctRate < requiredRate
                  ? `再答对一些，达到 ${Math.round(requiredRate * 100)}% 就能过关。`
                  : !transferPassed
                    ? '迁移验证题需要首次独立答对；回看讲解后再试一次。'
                    : resultSubtitle(false))}</p>
            </>
          )}

          {/* 星级 */}
          {stars > 0 && (
            <div className="my-6">
              <StarRow earned={stars} total={3} />
            </div>
          )}

          {/* 得分摘要 */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100">
            <span className="text-sm text-slate-500">得分</span>
            <span className="text-lg font-bold text-slate-800 tabular-nums">{score}</span>
            <span className="text-sm text-slate-400">/ {maxScore}</span>
          </div>
        </div>

        {/* 答题回顾 */}
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">答题回顾</h3>
          <div className="space-y-4">
            {activeQuestions.map((q, index) => {
              const answer = answers[q.id];
              const correct = answer?.correct ?? false;
              const selectedText = answer
                ? Array.isArray(answer.selected)
                  ? answer.selected.join('、')
                  : answer.selected
                : '';
              const correctText = Array.isArray(q.correctAnswer)
                ? q.correctAnswer.join('、')
                : q.correctAnswer;

              return (
                <div
                  key={q.id}
                  className="rounded-lg border border-slate-200 overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-3 bg-slate-50">
                    <span
                      className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        correct
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {correct ? '✓' : '✗'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">
                        第 {index + 1} 题
                        {isTransferQuestion(q) ? (
                          <span className="question-type-tag is-transfer">迁移验证</span>
                        ) : (
                          <span className="question-type-tag is-choice">选择题</span>
                        )}
                        {isTransferQuestion(q) && correct && !answer?.firstTry ? (
                          <span className="question-type-tag is-retry">重试后答对 · 本次不计迁移验证</span>
                        ) : null}
                      </p>
                      <p className="text-sm text-slate-600 mt-0.5">{q.prompt}</p>
                    </div>
                  </div>
                  {!correct && answer && (
                    <div className="px-3 pb-3 pt-2 space-y-1 bg-white border-t border-slate-100">
                      <p className="text-xs text-red-500">你的答案：{selectedText}</p>
                      <p className="text-xs text-green-600">正确答案：{correctText}</p>
                      <p className="text-xs text-slate-500 mt-1">{q.explanation}</p>
                    </div>
                  )}
                  {correct && (
                    <div className="px-3 pb-3 pt-2 bg-white border-t border-slate-100">
                      <p className="text-xs text-slate-500">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
          {!passed && (
            <button
              onClick={() => handleRestart()}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[48px] flex items-center"
            >
              {strictEvidence ? '再练当前题组' : '再试一次'}
            </button>
          )}
          {!passed && alternateAction}
          {!passed && strictEvidence && bSpent && <p className="w-full text-sm text-slate-600">当前两组新题机会已使用；可以继续原题练习，后续需新的题组再验证。不会清除已有成绩。</p>}
          {passed && onNextCourse && !isReview ? (
            <button
              onClick={onNextCourse}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[48px] flex items-center gap-2 max-w-full"
            >
              <span className="truncate">{nextActionLabel ?? `下一课${nextCourseTitle ? `：${nextCourseTitle}` : ''}`}</span>
              <span className="shrink-0">→</span>
            </button>
          ) : null}
          <button
            onClick={onReviewCourse}
            className="px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors min-h-[48px] flex items-center"
          >
            回看讲解
          </button>
        </div>
      </div>
    );
  }

  // ===== 游戏进行中界面 =====
  return (
    <div className={`space-y-4${className ? ' ' + className : ''}`}>
      {strictEvidence && <section role="note" className="space-y-3 rounded-xl border border-indigo-200 p-4 text-sm">
        <p>{form.toUpperCase()}组 · {attemptClaim.current === null ? '本轮只作练习：首次记录、账号同步或复习阶段不满足验证条件。' : spent && !attemptClaim.current ? '已接触原题：本轮只作练习。' : '首次提交后记录题组接触；刷新或回看后重做不算首次证据。'}</p>
        {spent && attemptClaim.current === undefined && alternateAction}
      </section>}
      {/* 进度条 + 信息 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">
            {isReview ? `复习（${frozenReviewMode === 'd1' ? '第一次' : '第二次'}）· ` : ''}第 {currentQuestionIndex + 1} / {activeQuestions.length} 题
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium tabular-nums">
            得分: {score} / {maxScore}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progressPercent)} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 题目卡片 */}
      <div className={`rounded-xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6${isAnswered ? (answers[currentQuestion.id]?.correct ? ' answer-correct-anim' : ' answer-wrong-anim') : ''}`}>
        {renderQuestion()}
      </div>

      {/* 下一题按钮 */}
      {isAnswered && (
        <div className="flex justify-end">
          <button
            autoFocus
            onClick={handleNext}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[48px] flex items-center gap-2"
          >
            {isLastQuestion ? '查看结果' : '下一题'}
            <NextArrowIcon />
          </button>
        </div>
      )}
    </div>
  );
}
