import { useEffect, useState } from 'react';
import type { KnowledgePoint as KnowledgePointType } from '@/lib/types';
import { useProgress } from '@/context/ProgressContext';
import GameRunner from '@/components/GameRunner';
import ConceptPlayer from '@/components/ConceptPlayer';
import InteractivePractice, { hasCourseSpecificModel } from '@/components/InteractivePractice';
import { isGenericVisualizationSafe } from '@/lib/courseQuality';
import { isCourseModelType, isConceptModelType, isAdvancedModelType } from '@/lib/model-type-guards';
import DiscoveryLesson from '@/components/DiscoveryLesson';
import KnowledgeDeck from '@/components/KnowledgeDeck';
import UiIcon from '@/components/UiIcon';
import KnowledgeContextStrip from '@/components/KnowledgeContextStrip';

type LessonStage = 'explore' | 'discover' | 'challenge';

const stages: Array<{ key: LessonStage; label: string }> = [
  { key: 'explore', label: '探索' },
  { key: 'discover', label: '发现' },
  { key: 'challenge', label: '挑战' },
];

const stageDescriptions: Record<LessonStage, string> = {
  explore: '动手试试，换一个数或一种情况，看看什么变了、什么没有变',
  discover: '跟着短短几页，把道理说清楚',
  challenge: '换一道题，看看自己会不会',
};

