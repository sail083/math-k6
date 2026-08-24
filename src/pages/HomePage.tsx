import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getGrades, getKnowledgePointsByGrade, getAllKnowledgePoints, getKnowledgePointById } from '@/lib/content';
import { useProgress } from '@/context/ProgressContext';
import type { TextbookFilter } from '@/lib/types';

const gradeMeta: Record<number, { title: string; desc: string; emoji: string }> = {
  3: { title: '三年级', desc: '面积、分数初步认识', emoji: '📐' },
  4: { title: '四年级', desc: '运算律、三角形', emoji: '✏️' },
  5: { title: '五年级', desc: '多边形面积、分数运算', emoji: '📏' },
  6: { title: '六年级', desc: '圆、圆柱与圆锥', emoji: '⭕' },
};

const versionOptions: TextbookFilter[] = ['全部', '人教版', '北师大版', '苏教版'];

const versionColors: Record<TextbookFilter, string> = {
  全部: 'bg-indigo-600 text-white',
  人教版: 'bg-rose-600 text-white',
  北师大版: 'bg-sky-600 text-white',
  苏教版: 'bg-emerald-600 text-white',
};

interface RecommendedAction {
  link: string;
  reason: string;
  title: string;
  description: string;
  urgent: boolean;
}

export default function HomePage() {
  const grades = getGrades();
  const { progress, isPassed, getDueReviewIds, getMasteryStatus } = useProgress();
  const [version, setVersion] = useState<TextbookFilter>('全部');

  // Compute recommended action
  const allKPs = getAllKnowledgePoints();
  const dueReviews = getDueReviewIds();

  let recommended: RecommendedAction | null = null;

  if (dueReviews.length > 0) {
    const kp = getKnowledgePointById(dueReviews[0]);
    if (kp) {
      recommended = {
        link: `/kp/${kp.meta.id}`,
        reason: '复习时间到了',
        title: kp.meta.title,
        description: `${kp.meta.grade}年级 · 这个知识点需要复习了，来巩固一下。`,
        urgent: true,
      };
    }
  } else if (progress.currentLearning) {
    const kp = getKnowledgePointById(progress.currentLearning);
    if (kp && !isPassed(kp.meta.id)) {
      recommended = {
        link: `/kp/${kp.meta.id}`,
        reason: '继续学习',
        title: kp.meta.title,
        description: `${kp.meta.grade}年级 · 你上次学到这里，继续吧。`,
        urgent: false,
      };
    }
  }

  if (!recommended) {
    const firstRecommended = allKPs.find(
      (kp) => !isPassed(kp.meta.id) && kp.meta.prerequisites.every((p) => isPassed(p)),
    );
    const target = firstRecommended ?? allKPs.find((kp) => !isPassed(kp.meta.id));
    if (target) {
      const hasUnmetPrereqs = target.meta.prerequisites.some((p) => !isPassed(p));
      recommended = {
        link: `/kp/${target.meta.id}`,
        reason: hasUnmetPrereqs ? '推荐学习' : '开始学习',
        title: target.meta.title,
        description: hasUnmetPrereqs
          ? `${target.meta.grade}年级 · 可自由学习，建议先复习前置知识。`
          : `${target.meta.grade}年级 · 还没有学过的知识点，从这里开始吧。`,
        urgent: false,
      };
    }
  }

  // Compute stable/provisional/due counts
  const stableCount = allKPs.filter((kp) => getMasteryStatus(kp.meta.id) === 'stable').length;
  const dueCount = dueReviews.length;
  const provisionalCount = allKPs.filter((kp) => getMasteryStatus(kp.meta.id) === 'provisional').length;

  // 计算每个版本覆盖的知识点总数
  const versionCoverage: Record<string, number> = {
    人教版: 0,
    北师大版: 0,
    苏教版: 0,
  };
  for (const g of grades) {
    for (const kp of getKnowledgePointsByGrade(g)) {
      for (const ref of kp.meta.textbookRefs) {
        versionCoverage[ref.version] = (versionCoverage[ref.version] ?? 0) + 1;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* 欢迎横幅 */}
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">一次讲透小学数学</h1>
        <p className="text-indigo-100 text-sm sm:text-base">
          可视化讲解 · 公式原理推导 · 闯关巩固练习，让每个知识点都真正理解。
        </p>
      </section>

      {/* 今日推荐 / 继续学习 */}
      {recommended && (
        <section>
          <Link
            to={recommended.link}
            className={`block rounded-xl border-2 p-5 transition-all hover:shadow-md min-h-[88px] ${
              recommended.urgent
                ? 'border-amber-400 bg-amber-50'
                : 'border-indigo-200 bg-indigo-50/60'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className={`text-xs font-bold ${recommended.urgent ? 'text-amber-600' : 'text-indigo-500'}`}>
                  {recommended.reason}
                </span>
                <h2 className="text-lg font-bold text-slate-800 mt-1 truncate">{recommended.title}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{recommended.description}</p>
              </div>
              <span className={`shrink-0 text-2xl ${recommended.urgent ? 'text-amber-400' : 'text-indigo-400'}`}>→</span>
            </div>
          </Link>
        </section>
      )}

      {/* 掌握概览 */}
      {(stableCount > 0 || dueCount > 0 || provisionalCount > 0) && (
        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600 tabular-nums">{stableCount}</div>
            <div className="text-xs text-emerald-700 mt-0.5">已稳固</div>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
            <div className="text-2xl font-bold text-amber-600 tabular-nums">{dueCount}</div>
            <div className="text-xs text-amber-700 mt-0.5">待复习</div>
          </div>
          <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 text-center">
            <div className="text-2xl font-bold text-sky-600 tabular-nums">{provisionalCount}</div>
            <div className="text-xs text-sky-700 mt-0.5">当堂会</div>
          </div>
        </section>
      )}

      {/* 教材版本过滤 */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-slate-600">📚 已收录教材</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {versionOptions.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVersion(v)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all min-h-[44px] ${
                version === v
                  ? versionColors[v] + ' shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        {version !== '全部' && (
          <p className="mt-3 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{version}</span>
            覆盖{' '}
            <span className="font-bold text-indigo-600 tabular-nums">
              {versionCoverage[version]}
            </span>{' '}
            个知识点
          </p>
        )}
      </section>

      {/* 年级卡片 */}
      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">选择年级开始学习</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {grades.map((g) => {
            const allKPs = getKnowledgePointsByGrade(g);
            const kps =
              version === '全部'
                ? allKPs
                : allKPs.filter((kp) =>
                    kp.meta.textbookRefs.some((ref) => ref.version === version),
                  );
            const passed = kps.filter((kp) =>
              progress.passedKnowledgePoints.includes(kp.meta.id),
            ).length;
            const meta = gradeMeta[g];
            return (
              <Link
                key={g}
                to={`/grade/${g}?version=${encodeURIComponent(version)}`}
                className="group block rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-400 hover:shadow-md min-h-[44px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{meta.emoji}</span>
                    <div>
                      <div className="text-lg font-bold text-slate-800">{meta.title}</div>
                      <div className="text-sm text-slate-500">{meta.desc}</div>
                    </div>
                  </div>
                  <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <span>
                    {version !== '全部' && (
                      <span className="text-indigo-500 font-medium">{version} · </span>
                    )}
                    {kps.length} 个知识点
                  </span>
                  {kps.length > 0 && (
                    <>
                      <span>·</span>
                      <span>已通过 {passed}</span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
