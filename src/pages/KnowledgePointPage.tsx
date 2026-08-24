import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getCurriculum, getTextbookRef, loadKnowledgePointDetail } from '@/lib/content';
import type { KnowledgePoint as KnowledgePointType, TextbookFilter } from '@/lib/types';
import KnowledgePoint from '@/components/KnowledgePoint';
import UiIcon from '@/components/UiIcon';

export default function KnowledgePointPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [kp, setKp] = useState<KnowledgePointType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) {
      setKp(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    loadKnowledgePointDetail(id).then((detail) => {
      if (cancelled) return;
      setKp(detail ?? null);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setError(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="knowledge-page">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-block" />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-lg mb-4">加载失败，请检查网络后重试。</p>
        <Link to="/" className="text-indigo-600 hover:underline">
          返回首页
        </Link>
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
  const rawVersion = searchParams.get('version');
  const version: TextbookFilter = rawVersion === '人教版' || rawVersion === '北师大版' || rawVersion === '苏教版'
    ? rawVersion
    : '全部';
  const displayGrade = getTextbookRef(meta, version)?.grade ?? meta.grade;
  const curriculum = getCurriculum(displayGrade, version);
  const currentIndex = curriculum.findIndex((item) => item.meta.id === meta.id);
  const previous = currentIndex > 0 ? curriculum[currentIndex - 1] : undefined;
  const next = currentIndex >= 0 && currentIndex < curriculum.length - 1 ? curriculum[currentIndex + 1] : undefined;
  const queryString = `?version=${encodeURIComponent(version)}`;

  return (
    <div className="knowledge-page">
      {/* 面包屑导航 */}
      <div className="lesson-breadcrumb">
        <Link to={`/grade/${displayGrade}${queryString}`}>
          <UiIcon name="arrow-left" size={17}/> {displayGrade}年级课程
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 font-medium">{meta.title}</span>
      </div>

      {/* 知识点内容（3-tab：讲解 / 原理 / 闯关） */}
      <KnowledgePoint
        key={kp.meta.id}
        knowledgePoint={kp}
        nextCourseTitle={next?.meta.title}
        onNextCourse={next ? () => navigate(`/kp/${next.meta.id}${queryString}`) : undefined}
      />

      <nav className="course-navigation" aria-label="连续学习">
        {previous ? (
          <Link to={`/kp/${previous.meta.id}${queryString}`} className="previous-course-link">
            <UiIcon name="arrow-left"/><span><small>上一课</small><strong>{previous.meta.title}</strong></span>
          </Link>
        ) : <span className="previous-course-link is-empty" />}
        {next ? (
          <Link to={`/kp/${next.meta.id}${queryString}`} className="next-course-card">
            <div className="next-course-card__label"><UiIcon name="spark" size={18}/><span>下一课</span></div>
            <div className="next-course-card__content"><div><h2>{next.meta.title}</h2><p>预计 8 分钟 · 待学习</p></div><span className="next-course-card__arrow"><UiIcon name="arrow-right"/></span></div>
          </Link>
        ) : <div className="next-course-card is-complete"><div className="next-course-card__label"><UiIcon name="check" size={18}/><span>本册课程已完成</span></div><div className="next-course-card__content"><div><h2>继续复习已经学过的知识</h2><p>回到年级课程查看学习记录</p></div></div></div>}
      </nav>
    </div>
  );
}
