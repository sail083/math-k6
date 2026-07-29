import { useState } from 'react';
import type { VizType } from '@/lib/types';

interface CourseMathModelProps {
  type: Extract<VizType,
    | 'remainder-groups'
    | 'trial-division'
    | 'decimal-place-value'
    | 'decimal-product'
    | 'decimal-quotient'
    | 'fraction-product'
    | 'fraction-quotient'>;
  onInteract?: () => void;
}

const courseModelTypes = new Set<VizType>([
  'remainder-groups',
  'trial-division',
  'decimal-place-value',
  'decimal-product',
  'decimal-quotient',
  'fraction-product',
  'fraction-quotient',
]);

export function isCourseModelType(type: VizType): type is CourseMathModelProps['type'] {
  return courseModelTypes.has(type);
}

function ModelShell({ title, relation, children }: { title: string; relation: string; children: React.ReactNode }) {
  return (
    <div className="math-model">
      <div className="math-model__head"><span><i className="signal-dot is-live" />动手试</span><strong>{relation}</strong></div>
      <div className="math-model__canvas"><h3>{title}</h3>{children}</div>
    </div>
  );
}

function RemainderGroups({ onInteract }: Pick<CourseMathModelProps, 'onInteract'>) {
  const [total, setTotal] = useState(14);
  const [divisor, setDivisor] = useState(4);
  const quotient = Math.floor(total / divisor);
  const remainder = total % divisor;
  const groups = Array.from({ length: quotient }, (_, group) =>
    Array.from({ length: divisor }, (_, item) => group * divisor + item),
  );

  const update = (setter: (value: number) => void, value: number) => {
    setter(value);
    onInteract?.();
  };

  return (
    <ModelShell title="把物品平均分组，分不完的才是余数" relation={`${total} ÷ ${divisor} = ${quotient} …… ${remainder}`}>
      <div className="grouping-board">
        <div className="grouping-board__groups">
          {groups.map((items, index) => <div key={index} className="object-group" aria-label={`第${index + 1}组，共${divisor}个`}>{items.map((item) => <i key={item} />)}</div>)}
          {remainder > 0 ? <div className="object-group remainder" aria-label={`余下${remainder}个`}>{Array.from({ length: remainder }, (_, index) => <i key={index} />)}<span>余下 {remainder}</span></div> : null}
        </div>
        <div className={`model-proof ${remainder < divisor ? 'is-valid' : ''}`}><span>必须满足</span><strong>余数 {remainder} ＜ 除数 {divisor}</strong></div>
      </div>
      <div className="model-controls two">
        <label>物品总数 <output>{total}</output><input type="range" min="7" max="20" value={total} onChange={(event) => update(setTotal, Number(event.target.value))} /></label>
        <label>每组数量 <output>{divisor}</output><input type="range" min="2" max="6" value={divisor} onChange={(event) => update(setDivisor, Number(event.target.value))} /></label>
      </div>
    </ModelShell>
  );
}

function TrialDivision({ onInteract }: Pick<CourseMathModelProps, 'onInteract'>) {
  const examples = [{ dividend: 196, divisor: 39, estimate: 40 }, { dividend: 84, divisor: 21, estimate: 20 }];
  const [exampleIndex, setExampleIndex] = useState(0);
  const [trial, setTrial] = useState(4);
  const example = examples[exampleIndex];
  const product = example.divisor * trial;
  const remainder = example.dividend - product;
  const tooLarge = remainder < 0;
  const tooSmall = remainder >= example.divisor;
  const valid = !tooLarge && !tooSmall;

  const adjust = (value: number) => {
    setTrial(value);
    onInteract?.();
  };

  return (
    <ModelShell title="试商不是猜答案，而是估、乘、减、检查" relation={`${example.dividend} ÷ ${example.divisor}`}>
      <div className="trial-layout">
        <div className="division-stack" aria-label="除法竖式">
          <b className={valid ? 'is-valid' : ''}>{trial}</b>
          <span>{example.divisor}⌯{example.dividend}</span>
          <i>- {product}</i>
          <strong>{remainder}</strong>
        </div>
        <div className="trial-reasoning">
          <span>把 {example.divisor} 看作 {example.estimate}，先试商 {trial}</span>
          <p>{example.divisor} × {trial} = {product}</p>
          <div className={`model-proof ${valid ? 'is-valid' : 'is-warning'}`}>
            {tooLarge ? '乘积超过被除数，商要调小' : tooSmall ? `余数 ${remainder} ≥ 除数 ${example.divisor}，商要调大` : `0 ≤ 余数 ${remainder} ＜ 除数 ${example.divisor}，试商正确`}
          </div>
        </div>
      </div>
      <div className="model-controls split">
        <div className="segmented-control">{examples.map((item, index) => <button key={item.dividend} type="button" className={index === exampleIndex ? 'is-active' : ''} onClick={() => { setExampleIndex(index); setTrial(index === 0 ? 4 : 3); onInteract?.(); }}>{item.dividend} ÷ {item.divisor}</button>)}</div>
        <div className="stepper"><button type="button" aria-label="试商减一" onClick={() => adjust(Math.max(1, trial - 1))}>−</button><output>试商 {trial}</output><button type="button" aria-label="试商加一" onClick={() => adjust(Math.min(9, trial + 1))}>＋</button></div>
      </div>
    </ModelShell>
  );
}

