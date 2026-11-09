import { useState, type ReactNode } from 'react';
import './course-geometry-model.css';

export type CourseGeometryModelType =
  | 'g3-rect-area'
  | 'g4-angle-measure'
  | 'g4-triangle'
  | 'g5-parallelogram-area'
  | 'g5-trapezoid-area'
  | 'g5-triangle-area'
  | 'g6-circle-area';

export interface CourseGeometryModelProps {
  type: CourseGeometryModelType;
  onInteract?: () => void;
}

const geometryModelTypes = new Set<string>([
  'g3-rect-area', 'g4-angle-measure', 'g4-triangle', 'g5-parallelogram-area',
  'g5-trapezoid-area', 'g5-triangle-area', 'g6-circle-area',
]);

export function isGeometryModelType(type: string): type is CourseGeometryModelType {
  return geometryModelTypes.has(type);
}

function Shell({ title, relation, children, controls }: { title: string; relation: string; children: ReactNode; controls: ReactNode }) {
  return <div className="math-model geometry-model"><div className="math-model__head"><span><i className="signal-dot is-live" />几何实验</span><strong>{relation}</strong></div><div className="math-model__canvas"><h3>{title}</h3>{children}</div><div className="model-controls">{controls}</div></div>;
}

function Segments({ value, setValue, labels, onInteract }: { value: number; setValue: (value: number) => void; labels: string[]; onInteract?: () => void }) {
  return <div className="segmented-control">{labels.map((label, index) => <button key={label} type="button" aria-pressed={value === index} className={value === index ? 'is-active' : ''} onClick={() => { setValue(index); onInteract?.(); }}>{label}</button>)}</div>;
}

function RectArea({ onInteract }: Pick<CourseGeometryModelProps, 'onInteract'>) {
  const [cols, setCols] = useState(5); const [rows, setRows] = useState(3);
  return <Shell title="每行同样多，行数 × 每行格数就是总格数" relation={`${rows} × ${cols} = ${rows * cols} 平方格`} controls={<><label>每行 <output>{cols}</output><input type="range" min="2" max="8" value={cols} onChange={e => { setCols(+e.target.value); onInteract?.(); }} /></label><label>行数 <output>{rows}</output><input type="range" min="2" max="6" value={rows} onChange={e => { setRows(+e.target.value); onInteract?.(); }} /></label></>}>
    <div className="geo-area-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, aspectRatio: `${cols}/${rows}` }} aria-label={`${rows}行${cols}列，共${rows * cols}个平方格`}>{Array.from({ length: rows * cols }, (_, i) => <i key={i}><span>{i + 1}</span></i>)}</div>
    <div className="model-proof is-valid"><strong>长 {cols} 个单位 × 宽 {rows} 个单位 = 面积 {cols * rows} 平方单位</strong></div>
  </Shell>;
}

function AngleMeasure({ onInteract }: Pick<CourseGeometryModelProps, 'onInteract'>) {
  const [angle, setAngle] = useState(60); const cx = 200, cy = 205, r = 145; const rad = Math.PI * angle / 180; const x = cx + r * Math.cos(rad), y = cy - r * Math.sin(rad);
  const ticks = Array.from({ length: 19 }, (_, i) => { const a = Math.PI * i / 18; return { x1: cx - 132 * Math.cos(a), y1: cy - 132 * Math.sin(a), x2: cx - (i % 3 ? 124 : 116) * Math.cos(a), y2: cy - (i % 3 ? 124 : 116) * Math.sin(a) }; });
  return <Shell title="中心对顶点，零线贴一边，再读另一边" relation={`∠A = ${angle}°`} controls={<label>转动射线 <output>{angle}°</output><input type="range" min="10" max="170" step="5" value={angle} onChange={e => { setAngle(+e.target.value); onInteract?.(); }} /></label>}>
    <svg className="geo-svg" viewBox="0 0 400 245" role="img" aria-label={`量角器测得${angle}度`}><path d="M55 205 A145 145 0 0 1 345 205" className="geo-soft" />{ticks.map((t, i) => <line key={i} {...t} className="geo-tick" />)}<line x1={cx} y1={cy} x2="345" y2={cy} className="geo-zero" /><line x1={cx} y1={cy} x2={x} y2={y} className="geo-ray" /><circle cx={cx} cy={cy} r="6" className="geo-center" /><path d={`M${cx + 42} ${cy} A42 42 0 0 0 ${cx + 42 * Math.cos(rad)} ${cy - 42 * Math.sin(rad)}`} className="geo-arc" /><text x="200" y="28">{angle}°</text><text x="350" y="222">0°</text></svg>
    <div className="geo-checks"><span>中心已对齐</span><span>零刻度线已对齐</span><strong>读数 {angle}°</strong></div>
  </Shell>;
}

