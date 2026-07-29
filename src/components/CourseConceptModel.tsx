import { useMemo, useState } from 'react';
import type { VizType } from '@/lib/types';

type ConceptModelType = Extract<VizType,
  | 'measurement-lab'
  | 'fraction-compare-model'
  | 'fraction-equivalence'
  | 'decimal-equivalence'
  | 'line-relations'
  | 'quadrilateral-constraints'
  | 'probability-experiment'
  | 'percent-grid'
  | 'ratio-mixture'
  | 'proportion-table'
  | 'coordinate-scale'>;

interface CourseConceptModelProps {
  type: ConceptModelType;
  onInteract?: () => void;
}

const conceptModelTypes = new Set<VizType>([
  'measurement-lab', 'fraction-compare-model', 'fraction-equivalence', 'decimal-equivalence',
  'line-relations', 'quadrilateral-constraints', 'probability-experiment', 'percent-grid',
  'ratio-mixture', 'proportion-table', 'coordinate-scale',
]);

export function isConceptModelType(type: VizType): type is ConceptModelType {
  return conceptModelTypes.has(type);
}

function Shell({ title, result, children, controls }: { title: string; result: string; children: React.ReactNode; controls: React.ReactNode }) {
  return <div className="math-model concept-model"><div className="math-model__head"><span><i className="signal-dot is-live" />动手试</span><strong>{result}</strong></div><div className="math-model__canvas"><h3>{title}</h3>{children}</div><div className="model-controls">{controls}</div></div>;
}

function MeasurementLab({ onInteract }: Pick<CourseConceptModelProps, 'onInteract'>) {
  const [mode, setMode] = useState<'length' | 'mass'>('length');
  const [value, setValue] = useState(4);
  const set = (next: 'length' | 'mass') => { setMode(next); setValue(4); onInteract?.(); };
  return <Shell title={mode === 'length' ? '同一段长度，换单位只改变数值写法' : '同一份质量，换单位只改变数值写法'} result={mode === 'length' ? `${value} cm = ${value * 10} mm` : `${value} kg = ${value * 1000} g`} controls={<><div className="segmented-control"><button type="button" className={mode === 'length' ? 'is-active' : ''} onClick={() => set('length')}>长度</button><button type="button" className={mode === 'mass' ? 'is-active' : ''} onClick={() => set('mass')}>质量</button></div><label>改变数量 <output>{value}</output><input type="range" min="1" max="9" value={value} onChange={(event) => { setValue(Number(event.target.value)); onInteract?.(); }} /></label></>}>
    {mode === 'length' ? <div className="ruler-model"><div className="ruler-track">{Array.from({ length: value * 10 + 1 }, (_, index) => <i key={index} className={index % 10 === 0 ? 'major' : ''}><span>{index % 10 === 0 ? index / 10 : ''}</span></i>)}</div><p>每 10 个毫米小格组成 1 厘米大格</p></div> : <div className="mass-model"><div className="scale-pan"><strong>{value} kg</strong></div><b>=</b><div className="weight-stack">{Array.from({ length: value }, (_, index) => <i key={index}>1000 g</i>)}</div></div>}
  </Shell>;
}

function FractionCompare({ onInteract }: Pick<CourseConceptModelProps, 'onInteract'>) {
  const [mode, setMode] = useState<'denominator' | 'numerator'>('denominator');
  const [value, setValue] = useState(2);
  const first = mode === 'denominator' ? { n: value, d: 6 } : { n: 2, d: 4 };
  const second = mode === 'denominator' ? { n: Math.min(5, value + 2), d: 6 } : { n: 2, d: 8 };
  const greater = first.n / first.d > second.n / second.d ? `${first.n}/${first.d}` : `${second.n}/${second.d}`;
  const bar = (fraction: { n: number; d: number }) => <div className="fraction-compare-bar" style={{ gridTemplateColumns: `repeat(${fraction.d},1fr)` }}>{Array.from({ length: fraction.d }, (_, index) => <i key={index} className={index < fraction.n ? 'filled' : ''} />)}</div>;
  return <Shell title={mode === 'denominator' ? '同分母：每份一样大，比较取了几份' : '同分子：取的份数一样，分得越少每份越大'} result={`${greater} 更大`} controls={<><div className="segmented-control"><button type="button" className={mode === 'denominator' ? 'is-active' : ''} onClick={() => { setMode('denominator'); onInteract?.(); }}>同分母</button><button type="button" className={mode === 'numerator' ? 'is-active' : ''} onClick={() => { setMode('numerator'); onInteract?.(); }}>同分子</button></div>{mode === 'denominator' ? <label>第一个分子 <output>{value}</output><input type="range" min="1" max="4" value={value} onChange={(event) => { setValue(Number(event.target.value)); onInteract?.(); }} /></label> : null}</>}><div className="fraction-comparison"><div><span>{first.n}/{first.d}</span>{bar(first)}</div><div><span>{second.n}/{second.d}</span>{bar(second)}</div></div></Shell>;
}

