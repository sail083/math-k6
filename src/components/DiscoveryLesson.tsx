import { useEffect, useMemo, useState } from 'react';
import type { KnowledgePointMeta } from '@/lib/types';
import UiIcon from '@/components/UiIcon';
import { buildDiscoveryContent, type DiscoveryContent } from '@/lib/learningContent';

interface Props {
  meta: KnowledgePointMeta;
  prediction: string;
  interactionCount: number;
  explanation: string;
  onComplete: () => void;
  onStartChallenge: () => void;
}

const FALLBACK_DISTRACTORS = [
  '只要数字变大，结果就一定变大',
  '记住例题中的数字，就能解决所有同类问题',
];

function generateNegation(rule: string): string {
  // Ordered from most specific to least specific to avoid double-negation.
  if (rule.includes('不会改变')) return rule.replace('不会改变', '会改变');
  if (rule.includes('没有变'))   return rule.replace('没有变', '会改变');
  if (rule.includes('不变'))     return rule.replace('不变', '会变');
  if (rule.includes('相同'))     return rule.replace('相同', '不同');
  if (rule.includes('等于'))     return rule.replace('等于', '不等于');
  if (rule.includes('一定'))     return rule.replace('一定', '不一定');
  return `不${rule}`;
}

function generateDistractors(correctRule: string, _content: DiscoveryContent, _meta: KnowledgePointMeta): string[] {
  try {
    // --- Distractor A: negate the correct rule ---
    const negation = generateNegation(correctRule);

    // --- Distractor B: over-generalise a keyword from the rule ---
    const clean = correctRule.replace(/\s+/g, '');
    const keyword = clean.slice(0, Math.min(6, clean.length));
    const partial = `只要记住"${keyword}"就行了`;

    const distractorA = negation === correctRule ? `不${correctRule}` : negation;
    const distractorB = partial === correctRule
      ? '记住例题中的数字，就能解决所有同类问题'
      : partial;

    return [distractorA, distractorB];
  } catch {
    return FALLBACK_DISTRACTORS;
  }
}

function ConceptSketch({ meta, step, content }: { meta: KnowledgePointMeta; step: number; content: DiscoveryContent }) {
  if (meta.id === 'g3-add-sub-10000') {
    return <div className="place-value-sketch" aria-label="万以内加减法数位拆解示例">
      <div className="place-value-sketch__labels"><span>百位</span><span>十位</span><span>个位</span></div>
      <div className="place-value-sketch__number"><strong>3</strong><strong>7</strong><strong>8</strong></div>
      <div className="place-value-sketch__operator">+ 2 4 6</div>
      <div className="place-value-sketch__line"/>
      <div className="place-value-sketch__number is-result"><strong>6</strong><strong>2</strong><strong>4</strong></div>
      <p><b>8 + 6 = 14</b><span>个位满十，向十位进 1</span></p>
    </div>;
  }
  return <div className="concept-sketch" aria-label={`${meta.title}概念关系图`}>
    <span className="concept-sketch__step">0{step + 1}</span>
    <div className="concept-sketch__nodes"><i>{meta.title.slice(0, 4)}</i><b>→</b><i>{step < 2 ? content.rule : content.whyTitle}</i></div>
    <p>{step < 2 ? content.evidence : content.reason}</p>
  </div>;
}

export default function DiscoveryLesson({ meta, explanation, prediction, interactionCount, onComplete, onStartChallenge }: Props) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<string>();
  const [attempted, setAttempted] = useState(false);
  const content = useMemo(() => buildDiscoveryContent(meta, explanation), [explanation, meta]);
  const correctRule = content.rule;
  const distractors = useMemo(() => generateDistractors(correctRule, content, meta), [correctRule, content, meta]);
  const choices = useMemo(() => [correctRule, ...distractors], [correctRule, distractors]);
  const isCorrect = answer === correctRule;
  const slides = [
    { eyebrow: '刚才我做了什么', title: '你换了两个情况来试', body: `你先猜“${prediction}”，然后动手试了 ${interactionCount} 次。两次的数字不一样，现在看看它们为什么都能用同一个办法。` },
    { eyebrow: '我发现', title: correctRule, body: content.evidence },
    { eyebrow: '为什么', title: content.whyTitle, body: content.reason },
    { eyebrow: '不看提示想一想', title: '哪一句是这节课真正要记住的？', body: '先自己想一想。选错不会马上给答案，我们会提醒你回想刚才试过的两个情况。' },
    { eyebrow: '准备好了', title: '换一道题，也用这个办法试试', body: content.transfer },
  ];

  useEffect(() => { setStep(0); setAnswer(undefined); setAttempted(false); }, [meta.id]);

  const submit = () => {
    setAttempted(true);
    if (answer === correctRule) onComplete();
  };

  return <div className="discovery-lesson">
    <div className="discovery-progress" aria-label={`为什么第${step + 1}页，共${slides.length}页`}>
      {slides.map((_, index) => <i key={index} className={index <= step ? 'is-active' : ''}/>) }
    </div>
    <article className="discovery-slide" aria-live="polite">
      <div className="discovery-slide__copy">
        <span>{slides[step].eyebrow}</span>
        <h3>{slides[step].title}</h3>
        <p>{slides[step].body}</p>
        {step === 0 ? <div className="evidence-pair"><div><small>我猜</small><strong>{prediction}</strong></div><b>然后</b><div><small>我试了</small><strong>{interactionCount} 个不同情况</strong></div></div> : null}
        {step === 3 ? <div className="retrieval-check">
          {choices.map(choice => <button type="button" key={choice} className={answer === choice ? 'is-selected' : ''} onClick={() => { setAnswer(choice); setAttempted(false); }}>{choice}</button>)}
          {attempted && !isCorrect ? <p className="retrieval-feedback is-error">再想想：哪一句能同时说明你刚才试过的两个情况？</p> : null}
          {attempted && isCorrect ? <p className="retrieval-feedback is-correct">答对了。你记住的是办法，不是例题里的数字。</p> : null}
        </div> : null}
      </div>
      <ConceptSketch meta={meta} step={step} content={content}/>
    </article>
    <div className="deck-controls discovery-controls">
      <button type="button" className="icon-control" aria-label="上一页" disabled={step === 0} onClick={() => setStep(value => value - 1)}><UiIcon name="arrow-left"/></button>
      <span className="page-status"><strong>{step + 1}</strong> / {slides.length}</span>
      {step === 3 && !(attempted && isCorrect) ? <button type="button" className="primary-control" disabled={!answer} onClick={submit}>看看选得对不对</button> : <button type="button" className="primary-control" onClick={() => step === slides.length - 1 ? onStartChallenge() : setStep(value => value + 1)}>{step === slides.length - 1 ? '去试一题' : '继续学习'} <UiIcon name="arrow-right" size={18}/></button>}
      <button type="button" className="icon-control" aria-label="下一页" disabled={step >= slides.length - 1 || (step === 3 && !(attempted && isCorrect))} onClick={() => setStep(value => value + 1)}><UiIcon name="arrow-right"/></button>
    </div>
  </div>;
}
