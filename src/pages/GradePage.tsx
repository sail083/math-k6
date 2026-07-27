import { useParams, Link } from 'react-router-dom';
import { getKnowledgePointsByGrade } from '@/lib/content';
import { useProgress } from '@/context/ProgressContext';
import type { Grade } from '@/lib/types';

const gradeLabels: Record<number, string> = {
  3: '三年级',
  4: '四年级',
  5: '五年级',
  6: '六年级',
};

function Stars({ count }: { count: number }) {
  return (
    <span className="text-sm" aria-label={`${count} 星`}>
      {'★'.repeat(count)}
      {'☆'.repeat(3 - count)}
    </span>
  );
}

export default function GradePage() {
  const { grade } = useParams<{ grade: string }>();
  const { isUnlocked, isPassed, getStars } = useProgress();

  const gradeNum = Number(grade) as Grade;
  const isValidGrade = [3, 4, 5, 6].includes(gradeNum);

  if (!isValidGrade) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">年级不存在，请从首页选择年级。</p>
        <Link to="/" className="text-indigo-600 hover:underline mt-2 inline-block">
          返回首页
        </Link>
      </div>
    );
  }

  const kps = getKnowledgePointsByGrade(gradeNum);

  if (kps.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-bold text-slate-700 mb-2">
          {gradeLabels[gradeNum]}
        </h1>
        <p className="text-slate-500">该年级的知识点内容正在建设中，敬请期待。</p>
        <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-sm text-slate-400 hover:text-indigo-600">
          ← 首页
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-800">{gradeLabels[gradeNum]}</h1>
      </div>

      <div className="space-y-3">
        {kps.map((kp) => {
          const unlocked = isUnlocked(kp.meta.prerequisites);
          const passed = isPassed(kp.meta.id);
          const stars = getStars(kp.meta.id);

          return (
            <Link
              key={kp.meta.id}
              to={unlocked ? `/kp/${kp.meta.id}` : '#'}
              onClick={(e) => {
                if (!unlocked) e.preventDefault();
              }}
              className={`block rounded-xl border bg-white p-4 transition-all ${
                unlocked
                  ? 'border-slate-200 hover:border-indigo-400 hover:shadow-md cursor-pointer'
                  : 'border-slate-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold shrink-0">
                      {kp.meta.unit}
                    </span>
                    <h2 className="font-semibold text-slate-800 truncate">
                      {kp.meta.title}
                    </h2>
                    {passed && (
                      <span className="shrink-0 text-green-500 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">
                        已通过
                      </span>
                    )}
                  </div>
                  {kp.meta.formula && (
                    <p className="mt-1 ml-9 text-sm text-indigo-600 font-mono">
                      {kp.meta.formula}
                    </p>
                  )}
                  <p className="mt-1 ml-9 text-xs text-slate-400 truncate">
                    {kp.meta.objectives[0] ?? ''}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {!unlocked ? (
                    <span className="text-slate-400 text-lg" title="需先完成前置知识点">
                      🔒
                    </span>
                  ) : passed ? (
                    <Stars count={stars} />
                  ) : (
                    <span className="text-indigo-400 text-lg">→</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