function FractionEquivalence({ onInteract }: Pick<CourseConceptModelProps, 'onInteract'>) {
  const [factor, setFactor] = useState(2);
  const render = (n: number, d: number) => <div className="equivalence-bar" style={{ gridTemplateColumns: `repeat(${d},1fr)` }}>{Array.from({ length: d }, (_, index) => <i key={index} className={index < n ? 'filled' : ''} />)}</div>;
  return <Shell title="分子和分母同时乘相同的非零数，分割变细但大小不变" result={`1/2 = ${factor}/${factor * 2}`} controls={<label>同时乘 <output>{factor}</output><input type="range" min="1" max="5" value={factor} onChange={(event) => { setFactor(Number(event.target.value)); onInteract?.(); }} /></label>}><div className="equivalence-pair"><div><span>1/2</span>{render(1, 2)}</div><b>=</b><div><span>{factor}/{factor * 2}</span>{render(factor, factor * 2)}</div></div><div className="model-proof is-valid"><strong>份数和取的份数同时扩大，涂色长度没有改变</strong></div></Shell>;
}

function DecimalEquivalence({ onInteract }: Pick<CourseConceptModelProps, 'onInteract'>) {
  const [zeros, setZeros] = useState(1);
  const text = `0.5${'0'.repeat(zeros)}`;
  return <Shell title="小数末尾添0只是把同一份量分得更细" result={`0.5 = ${text}`} controls={<div className="stepper"><button type="button" aria-label="减少一个末尾0" onClick={() => { setZeros(Math.max(0, zeros - 1)); onInteract?.(); }}>−</button><output>末尾 {zeros} 个0</output><button type="button" aria-label="增加一个末尾0" onClick={() => { setZeros(Math.min(2, zeros + 1)); onInteract?.(); }}>＋</button></div>}><div className="decimal-equivalence"><div><strong>0.5</strong><div className="ten-grid">{Array.from({ length: 10 }, (_, index) => <i key={index} className={index < 5 ? 'filled' : ''} />)}</div></div><b>=</b><div><strong>{text}</strong><div className="hundred-mini-grid">{Array.from({ length: 100 }, (_, index) => <i key={index} className={index < 50 ? 'filled' : ''} />)}</div></div></div></Shell>;
}

function LineRelations({ onInteract }: Pick<CourseConceptModelProps, 'onInteract'>) {
  const [mode, setMode] = useState<'parallel' | 'perpendicular'>('parallel');
  const [offset, setOffset] = useState(55);
  return <Shell title={mode === 'parallel' ? '两条直线无限延伸仍不相交，处处距离相等' : '两条直线相交成直角，四个角都是90°'} result={mode === 'parallel' ? `距离始终 ${offset}` : '夹角 = 90°'} controls={<><div className="segmented-control"><button type="button" className={mode === 'parallel' ? 'is-active' : ''} onClick={() => { setMode('parallel'); onInteract?.(); }}>平行</button><button type="button" className={mode === 'perpendicular' ? 'is-active' : ''} onClick={() => { setMode('perpendicular'); onInteract?.(); }}>垂直</button></div>{mode === 'parallel' ? <label>线间距离 <output>{offset}</output><input type="range" min="30" max="90" value={offset} onChange={(event) => { setOffset(Number(event.target.value)); onInteract?.(); }} /></label> : null}</>}><svg className="line-relation-svg" viewBox="0 0 420 220">{mode === 'parallel' ? <><line x1="40" y1={110-offset/2} x2="380" y2={110-offset/2}/><line x1="40" y1={110+offset/2} x2="380" y2={110+offset/2}/><line className="measure" x1="210" y1={110-offset/2} x2="210" y2={110+offset/2}/></> : <><line x1="45" y1="110" x2="375" y2="110"/><line x1="210" y1="25" x2="210" y2="195"/><path className="right-angle" d="M210 85 H235 V110"/></>}</svg></Shell>;
}

