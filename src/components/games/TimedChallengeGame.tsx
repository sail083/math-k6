import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Question } from '@/lib/types';
import { canUseTimedPractice, type TimedAnswerDetails } from '@/lib/timedChallengeQuality';
import { CheckIcon, XIcon } from './shared';

interface TimedChallengeGameProps {
  question: Question;
  onAnswer: (selectedAnswer: string, isCorrect: boolean, firstTry?: boolean, details?: TimedAnswerDetails) => void;
}

type Phase = 'ready' | 'running' | 'untimed' | 'timeout' | 'answered';
interface ClockSample { monotonic: number; wall: number }
interface ClockRun { deadline: number; last: ClockSample }
const optionLetters = ['A', 'B', 'C', 'D'];
// An engineering fail-safe: a long scheduling gap makes timing evidence unreliable.
// This is NOT a pupil time limit. See docs/timed-challenge-quality.md.
const MAX_CLOCK_GAP_MS = 2000;

function readClock(): ClockSample | null {
  try {
    const monotonic = performance.now();
    const wall = Date.now();
    return Number.isFinite(monotonic) && Number.isFinite(wall) ? { monotonic, wall } : null;
  } catch {
    return null;
  }
}

// Reset the complete attempt (including synchronous submission lock) if content changes.
export default function TimedChallengeGame(props: TimedChallengeGameProps) {
  return <TimedChallengeAttempt key={JSON.stringify(props.question)} {...props} />;
}

