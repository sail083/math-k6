import { useState, type ReactNode } from 'react';

export type FoundationModelType =
  | 'g3-fraction-intro'
  | 'g3-fraction-add-sub'
  | 'g3-rect-area'
  | 'g3-time'
  | 'g4-angle-measure'
  | 'g4-decimal-meaning'
  | 'g4-large-numbers';

interface CourseFoundationModelProps {
  type: FoundationModelType;
  onInteract?: () => void;
}

const foundationModelTypes = new Set<string>([
  'g3-fraction-intro',
  'g3-fraction-add-sub',
  'g3-rect-area',
  'g3-time',
  'g4-angle-measure',
  'g4-decimal-meaning',
  'g4-large-numbers',
]);

export function isFoundationModelType(type: string): type is FoundationModelType {
  return foundationModelTypes.has(type);
}

function ModelShell({ title, relation, invariant, children, controls }: {
  title: string;
  relation: string;
  invariant: string;
  children: ReactNode;
  controls: ReactNode;
}) {
  return (
    <div className="math-model foundation-model">
      <div className="math-model__head">
        <span><i className="signal-dot is-live" />动手试</span>
        <strong>{relation}</strong>
      </div>
      <div className="math-model__canvas">
        <h3>{title}</h3>
        {children}
        <div className="model-proof is-valid foundation-invariant">
          <span>每次都一样</span><strong>{invariant}</strong>
        </div>
      </div>
      <div className="model-controls foundation-controls">{controls}</div>
    </div>
  );
}

function FractionIntro({ onInteract }: Pick<CourseFoundationModelProps, 'onInteract'>) {
  const [parts, setParts] = useState(4);
  const [selected, setSelected] = useState(1);
  const safeSelected = Math.min(selected, parts);
  const width = 320 / parts;
  const changeParts = (next: number) => {
    setParts(next);
    setSelected((current) => Math.min(current, next));
    onInteract?.();
  };
  return (
    <ModelShell
      title="先固定同一个整体，再平均分成同样大的份"
      relation={`${safeSelected}/${parts}`}
      invariant="整体始终是同一个，分母表示等份总数"
      controls={<div className="foundation-control-grid"><label>平均分成 <output>{parts} 份</output><input type="range" min="2" max="8" value={parts} onChange={(event) => changeParts(Number(event.target.value))} /></label><label>取出 <output>{safeSelected} 份</output><input type="range" min="1" max={parts} value={safeSelected} onChange={(event) => { setSelected(Number(event.target.value)); onInteract?.(); }} /></label></div>}
    >
      <svg className="foundation-svg fraction-whole-svg" viewBox="0 0 380 150" role="img" aria-label={`整体平均分成${parts}份，取${safeSelected}份`}>
        {Array.from({ length: parts }, (_, index) => <rect key={index} x={30 + index * width} y="35" width={width} height="70" className={index < safeSelected ? 'is-selected' : ''} />)}
        <text x="190" y="132" textAnchor="middle">每份大小 = 1/{parts}，共取 {safeSelected} 份</text>
      </svg>
    </ModelShell>
  );
}

function FractionAddSub({ onInteract }: Pick<CourseFoundationModelProps, 'onInteract'>) {
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState(2);
  const denominator = 8;
  const first = operation === 'add' ? 2 : 6;
  const result = operation === 'add' ? first + amount : first - amount;
  return (
    <ModelShell
      title="加减的是同样大小的单位分数，不是把分母也加减"
      relation={`${first}/${denominator} ${operation === 'add' ? '+' : '−'} ${amount}/${denominator} = ${result}/${denominator}`}
      invariant={`每一份始终是 1/${denominator}，分母 ${denominator} 不变`}
      controls={<div className="foundation-control-grid"><div className="segmented-control"><button type="button" className={operation === 'add' ? 'is-active' : ''} onClick={() => { setOperation('add'); setAmount(2); onInteract?.(); }}>合并</button><button type="button" className={operation === 'subtract' ? 'is-active' : ''} onClick={() => { setOperation('subtract'); setAmount(2); onInteract?.(); }}>拿走</button></div><label>{operation === 'add' ? '再放入' : '拿走'} <output>{amount} 个 1/{denominator}</output><input type="range" min="1" max={operation === 'add' ? 6 : 5} value={amount} onChange={(event) => { setAmount(Number(event.target.value)); onInteract?.(); }} /></label></div>}
    >
      <div className="unit-fraction-equation" aria-label={`${first}个八分之一经过操作后成为${result}个八分之一`}>
        <div className="unit-fraction-strip">{Array.from({ length: denominator }, (_, index) => <i key={index} className={index < result ? 'is-result' : index < first ? 'is-removed' : ''}><span>1/{denominator}</span></i>)}</div>
        <p>{first} 个单位分数 {operation === 'add' ? `再合入 ${amount} 个` : `拿走 ${amount} 个`}，得到 {result} 个单位分数。</p>
      </div>
    </ModelShell>
  );
}

