import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getCourseTrack, getCurriculum, getKnowledgePointById, getSemester, getTextbookRef, getTextbookUnit, getTrackCourses } from '@/lib/content';
import { useProgress } from '@/context/ProgressContext';
import type { CourseTrack, Grade, Semester, TextbookFilter, MasteryStatus } from '@/lib/types';

const gradeLabels: Record<number, string> = { 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级' };
const versions: TextbookFilter[] = ['全部', '人教版', '北师大版', '苏教版'];
const trackLabels: Record<CourseTrack, string> = {
  base: '课内基础',
  extension: '能力拓展',
  challenge: '浅奥挑战',
};

function Stars({ count }: { count: number }) {
  return <span className="text-sm text-amber-400" aria-label={`${count} 星`}>{'★'.repeat(count)}{'☆'.repeat(3 - count)}</span>;
}

const statusLabels: Record<string, { text: string; className: string }> = {
  provisional: { text: '当堂会', className: 'bg-sky-100 text-sky-700' },
  review_due: { text: '待复习', className: 'bg-amber-100 text-amber-700' },
  stable: { text: '已稳固', className: 'bg-emerald-100 text-emerald-700' },
};

function StatusBadge({ status }: { status: MasteryStatus | null }) {
  if (!status || status === 'learning') return null;
  const label = statusLabels[status];
  if (!label) return null;
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${label.className}`}>{label.text}</span>;
}

function LearningBadge() {
  return <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700">学习中</span>;
}

export default function GradePage() {
  const { grade } = useParams<{ grade: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const { progress, isPassed, getStars, getMasteryStatus } = useProgress();
  const gradeNum = Number(grade) as Grade;
  const isValidGrade = [3, 4, 5, 6].includes(gradeNum);
  const requestedVersion = searchParams.get('version');
  const rawTrack = searchParams.get('track');
  const requestedTrack: CourseTrack = rawTrack === 'extension' || rawTrack === 'challenge' ? rawTrack : 'base';
  const availableTracks = useMemo(() => (['base', 'extension', 'challenge'] as CourseTrack[]).filter(
    (item) => item === 'base' || (isValidGrade && getTrackCourses(item, gradeNum).length > 0),
  ), [gradeNum, isValidGrade]);
  const track: CourseTrack = availableTracks.includes(requestedTrack) ? requestedTrack : 'base';
  const isBase = track === 'base';
  const version: TextbookFilter = versions.includes(requestedVersion as TextbookFilter)
    ? requestedVersion as TextbookFilter
    : '全部';

  const curriculum = useMemo(
    () => isValidGrade ? (isBase ? getCurriculum(gradeNum, version) : getTrackCourses(track, gradeNum)) : [],
    [gradeNum, isBase, isValidGrade, track, version],
  );
  const visibleCourses = curriculum.filter((kp) =>
    `${kp.meta.title} ${kp.meta.objectives.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const grouped = visibleCourses.reduce<Record<Semester, typeof visibleCourses>>(
    (result, kp) => {
      result[getSemester(getTextbookRef(kp.meta, version))].push(kp);
      return result;
    },
    { '上册': [], '下册': [] },
  );
  const passedCount = curriculum.filter((kp) => progress.passedKnowledgePoints.includes(kp.meta.id)).length;
  const completion = curriculum.length ? Math.round((passedCount / curriculum.length) * 100) : 0;

  useEffect(() => {
    if (!rawTrack || rawTrack === track) return;
    const next = new URLSearchParams(searchParams);
    next.delete('track');
    setSearchParams(next, { replace: true });
  }, [rawTrack, searchParams, setSearchParams, track]);

  if (!isValidGrade) {
    return <div className="py-12 text-center"><p className="text-slate-500">年级不存在，请从首页选择年级。</p><Link to="/" className="mt-2 inline-block text-indigo-600 hover:underline">返回首页</Link></div>;
  }

  const setVersion = (next: TextbookFilter) => {
    setSearchParams(next === '全部' ? {} : { version: next });
  };
  const setTrack = (nextTrack: CourseTrack) => {
    const next = new URLSearchParams(searchParams);
    if (nextTrack === 'base') next.delete('track');
    else next.set('track', nextTrack);
    setSearchParams(next);
    setQuery('');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-slate-400 hover:text-indigo-600">← 首页</Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-600">{gradeLabels[gradeNum]}</span>
      </div>

      <section className="border-b border-slate-200 pb-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{gradeLabels[gradeNum]}{isBase ? '课程' : trackLabels[track]}</h1>
            <p className="mt-1 text-sm text-slate-500">{isBase ? version === '全部' ? '所有版本合并知识点' : `${version}编排` : track === 'extension' ? '把课内方法用到更灵活的问题里' : '组合多个基础方法解决浅奥问题'} · {curriculum.length} 课</p>
          </div>
          <div className="min-w-36 text-right">
            <p className="text-sm font-semibold text-slate-700">已完成 {passedCount} / {curriculum.length}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completion}%` }} /></div>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${availableTracks.length}, minmax(0, 1fr))` }} role="tablist" aria-label="课程层级">
          {availableTracks.map((item) => (
            <button key={item} type="button" role="tab" aria-selected={track === item} onClick={() => setTrack(item)} className={`min-h-11 min-w-0 rounded-lg border px-2 text-xs font-semibold sm:px-4 sm:text-sm ${track === item ? item === 'base' ? 'border-indigo-600 bg-indigo-600 text-white' : item === 'extension' ? 'border-sky-600 bg-sky-600 text-white' : 'border-amber-500 bg-amber-500 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{trackLabels[item]}</button>
          ))}
        </div>
        {isBase ? <div className="flex gap-2 overflow-x-auto pb-1" aria-label="教材版本">
          {versions.map((item) => <button key={item} type="button" onClick={() => setVersion(item)} className={`min-h-11 shrink-0 rounded-lg border px-4 text-sm font-medium ${version === item ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'}`}>{item === '全部' ? '所有版本' : item}</button>)}
        </div> : null}
        <label className="relative block">
          <span className="sr-only">搜索课程</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索知识点或学习目标" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          {query ? <button type="button" aria-label="清空搜索" onClick={() => setQuery('')} className="absolute right-1 top-1 h-9 w-9 text-slate-400 hover:text-slate-700">×</button> : null}
        </label>
      </div>

      {visibleCourses.length === 0 ? (
        query.trim() ? (
          <div className="py-14 text-center">
            <p className="text-slate-500 mb-2">没有找到"{query}"相关的课程</p>
            <p className="text-sm text-slate-400 mb-4">试试换个关键词，或者浏览全部课程</p>
            <button onClick={() => setQuery('')} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors min-h-[44px]">
              清除搜索
            </button>
          </div>
        ) : (
          <div className="py-14 text-center">
            <p className="text-slate-500">{gradeLabels[gradeNum]}暂无{trackLabels[track]}课程。</p>
            {!isBase ? <button type="button" onClick={() => setTrack('base')} className="mt-4 min-h-11 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white">返回课内基础</button> : null}
          </div>
        )
      ) : (
        (!isBase ? [{ label: `${trackLabels[track]}路径`, courses: visibleCourses }] : (['上册', '下册'] as Semester[]).map((semester) => ({ label: semester, courses: grouped[semester] }))).map((section) => section.courses.length > 0 ? (
          <section key={section.label} className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="font-bold text-slate-800">{section.label}</h2>
              <span className="text-xs text-slate-400">{section.courses.length} 课</span>
            </div>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {section.courses.map((kp) => {
                const ref = isBase ? getTextbookRef(kp.meta, version) : undefined;
                const passed = isPassed(kp.meta.id);
                const masteryStatus = getMasteryStatus(kp.meta.id);
                const missingPrerequisites = kp.meta.prerequisites.filter(
                  (id) => !progress.passedKnowledgePoints.includes(id),
                );
                const prerequisiteTitles = missingPrerequisites
                  .map((id) => getKnowledgePointById(id)?.meta.title)
                  .filter((title): title is string => Boolean(title));
                return (
                  <Link key={kp.meta.id} to={`/kp/${kp.meta.id}?${isBase ? `version=${encodeURIComponent(version)}` : `track=${track}`}`} className="flex min-h-[78px] items-center gap-3 p-4 transition-colors hover:bg-indigo-50/60">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-bold ${passed ? 'bg-emerald-100 text-emerald-700' : track === 'challenge' ? 'bg-amber-100 text-amber-700' : track === 'extension' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'}`}>{!isBase ? curriculum.findIndex((course) => course.meta.id === kp.meta.id) + 1 : version === '全部' ? kp.meta.unit : getTextbookUnit(ref)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="font-semibold text-slate-800">{kp.meta.title}</h3>{ref ? <span className="text-xs text-slate-400">{ref.chapter}</span> : null}{!isBase ? <span className="text-[10px] font-semibold text-slate-400">{trackLabels[getCourseTrack(kp.meta)]}</span> : null}{passed ? <StatusBadge status={masteryStatus} /> : progress.currentLearning === kp.meta.id ? <LearningBadge /> : null}</div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {prerequisiteTitles.length > 0
                          ? `建议先学：${prerequisiteTitles.join('、')}`
                          : kp.meta.objectives[0]}
                      </p>
                    </div>
                    <div className="shrink-0">{passed ? <Stars count={getStars(kp.meta.id)} /> : <span className="text-lg text-indigo-500">→</span>}</div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null)
      )}
    </div>
  );
}
