import { useMemo, useState, type ReactNode } from 'react';

export type CourseMasteryModelCType =
  | 'g5-cuboid-surface'
  | 'g5-cuboid-volume'
  | 'g5-equation'
  | 'g6-circle-area'
  | 'g6-cone-volume'
  | 'g6-cylinder-surface'
  | 'g6-sector-chart';

export interface CourseMasteryModelCProps {
  type: CourseMasteryModelCType;
  onInteract?: () => void;
}

const modelTypes = new Set<string>([
  'g5-cuboid-surface', 'g5-cuboid-volume', 'g5-equation', 'g6-circle-area',
  'g6-cone-volume', 'g6-cylinder-surface', 'g6-sector-chart',
]);

// The guard intentionally lives beside the switch so their supported IDs cannot drift apart.
// oxlint-disable-next-line react/only-export-components
export function isCourseMasteryModelCType(type: string): type is CourseMasteryModelCType {
  return modelTypes.has(type);
}

function Shell({ title, result, invariant, controls, children }: {
  title: string;
  result: string;
  invariant: string;
  controls: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="math-model mastery-model-c">
      <div className="math-model__head"><span><i className="signal-dot is-live" />动手试</span><strong>{result}</strong></div>
      <div className="math-model__canvas">
        <h3>{title}</h3>
        {children}
        <div className="model-proof is-valid"><span>始终成立</span><strong>{invariant}</strong></div>
      </div>
      <div className="model-controls">{controls}</div>
    </div>
  );
}

function CuboidSurface({ onInteract }: Pick<CourseMasteryModelCProps, 'onInteract'>) {
  const [length, setLength] = useState(4);
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(2);
  const [hasLid, setHasLid] = useState(true);
  const bottom = length * width;
  const front = length * height;
  const side = width * height;
  const surface = bottom * (hasLid ? 2 : 1) + front * 2 + side * 2;
  const s = 13;
  const x = 190 - length * s / 2;
  const y = 105;
  const face = (key: string, fx: number, fy: number, fw: number, fh: number, color: string, label: string, opacity = 1) => (
    <g key={key} opacity={opacity}><rect x={fx} y={fy} width={fw} height={fh} rx="2" fill={color} stroke="#334155" strokeWidth="1.4" /><text x={fx + fw / 2} y={fy + fh / 2 + 4} textAnchor="middle" fontSize="11" fill="#172033">{label}</text></g>
  );
  return (
    <Shell title="把六个面摊平，对面面积相等；无盖时只去掉一个长×宽" result={`S = ${surface} 平方单位`} invariant={`${hasLid ? '2' : '1'}×${length}×${width} + 2×${length}×${height} + 2×${width}×${height} = ${surface}`}
      controls={<><div className="segmented-control"><button type="button" className={hasLid ? 'is-active' : ''} onClick={() => { setHasLid(true); onInteract?.(); }}>有盖</button><button type="button" className={!hasLid ? 'is-active' : ''} onClick={() => { setHasLid(false); onInteract?.(); }}>无盖</button></div><label>长 <output>{length}</output><input type="range" min="2" max="6" value={length} onChange={(e) => { setLength(Number(e.target.value)); onInteract?.(); }} /></label><label>宽 <output>{width}</output><input type="range" min="2" max="5" value={width} onChange={(e) => { setWidth(Number(e.target.value)); onInteract?.(); }} /></label><label>高 <output>{height}</output><input type="range" min="1" max="4" value={height} onChange={(e) => { setHeight(Number(e.target.value)); onInteract?.(); }} /></label></>}>
      <svg viewBox="0 0 380 250" role="img" aria-label={`${hasLid ? '有盖' : '无盖'}长方体六面展开图，表面积${surface}`} style={{ width: '100%', maxHeight: 290 }}>
        {face('bottom', x, y, length * s, width * s, '#bfdbfe', `底 ${bottom}`)}
        {face('top', x, y - width * s - height * s, length * s, width * s, '#bfdbfe', `盖 ${bottom}`, hasLid ? 1 : 0.18)}
        {face('front', x, y - height * s, length * s, height * s, '#bbf7d0', `前 ${front}`)}
        {face('back', x, y + width * s, length * s, height * s, '#bbf7d0', `后 ${front}`)}
        {face('left', x - height * s, y, height * s, width * s, '#fde68a', `左 ${side}`)}
        {face('right', x + length * s, y, height * s, width * s, '#fde68a', `右 ${side}`)}
        {!hasLid && <text x="190" y="25" textAnchor="middle" fontSize="12" fill="#b45309">无盖：淡化的上底不计入表面积</text>}
      </svg>
    </Shell>
  );
}

