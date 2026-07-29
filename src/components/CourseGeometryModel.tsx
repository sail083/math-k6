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
  return <div className="segmented-control">{labels.map((label, index) => <button key={label} type="button" className={value === index ? 'is-active' : ''} onClick={() => { setValue(index); onInteract?.(); }}>{label}</button>)}</div>;
}

function RectArea({ onInteract }: Pick<CourseGeometryModelProps, 'onInteract'>) {
  const [cols, setCols] = useState(5); const [rows, setRows] = useState(3);
  return <Shell title="每行同样多，行数 × 每行格数就是总格数" relation={`${rows} × ${cols} = ${rows * cols} 平方格`} controls={<><label>每行 <output>{cols}</output><input type="range" min="2" max="8" value={cols} onChange={e => { setCols(+e.target.value); onInteract?.(); }} /></label><label>行数 <output>{rows}</output><input type="range" min="2" max="6" value={rows} onChange={e => { setRows(+e.target.value); onInteract?.(); }} /></label></>}>
    <div className="geo-area-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, aspectRatio: `${cols}/${rows}` }} aria-label={`${rows}行${cols}列，共${rows * cols}个平方格`}>{Array.from({ length: rows * cols }, (_, i) => <i key={i}><span>{i + 1}</span></i>)}</div>
    <div className="model-proof is-valid"><strong>长 {cols} 个单位 × 宽 {rows} 个单位 = 面积 {cols * rows} 平方单位</strong></div>
  </Shell>;
}

function AngleMeasure({ onInteract }: Pick<CourseGeometryModelProps, 'onInteract'>) {
  const [angle, setAngle] = useState(60); const cx = 200, cy = 205, r = 145; const rad = Math.PI * (180 - angle) / 180; const x = cx + r * Math.cos(rad), y = cy - r * Math.sin(rad);
  const ticks = Array.from({ length: 19 }, (_, i) => { const a = Math.PI * i / 18; return { x1: cx - 132 * Math.cos(a), y1: cy - 132 * Math.sin(a), x2: cx - (i % 3 ? 124 : 116) * Math.cos(a), y2: cy - (i % 3 ? 124 : 116) * Math.sin(a) }; });
  return <Shell title="中心对顶点，零线贴一边，再读另一边" relation={`∠A = ${angle}°`} controls={<label>转动射线 <output>{angle}°</output><input type="range" min="10" max="170" step="5" value={angle} onChange={e => { setAngle(+e.target.value); onInteract?.(); }} /></label>}>
    <svg className="geo-svg" viewBox="0 0 400 245" role="img" aria-label={`量角器测得${angle}度`}><path d="M55 205 A145 145 0 0 1 345 205" className="geo-soft" />{ticks.map((t, i) => <line key={i} {...t} className="geo-tick" />)}<line x1={cx} y1={cy} x2="345" y2={cy} className="geo-zero" /><line x1={cx} y1={cy} x2={x} y2={y} className="geo-ray" /><circle cx={cx} cy={cy} r="6" className="geo-center" /><path d={`M${cx + 42} ${cy} A42 42 0 0 0 ${cx + 42 * Math.cos(rad)} ${cy - 42 * Math.sin(rad)}`} className="geo-arc" /><text x="200" y="28">{angle}°</text><text x="350" y="222">0°</text></svg>
    <div className="geo-checks"><span>中心已对齐</span><span>零刻度线已对齐</span><strong>读数 {angle}°</strong></div>
  </Shell>;
}

type TriangleKind = '锐角' | '直角' | '钝角';
const triangles: Record<TriangleKind, { points: string; angles: [number, number, number] }> = { 锐角: { points: '95,205 305,205 215,70', angles: [48, 56, 76] }, 直角: { points: '105,205 305,205 105,70', angles: [90, 34, 56] }, 钝角: { points: '70,205 325,205 135,120', angles: [53, 24, 103] } };
function TriangleLab({ onInteract }: Pick<CourseGeometryModelProps, 'onInteract'>) {
  const [kind, setKind] = useState<TriangleKind>('锐角'); const item = triangles[kind];
  return <Shell title="按最大角分类，三个内角始终拼成平角" relation={`${item.angles.join('° + ')}° = 180°`} controls={<div className="segmented-control">{(Object.keys(triangles) as TriangleKind[]).map(k => <button key={k} type="button" className={kind === k ? 'is-active' : ''} onClick={() => { setKind(k); onInteract?.(); }}>{k}三角形</button>)}</div>}>
    <svg className="geo-svg" viewBox="0 0 400 250"><polygon points={item.points} className="geo-shape" /><text x="200" y="32">{kind}三角形</text><text x="55" y="226">{item.angles[0]}°</text><text x="313" y="226">{item.angles[1]}°</text><text x="205" y="62">{item.angles[2]}°</text></svg>
    <div className="geo-angle-sum">{[0, item.angles[0], item.angles[0] + item.angles[1], 180].map((rotation) => <i key={rotation} style={{ transform: `rotate(${-rotation}deg)` }} />)}<strong>180°</strong></div>
  </Shell>;
}