function RectangleArea({ onInteract }: Pick<CourseFoundationModelProps, 'onInteract'>) {
  const [columns, setColumns] = useState(4);
  const [rows, setRows] = useState(3);
  const count = columns * rows;
  return (
    <ModelShell
      title="面积不是边长相加，而是数内部铺了多少个单位正方形"
      relation={`${columns} × ${rows} = ${count} 平方单位`}
      invariant="每个小格都是 1 平方单位，铺满时没有缝隙和重叠"
      controls={<div className="foundation-control-grid"><label>每行 <output>{columns} 格</output><input type="range" min="2" max="7" value={columns} onChange={(event) => { setColumns(Number(event.target.value)); onInteract?.(); }} /></label><label>共有 <output>{rows} 行</output><input type="range" min="2" max="5" value={rows} onChange={(event) => { setRows(Number(event.target.value)); onInteract?.(); }} /></label></div>}
    >
      <div className="area-unit-board" style={{ gridTemplateColumns: `repeat(${columns}, minmax(28px, 52px))` }} aria-label={`${rows}行${columns}列，共${count}个单位方格`}>
        {Array.from({ length: count }, (_, index) => <i key={index}><span>{index + 1}</span></i>)}
      </div>
      <p className="foundation-observation">每行 {columns} 个，重复 {rows} 行，所以不用逐个数：{columns} × {rows} = {count}。</p>
    </ModelShell>
  );
}

function TimeRegroup({ onInteract }: Pick<CourseFoundationModelProps, 'onInteract'>) {
  const [minutes, setMinutes] = useState(58);
  const [added, setAdded] = useState(2);
  const total = minutes + added;
  const hours = Math.floor(total / 60);
  const remaining = total % 60;
  return (
    <ModelShell
      title="分针走满 60 个小格，才向小时换成 1"
      relation={`${minutes} 分 + ${added} 分 = ${hours > 0 ? `${hours} 时 ` : ''}${remaining} 分`}
      invariant="经过的总时间不变：60 分钟和 1 小时表示同一段时间"
      controls={<div className="foundation-control-grid"><label>已有分钟 <output>{minutes}</output><input type="range" min="50" max="59" value={minutes} onChange={(event) => { setMinutes(Number(event.target.value)); onInteract?.(); }} /></label><label>再经过 <output>{added} 分</output><input type="range" min="1" max="15" value={added} onChange={(event) => { setAdded(Number(event.target.value)); onInteract?.(); }} /></label></div>}
    >
      <div className="time-regroup-board">
        <svg className="foundation-svg time-regroup-svg" viewBox="0 0 260 260" role="img" aria-label={`分针从${minutes}分走到${remaining}分`}>
          <circle cx="130" cy="130" r="98" />
          {Array.from({ length: 60 }, (_, index) => { const angle = (index * 6 - 90) * Math.PI / 180; const inner = index % 5 === 0 ? 84 : 90; const isAdded = total < 60 ? index >= minutes && index < total : index >= minutes || index < remaining; return <line key={index} x1={130 + inner * Math.cos(angle)} y1={130 + inner * Math.sin(angle)} x2={130 + 98 * Math.cos(angle)} y2={130 + 98 * Math.sin(angle)} className={isAdded ? 'is-added' : ''} />; })}
          <line className="minute-hand" x1="130" y1="130" x2={130 + 76 * Math.cos((remaining * 6 - 90) * Math.PI / 180)} y2={130 + 76 * Math.sin((remaining * 6 - 90) * Math.PI / 180)} />
          <circle cx="130" cy="130" r="5" />
        </svg>
        <div className={`regroup-counter ${hours > 0 ? 'is-regrouped' : ''}`}><span>{total} 个一分钟</span><strong>{hours > 0 ? `换成 ${hours} 个一小时，余 ${remaining} 分` : `还差 ${60 - total} 分凑满一小时`}</strong></div>
      </div>
    </ModelShell>
  );
}

function AngleMeasure({ onInteract }: Pick<CourseFoundationModelProps, 'onInteract'>) {
  const [angle, setAngle] = useState(60);
  const radius = 105;
  const endX = 145 + radius * Math.cos(-angle * Math.PI / 180);
  const endY = 145 - radius * Math.sin(angle * Math.PI / 180);
  const arcEndX = 145 + 42 * Math.cos(-angle * Math.PI / 180);
  const arcEndY = 145 - 42 * Math.sin(angle * Math.PI / 180);
  return (
    <ModelShell
      title="角的大小是从起始边旋转到终止边的旋转量"
      relation={`${angle}°`}
      invariant="边的长短不影响角度，起始边始终对准 0°"
      controls={<label>旋转终止边 <output>{angle}°</output><input type="range" min="0" max="180" step="5" value={angle} onChange={(event) => { setAngle(Number(event.target.value)); onInteract?.(); }} /></label>}
    >
      <svg className="foundation-svg angle-measure-svg" viewBox="0 0 330 190" role="img" aria-label={`从0度起始边旋转到${angle}度`}>
        <path d="M40 145 A105 105 0 0 1 250 145" className="protractor-arc" />
        {Array.from({ length: 19 }, (_, index) => { const degree = index * 10; const rad = (180 + degree) * Math.PI / 180; const inner = degree % 30 === 0 ? 92 : 98; return <line key={degree} x1={145 + inner * Math.cos(rad)} y1={145 + inner * Math.sin(rad)} x2={145 + 105 * Math.cos(rad)} y2={145 + 105 * Math.sin(rad)} />; })}
        <line className="angle-ray start" x1="145" y1="145" x2="250" y2="145" />
        <line className="angle-ray end" x1="145" y1="145" x2={endX} y2={endY} />
        {angle > 0 && <path className="angle-sweep" d={`M187 145 A42 42 0 ${angle > 180 ? 1 : 0} 0 ${arcEndX} ${arcEndY}`} />}
        <text x="257" y="163">0°</text><text x="145" y="175" textAnchor="middle">旋转 {angle} 个 1°</text>
      </svg>
    </ModelShell>
  );
}