function CuboidVolume({ onInteract }: Pick<CourseMasteryModelCProps, 'onInteract'>) {
  const length = 4;
  const width = 3;
  const height = 4;
  const [layers, setLayers] = useState(1);
  const perLayer = length * width;
  const filled = perLayer * layers;
  return (
    <Shell title="先数每层单位立方体，再数有多少层" result={`${perLayer} × ${layers} = ${filled} 个单位立方体`} invariant={`每层 ${length}×${width}=${perLayer} 个；装满 ${height} 层时 V=${length}×${width}×${height}=${perLayer * height}`}
      controls={<label>已填充 <output>{layers} / {height} 层</output><input type="range" min="1" max={height} value={layers} onChange={(e) => { setLayers(Number(e.target.value)); onInteract?.(); }} /></label>}>
      <svg viewBox="0 0 380 260" role="img" aria-label={`${layers}层，每层${perLayer}个，共${filled}个单位立方体`} style={{ width: '100%', maxHeight: 300 }}>
        {Array.from({ length: layers }, (_, layer) => Array.from({ length: width }, (_, row) => Array.from({ length }, (_, col) => {
          const px = 100 + col * 35 + row * 14;
          const py = 205 - layer * 32 - row * 10;
          return <g key={`${layer}-${row}-${col}`}><polygon points={`${px},${py} ${px + 28},${py} ${px + 38},${py - 8} ${px + 10},${py - 8}`} fill="#bfdbfe" stroke="#334155"/><polygon points={`${px},${py} ${px + 10},${py - 8} ${px + 10},${py - 34} ${px},${py - 26}`} fill="#dbeafe" stroke="#334155"/><polygon points={`${px},${py} ${px + 28},${py} ${px + 28},${py - 26} ${px},${py - 26}`} fill="#93c5fd" stroke="#334155"/></g>;
        })))}
        <text x="190" y="245" textAnchor="middle" fontSize="13" fill="#334155">{layers} 层 × 每层 {perLayer} 个 = {filled} 个</text>
      </svg>
    </Shell>
  );
}

