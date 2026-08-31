import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import ChoiceGame from '@/components/games/ChoiceGame';
import FillBlankGame from '@/components/games/FillBlankGame';
import { chineseLessonIds, chineseLessons } from '@/content/chinese';
import { useProgress } from '@/context/ProgressContext';
import { getNextLanguageLessonId } from '@/lib/progress';
import type { LanguageLesson } from '@/lib/types';

const PASS_COUNT = 2;

export function LessonPractice({
  lesson,
  onPassed,
  nextLessonId,
}: {
  lesson: LanguageLesson;
  onPassed: () => void;
  nextLessonId: string | null;
}) {
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
              <Link to={`/chinese/${nextLessonId}`} className="inline-flex min-h-11 items-center rounded-xl bg-rose-600 px-5 font-semibold text-white hover:bg-rose-700">
                进入下一课
              </Link>
            ) : (
              <Link to="/chinese" className="inline-flex min-h-11 items-center rounded-xl bg-rose-600 px-5 font-semibold text-white hover:bg-rose-700">
                返回语文课程
              </Link>
            )
          ) : (
            <button type="button" onClick={restart} className="min-h-11 rounded-xl bg-rose-600 px-5 font-semibold text-white hover:bg-rose-700">
              重新练习
            </button>
          )}
          <Link to="/chinese" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-600 hover:bg-slate-50">
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
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-rose-500">小练习</p>
          <h2 id="practice-title" className="mt-1 text-xl font-bold text-slate-900">答对 2 题即可完成本课</h2>
        </div>
        <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">
          {questionIndex + 1} / {lesson.questions.length}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="练习进度" aria-valuenow={questionIndex + 1} aria-valuemin={1} aria-valuemax={lesson.questions.length}>
        <div className="h-full rounded-full bg-rose-500" style={{ width: `${((questionIndex + 1) / lesson.questions.length) * 100}%` }} />
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
          <button type="button" onClick={finishQuestion} className="min-h-11 rounded-xl bg-rose-600 px-5 font-semibold text-white hover:bg-rose-700">
            {questionIndex === lesson.questions.length - 1 ? '查看结果' : '下一题'}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default function LanguageSubjectPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { progress, startLanguageLesson, completeLanguageLesson } = useProgress();
  const lesson = lessonId ? chineseLessons.find((item) => item.id === lessonId) : undefined;
  const completedIds = progress.languageLessons?.chinese?.completedLessonIds;
  const completed = useMemo(() => new Set(completedIds ?? []), [completedIds]);
  const nextLessonId = getNextLanguageLessonId(progress, 'chinese', chineseLessonIds);
  const isLocked = !!lesson && !completed.has(lesson.id) && nextLessonId !== lesson.id;

  useEffect(() => {
    if (!lesson || isLocked || completed.has(lesson.id)) return;
    startLanguageLesson('chinese', lesson.id, chineseLessonIds);
  }, [completed, isLocked, lesson, startLanguageLesson]);

  if (lessonId && (!lesson || isLocked)) return <Navigate to="/chinese" replace />;

  const content = lesson ? (
    <div className="space-y-6">
      <nav aria-label="面包屑" className="text-sm">
        <Link to="/chinese" className="font-semibold text-rose-700 hover:underline">← 语文课程</Link>
      </nav>
      <article className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold text-rose-600">校园里的小发现 · 第 {chineseLessons.indexOf(lesson) + 1} 课</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{lesson.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{lesson.summary}</p>
        <div className="mt-7 space-y-4 text-base leading-8 text-slate-700">
          {lesson.body.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </article>
      <LessonPractice
        key={lesson.id}
        lesson={lesson}
        nextLessonId={nextLessonId}
        onPassed={() => completeLanguageLesson('chinese', lesson.id, chineseLessonIds)}
      />
    </div>
  ) : (
    <div>
      <section className="rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 px-6 py-8 text-white shadow-lg sm:px-8">
        <p className="text-sm font-semibold text-rose-100">语文 · 三课小单元</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">校园里的小发现</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-rose-50">从词语、阅读到表达，把一次校园观察说清楚。</p>
        <p className="mt-5 text-sm font-bold">已完成 {completed.size} / {chineseLessons.length} 课</p>
      </section>
      <section aria-labelledby="lesson-list-title" className="mt-7">
        <h2 id="lesson-list-title" className="text-xl font-bold text-slate-900">三课学习顺序</h2>
        <div className="mt-4 grid gap-4">
          {chineseLessons.map((item, index) => {
            const isDone = completed.has(item.id);
            const available = isDone || item.id === nextLessonId;
            const status = isDone ? '已完成' : available ? (progress.languageLessons?.chinese?.currentLessonId === item.id ? '继续学习' : '可以开始') : '完成前一课后开放';
            const card = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-rose-500">第 {index + 1} 课</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.summary}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${isDone ? 'bg-emerald-100 text-emerald-700' : available ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>{status}</span>
                </div>
                {available ? <span className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-rose-700">{isDone ? '回看课程' : '进入课程'} →</span> : null}
              </>
            );
            return available ? (
              <Link key={item.id} to={`/chinese/${item.id}`} className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm transition hover:border-rose-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200">
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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-rose-700 focus:shadow-lg">跳到主要内容</a>
      <header className="app-header">
        <div className="app-container flex min-h-[68px] items-center justify-between gap-4 py-3">
          <Link to="/chinese" className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200" aria-label="语文课程首页">
            <span className="brand-mark bg-rose-600" aria-hidden="true">文</span>
            <div className="brand-copy"><strong>语文学习</strong><small>校园里的小发现</small></div>
          </Link>
          <Link to="/" className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200">返回学习中心</Link>
        </div>
      </header>
      <main id="main-content" className="app-main">{content}</main>
      <footer className="border-t border-slate-200 bg-white"><div className="app-container py-4 text-center text-xs text-slate-500">语文 · 校园里的小发现</div></footer>
    </div>
  );
}