function ParallelogramArea({ onInteract }: Pick<CourseGeometryModelProps, 'onInteract'>) {
  const [step, setStep] = useState(0); const [shift, setShift] = useState(45);
  return <Shell title="把斜出来的三角形移到另一边，面积不变" relation={`S = ${6} × ${4} = 24`} controls={<><Segments value={step} setValue={setStep} labels={['原图', '切开', '补成长方形']} onInteract={onInteract} /><label>斜度 <output>{shift}</output><input type="range" min="20" max="70" value={shift} onChange={e => { setShift(+e.target.value); onInteract?.(); }} /></label></>}>
    <svg className="geo-svg" viewBox="0 0 400 250"><polygon points={`${90 + shift},65 310,65 ${310 - shift},205 90,205`} className="geo-shape" />{step > 0 && <line x1={90 + shift} y1="65" x2={90 + shift} y2="205" className="geo-cut" />}{step === 2 && <polygon points={`${90 + shift},65 ${90 + shift},205 90,205`} className="geo-piece moved" transform={`translate(${220 - shift} 0)`} />}<line x1="90" y1="222" x2="310" y2="222" className="geo-dimension" /><text x="200" y="242">底 6</text><text x="72" y="140">高 4</text></svg><div className="model-proof is-valid"><strong>{step < 2 ? '割补只改变形状，不改变面积' : '长方形的长 = 原来的底，宽 = 原来的高'}</strong></div>
  </Shell>;
}

function PairArea({ type, onInteract }: { type: 'triangle' | 'trapezoid'; onInteract?: () => void }) {
  const [step, setStep] = useState(0); const trapezoid = type === 'trapezoid'; const relation = trapezoid ? 'S = (3 + 7) × 4 ÷ 2 = 20' : 'S = 6 × 4 ÷ 2 = 12';
  const first = trapezoid ? '90,190 270,190 230,80 140,80' : '90,190 290,190 150,80';
  const copied = trapezoid ? '280,190 460,190 420,80 330,80' : '280,190 480,190 340,80';
  const joined = trapezoid ? '230,80 410,80 360,190 270,190' : '150,80 350,80 290,190';
  return <Shell title={trapezoid ? '两个完全相同的梯形拼成平行四边形' : '两个完全相同的三角形拼成平行四边形'} relation={relation} controls={<Segments value={step} setValue={setStep} labels={['一个图形', '复制一个', '旋转拼接']} onInteract={onInteract} />}>
    <svg className="geo-svg" viewBox="0 0 500 250"><polygon points={first} className="geo-shape" />{step > 0 && <polygon points={step === 1 ? copied : joined} className="geo-piece" />}<text x="62" y="138">高 4</text>{trapezoid && <><text x="185" y="68">上底 3</text><text x="180" y="214">下底 7</text></>}</svg><div className="model-proof is-valid"><strong>{step === 2 ? `拼成图形面积是原图的 2 倍，所以 ${trapezoid ? '除以 2' : '三角形面积是底×高的一半'}` : '复制前后两个图形全等，面积相等'}</strong></div>
  </Shell>;
}

function CircleArea({ onInteract }: Pick<CourseGeometryModelProps, 'onInteract'>) {
  const [sectors, setSectors] = useState(12); const radius = 78, cx = 130, cy = 125; const pieces = Array.from({ length: sectors }, (_, i) => { const a1 = 2 * Math.PI * i / sectors - Math.PI / 2, a2 = 2 * Math.PI * (i + 1) / sectors - Math.PI / 2; return `M${cx},${cy} L${cx + radius * Math.cos(a1)},${cy + radius * Math.sin(a1)} A${radius},${radius} 0 0 1 ${cx + radius * Math.cos(a2)},${cy + radius * Math.sin(a2)} Z`; });
  return <Shell title="扇形越细，重排后越接近长方形" relation={`S ≈ (πr) × r = πr²`} controls={<label>扇形数量 <output>{sectors}</output><input type="range" min="8" max="24" step="4" value={sectors} onChange={e => { setSectors(+e.target.value); onInteract?.(); }} /></label>}>
    <svg className="geo-svg circle-rearrange" viewBox="0 0 430 250"><g>{pieces.map((d, i) => <path key={i} d={d} className={i % 2 ? 'geo-sector alt' : 'geo-sector'} />)}</g><g transform="translate(245 72)">{Array.from({ length: sectors }, (_, i) => { const w = 150 / sectors; return <path key={i} d={`M${i * w},${i % 2 ? 68 : 0} L${i * w + w},${i % 2 ? 68 : 0} L${i * w + w / 2},${i % 2 ? 0 : 68} Z`} className={i % 2 ? 'geo-sector alt' : 'geo-sector'} />; })}<text x="75" y="92">底 ≈ πr</text><text x="-12" y="35">高 r</text></g></svg><div className="model-proof is-valid"><strong>{sectors} 等分：上下弧边更平，重排图形更接近长方形</strong></div>
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