function DecimalPlaceValue({ onInteract }: Pick<CourseMathModelProps, 'onInteract'>) {
  const [mode, setMode] = useState<'add' | 'subtract'>('add');
  const data = mode === 'add'
    ? { a: ['3', '.', '4', '5'], b: ['2', '.', '3', '0'], result: ['5', '.', '7', '5'], expression: '3.45 + 2.30 = 5.75' }
    : { a: ['5', '.', '6', '0'], b: ['2', '.', '8', '0'], result: ['2', '.', '8', '0'], expression: '5.60 - 2.80 = 2.80' };
  return (
    <ModelShell title="对齐的是数位，小数点只是对齐标记" relation={data.expression}>
      <div className="decimal-columns">
        <div className="decimal-columns__heads"><span>个位</span><span>小数点</span><span>十分位</span><span>百分位</span></div>
        {[data.a, data.b, data.result].map((row, rowIndex) => <div key={rowIndex} className={`decimal-row ${rowIndex === 2 ? 'result' : ''}`}>{row.map((digit, index) => <strong key={index} className={digit === '.' ? 'point' : ''}>{digit}</strong>)}</div>)}
        <p>2.3 可以写成 2.30，数的大小不变，但相同数位更容易对齐。</p>
      </div>
      <div className="model-controls"><div className="segmented-control"><button type="button" className={mode === 'add' ? 'is-active' : ''} onClick={() => { setMode('add'); onInteract?.(); }}>小数加法</button><button type="button" className={mode === 'subtract' ? 'is-active' : ''} onClick={() => { setMode('subtract'); onInteract?.(); }}>小数减法</button></div></div>
    </ModelShell>
  );
}

function DecimalProduct({ onInteract }: Pick<CourseMathModelProps, 'onInteract'>) {
  const [tenths, setTenths] = useState(4);
  const first = 5;
  const overlap = first * tenths;
  return (
    <ModelShell title="横向取十分之几，再纵向取十分之几，重叠部分就是积" relation={`0.${first} × 0.${tenths} = 0.${String(overlap).padStart(2, '0')}`}>
      <div className="hundred-grid" aria-label={`${overlap}个百分之一被双重涂色`}>{Array.from({ length: 100 }, (_, index) => { const row = Math.floor(index / 10); const col = index % 10; const horizontal = col < first; const vertical = row < tenths; return <i key={index} className={horizontal && vertical ? 'overlap' : horizontal ? 'horizontal' : vertical ? 'vertical' : ''} />; })}</div>
      <div className="model-proof is-valid"><span>重叠</span><strong>{first} × {tenths} = {overlap} 个百分之一</strong></div>
      <div className="model-controls"><label>第二个因数 0.{tenths}<input type="range" min="1" max="9" value={tenths} onChange={(event) => { setTenths(Number(event.target.value)); onInteract?.(); }} /></label></div>
    </ModelShell>
  );
}