function TimedChallengeAttempt({ question, onAnswer }: TimedChallengeGameProps) {
  const promptId = useId();
  const instructionId = useId();
  const timingAvailable = canUseTimedPractice(question);
  const timeLimit = timingAvailable ? question.timeLimit! : 0;
  const options = useMemo(() => question.options ?? [], [question.options]);
  const [phase, setPhase] = useState<Phase>(timingAvailable ? 'ready' : 'untimed');
  const phaseRef = useRef<Phase>(phase);
  const settled = useRef(false);
  const clock = useRef<ClockRun | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const firstOption = useRef<HTMLButtonElement>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [clockInterrupted, setClockInterrupted] = useState(false);
  const [answerTiming, setAnswerTiming] = useState<'timed' | 'untimed'>('untimed');
  const hasAnswered = phase === 'answered' || phase === 'timeout';
  const showAnswer = phase === 'answered' || answerRevealed;

  const checkCorrect = useCallback((selected: string): boolean => (
    Array.isArray(question.correctAnswer)
      ? question.correctAnswer.includes(selected)
      : question.correctAnswer === selected
  ), [question.correctAnswer]);

  const switchToUntimed = useCallback((interrupted = false) => {
    if (settled.current) return;
    phaseRef.current = 'untimed';
    clock.current = null;
    setClockInterrupted(interrupted);
    setPhase('untimed');
  }, []);

  const finishTimeout = useCallback(() => {
    if (settled.current) return;
    // Claim the result before any state update or external callback.
    settled.current = true;
    phaseRef.current = 'timeout';
    clock.current = null;
    setTimeLeft(0);
    setPhase('timeout');
    onAnswer('超时', false, false, { outcome: 'timeout', timing: 'timed' });
  }, [onAnswer]);

  /** Check both timer ticks and input against the same deadline, independent of paint order. */
  const synchronizeClock = useCallback(() => {
    if (phaseRef.current !== 'running' || settled.current) return;
    const sample = readClock();
    const run = clock.current;
    const monotonicGap = sample && run ? sample.monotonic - run.last.monotonic : NaN;
    const wallGap = sample && run ? sample.wall - run.last.wall : NaN;
    if (document.hidden || !sample || !run || !Number.isFinite(monotonicGap)
      || monotonicGap < 0 || wallGap < 0 || monotonicGap > MAX_CLOCK_GAP_MS
      || Math.abs(monotonicGap - wallGap) > MAX_CLOCK_GAP_MS) {
      switchToUntimed(true);
      return;
    }
    run.last = sample;
    const remaining = Math.max(0, run.deadline - sample.monotonic);
    setTimeLeft(Math.ceil(remaining / 1000));
    if (remaining === 0) finishTimeout();
  }, [finishTimeout, switchToUntimed]);

  const startTimer = () => {
    if (phaseRef.current !== 'ready' || settled.current) return;
    const sample = readClock();
    if (!sample || document.hidden) { switchToUntimed(true); return; }
    clock.current = { deadline: sample.monotonic + timeLimit * 1000, last: sample };
    phaseRef.current = 'running';
    setPhase('running');
  };

  useEffect(() => {
    if (phase !== 'running') return;
    const interval = window.setInterval(synchronizeClock, 100);
    const onVisibilityChange = () => { if (document.hidden) switchToUntimed(true); };
    const onPageHide = () => switchToUntimed(true);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [phase, synchronizeClock, switchToUntimed]);

  useEffect(() => {
    if (!document.hidden && (phase === 'running' || phase === 'untimed')) firstOption.current?.focus();
  }, [phase]);

  const handleSelect = useCallback((option: string) => {
    if (settled.current || !['running', 'untimed'].includes(phaseRef.current)) return;
    synchronizeClock();
    if (settled.current) return; // Timeout wins at or after the deadline.
    settled.current = true;
    const timing = phaseRef.current === 'running' ? 'timed' : 'untimed';
    const correct = checkCorrect(option);
    phaseRef.current = 'answered';
    clock.current = null;
    setSelectedOption(option);
    setIsCorrect(correct);
    setAnswerTiming(timing);
    setPhase('answered');
    onAnswer(option, correct, true, { outcome: 'answered', timing });
  }, [checkCorrect, onAnswer, synchronizeClock]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (settled.current || event.defaultPrevented || event.repeat || event.isComposing
        || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof Element && (
        target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
        || (target !== document.body && !root.current?.contains(target))
      )) return;
      const index = ({ '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 } as Record<string, number>)[event.key.toLowerCase()];
      if (index !== undefined && options[index] && ['running', 'untimed'].includes(phaseRef.current)) {
        event.preventDefault();
        handleSelect(options[index]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options, handleSelect]);

  const getOptionState = (option: string): 'correct' | 'wrong' | 'dimmed' | 'default' => {
    if (!showAnswer) return 'default';
    if (checkCorrect(option)) return 'correct';
    if (option === selectedOption) return 'wrong';
    return 'dimmed';
  };
  const correctText = Array.isArray(question.correctAnswer) ? question.correctAnswer.join('、') : question.correctAnswer;
  const isUrgent = timeLeft <= 10 && phase === 'running';
  const progressPercent = timeLimit > 0 ? Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100)) : 0;

  return (
    <div ref={root} className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        {phase === 'ready' ? (
          <button autoFocus onClick={startTimer} className="px-4 py-3 rounded-xl bg-indigo-600 text-white min-h-[48px]">
            开始 {timeLimit} 秒练习
          </button>
        ) : phase === 'running' ? (
          <span role="timer" aria-label="剩余时间" aria-live="off" className={`px-4 py-2 rounded-xl font-bold text-lg tabular-nums ${isUrgent ? 'bg-amber-50 text-amber-800' : 'bg-indigo-50 text-indigo-600'}`}>
            {timeLeft}s
          </span>
        ) : <span className="text-sm font-medium text-slate-600">{hasAnswered ? '本题已结束' : '不限时练习'}</span>}
        {(phase === 'ready' || phase === 'running') && (
          <button onClick={() => {
            synchronizeClock();
            if (phaseRef.current === 'ready' || phaseRef.current === 'running') switchToUntimed();
          }} className="px-4 py-3 rounded-xl border border-slate-300 min-h-[48px]">
            不限时练习
          </button>
        )}
      </div>
      {phase === 'running' && (
        <div aria-hidden="true" className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${progressPercent}%` }} />
        </div>
      )}
      {phase !== 'ready' && <>
        <p id={promptId} className="text-lg font-medium text-slate-800 leading-relaxed">{question.prompt}</p>
        <p id={instructionId} className="text-sm text-slate-500">按 1–4 或 A–D 作答，也可逐个选择按钮。</p>
      </>}

      {/* Keep the live region mounted. The timer itself is deliberately not a live region. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="text-sm text-slate-700">
        {phase === 'ready' && '准备好后再开始，开始后显示题目；计时包含读题与选择，也可以选择不限时练习。计时结果只作练习表现，不计知识得分。'}
        {phase === 'running' && '计时已开始，可随时切换为不限时练习。'}
        {phase === 'untimed' && (clockInterrupted ? '计时已中断，已转为不限时练习。请继续作答，本次不计速度。' : '本题不限时，请先想清楚计算方法。')}
        {phase === 'timeout' && (
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50">
            <p className="font-bold">时间到！</p>
            <p>本次未在时限内完成，不代表不会；本题不计知识得分，也不记为知识错误。</p>
            {showAnswer && <><p className="mt-1">正确答案：{correctText}</p><p className="mt-1">{question.explanation}</p></>}
          </div>
        )}
        {phase === 'answered' && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50">
            <span aria-hidden="true" className={isCorrect ? 'text-green-600' : 'text-red-600'}>{isCorrect ? <CheckIcon /> : <XIcon />}</span>
            <div>
              <p className="font-bold">{isCorrect ? '回答正确！' : '回答错误'}</p>
              {!isCorrect && <p className="mt-1">正确答案：{correctText}</p>}
              <p className="mt-1">{question.explanation}</p>
              {answerTiming === 'timed' && <p className="mt-1">本次为限时练习，结果不计入知识得分。</p>}
            </div>
          </div>
        )}
      </div>

      {phase !== 'ready' && <div role="group" aria-labelledby={promptId} aria-describedby={instructionId} className="space-y-3">
        {options.map((option, index) => {
          const state = getOptionState(option);
          return (
            <button key={index} ref={index === 0 ? firstOption : undefined}
              onClick={() => handleSelect(option)} disabled={hasAnswered}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left min-h-[48px] ${state === 'correct' ? 'bg-green-50 border-green-500' : state === 'wrong' ? 'bg-red-50 border-red-500' : state === 'dimmed' ? 'bg-white border-slate-200 opacity-50' : 'bg-white border-slate-200 enabled:hover:border-indigo-400'}`}>
              <span className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 bg-slate-100 text-slate-600">{optionLetters[index] ?? String(index + 1)}</span>
              <span className="flex-1 text-slate-700">{option}</span>
              {state === 'correct' && <span aria-hidden="true" className="text-green-600"><CheckIcon /></span>}
              {state === 'wrong' && <span aria-hidden="true" className="text-red-600"><XIcon /></span>}
            </button>
          );
        })}
      </div>}
      {phase === 'timeout' && !showAnswer && (
        <button onClick={() => setAnswerRevealed(true)} className="px-4 py-3 rounded-xl border border-indigo-300 text-indigo-700 min-h-[48px]">
          查看答案与解析
        </button>
      )}
    </div>
  );
}