function DecimalMeaning({ onInteract }: Pick<CourseFoundationModelProps, 'onInteract'>) {
  const [tenths, setTenths] = useState(3);
  const [hundredths, setHundredths] = useState(5);
  const value = (tenths / 10 + hundredths / 100).toFixed(2);
  return (
    <ModelShell
      title="每向右一个数位，计数单位缩小为原来的十分之一"
      relation={`${tenths} 个 0.1 + ${hundredths} 个 0.01 = ${value}`}
      invariant="数位决定单位：十分位只数 0.1，百分位只数 0.01"
      controls={<div className="foundation-control-grid"><label>十分位 <output>{tenths}</output><input type="range" min="0" max="9" value={tenths} onChange={(event) => { setTenths(Number(event.target.value)); onInteract?.(); }} /></label><label>百分位 <output>{hundredths}</output><input type="range" min="0" max="9" value={hundredths} onChange={(event) => { setHundredths(Number(event.target.value)); onInteract?.(); }} /></label></div>}
    >
      <div className="decimal-place-board">
        <div><span>个位</span><strong>0</strong><small>1</small></div><b>.</b><div className="is-active"><span>十分位</span><strong>{tenths}</strong><small>0.1</small></div><div className="is-active"><span>百分位</span><strong>{hundredths}</strong><small>0.01</small></div>
      </div>
      <div className="decimal-unit-blocks"><div>{Array.from({ length: tenths }, (_, index) => <i key={index} className="tenth">0.1</i>)}</div><div>{Array.from({ length: hundredths }, (_, index) => <i key={index} className="hundredth">0.01</i>)}</div></div>
    </ModelShell>
  );
}

function LargeNumberRegroup({ onInteract }: Pick<CourseFoundationModelProps, 'onInteract'>) {
  const [highGroup, setHighGroup] = useState(3205);
  const [lowGroup, setLowGroup] = useState(6080);
  const value = highGroup * 10000 + lowGroup;
  const digits = String(value).padStart(8, '0').split('');
  const places = ['千万', '百万', '十万', '万', '千', '百', '十', '个'];
  return (
    <ModelShell
      title="先四位分级，再逐级读出每个数字所在的数位"
      relation={`${highGroup} 万 + ${lowGroup} = ${value.toLocaleString('zh-CN')}`}
      invariant="相邻数位进率始终是 10；万级和个级都按个、十、百、千四位分组"
      controls={<div className="foundation-control-grid"><label>万级 <output>{highGroup}</output><input type="range" min="1000" max="9999" step="101" value={highGroup} onChange={(event) => { setHighGroup(Number(event.target.value)); onInteract?.(); }} /></label><label>个级 <output>{String(lowGroup).padStart(4, '0')}</output><input type="range" min="0" max="9999" step="37" value={lowGroup} onChange={(event) => { setLowGroup(Number(event.target.value)); onInteract?.(); }} /></label></div>}
    >
      <div className="place-regroup-board large-number-board" aria-label={`大数${value}的数位表`}>
        {digits.map((digit, index) => <div className={`place-column ${index === 3 ? 'is-group-end' : ''}`} key={places[index]}><span>{places[index]}</span><strong>{digit}</strong><small>{index < 4 ? '万级' : '个级'}</small></div>)}
      </div>
      <p className="foundation-observation">分级：{highGroup}｜{String(lowGroup).padStart(4, '0')}。每一级内部都从高位到低位读，级末再加“万”。</p>
    </ModelShell>
  );
}

export default function CourseFoundationModel({ type, onInteract }: CourseFoundationModelProps) {
  switch (type) {
    case 'g3-fraction-intro': return <FractionIntro onInteract={onInteract} />;
    case 'g3-fraction-add-sub': return <FractionAddSub onInteract={onInteract} />;
    case 'g3-rect-area': return <RectangleArea onInteract={onInteract} />;
    case 'g3-time': return <TimeRegroup onInteract={onInteract} />;
    case 'g4-angle-measure': return <AngleMeasure onInteract={onInteract} />;
    case 'g4-decimal-meaning': return <DecimalMeaning onInteract={onInteract} />;
    case 'g4-large-numbers': return <LargeNumberRegroup onInteract={onInteract} />;
  }
}