type TriangleKind = '锐角' | '直角' | '钝角';
const triangles: Record<TriangleKind, [number, number, number]> = { 锐角: [48, 56, 76], 直角: [90, 34, 56], 钝角: [53, 24, 103] };
function TriangleLab({ onInteract }: Pick<CourseGeometryModelProps, 'onInteract'>) {
  const [kind, setKind] = useState<TriangleKind>('锐角'); const angles = triangles[kind];
  // 角度是唯一数据源；正弦定理生成顶点，避免示意图与标注互相矛盾。
  const radians = angles.map(angle => angle * Math.PI / 180);
  const side = 210 * Math.sin(radians[1]) / Math.sin(radians[2]);
  const vertices = [[95, 205], [305, 205], [95 + side * Math.cos(radians[0]), 205 - side * Math.sin(radians[0])]];
  return <Shell title="按最大角分类，三个内角始终拼成平角" relation={`${angles.join('° + ')}° = 180°`} controls={<div className="segmented-control">{(Object.keys(triangles) as TriangleKind[]).map(k => <button key={k} type="button" aria-pressed={kind === k} className={kind === k ? 'is-active' : ''} onClick={() => { setKind(k); onInteract?.(); }}>{k}三角形</button>)}</div>}>
    <svg className="geo-svg" viewBox="0 0 400 250" role="img" aria-label={`${kind}三角形，内角${angles.join('度、')}度`}><polygon points={vertices.map(point => point.join(',')).join(' ')} className="geo-shape" /><text x="200" y="32">{kind}三角形</text>{vertices.map(([x, y], index) => <text key={index} x={x} y={y + (index === 2 ? -12 : 24)}>{angles[index]}°</text>)}</svg>
    <div className="geo-angle-sum">{[0, angles[0], angles[0] + angles[1], 180].map((rotation) => <i key={rotation} style={{ transform: `rotate(${-rotation}deg)` }} />)}<strong>180°</strong></div>
  </Shell>;
}

function ParallelogramArea({ onInteract }: Pick<CourseGeometryModelProps, 'onInteract'>) {
  const [step, setStep] = useState(0); const [shift, setShift] = useState(45);
  const left = 60, base = 210, top = 65, bottom = 205;
  const cut = left + shift, right = left + base;
  const original = `${left},${bottom} ${right},${bottom} ${right + shift},${top} ${cut},${top}`;
  const remainder = `${cut},${bottom} ${right},${bottom} ${right + shift},${top} ${cut},${top}`;
  const piece = `${left},${bottom} ${cut},${bottom} ${cut},${top}`;
  const dimensionLeft = step === 2 ? cut : left;
  return <Shell title="把斜出来的三角形移到另一边，面积不变" relation={`S = ${6} × ${4} = 24`} controls={<><Segments value={step} setValue={setStep} labels={['原图', '切开', '补成长方形']} onInteract={onInteract} /><label>斜度 <output>{shift}</output><input type="range" min="20" max="70" value={shift} onChange={e => { setShift(+e.target.value); onInteract?.(); }} /></label></>}>
    <svg className="geo-svg" viewBox="0 0 400 250" role="img" aria-label={`底6高4的平行四边形，${['原图', '沿高切开', '剪拼成长方形'][step]}`}>
      <polygon points={step === 0 ? original : remainder} className="geo-shape" />
      {step > 0 && <polygon points={piece} className={`geo-piece${step === 2 ? ' moved' : ''}`} transform={`translate(${step === 2 ? base : 0} 0)`} />}
      {step === 1 && <line x1={cut} y1={top} x2={cut} y2={bottom} className="geo-cut" />}
      <line x1={dimensionLeft} y1="222" x2={dimensionLeft + base} y2="222" className="geo-dimension" /><text x={dimensionLeft + base / 2} y="242">{step === 2 ? '长 6' : '底 6'}</text>
      <line x1="44" y1={top} x2="44" y2={bottom} className="geo-dimension" /><text x="26" y="140">高 4</text>
    </svg><div className="model-proof is-valid"><strong>{step < 2 ? '底和高不变；切下的部分没有增加或丢失' : '长方形的长 = 原来的底，宽 = 原来的高'}</strong></div>
  </Shell>;
}