function QuadrilateralConstraints({ onInteract }: Pick<CourseConceptModelProps, 'onInteract'>) {
  const [type, setType] = useState<'parallelogram' | 'trapezoid'>('parallelogram');
  const [slant, setSlant] = useState(45);
  const points = type === 'parallelogram' ? `${80+slant},50 ${300+slant},50 300,180 80,180` : `${130+slant/2},50 290,50 340,180 70,180`;
  return <Shell title={type === 'parallelogram' ? '拖动倾斜量，两组对边仍分别平行' : '只有一组对边平行，另一组会相交'} result={type === 'parallelogram' ? '两组对边平行' : '只有一组对边平行'} controls={<><div className="segmented-control"><button type="button" className={type === 'parallelogram' ? 'is-active' : ''} onClick={() => { setType('parallelogram'); onInteract?.(); }}>平行四边形</button><button type="button" className={type === 'trapezoid' ? 'is-active' : ''} onClick={() => { setType('trapezoid'); onInteract?.(); }}>梯形</button></div><label>改变形状 <input type="range" min="10" max="80" value={slant} onChange={(event) => { setSlant(Number(event.target.value)); onInteract?.(); }} /></label></>}><svg className="quadrilateral-svg" viewBox="0 0 420 230"><polygon points={points}/><line x1="55" y1="205" x2="365" y2="205"/><text x="210" y="222" textAnchor="middle">改变外形，不改变平行关系</text></svg></Shell>;
}

function seededRedCount(trials: number, redOutOfTen: number) {
  let seed = redOutOfTen * 97 + trials;
  let red = 0;
  for (let index = 0; index < trials; index += 1) { seed = (seed * 48271) % 2147483647; if ((seed % 10) < redOutOfTen) red += 1; }
  return red;
}

function ProbabilityExperiment({ onInteract }: Pick<CourseConceptModelProps, 'onInteract'>) {
  const [red, setRed] = useState(4);
  const [trials, setTrials] = useState(20);
  const observed = useMemo(() => seededRedCount(trials, red), [trials, red]);
  const observedRate = Math.round(observed / trials * 100);
  return <Shell title="随机结果每次不确定，但试验次数增多时频率会靠近理论概率" result={`红色理论概率 ${red * 10}% · 本次频率 ${observedRate}%`} controls={<><label>10个球中红球 <output>{red}</output><input type="range" min="1" max="9" value={red} onChange={(event) => { setRed(Number(event.target.value)); onInteract?.(); }} /></label><div className="segmented-control">{[20,100,1000].map((count) => <button key={count} type="button" className={trials === count ? 'is-active' : ''} onClick={() => { setTrials(count); onInteract?.(); }}>{count}次</button>)}</div></>}><div className="probability-lab"><div className="ball-bag">{Array.from({ length: 10 }, (_, index) => <i key={index} className={index < red ? 'red' : 'blue'} />)}</div><div className="frequency-bars"><div><span>理论概率</span><i style={{ width: `${red * 10}%` }}/><strong>{red * 10}%</strong></div><div><span>试验频率</span><i style={{ width: `${observedRate}%` }}/><strong>{observedRate}%</strong></div></div></div></Shell>;
}

function PercentGridModel({ onInteract }: Pick<CourseConceptModelProps, 'onInteract'>) {
  const [percent, setPercent] = useState(35);
  return <Shell title="百分数把整体固定看作100份，便于直接比较" result={`${percent}% = ${percent}/100 = ${(percent/100).toFixed(2)}`} controls={<label>涂色百分比 <output>{percent}%</output><input type="range" min="0" max="100" step="5" value={percent} onChange={(event) => { setPercent(Number(event.target.value)); onInteract?.(); }} /></label>}><div className="hundred-grid percent">{Array.from({ length: 100 }, (_, index) => <i key={index} className={index < percent ? 'overlap' : ''}/>)}</div></Shell>;
}