function DecimalQuotient({ onInteract }: Pick<CourseMathModelProps, 'onInteract'>) {
  const [scale, setScale] = useState(0);
  const factor = 10 ** scale;
  const dividend = 1.2 * factor;
  const divisor = 0.3 * factor;
  return (
    <ModelShell title="被除数和除数同时扩大相同倍数，商保持不变" relation={`${dividend} ÷ ${divisor} = 4`}>
      <div className="scale-equation">
        <div><span>被除数</span><strong>{dividend}</strong></div><b>÷</b><div><span>除数</span><strong>{divisor}</strong></div><b>=</b><div className="quotient"><span>商</span><strong>4</strong></div>
      </div>
      <div className="scale-arrows"><span>同时 × {factor}</span><strong>商不变</strong></div>
      <div className="model-controls"><div className="segmented-control"><button type="button" className={scale === 0 ? 'is-active' : ''} onClick={() => { setScale(0); onInteract?.(); }}>1.2 ÷ 0.3</button><button type="button" className={scale === 1 ? 'is-active' : ''} onClick={() => { setScale(1); onInteract?.(); }}>同时扩大 10 倍</button></div></div>
    </ModelShell>
  );
}

function FractionProduct({ onInteract }: Pick<CourseMathModelProps, 'onInteract'>) {
  const [horizontal, setHorizontal] = useState(1);
  const [vertical, setVertical] = useState(1);
  const denominator = 6;
  const numerator = horizontal * vertical;
  return (
    <ModelShell title="一个分数的另一个分数，是两次取份后的重叠部分" relation={`${horizontal}/2 × ${vertical}/3 = ${numerator}/${denominator}`}>
      <div className="fraction-overlap">{Array.from({ length: 6 }, (_, index) => { const row = Math.floor(index / 3); const col = index % 3; const selected = row < horizontal && col < vertical; return <i key={index} className={selected ? 'selected' : ''}><span>{selected ? '重叠' : ''}</span></i>; })}</div>
      <div className="model-proof is-valid"><strong>整个长方形被分成 2 × 3 = 6 份，重叠 {numerator} 份</strong></div>
      <div className="model-controls two"><label>横向取 {horizontal}/2<input type="range" min="1" max="2" value={horizontal} onChange={(event) => { setHorizontal(Number(event.target.value)); onInteract?.(); }} /></label><label>纵向取 {vertical}/3<input type="range" min="1" max="3" value={vertical} onChange={(event) => { setVertical(Number(event.target.value)); onInteract?.(); }} /></label></div>
    </ModelShell>
  );
}

function FractionQuotient({ onInteract }: Pick<CourseMathModelProps, 'onInteract'>) {
  const [eighths, setEighths] = useState(1);
  const available = 6;
  const groups = Math.floor(available / eighths);
  return (
    <ModelShell title="分数除法先问：被除数里包含几个除数" relation={`3/4 ÷ ${eighths}/8 = ${groups}`}>
      <div className="fraction-strip">{Array.from({ length: 8 }, (_, index) => <i key={index} className={index < available ? `filled group-${Math.floor(index / eighths) % 2}` : ''}><span>{index < available ? '1/8' : ''}</span></i>)}</div>
      <div className="model-proof is-valid"><strong>3/4 = 6/8，其中包含 {groups} 个 {eighths}/8</strong></div>
      <div className="model-controls"><label>每组大小 {eighths}/8<input type="range" min="1" max="3" value={eighths} onChange={(event) => { setEighths(Number(event.target.value)); onInteract?.(); }} /></label></div>
    </ModelShell>
  );
}

export default function CourseMathModel({ type, onInteract }: CourseMathModelProps) {
  switch (type) {
    case 'remainder-groups': return <RemainderGroups onInteract={onInteract} />;
    case 'trial-division': return <TrialDivision onInteract={onInteract} />;
    case 'decimal-place-value': return <DecimalPlaceValue onInteract={onInteract} />;
    case 'decimal-product': return <DecimalProduct onInteract={onInteract} />;
    case 'decimal-quotient': return <DecimalQuotient onInteract={onInteract} />;
    case 'fraction-product': return <FractionProduct onInteract={onInteract} />;
    case 'fraction-quotient': return <FractionQuotient onInteract={onInteract} />;
  }
}