function EquationBalance({ onInteract }: Pick<CourseMasteryModelCProps, 'onInteract'>) {
  const [step, setStep] = useState(0);
  const states = [
    { left: '2x + 4', right: '12', operation: '两边同时减 4', relation: '2x + 4 = 12' },
    { left: '2x', right: '8', operation: '两边同时除以 2', relation: '2x = 8' },
    { left: 'x', right: '4', operation: '重新开始', relation: 'x = 4' },
  ];
  const current = states[step];
  return (
    <Shell title="天平保持平衡的条件：等式两边必须执行完全相同的操作" result={current.relation} invariant="左边的值始终等于右边的值；解得 x = 4"
      controls={<><button type="button" className="primary-control" onClick={() => { setStep((step + 1) % states.length); onInteract?.(); }}>{current.operation}</button><span aria-live="polite">第 {step + 1} 步 / 3</span></>}>
      <svg viewBox="0 0 380 230" role="img" aria-label={`平衡天平，${current.relation}`} style={{ width: '100%', maxHeight: 270 }}>
        <line x1="75" y1="85" x2="305" y2="85" stroke="#4f46e5" strokeWidth="5" strokeLinecap="round"/>
        <polygon points="175,205 205,205 190,85" fill="#94a3b8"/><line x1="190" y1="85" x2="190" y2="205" stroke="#64748b" strokeWidth="4"/>
        <line x1="95" y1="85" x2="95" y2="125" stroke="#64748b"/><line x1="285" y1="85" x2="285" y2="125" stroke="#64748b"/>
        <path d="M45 125 Q95 165 145 125 Z" fill="#dbeafe" stroke="#4f46e5" strokeWidth="2"/><path d="M235 125 Q285 165 335 125 Z" fill="#dbeafe" stroke="#4f46e5" strokeWidth="2"/>
        <text x="95" y="120" textAnchor="middle" fontSize="20" fontWeight="700" fill="#172033">{current.left}</text><text x="285" y="120" textAnchor="middle" fontSize="20" fontWeight="700" fill="#172033">{current.right}</text>
        <text x="190" y="32" textAnchor="middle" fontSize="14" fill="#15803d">两边同操作，横梁始终水平</text>
      </svg>
    </Shell>
  );
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  const rad = (angle - 90) * Math.PI / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function CircleArea({ onInteract }: Pick<CourseMasteryModelCProps, 'onInteract'>) {
  const options = [8, 16, 32, 64];
  const [index, setIndex] = useState(1);
  const sectors = options[index];
  const radius = 68;
  const sectorPaths = Array.from({ length: sectors }, (_, i) => {
    const a = polar(95, 105, radius, i * 360 / sectors);
    const b = polar(95, 105, radius, (i + 1) * 360 / sectors);
    return `M95 105 L${a.x} ${a.y} A${radius} ${radius} 0 0 1 ${b.x} ${b.y} Z`;
  });
  const tooth = Math.PI * radius / (sectors / 2);
  const top = Array.from({ length: sectors / 2 + 1 }, (_, i) => `${210 + i * tooth},${i % 2 === 0 ? 70 : 61}`).join(' ');
  const bottom = Array.from({ length: sectors / 2 + 1 }, (_, i) => `${210 + (sectors / 2 - i) * tooth},${i % 2 === 0 ? 138 : 147}`).join(' ');
  return (
    <Shell title="把圆等分后交错排列；份数越多，弧边越接近直线" result={`S ≈ πr × r = πr²（${sectors} 等分）`} invariant="重排只移动扇形，不增不减面积；近似长方形的长趋近 πr、宽趋近 r"
      controls={<div className="segmented-control">{options.map((count, i) => <button key={count} type="button" className={index === i ? 'is-active' : ''} onClick={() => { setIndex(i); onInteract?.(); }}>{count} 等分</button>)}</div>}>
      <svg viewBox="0 0 450 220" role="img" aria-label={`圆被分成${sectors}个扇形并重排为近似长方形`} style={{ width: '100%', maxHeight: 280 }}>
        {sectorPaths.map((path, i) => <path key={path} d={path} fill={i % 2 ? '#93c5fd' : '#a7f3d0'} stroke="#fff" strokeWidth="0.8"/>)}
        <polygon points={`${top} ${bottom}`} fill="#bfdbfe" stroke="#4f46e5" strokeWidth="1.5"/>
        <line x1="210" y1="170" x2={210 + Math.PI * radius} y2="170" stroke="#b45309" strokeWidth="2"/><text x={210 + Math.PI * radius / 2} y="190" textAnchor="middle" fontSize="12">长 → πr</text>
        <line x1="420" y1="65" x2="420" y2="143" stroke="#15803d" strokeWidth="2"/><text x="428" y="108" fontSize="12">r</text>
      </svg>
    </Shell>
  );
}

function ConeVolume({ onInteract }: Pick<CourseMasteryModelCProps, 'onInteract'>) {
  const [pours, setPours] = useState(0);
  const level = pours / 3;
  return (
    <Shell title="同底等高的圆锥装满水，每次恰好装圆柱的三分之一" result={`${pours} 次圆锥水量 = 圆柱的 ${pours}/3`} invariant="同底等高时，3 × V圆锥 = V圆柱，所以 V圆锥 = ⅓πr²h"
      controls={<div className="stepper"><button type="button" aria-label="倒掉一次" disabled={pours === 0} onClick={() => { setPours(Math.max(0, pours - 1)); onInteract?.(); }}>−</button><output>{pours} / 3 次</output><button type="button" aria-label="倒入一次" disabled={pours === 3} onClick={() => { setPours(Math.min(3, pours + 1)); onInteract?.(); }}>＋</button></div>}>
      <svg viewBox="0 0 400 250" role="img" aria-label={`圆锥向同底等高圆柱灌水${pours}次，圆柱填充${pours}/3`} style={{ width: '100%', maxHeight: 290 }}>
        <path d="M55 190 L110 50 L165 190 Z" fill="#dbeafe" stroke="#4f46e5" strokeWidth="2"/><ellipse cx="110" cy="190" rx="55" ry="14" fill="#93c5fd" stroke="#4f46e5" strokeWidth="2"/><text x="110" y="225" textAnchor="middle">量杯：1 个圆锥</text>
        <rect x="235" y="50" width="110" height="140" fill="#f8fafc" stroke="#4f46e5" strokeWidth="2"/>
        {pours > 0 && <><rect x="236" y={190 - 140 * level} width="108" height={140 * level} fill="#7dd3fc"/><ellipse cx="290" cy={190 - 140 * level} rx="54" ry="12" fill="#bae6fd"/></>}
        <ellipse cx="290" cy="50" rx="55" ry="14" fill="none" stroke="#4f46e5" strokeWidth="2"/><ellipse cx="290" cy="190" rx="55" ry="14" fill="#e0f2fe" stroke="#4f46e5" strokeWidth="2"/>
        {[1, 2].map((n) => <g key={n}><line x1="235" y1={190 - 140 * n / 3} x2="345" y2={190 - 140 * n / 3} stroke="#0284c7" strokeDasharray="4 4"/><text x="355" y={194 - 140 * n / 3} fontSize="12">{n}/3</text></g>)}
      </svg>
    </Shell>
  );
}

function CylinderSurface({ onInteract }: Pick<CourseMasteryModelCProps, 'onInteract'>) {
  const [radius, setRadius] = useState(2);
  const [height, setHeight] = useState(4);
  const circumference = 2 * Math.PI * radius;
  const surface = 2 * Math.PI * radius * radius + circumference * height;
  const scale = 12;
  const rectWidth = circumference * scale;
  return (
    <Shell title="沿高剪开侧面：长方形的长严格等于底面圆周，宽等于高" result={`S = ${surface.toFixed(2)} 平方单位`} invariant={`侧面长 ${circumference.toFixed(2)} = 2πr；总面积 = 2πr² + 2πrh`}
      controls={<><label>半径 r <output>{radius}</output><input type="range" min="1" max="4" value={radius} onChange={(e) => { setRadius(Number(e.target.value)); onInteract?.(); }} /></label><label>高 h <output>{height}</output><input type="range" min="2" max="8" value={height} onChange={(e) => { setHeight(Number(e.target.value)); onInteract?.(); }} /></label></>}>
      <svg viewBox="0 0 440 270" role="img" aria-label={`圆柱侧面展开成长${circumference.toFixed(2)}、宽${height}的长方形，并有两个底面`} style={{ width: '100%', maxHeight: 310 }}>
        <rect x={(440 - rectWidth) / 2} y="80" width={rectWidth} height={height * scale} fill="#bfdbfe" stroke="#4f46e5" strokeWidth="2"/>
        <text x="220" y={75 + height * scale / 2} textAnchor="middle" fontSize="14">侧面积 = 2πr × h</text>
        <line x1={(440 - rectWidth) / 2} y1="65" x2={(440 + rectWidth) / 2} y2="65" stroke="#b45309" strokeWidth="2"/><text x="220" y="52" textAnchor="middle" fontSize="12">长 = 底面周长 = {circumference.toFixed(2)}</text>
        <circle cx={170 - radius * scale} cy="210" r={radius * scale} fill="#a7f3d0" stroke="#15803d" strokeWidth="2"/><circle cx={270 + radius * scale} cy="210" r={radius * scale} fill="#a7f3d0" stroke="#15803d" strokeWidth="2"/>
        <text x="220" y="260" textAnchor="middle" fontSize="12">两个底面：2 × π × {radius}²</text>
      </svg>
    </Shell>
  );
}

function SectorChart({ onInteract }: Pick<CourseMasteryModelCProps, 'onInteract'>) {
  const [first, setFirst] = useState(12);
  const [stage, setStage] = useState<'count' | 'percent' | 'angle'>('count');
  const values = useMemo(() => [first, 8, 5, 15], [first]);
  const labels = ['阅读', '运动', '音乐', '其他'];
  const colors = ['#4f46e5', '#0891b2', '#16a34a', '#f59e0b'];
  const total = values.reduce((sum, value) => sum + value, 0);
  const displayedPercents = values.map((value, index) => index < values.length - 1
    ? Number((value / total * 100).toFixed(1))
    : Number((100 - values.slice(0, -1).reduce((sum, item) => sum + Number((item / total * 100).toFixed(1)), 0)).toFixed(1)));
  const displayedAngles = values.map((value, index) => index < values.length - 1
    ? Number((value / total * 360).toFixed(1))
    : Number((360 - values.slice(0, -1).reduce((sum, item) => sum + Number((item / total * 360).toFixed(1)), 0)).toFixed(1)));
  let angle = 0;
  const paths = values.map((value) => {
    const start = angle;
    angle += value / total * 360;
    const a = polar(125, 125, 84, start);
    const b = polar(125, 125, 84, angle);
    return `M125 125 L${a.x} ${a.y} A84 84 0 ${angle - start > 180 ? 1 : 0} 1 ${b.x} ${b.y} Z`;
  });
  const percentSum = values.reduce((sum, value) => sum + value / total * 100, 0);
  const angleSum = values.reduce((sum, value) => sum + value / total * 360, 0);
  return (
    <Shell title="每一类先除以总数得到占比，再乘 360° 得到圆心角" result={`总数 ${total} · ${percentSum.toFixed(0)}% · ${angleSum.toFixed(0)}°`} invariant="各类数量之和对应整个圆；百分比和 = 100%，圆心角和 = 360°"
      controls={<><div className="segmented-control">{(['count', 'percent', 'angle'] as const).map((item) => <button key={item} type="button" className={stage === item ? 'is-active' : ''} onClick={() => { setStage(item); onInteract?.(); }}>{item === 'count' ? '原始数量' : item === 'percent' ? '换成百分比' : '换成圆心角'}</button>)}</div><label>阅读人数 <output>{first}</output><input type="range" min="4" max="20" value={first} onChange={(e) => { setFirst(Number(e.target.value)); onInteract?.(); }} /></label></>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) minmax(180px, 1fr)', gap: 16, alignItems: 'center' }}>
        <svg viewBox="0 0 250 250" role="img" aria-label={`扇形统计图，总数${total}`} style={{ width: '100%', maxHeight: 260 }}>{paths.map((path, i) => <path key={labels[i]} d={path} fill={colors[i]} stroke="#fff" strokeWidth="2"/>)}</svg>
        <div>{values.map((value, i) => <p key={labels[i]} style={{ display: 'grid', gridTemplateColumns: '12px 1fr auto', gap: 8, alignItems: 'center', margin: '8px 0' }}><i style={{ width: 12, height: 12, background: colors[i], borderRadius: 2 }}/><span>{labels[i]}</span><strong>{stage === 'count' ? `${value} 人` : stage === 'percent' ? `${displayedPercents[i].toFixed(1)}%` : `${displayedAngles[i].toFixed(1)}°`}</strong></p>)}</div>
      </div>
    </Shell>
  );
}

export default function CourseMasteryModelC({ type, onInteract }: CourseMasteryModelCProps) {
  switch (type) {
    case 'g5-cuboid-surface': return <CuboidSurface onInteract={onInteract} />;
    case 'g5-cuboid-volume': return <CuboidVolume onInteract={onInteract} />;
    case 'g5-equation': return <EquationBalance onInteract={onInteract} />;
    case 'g6-circle-area': return <CircleArea onInteract={onInteract} />;
    case 'g6-cone-volume': return <ConeVolume onInteract={onInteract} />;
    case 'g6-cylinder-surface': return <CylinderSurface onInteract={onInteract} />;
    case 'g6-sector-chart': return <SectorChart onInteract={onInteract} />;
  }
}