function PairArea({ type, onInteract }: { type: 'triangle' | 'trapezoid'; onInteract?: () => void }) {
  const [step, setStep] = useState(0); const trapezoid = type === 'trapezoid'; const relation = trapezoid ? 'S = (3 + 7) × 4 ÷ 2 = 20' : 'S = 6 × 4 ÷ 2 = 12';
  const vertices = trapezoid ? [[70, 190], [245, 190], [190, 90], [115, 90]] : [[70, 190], [220, 190], [120, 90]];
  const first = vertices.map(point => point.join(',')).join(' ');
  const joined = `translate(${vertices[1][0] + vertices[2][0]} ${vertices[1][1] + vertices[2][1]}) rotate(180)`;
  return <Shell title={trapezoid ? '两个完全相同的梯形拼成平行四边形' : '两个完全相同的三角形拼成平行四边形'} relation={relation} controls={<Segments value={step} setValue={setStep} labels={['一个图形', '复制一个', '旋转拼接']} onInteract={onInteract} />}>
    <svg className="geo-svg" viewBox="0 0 500 250" role="img" aria-label={`${trapezoid ? '上底3下底7高4的梯形' : '底6高4的三角形'}，${['原图', '复制一片', '旋转拼接'][step]}`}><polygon points={first} className="geo-shape" />{step > 0 && <polygon points={first} transform={step === 1 ? 'translate(220 0)' : joined} className="geo-piece" />}<line x1="48" y1="90" x2="48" y2="190" className="geo-dimension" /><text x="28" y="145">高 4</text><text x={(vertices[0][0] + vertices[1][0]) / 2} y="214">{trapezoid ? '下底 7' : '底 6'}</text>{trapezoid && <text x={(vertices[2][0] + vertices[3][0]) / 2} y="76">上底 3</text>}</svg><div className="model-proof is-valid"><strong>{step === 2 ? `拼成图形面积是原图的 2 倍，所以 ${trapezoid ? '除以 2' : '三角形面积是底×高的一半'}` : step === 1 ? '复制前后两个图形全等，面积相等' : '先看一个图形的底和高，再复制一个完全相同的图形'}</strong></div>
  </Shell>;
}

function CircleArea({ onInteract }: Pick<CourseGeometryModelProps, 'onInteract'>) {
  const [sectors, setSectors] = useState(12);
  const radius = 58, halfAngle = Math.PI / sectors;
  const halfChord = radius * Math.sin(halfAngle), height = radius * Math.cos(halfAngle);
  // 两侧复用同一扇形，只旋转和平移：弧线和面积都保留，不用三角形近似切片。
  const sector = `M0 0 L${-halfChord} ${-height} A${radius} ${radius} 0 0 1 ${halfChord} ${-height} Z`;
  const pieces = Array.from({ length: sectors }, (_, index) => index);
  return <Shell title="扇形越细，重排后越接近长方形" relation="重排面积不变：S = πr²" controls={<label>扇形数量 <output>{sectors}</output><input type="range" min="8" max="24" step="4" value={sectors} onChange={e => { setSectors(+e.target.value); onInteract?.(); }} /></label>}>
    <svg className="geo-svg circle-rearrange" viewBox="0 0 430 250" role="img" aria-label={`圆分成${sectors}个相同扇形，原样重排，面积不变`}>
      <g aria-label="原圆扇形">{pieces.map(i => <path key={i} d={sector} transform={`translate(85 125) rotate(${i * 360 / sectors})`} className={i % 2 ? 'geo-sector alt' : 'geo-sector'} />)}</g>
      <g aria-label="重排扇形">{pieces.map(i => <path key={i} d={sector} transform={`translate(${195 + (i + 1) * halfChord} ${95 + (i % 2 ? 0 : height)}) rotate(${i % 2 ? 180 : 0})`} className={i % 2 ? 'geo-sector alt' : 'geo-sector'} />)}</g>
      <text x="85" y="210">原圆：半径 r</text><text x="295" y="195">底逐渐接近 πr</text><text x="295" y="216">高逐渐接近 r</text>
    </svg><div className="model-proof is-valid"><strong>{sectors} 等分：弧边仍有起伏，分得越细越接近长方形；没有增加或丢失扇形。</strong></div>
  </Shell>;
}

export default function CourseGeometryModel({ type, onInteract }: CourseGeometryModelProps) {
  switch (type) {
    case 'g3-rect-area': return <RectArea onInteract={onInteract} />;
    case 'g4-angle-measure': return <AngleMeasure onInteract={onInteract} />;
    case 'g4-triangle': return <TriangleLab onInteract={onInteract} />;
    case 'g5-parallelogram-area': return <ParallelogramArea onInteract={onInteract} />;
    case 'g5-trapezoid-area': return <PairArea type="trapezoid" onInteract={onInteract} />;
    case 'g5-triangle-area': return <PairArea type="triangle" onInteract={onInteract} />;
    case 'g6-circle-area': return <CircleArea onInteract={onInteract} />;
  }
}
