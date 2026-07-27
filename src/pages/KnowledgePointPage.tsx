import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadKnowledgePointDetail } from '@/lib/content';
import type { KnowledgePoint as KnowledgePointType } from '@/lib/types';
import KnowledgePoint from '@/components/KnowledgePoint';

export default function KnowledgePointPage() {
  const { id } = useParams<{ id: string }>();
  const [kp, setKp] = useState<KnowledgePointType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setKp(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadKnowledgePointDetail(id).then((detail) => {
      if (cancelled) return;
      setKp(detail ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if (!kp) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-lg">知识点不存在</p>
        <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">
          返回首页
        </Link>
      </div>
    );
  }

  const { meta } = kp;

  return (
    <div className="space-y-5">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm">
        <Link to={`/grade/${meta.grade}`} className="text-slate-400 hover:text-indigo-600">
          {'\u2190'} {meta.grade}年级
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 font-medium">{meta.title}</span>
      </div>

      {/* 知识点内容（3-tab：讲解 / 原理 / 闯关） */}
      <KnowledgePoint knowledgePoint={kp} />
    </div>
  );
}
