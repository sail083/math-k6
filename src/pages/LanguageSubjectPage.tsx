import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import ChoiceGame from '@/components/games/ChoiceGame';
import FillBlankGame from '@/components/games/FillBlankGame';
import { chineseLessonIds, chineseLessons } from '@/content/chinese';
import { englishLessonIds, englishLessons } from '@/content/english';
import { useProgress } from '@/context/ProgressContext';
import { getNextLanguageLessonId } from '@/lib/progress';
import type { LanguageLesson, LanguageSubject } from '@/lib/types';

const PASS_COUNT = 2;

const THEMES = {
  rose: {
    action: 'bg-rose-600 hover:bg-rose-700',
    accent: 'text-rose-700',
    kicker: 'text-rose-500',
    chip: 'bg-rose-50 text-rose-700',
    progress: 'bg-rose-500',
    border: 'border-rose-100',
    availableChip: 'bg-rose-100 text-rose-700',
    card: 'border-rose-100 hover:border-rose-300 focus-visible:ring-rose-200',
    hero: 'from-rose-500 to-orange-400',
    heroKicker: 'text-rose-100',
    heroCopy: 'text-rose-50',
    focus: 'focus-visible:ring-rose-200',
    mark: 'bg-rose-600',
  },
  sky: {
    action: 'bg-sky-700 hover:bg-sky-800',
    accent: 'text-sky-700',
    kicker: 'text-sky-700',
    chip: 'bg-sky-50 text-sky-800',
    progress: 'bg-sky-600',
    border: 'border-sky-100',
    availableChip: 'bg-sky-100 text-sky-800',
    card: 'border-sky-100 hover:border-sky-300 focus-visible:ring-sky-200',
    hero: 'from-sky-600 to-cyan-500',
    heroKicker: 'text-sky-100',
    heroCopy: 'text-sky-50',
    focus: 'focus-visible:ring-sky-200',
    mark: 'bg-sky-700',
  },
} as const;

interface SubjectConfig {
  label: string;
  mark: string;
  unitTitle: string;
  unitSummary: string;
  lessons: LanguageLesson[];
  lessonIds: string[];
  theme: keyof typeof THEMES;
}

const SUBJECTS: Record<LanguageSubject, SubjectConfig> = {
  chinese: {
    label: '语文',
    mark: '文',
    unitTitle: '校园里的小发现',
    unitSummary: '从词语、阅读到表达，把一次校园观察说清楚。',
    lessons: chineseLessons,
    lessonIds: chineseLessonIds,
    theme: 'rose',
  },
  english: {
    label: '英语',
    mark: 'Aa',
    unitTitle: '公园里的动物',
    unitSummary: '从动物词汇、基础句型到英文听读，读懂一段公园见闻。',
    lessons: englishLessons,
    lessonIds: englishLessonIds,
    theme: 'sky',
  },
};

export function ReadAloudButton({ text }: { text: string }) {
  const synthesis = typeof window === 'undefined' ? undefined : window.speechSynthesis;
  const supported = !!synthesis && typeof SpeechSynthesisUtterance !== 'undefined';
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => {
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    synthesis?.cancel();
  }, [synthesis]);

  const readAloud = () => {
    if (!supported || !synthesis) return;
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }
    synthesis.cancel();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.onend = () => {
        if (utteranceRef.current === utterance) utteranceRef.current = null;
        setSpeaking(false);
      };
      utterance.onerror = () => {
        if (utteranceRef.current === utterance) utteranceRef.current = null;
        setSpeaking(false);
        setError('朗读暂时不可用，请直接阅读下方英文正文。');
      };
      utteranceRef.current = utterance;
      setError('');
      setSpeaking(true);
      synthesis.speak(utterance);
    } catch {
      utteranceRef.current = null;
      setSpeaking(false);
      setError('朗读暂时不可用，请直接阅读下方英文正文。');
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-4">
      <button
        type="button"
        onClick={readAloud}
        disabled={!supported}
        aria-busy={speaking}
        className="inline-flex min-h-11 items-center rounded-xl bg-sky-700 px-5 font-semibold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {speaking ? '正在朗读' : '朗读英文正文'}
      </button>
      <p className="mt-2 text-sm leading-6 text-slate-600">朗读用于辅助听读，英文正文始终显示在下方。</p>
      {!supported ? (
        <p role="status" className="mt-2 text-sm font-semibold text-amber-800">当前浏览器不支持朗读，请直接阅读下方英文正文。</p>
      ) : error ? (
        <p role="status" className="mt-2 text-sm font-semibold text-amber-800">{error}</p>
      ) : null}
    </div>
  );
}

