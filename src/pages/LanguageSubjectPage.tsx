import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReadAloudButton } from '@/components/ReadAloudButton';
import ListeningExercise from '@/components/ListeningExercise';
export { ReadAloudButton } from '@/components/ReadAloudButton';
import { Link, Navigate, useParams } from 'react-router-dom';
import ChoiceGame from '@/components/games/ChoiceGame';
import CharacterStrokeStudy from '@/components/CharacterStrokeStudy';
import FillBlankGame from '@/components/games/FillBlankGame';
import LessonProject from '@/components/LessonProject';
import { LocalSpeakingPractice } from '@/components/LocalSpeakingPractice';
import { useAuth } from '@/context/AuthContext';
import { chineseLessonIds, chineseLessons, chineseUnits } from '@/content/chinese';
import { englishLessonIds, englishLessons, englishUnits } from '@/content/english';
import { useProgress } from '@/context/ProgressContext';
import { getNextLanguageLessonId } from '@/lib/progress';
import type { LanguageLesson, LanguageSubject, LanguageUnit } from '@/lib/types';

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
  units: LanguageUnit[];
  theme: keyof typeof THEMES;
}

const SUBJECTS: Record<LanguageSubject, SubjectConfig> = {
  chinese: {
    label: '语文',
    mark: '文',
    unitTitle: '语文自学课程',
    unitSummary: '按年级选择原创能力单元，从读懂到写清楚。每个单元都可以独立开始。',
    lessons: chineseLessons,
    lessonIds: chineseLessonIds,
    units: chineseUnits,
    theme: 'rose',
  },
  english: {
    label: '英语',
    mark: 'Aa',
    unitTitle: '外研版英语课程',
    unitSummary: '以外研社《英语（新标准）》2022课标新修订版为教材方向，按年级选择原创练习。每个单元可独立开始，教材映射状态见各单元。',
    lessons: englishLessons,
    lessonIds: englishLessonIds,
    units: englishUnits,
    theme: 'sky',
  },
};



interface LessonPracticeProps {
  lesson: LanguageLesson;
  onPassed: () => void;
  nextLessonId: string | null;
  subject: LanguageSubject;
}

export function LessonPractice(props: LessonPracticeProps) {
  const { user } = useAuth();
  return <LessonPracticeSession key={JSON.stringify([user?.id, props.subject, props.lesson.id])} {...props} ownerId={user?.id ?? null} />;
}