function getExploreMission(meta: KnowledgePointType['meta']) {
  const challengeMissions: Record<string, { title: string; hint: string }> = {
    'g3-cycle-pattern': { title: '排到很后面时，怎样不用一个个数？', hint: '同时改变循环长度和目标位置，观察余数怎样锁定答案。' },
    'g3-systematic-enumeration': { title: '怎样列出所有搭配，既不重复也不遗漏？', hint: '先固定一种颜色，再依次配完所有形状。' },
    'g4-sum-difference': { title: '知道总和与相差，怎样把两个量分出来？', hint: '把多出的差先拿开，观察剩下的两份为什么同样多。' },
    'g4-sum-difference-multiple': { title: '“大数是小数的几倍”到底表示几份？', hint: '把小数看作一份，改变倍数，观察和与差由多少份组成。' },
    'g5-chicken-rabbit': { title: '只知道头和脚，怎样知道鸡兔各有多少只？', hint: '先假设全是鸡，再观察每换成一只兔会多出几只脚。' },
  };
  if (challengeMissions[meta.id]) return challengeMissions[meta.id];
  if (meta.id === 'g3-add-sub-10000') {
    return {
      title: '为什么满十要进一，不够减要退一？',
      hint: '从个位开始操作，观察 10 个低位单位怎样换成 1 个高位单位。',
    };
  }
  if (!isGenericVisualizationSafe(meta.id) && !hasCourseSpecificModel(meta.id) && !isCourseModelType(meta.vizType) && !isConceptModelType(meta.vizType) && !isAdvancedModelType(meta.vizType)) {
    return {
      title: `先梳理"${meta.title}"必须解释清楚的关系`,
      hint: '先沿关键推理逐步判断，再用例题验证每个关系。',
    };
  }
  const modelMissions: Partial<Record<KnowledgePointType['meta']['vizType'], { title: string; hint: string }>> = {
    'remainder-groups': { title: '分完以后，什么情况才能叫余数？', hint: '改变总数和每组数量，验证余数为什么必须小于除数。' },
    'trial-division': { title: '试出的商怎样判断该调大还是调小？', hint: '亲自调整商，用乘积和余数判断这次试商是否正确。' },
    'decimal-place-value': { title: '小数加减为什么一定要对齐小数点？', hint: '比较每一列代表的数位，观察补0为什么不改变数的大小。' },
    'decimal-product': { title: '两个小数相乘，积为什么会再缩小一次？', hint: '用横向、纵向两次取份，观察重叠区域占整个方格的多少。' },
    'decimal-quotient': { title: '除数变成整数后，为什么商没有变？', hint: '让被除数和除数同时扩大相同倍数，比较变换前后的商。' },
    'fraction-product': { title: '"一个分数的另一个分数"到底是哪一块？', hint: '用横纵两次取份找到重叠部分，再数总份数和重叠份数。' },
    'fraction-quotient': { title: '分数除法是在问"里面包含几个"吗？', hint: '把3/4改写成6/8，数一数里面能装下几个指定大小的分数。' },
    'measurement-lab': { title: '换了单位，物体真的变长或变重了吗？', hint: '在长度和质量之间切换，验证同一个量如何用不同单位表示。' },
    'fraction-compare-model': { title: '分子或分母相同时，怎样不用通分就比较？', hint: '切换同分母与同分子情形，让同样大小的整体直接对齐。' },
    'fraction-equivalence': { title: '分子分母都变了，为什么分数大小没变？', hint: '把每一份继续等分，观察涂色长度是否发生变化。' },
    'decimal-equivalence': { title: '0.5、0.50 和 0.500 为什么相等？', hint: '比较十分格与百分格，观察末尾添0改变了什么。' },
    'line-relations': { title: '怎样证明两条直线真的平行或垂直？', hint: '改变线间距离并切换关系，观察距离和直角这两个判定条件。' },
    'quadrilateral-constraints': { title: '外形改变以后，平行关系还保留吗？', hint: '拖动图形并切换类型，检查有几组对边始终平行。' },
    'probability-experiment': { title: '随机结果为什么能用一个确定的数来描述？', hint: '改变红球占比和试验次数，比较理论概率与试验频率。' },
    'percent-grid': { title: '为什么百分数能直接比较不同整体中的占比？', hint: '把整体固定分成100份，联动百分数、分数和小数。' },
    'ratio-mixture': { title: '总量变大以后，配方的比为什么可以不变？', hint: '同时放大两种份数，观察比值是否保持不变。' },
    'proportion-table': { title: '怎样判断两个比确实组成比例？', hint: '改变对应数量，检查比值和交叉乘积是否始终相等。' },
    'coordinate-scale': { title: '放大图形是把点随便移远吗？', hint: '改变放大倍数，观察所有对应点如何按同一倍率移动。' },
    'place-value-product': { title: '多位数乘一位数，为什么每一位都要分别乘？', hint: '把234拆成200、30和4，观察每个数位如何共同组成乘积。' },
    'perimeter-walk': { title: '周长是在数里面的格子，还是沿边界走一圈？', hint: '改变长和宽，观察两组对应边怎样组成完整边界。' },
    'operation-laws': { title: '改变顺序或拆开计算，结果为什么没有变？', hint: '切换交换、结合、分配三种变形，验证总量始终相同。' },
    'partial-products': { title: '三位数乘两位数，竖式为什么会出现两行部分积？', hint: '把两位数拆成几十和几个，观察两个部分积各自代表什么。' },
    'fraction-common-parts': { title: '不同大小的分数单位可以直接相加吗？', hint: '先把两个整体切成相同大小的份，再合并份数。' },
    'circle-roll': { title: '圆周长为什么总是直径的约3.14倍？', hint: '让圆滚动一周，把弯曲的圆周展开成直线并与直径比较。' },
    'cylinder-layers': { title: '圆柱体积为什么是底面积乘高？', hint: '改变底面和层数，观察相同底面积逐层堆叠得到体积。' },
  };
  if (modelMissions[meta.vizType]) return modelMissions[meta.vizType]!;
  return {
    title: `先来试试：${meta.title}`,
    hint: '换一个数或一种情况试试，看看什么变了、什么没有变。',
  };
}

export interface KnowledgePointProps {
  knowledgePoint: KnowledgePointType;
  onCoursePassed?: () => void;
  onNextCourse?: () => void;
  nextCourseTitle?: string;
  nextActionLabel?: string;
  targetSkillId?: string;
}

interface LessonSession {
  interactionCount: number;
  discoveryComplete: boolean;
  prediction: string;
}

const emptySession: LessonSession = { interactionCount: 0, discoveryComplete: false, prediction: '' };

function loadSession(id: string): LessonSession {
  try {
    const saved = JSON.parse(localStorage.getItem(`math-k6-lesson-session:${id}`) ?? '{}') as Partial<LessonSession>;
    return { ...emptySession, ...saved };
  } catch {
    return { ...emptySession };
  }
}

function loadStage(id: string): LessonStage {
  try {
    const saved = localStorage.getItem(`math-k6-lesson-stage:${id}`);
    return stages.some((stage) => stage.key === saved) ? saved as LessonStage : 'explore';
  } catch {
    return 'explore';
  }
}