export function LessonPractice({
  lesson,
  onPassed,
  nextLessonId,
  subject,
}: {
  lesson: LanguageLesson;
  onPassed: () => void;
  nextLessonId: string | null;
  subject: LanguageSubject;
}) {
  const config = SUBJECTS[subject];
  const theme = THEMES[config.theme];
  const basePath = `/${subject}`;
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<'playing' | 'passed' | 'failed'>('playing');
  const [attempt, setAttempt] = useState(0);
  const question = lesson.questions[questionIndex];
  const answered = answers[question.id] !== undefined;
  const score = lesson.questions.reduce(
    (total, item) => total + (answers[item.id] ? item.points : 0),
    0,
  );

  const handleAnswer = useCallback((_selected: string, isCorrect: boolean) => {
    setAnswers((current) => current[question.id] === undefined
      ? { ...current, [question.id]: isCorrect }
      : current);
  }, [question.id]);

  const restart = () => {
    setQuestionIndex(0);
    setAnswers({});
    setStatus('playing');
    setAttempt((value) => value + 1);
  };

  if (status !== 'playing') {
    const passed = status === 'passed';
    return (
      <section aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className={`text-2xl font-bold ${passed ? 'text-emerald-700' : 'text-slate-800'}`}>
          {passed ? '本课完成' : '再练一次'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {passed ? `答对 ${score / 10} 题，已经达到本课要求。` : `答对 ${score / 10} 题，需要至少答对 2 题。`}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {passed ? (
            nextLessonId ? (
              <Link to={`${basePath}/${nextLessonId}`} className={`inline-flex min-h-11 items-center rounded-xl px-5 font-semibold text-white ${theme.action}`}>
                进入下一课
              </Link>
            ) : (
              <Link to={basePath} className={`inline-flex min-h-11 items-center rounded-xl px-5 font-semibold text-white ${theme.action}`}>
                返回{config.label}课程
              </Link>
            )
          ) : (
            <button type="button" onClick={restart} className={`min-h-11 rounded-xl px-5 font-semibold text-white ${theme.action}`}>
              重新练习
            </button>
          )}
          <Link to={basePath} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-600 hover:bg-slate-50">
            查看三课
          </Link>
        </div>
      </section>
    );
  }

  const finishQuestion = () => {
    if (questionIndex < lesson.questions.length - 1) {
      setQuestionIndex((value) => value + 1);
      return;
    }
    const correctCount = Object.values(answers).filter(Boolean).length;
    if (correctCount >= PASS_COUNT) {
      setStatus('passed');
      onPassed();
    } else {
      setStatus('failed');
    }
  };

  return (
    <section aria-labelledby="practice-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wider ${theme.kicker}`}>小练习</p>
          <h2 id="practice-title" className="mt-1 text-xl font-bold text-slate-900">答对 2 题即可完成本课</h2>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${theme.chip}`}>
          {questionIndex + 1} / {lesson.questions.length}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="练习进度" aria-valuenow={questionIndex + 1} aria-valuemin={1} aria-valuemax={lesson.questions.length}>
        <div className={`h-full rounded-full ${theme.progress}`} style={{ width: `${((questionIndex + 1) / lesson.questions.length) * 100}%` }} />
      </div>
      <div className="mt-6" key={`${question.id}:${attempt}`}>
        {question.type === 'choice' ? (
          <ChoiceGame question={question} onAnswer={handleAnswer} />
        ) : (
          <FillBlankGame question={question} onAnswer={handleAnswer} />
        )}
      </div>
      {answered ? (
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={finishQuestion} className={`min-h-11 rounded-xl px-5 font-semibold text-white ${theme.action}`}>
            {questionIndex === lesson.questions.length - 1 ? '查看结果' : '下一题'}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default function LanguageSubjectPage({ subject }: { subject: LanguageSubject }) {
  const config = SUBJECTS[subject];
  const theme = THEMES[config.theme];
  const basePath = `/${subject}`;
  const { lessonId } = useParams<{ lessonId: string }>();
  const { progress, startLanguageLesson, completeLanguageLesson } = useProgress();
  const lesson = lessonId ? config.lessons.find((item) => item.id === lessonId) : undefined;
  const subjectProgress = progress.languageLessons?.[subject];
  const completedIds = subjectProgress?.completedLessonIds;
  const completed = useMemo(() => new Set(completedIds ?? []), [completedIds]);
  const nextLessonId = getNextLanguageLessonId(progress, subject, config.lessonIds);
  const isLocked = !!lesson && !completed.has(lesson.id) && nextLessonId !== lesson.id;

  useEffect(() => {
    document.title = `${config.label}学习 · 语数英综合学习平台`;
    return () => { document.title = '语数英综合学习平台'; };
  }, [config.label]);

  useEffect(() => {
    if (!lesson || isLocked || completed.has(lesson.id)) return;
    startLanguageLesson(subject, lesson.id, config.lessonIds);
  }, [completed, config.lessonIds, isLocked, lesson, startLanguageLesson, subject]);

  if (lessonId && (!lesson || isLocked)) return <Navigate to={basePath} replace />;

  const content = lesson ? (
    <div className="space-y-6">
      <nav aria-label="面包屑" className="text-sm">
        <Link to={basePath} className={`font-semibold hover:underline ${theme.accent}`}>← {config.label}课程</Link>
      </nav>
      <article className={`rounded-2xl border bg-white p-6 shadow-sm sm:p-8 ${theme.border}`}>
        <p className={`text-sm font-bold ${theme.kicker}`}>{config.unitTitle} · 第 {config.lessons.indexOf(lesson) + 1} 课</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{lesson.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{lesson.summary}</p>
        {lesson.speakable ? <ReadAloudButton text={lesson.body} /> : null}
        <div lang={lesson.speakable ? 'en' : undefined} className="mt-7 space-y-4 text-base leading-8 text-slate-700">
          {lesson.body.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </article>
      <LessonPractice
        key={lesson.id}
        lesson={lesson}
        nextLessonId={nextLessonId}
        subject={subject}
        onPassed={() => completeLanguageLesson(subject, lesson.id, config.lessonIds)}
      />
    </div>
  ) : (
    <div>
      <section className={`rounded-2xl bg-gradient-to-br px-6 py-8 text-white shadow-lg sm:px-8 ${theme.hero}`}>
        <p className={`text-sm font-semibold ${theme.heroKicker}`}>{config.label} · 三课小单元</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{config.unitTitle}</h1>
        <p className={`mt-3 max-w-2xl text-sm leading-6 ${theme.heroCopy}`}>{config.unitSummary}</p>
        <p className="mt-5 text-sm font-bold">已完成 {completed.size} / {config.lessons.length} 课</p>
      </section>
      <section aria-labelledby="lesson-list-title" className="mt-7">
        <h2 id="lesson-list-title" className="text-xl font-bold text-slate-900">三课学习顺序</h2>
        <div className="mt-4 grid gap-4">
          {config.lessons.map((item, index) => {
            const isDone = completed.has(item.id);
            const available = isDone || item.id === nextLessonId;
            const status = isDone ? '已完成' : available ? (subjectProgress?.currentLessonId === item.id ? '继续学习' : '可以开始') : '完成前一课后开放';
            const card = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${theme.kicker}`}>第 {index + 1} 课</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.summary}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${isDone ? 'bg-emerald-100 text-emerald-700' : available ? theme.availableChip : 'bg-slate-100 text-slate-500'}`}>{status}</span>
                </div>
                {available ? <span className={`mt-4 inline-flex min-h-11 items-center text-sm font-bold ${theme.accent}`}>{isDone ? '回看课程' : '进入课程'} →</span> : null}
              </>
            );
            return available ? (
              <Link key={item.id} to={`${basePath}/${item.id}`} className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-4 motion-reduce:transition-none ${theme.card}`}>
                {card}
              </Link>
            ) : (
              <article key={item.id} aria-label={`${item.title}，${status}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 opacity-75">
                {card}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );

  return (
    <div className="app-frame min-h-screen flex flex-col">
      <a href="#main-content" className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:shadow-lg ${theme.accent}`}>跳到主要内容</a>
      <header className="app-header">
        <div className="app-container flex min-h-[68px] items-center justify-between gap-3 py-3 sm:gap-4">
          <Link to={basePath} className={`flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-4 ${theme.focus}`} aria-label={`${config.label}课程首页`}>
            <span className={`brand-mark shrink-0 ${theme.mark}`} aria-hidden="true">{config.mark}</span>
            <div className="brand-copy min-w-0"><strong className="block truncate">{config.label}学习</strong><small className="block truncate">{config.unitTitle}</small></div>
          </Link>
          <Link to="/" className={`inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-white focus-visible:outline-none focus-visible:ring-4 sm:px-4 ${theme.focus}`}>返回学习中心</Link>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="app-main">{content}</main>
      <footer className="border-t border-slate-200 bg-white"><div className="app-container py-4 text-center text-xs text-slate-500">{config.label} · {config.unitTitle}</div></footer>
    </div>
  );
}