function LessonPracticeSession({
  lesson,
  onPassed,
  nextLessonId,
  subject,
  ownerId,
}: LessonPracticeProps & { ownerId: string | null }) {
  const config = SUBJECTS[subject];
  const theme = THEMES[config.theme];
  const basePath = `/${subject}`;
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<'playing' | 'passed' | 'failed' | 'project_pending'>('playing');
  const [projectReady, setProjectReady] = useState(false);
  const [usedReadingHelp, setUsedReadingHelp] = useState(false);
  const markReadingHelp = useCallback(() => setUsedReadingHelp(true), []);
  const [attempt, setAttempt] = useState(0);
  const question = lesson.questions[questionIndex];
  const answered = answers[question.id] !== undefined;
  const score = lesson.questions.reduce(
    (total, item) => total + (answers[item.id] ? item.points : 0),
    0,
  );
  const projectEditor = lesson.project ? <LessonProject project={lesson.project} ownerId={ownerId}
    subject={subject} lessonId={lesson.id} onReady={setProjectReady} /> : null;

  const handleAnswer = useCallback((_selected: string, isCorrect: boolean) => {
    setAnswers((current) => current[question.id] === undefined
      ? { ...current, [question.id]: isCorrect }
      : current);
  }, [question.id]);

  const restart = () => {
    setQuestionIndex(0);
    setAnswers({});
    setStatus('playing');
    setUsedReadingHelp(false);
    setAttempt((value) => value + 1);
  };

  if (status !== 'playing') {
    const passed = status === 'passed';
    return (<>
      {projectEditor}
      <section aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className={`text-2xl font-bold ${passed ? 'text-emerald-700' : 'text-slate-800'}`}>
          {passed ? '本课完成' : status === 'project_pending' ? '练习达标，请完成作品自检' : '再练一次'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {passed ? `答对 ${score / 10} 题，${lesson.project ? '本次练习与作品自检已完成' : '本次练习已完成'}。` : status === 'project_pending'
            ? '小练习已经达标。请完成上方作品并逐项自检，然后确认完成本课。'
            : `答对 ${score / 10} 题，需要至少答对 2 题。`}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {usedReadingHelp ? <p role="note" className="w-full text-sm text-slate-600">本次使用了阅读辅助，成绩表示练习完成，不作为独立听辨结果。</p> : null}
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
          ) : status === 'project_pending' ? (
            <button type="button" disabled={!projectReady} onClick={() => {
              if (!projectReady) return;
              setStatus('passed');
              onPassed();
            }} className={`min-h-11 rounded-xl px-5 font-semibold text-white disabled:bg-slate-400 ${theme.action}`}>完成自检，确认完成本课</button>
          ) : (
            <button type="button" onClick={restart} className={`min-h-11 rounded-xl px-5 font-semibold text-white ${theme.action}`}>
              重新练习
            </button>
          )}
          <Link to={basePath} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-600 hover:bg-slate-50">
            查看课程
          </Link>
        </div>
      </section>
      </>
    );
  }

  const finishQuestion = () => {
    if (questionIndex < lesson.questions.length - 1) {
      setQuestionIndex((value) => value + 1);
      return;
    }
    const correctCount = Object.values(answers).filter(Boolean).length;
    if (correctCount >= PASS_COUNT) {
      if (lesson.project && !projectReady) {
        setStatus('project_pending');
        return;
      }
      setStatus('passed');
      onPassed();
    } else {
      setStatus('failed');
    }
  };

  return (<>
    {projectEditor}
    <section aria-labelledby="practice-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wider ${theme.kicker}`}>小练习</p>
          <h2 id="practice-title" className="mt-1 text-xl font-bold text-slate-900">{lesson.project ? '答对 2 题并完成作品自检' : '答对 2 题即可完成本课'}</h2>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${theme.chip}`}>
          {questionIndex + 1} / {lesson.questions.length}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label={`练习进度：第 ${questionIndex + 1} / ${lesson.questions.length} 题`} aria-valuenow={questionIndex + 1} aria-valuemin={1} aria-valuemax={lesson.questions.length}>
        <div className={`h-full rounded-full ${theme.progress}`} style={{ width: `${((questionIndex + 1) / lesson.questions.length) * 100}%` }} />
      </div>
      <div className="mt-6" key={`${question.id}:${attempt}`}>
        <ListeningExercise text={question.listeningText} prompt={question.prompt} onReadingHelp={markReadingHelp}>
        {question.type === 'choice' ? (
          <ChoiceGame question={question} onAnswer={handleAnswer} />
        ) : (
          <FillBlankGame question={question} onAnswer={handleAnswer} />
        )}
        </ListeningExercise>
      </div>
      {answered ? (
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={finishQuestion} className={`min-h-11 rounded-xl px-5 font-semibold text-white ${theme.action}`}>
            {questionIndex === lesson.questions.length - 1 ? '查看结果' : '下一题'}
          </button>
        </div>
      ) : null}
    </section>
    </>
  );
}

export default function LanguageSubjectPage({ subject }: { subject: LanguageSubject }) {
  const config = SUBJECTS[subject];
  const theme = THEMES[config.theme];
  const basePath = `/${subject}`;
  const { lessonId } = useParams<{ lessonId: string }>();
  const units = config.units;
  const { progress, startLanguageLesson, completeLanguageLesson } = useProgress();
  const lesson = lessonId ? config.lessons.find((item) => item.id === lessonId) : undefined;
  const activeUnit = lesson
    ? config.units.find((unit) => unit.lessonIds.includes(lesson.id))
    : undefined;
  const orderedLessonIds = activeUnit?.lessonIds ?? config.lessonIds;
  const subjectProgress = progress.languageLessons?.[subject];
  const completedIds = subjectProgress?.completedLessonIds;
  const completed = useMemo(() => new Set(completedIds ?? []), [completedIds]);
  const nextLessonId = getNextLanguageLessonId(progress, subject, orderedLessonIds);
  const isLocked = !!lesson && !completed.has(lesson.id) && nextLessonId !== lesson.id;

  useEffect(() => {
    document.title = `${config.label}学习 · 语数英综合学习平台`;
    return () => { document.title = '语数英综合学习平台'; };
  }, [config.label]);

  useEffect(() => {
    if (!lesson || isLocked || completed.has(lesson.id)) return;
    startLanguageLesson(subject, lesson.id, orderedLessonIds);
  }, [completed, isLocked, lesson, orderedLessonIds, startLanguageLesson, subject]);

  if (lessonId && (!lesson || isLocked)) return <Navigate to={basePath} replace />;

  const content = lesson ? (
    <div className="space-y-6">
      <nav aria-label="面包屑" className="text-sm">
        <Link to={basePath} className={`inline-flex min-h-11 items-center font-semibold hover:underline ${theme.accent}`}>← {config.label}课程</Link>
      </nav>
      <article className={`rounded-2xl border bg-white p-6 shadow-sm sm:p-8 ${theme.border}`}>
        <p className={`text-sm font-bold ${theme.kicker}`}>{activeUnit?.title ?? config.unitTitle} · 第 {orderedLessonIds.indexOf(lesson.id) + 1} 课</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{lesson.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{lesson.summary}</p>
        {lesson.studyGuide ? (
          <section aria-label="自学提示" className="mt-5 rounded-xl bg-sky-50 p-4">
            <h2 className="font-bold text-slate-900">先这样学</h2>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
              {lesson.studyGuide.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </section>
        ) : null}
        {lesson.speakable || lesson.readAloudText ? <ReadAloudButton key={lesson.id} text={lesson.readAloudText ?? lesson.body} /> : null}
        {lesson.speakable ? <LocalSpeakingPractice prompt={subject === 'chinese' ? '可选：用自己的话复述本课要点。' : '可选：朗读或用自己的话回答本课提示。'} /> : null}
        {lesson.readAloudText ? <p lang="en" className="mt-4 text-base leading-8">{lesson.readAloudText}</p> : null}
        <div lang={lesson.speakable ? 'en' : undefined} className="mt-7 space-y-4 text-base leading-8 text-slate-700">
          {lesson.body.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </article>
      {lesson.characters ? <CharacterStrokeStudy characters={lesson.characters} /> : null}
      <LessonPractice
        key={lesson.id}
        lesson={lesson}
        nextLessonId={nextLessonId}
        subject={subject}
        onPassed={() => completeLanguageLesson(subject, lesson.id, orderedLessonIds)}
      />
    </div>
  ) : (
    <div>
      <section className={`rounded-2xl bg-gradient-to-br px-6 py-8 text-white shadow-lg sm:px-8 ${theme.hero}`}>
        <p className={`text-sm font-semibold ${theme.heroKicker}`}>{subject === 'english' ? '英语 · 外研社三年级起点' : '语文 · 3—6年级原创能力课程'}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{config.unitTitle}</h1>
        <p className={`mt-3 max-w-2xl text-sm leading-6 ${theme.heroCopy}`}>{config.unitSummary}</p>
        <p className="mt-5 text-sm font-bold">已完成 {config.lessonIds.filter((id) => completed.has(id)).length} / {config.lessons.length} 课</p>
      </section>
      <section aria-labelledby="lesson-list-title" className="mt-7 space-y-7">
        <h2 id="lesson-list-title" className="text-xl font-bold text-slate-900">选择学习单元</h2>
        <nav aria-label="年级单元导航" className="flex flex-wrap gap-2">
          {units.filter((unit, index) => index === 0 || unit.grade !== units[index - 1].grade).map((unit) => <a key={unit.id} href={`#${unit.id}-title`} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold focus-visible:ring-4 focus-visible:ring-sky-200">
            {unit.grade}年级
          </a>)}
        </nav>
        {units.map((unit) => {
          const unitLessons = unit.lessonIds.map((id) => config.lessons.find((item) => item.id === id)).filter((item): item is LanguageLesson => !!item);
          const unitNextLessonId = getNextLanguageLessonId(progress, subject, unit.lessonIds);
          const unitCompleted = unit.lessonIds.filter((id) => completed.has(id)).length;
          return (
            <section key={unit.id} aria-labelledby={`${unit.id}-title`} className="rounded-2xl border border-slate-200 bg-white/60 p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className={`text-xs font-bold ${theme.kicker}`}>{unit.grade}年级{unit.semester ?? ''} · {subject === 'english' && unit.unit ? `Unit ${unit.unit}` : '原创能力课程'}</p>
                  {unit.curriculumLabel ? <p className="mt-1 text-xs leading-5 text-slate-600">{unit.curriculumLabel}</p> : null}
                  <h3 id={`${unit.id}-title`} tabIndex={-1} className="mt-1 scroll-mt-24 text-xl font-bold text-slate-900">{unit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{unit.summary}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-slate-600">已完成 {unitCompleted} / {unit.lessonIds.length} 课</span>
              </div>
              <div className="mt-4 grid gap-4">
          {unitLessons.map((item, index) => {
            const isDone = completed.has(item.id);
            const available = isDone || item.id === unitNextLessonId;
            const status = isDone ? '已完成' : available ? (subjectProgress?.currentLessonId === item.id ? '继续学习' : '可以开始') : '完成前一课后开放';
            const card = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${theme.kicker}`}>第 {index + 1} 课</p>
                    <h4 className="mt-1 text-xl font-bold text-slate-900">{item.title}</h4>
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
          );
        })}
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
            <div className="brand-copy min-w-0"><strong className="block truncate">{config.label}学习</strong><small className="block truncate">{activeUnit?.title ?? config.unitTitle}</small></div>
          </Link>
          <Link to="/" className={`inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-white focus-visible:outline-none focus-visible:ring-4 sm:px-4 ${theme.focus}`}>返回学习中心</Link>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="app-main">{content}</main>
      <footer className="border-t border-slate-200 bg-white"><div className="app-container py-4 text-center text-xs text-slate-500">{config.label} · {activeUnit?.title ?? config.unitTitle}</div></footer>
    </div>
  );
}
