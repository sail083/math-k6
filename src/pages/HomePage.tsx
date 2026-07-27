import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getGrades, getKnowledgePointsByGrade } from '@/lib/content';
import { useProgress } from '@/context/ProgressContext';
import type { TextbookVersion } from '@/lib/types';

const gradeMeta: Record<number, { title: string; desc: string; emoji: string }> = {
  3: { title: '三年级', desc: '面积、分数初步认识', emoji: '📐' },
  4: { title: '四年级', desc: '运算律、三角形', emoji: '✏️' },
  5: { title: '五年级', desc: '多边形面积、分数运算', emoji: '📏' },
  6: { title: '六年级', desc: '圆、圆柱与圆锥', emoji: '⭕' },
};

type VersionFilter = '全部' | TextbookVersion;
const versionOptions: VersionFilter[] = ['全部', '人教版', '北师大版', '苏教版'];

const versionColors: Record<VersionFilter, string> = {
  全部: 'bg-indigo-600 text-white',
  人教版: 'bg-rose-600 text-white',
  北师大版: 'bg-sky-600 text-white',
  苏教版: 'bg-emerald-600 text-white',
};

export default function HomePage() {
  const grades = getGrades();
  const { progress } = useProgress();
  const [version, setVersion] = useState<VersionFilter>('全部');

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

      {/* 教材版本过滤 */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-slate-600">📚 教材版本</span>
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
                to={`/grade/${g}`}
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
