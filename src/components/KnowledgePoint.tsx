import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { KnowledgePoint } from '@/lib/types';
import { useProgress } from '@/context/ProgressContext';
import { VIZ_REGISTRY } from '@/visualizations/registry';
import DerivationPlayer from '@/components/DerivationPlayer';
import GameRunner from '@/components/GameRunner';

type Tab = 'explain' | 'derivation' | 'game';

const tabs: { key: Tab; label: string }[] = [
  { key: 'explain', label: '讲解' },
  { key: 'derivation', label: '原理' },
  { key: 'game', label: '闯关' },
];

// 教材版本徽章颜色映射
const badgeColors: Record<string, string> = {
  人教版: 'bg-red-50 text-red-600 border-red-200',
  北师大版: 'bg-blue-50 text-blue-600 border-blue-200',
  苏教版: 'bg-green-50 text-green-600 border-green-200',
};

export interface KnowledgePointProps {
  knowledgePoint: KnowledgePoint;
}

export default function KnowledgePoint({ knowledgePoint: kp }: KnowledgePointProps) {
  const { meta } = kp;
  const [activeTab, setActiveTab] = useState<Tab>('explain');
  const { getStars, isPassed } = useProgress();
  const VizDemo = VIZ_REGISTRY[meta.vizType];

  const stars = getStars(meta.id);
  const passed = isPassed(meta.id);

  return (
    <div className="space-y-5">
      {/* ===== 标题区 ===== */}
      <div className="rounded-xl bg-white border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-800">{meta.title}</h1>
            {meta.hasFormula && meta.formula && (
              <div className="mt-2 inline-block bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-1.5">
                <code className="text-lg font-mono text-indigo-700">{meta.formula}</code>
              </div>
            )}
          </div>
          {passed && (
            <div className="text-right shrink-0">
              <div className="text-amber-400 text-lg" aria-label={`${stars} 星`}>
                {'\u2605'.repeat(stars)}
                {'\u2606'.repeat(3 - stars)}
              </div>
              <span className="text-xs text-green-600 font-medium">已通过</span>
            </div>
          )}
        </div>

        {/* 教材版本徽章 */}
        {meta.textbookRefs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {meta.textbookRefs.map((ref, i) => (
              <span
                key={i}
                className={`inline-flex items-center text-xs px-2.5 py-1 rounded-md border ${
                  badgeColors[ref.version] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {ref.version} · {ref.chapter}
              </span>
            ))}
          </div>
        )}

        {/* 学习目标 */}
        {meta.objectives.length > 0 && (
          <ul className="mt-3 space-y-1">
            {meta.objectives.map((obj, i) => (
              <li key={i} className="text-sm text-slate-500 flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">{'\u2022'}</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ===== 标签栏 ===== */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 px-4 py-2.5 text-sm transition-colors min-h-[44px] border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== 标签内容 ===== */}
      <div className="min-h-[200px]">
        {/* 讲解 */}
        {activeTab === 'explain' && (
          <div className="space-y-4">
            <div className="prose prose-slate max-w-none rounded-xl bg-white border border-slate-200 p-5 prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-800 prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
              {kp.explanation ? (
                <ReactMarkdown>{kp.explanation}</ReactMarkdown>
              ) : (
                <p className="text-slate-400">讲解内容即将上线。</p>
              )}
            </div>

            {/* 可视化演示 */}
            <div className="rounded-xl bg-white border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                {'\u{1F4D0}'} 动手试一试
              </h3>
              {VizDemo ? (
                <div className="flex justify-center py-2">
                  <VizDemo />
                </div>
              ) : (
                <p className="text-center text-slate-400 py-8">
                  该知识点的可视化演示即将上线
                </p>
              )}
            </div>
          </div>
        )}

        {/* 原理 */}
        {activeTab === 'derivation' && (
          <div className="rounded-xl bg-white border border-slate-200 p-5">
            {kp.derivation ? (
              <DerivationPlayer derivation={kp.derivation} />
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">{'\u{1F52C}'}</div>
                <p className="text-slate-500">本知识点暂无公式推导动画</p>
              </div>
            )}
          </div>
        )}

        {/* 闯关 */}
        {activeTab === 'game' && (
          <div>
            {kp.game ? (
              <GameRunner game={kp.game} knowledgePointId={meta.id} />
            ) : (
              <div className="rounded-xl bg-white border border-slate-200 p-8 text-center">
                <div className="text-4xl mb-3">{'\u{1F3AE}'}</div>
                <p className="text-slate-500">本知识点暂无过关游戏</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