function RatioMixture({ onInteract }: Pick<CourseConceptModelProps, 'onInteract'>) {
  const [red, setRed] = useState(2); const [blue, setBlue] = useState(3); const [scale, setScale] = useState(1);
  return <Shell title="把每一份同时放大相同倍数，配方总量变了但比不变" result={`${red*scale}:${blue*scale} = ${red}:${blue}`} controls={<><label>红色份数 <output>{red}</output><input type="range" min="1" max="5" value={red} onChange={(event)=>{setRed(Number(event.target.value));onInteract?.();}}/></label><label>蓝色份数 <output>{blue}</output><input type="range" min="1" max="5" value={blue} onChange={(event)=>{setBlue(Number(event.target.value));onInteract?.();}}/></label><label>同时放大 <output>×{scale}</output><input type="range" min="1" max="3" value={scale} onChange={(event)=>{setScale(Number(event.target.value));onInteract?.();}}/></label></>}><div className="ratio-blocks"><div>{Array.from({length:red*scale},(_,i)=><i key={i} className="red"/>)}</div><b>:</b><div>{Array.from({length:blue*scale},(_,i)=><i key={i} className="blue"/>)}</div></div><div className="model-proof is-valid"><strong>前项和后项同时乘 {scale}，比值仍是 {red}/{blue}</strong></div></Shell>;
}

function ProportionTable({ onInteract }: Pick<CourseConceptModelProps, 'onInteract'>) {
  const [count, setCount] = useState(4); const unitPrice = 3;
  return <Shell title="两个量同时按相同倍数变化，每组对应比值保持相等" result={`1:3 = ${count}:${count*unitPrice}`} controls={<label>数量 <output>{count}</output><input type="range" min="2" max="8" value={count} onChange={(event)=>{setCount(Number(event.target.value));onInteract?.();}}/></label>}><div className="proportion-table"><div><span>数量</span><strong>1</strong><strong>{count}</strong></div><div><span>总价</span><strong>3</strong><strong>{count*unitPrice}</strong></div><p>交叉乘积：1 × {count*unitPrice} = 3 × {count} = {count*unitPrice}</p></div></Shell>;
}

function CoordinateScale({ onInteract }: Pick<CourseConceptModelProps, 'onInteract'>) {
  const [scale, setScale] = useState(2); const base=[[1,1],[3,1],[1,3]]; const mapped=base.map(([x,y])=>[x*scale,y*scale]);
  const pts=(values:number[][])=>values.map(([x,y])=>`${30+x*36},${250-y*30}`).join(' ');
  return <Shell title="所有对应点离原点的距离按同一倍率变化，形状和角度保持不变" result={`放大 ${scale} 倍`} controls={<label>放大倍数 <output>{scale}</output><input type="range" min="1" max="3" value={scale} onChange={(event)=>{setScale(Number(event.target.value));onInteract?.();}}/></label>}><svg className="coordinate-scale-svg" viewBox="0 0 420 280"><path d="M30 20 V250 H400"/><polygon className="original" points={pts(base)}/><polygon className="scaled" points={pts(mapped)}/>{mapped.map(([x,y],index)=><text key={index} x={30+x*36+5} y={250-y*30-5}>({x},{y})</text>)}</svg></Shell>;
}

export default function CourseConceptModel({ type, onInteract }: CourseConceptModelProps) {
  switch(type){
    case 'measurement-lab': return <MeasurementLab onInteract={onInteract}/>;
    case 'fraction-compare-model': return <FractionCompare onInteract={onInteract}/>;
    case 'fraction-equivalence': return <FractionEquivalence onInteract={onInteract}/>;
    case 'decimal-equivalence': return <DecimalEquivalence onInteract={onInteract}/>;
    case 'line-relations': return <LineRelations onInteract={onInteract}/>;
    case 'quadrilateral-constraints': return <QuadrilateralConstraints onInteract={onInteract}/>;
    case 'probability-experiment': return <ProbabilityExperiment onInteract={onInteract}/>;
    case 'percent-grid': return <PercentGridModel onInteract={onInteract}/>;
    case 'ratio-mixture': return <RatioMixture onInteract={onInteract}/>;
    case 'proportion-table': return <ProportionTable onInteract={onInteract}/>;
    case 'coordinate-scale': return <CoordinateScale onInteract={onInteract}/>;
  }
}