function loadValidStage(id: string): LessonStage {
  const stage = loadStage(id);
  const saved = loadSession(id);
  if (stage === 'challenge' && !saved.discoveryComplete) return 'discover';
  return stage;
}

export default function KnowledgePoint({
  knowledgePoint: kp,
  onCoursePassed,
  onNextCourse,
  nextCourseTitle,
  nextActionLabel,
  targetSkillId,
}: KnowledgePointProps) {
  const { meta } = kp;
  const { getStars, isPassed, getMasteryStatus, getReviewMode, setCurrentLearning } = useProgress();
  const stars = getStars(meta.id);
  const passed = isPassed(meta.id);
  const masteryStatus = getMasteryStatus(meta.id);

  const [entryReviewMode] = useState<'d1' | 'd7' | null>(() =>
    passed && masteryStatus === 'review_due' ? getReviewMode(meta.id) : null,
  );
  const isReviewSession = entryReviewMode !== null;

  const [activeStage, setActiveStage] = useState<LessonStage>(() =>
    isReviewSession ? 'challenge' : loadValidStage(meta.id),
  );
  const [session, setSession] = useState<LessonSession>(() => loadSession(meta.id));
  const exploreMission = getExploreMission(meta);

  useEffect(() => {
    setCurrentLearning(meta.id);
  }, [meta.id, setCurrentLearning]);

  useEffect(() => {
    try { localStorage.setItem(`math-k6-lesson-session:${meta.id}`, JSON.stringify(session)); } catch { /* Session persistence is optional. */ }
  }, [meta.id, session]);

  const goToStage = (stage: LessonStage) => {
    setActiveStage(stage);
    try {
      localStorage.setItem(`math-k6-lesson-stage:${meta.id}`, stage);
    } catch {
      // Learning still works when storage is unavailable.
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canDiscover = session.prediction.trim() !== '' && session.interactionCount >= 2;

  return (
    <div className="lesson-shell">
      <header className="lesson-header">
        <div>
          <p className="lesson-kicker"><span className="signal-dot is-live" /> AI 学习工作台 · {meta.grade} 年级</p>
          <h1>{meta.title}</h1>
          <p className="lesson-subtitle">{stageDescriptions[activeStage]}</p>
        </div>
        {passed ? (
          <div className="mastery-status">
            <span>本课记录</span>
            <strong aria-label={`${stars} 星`}>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</strong>
            <small>{masteryStatus === 'stable' ? '已稳固' : masteryStatus === 'review_due' ? '待复习' : masteryStatus === 'provisional' ? '当堂会' : '本次练习通过'}</small>
          </div>
        ) : null}
      </header>

      <KnowledgeContextStrip courseId={meta.id} targetSkillId={targetSkillId} />

      <nav className="lesson-rail-mobile" aria-label="三阶段学习进度">
        {stages.map((stage) => {
          const stageIndex = stages.indexOf(stage);
          const stageComplete = stageIndex === 0
            ? session.interactionCount >= 2
            : stageIndex === 1
              ? session.discoveryComplete
              : passed;
          const current = activeStage === stage.key;
          const reached = stageIndex === 0
            || (stageIndex === 1 && canDiscover)
            || (stageIndex === 2 && (session.discoveryComplete || passed || isReviewSession));
          return (
            <button key={stage.key} type="button" onClick={() => reached && goToStage(stage.key)} disabled={!reached} aria-current={current ? 'step' : undefined} className={`${current ? 'is-current' : ''} ${reached ? 'is-reached' : ''} ${stageComplete || passed ? 'is-complete' : ''}`}>
              <i>{stageComplete || passed ? <UiIcon name="check" size={16}/> : stageIndex + 1}</i>
              <span><strong>{stage.label}</strong></span>
            </button>
          );
        })}
      </nav>

      {activeStage === 'explore' ? (
        <section className="learning-surface" aria-labelledby="explore-title">
          <div className="mission-brief">
            <span className="mission-index">01 / 探索</span>
            <div><p>今天的问题</p><h2 id="explore-title">{exploreMission.title}</h2><small>{exploreMission.hint}</small></div>
          </div>
          <div className="tool-frame">
            {hasCourseSpecificModel(meta.id) || meta.vizType === 'column-arithmetic' || isCourseModelType(meta.vizType) || isConceptModelType(meta.vizType) || isAdvancedModelType(meta.vizType) || isGenericVisualizationSafe(meta.id) ? (
              <InteractivePractice knowledgePointId={meta.id} vizType={meta.vizType} title={meta.title} onInteract={() => setSession(current => ({ ...current, interactionCount: Math.min(9, current.interactionCount + 1) }))} />
            ) : (
              <div className="derivation-frame"><ConceptPlayer meta={meta} onInteract={() => setSession(current => ({ ...current, interactionCount: Math.min(9, current.interactionCount + 1) }))} /></div>
            )}
          </div>
          <div className="explore-footer">
            <div className={`evidence-counter ${session.interactionCount >= 2 ? 'is-ready' : ''}`}>
              <strong>{session.interactionCount} 次操作</strong>
              <p>{session.interactionCount === 0 ? '拖动滑块，换一个数试试。' : session.interactionCount < 2 ? '再多试一个情况，看看规律。' : '试了两种情况，准备好了。'}</p>
            </div>
            {session.interactionCount >= 2 ? (
              <div className="prediction-block">
                <label htmlFor="prediction-input" className="prediction-label">不看答案，先猜一猜：这个办法为什么能行？</label>
                <input
                  id="prediction-input"
                  type="text"
                  value={session.prediction}
                  onChange={(e) => setSession(current => ({ ...current, prediction: e.target.value }))}
                  placeholder="写下你的猜测"
                  autoComplete="off"
                  className="prediction-input"
                />
              </div>
            ) : null}
            <button type="button" onClick={() => canDiscover && goToStage('discover')} disabled={!canDiscover} className="journey-action">看看为什么 <UiIcon name="arrow-right"/></button>
          </div>
        </section>
      ) : null}

      {activeStage === 'discover' ? (
        <section className="learning-surface" aria-labelledby="discover-title">
          <div className="mission-brief cyan">
            <span className="mission-index">02 / 发现</span>
            <div><p>为什么</p><h2 id="discover-title">刚才两次都能用，这个办法藏着什么道理？</h2><small>跟着短短几页，把自己的发现说清楚。</small></div>
          </div>
          <div className="tool-frame derivation-frame">
            <DiscoveryLesson meta={meta} explanation={kp.explanation} prediction={session.prediction} interactionCount={session.interactionCount} onComplete={() => setSession(current => ({ ...current, discoveryComplete: true }))} onStartChallenge={() => goToStage('challenge')}/>
          </div>
          {session.discoveryComplete ? <button type="button" onClick={() => goToStage('challenge')} className="journey-action">换一道题试试 <UiIcon name="arrow-right"/></button> : <div className="lesson-lock" role="status"><UiIcon name="lock"/><div><strong>完成上一项后即可继续</strong><span>完成"不看提示想一想"</span></div></div>}
        </section>
      ) : null}

      {activeStage === 'challenge' ? (
        <section className="learning-surface" aria-labelledby="challenge-title">
          <div className="mission-brief lime">
            <span className="mission-index">03 / 挑战</span>
            <div><p>试一题</p><h2 id="challenge-title">{isReviewSession ? '复习时间到了' : '换一道题，你也会吗？'}</h2><small>{isReviewSession ? '换一道复习题，看看还记得多少。' : '慢慢想，答错了会给你一个小提示。'}</small></div>
          </div>
          {kp.game ? (
            <GameRunner key={`gamerunner-${meta.id}`} game={kp.game} knowledgePointId={meta.id} onPassed={onCoursePassed} onReviewCourse={() => goToStage('discover')} onNextCourse={onNextCourse} nextCourseTitle={nextCourseTitle} nextActionLabel={nextActionLabel} reviewMode={entryReviewMode} />
          ) : <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 space-y-4">挑战内容正在准备中。<button type="button" onClick={() => goToStage('discover')} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[48px] flex items-center mx-auto">回看讲解</button></div>}
        </section>
      ) : null}

      <KnowledgeDeck title={meta.title} markdown={kp.explanation} textbookRefs={meta.textbookRefs}/>
    </div>
  );
}
