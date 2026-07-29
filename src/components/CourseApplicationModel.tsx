import { useState, type ReactNode } from 'react';

export type ApplicationModelType = 'g4-bar-chart' | 'g5-position' | 'g5-tree-planting';

interface Props { type: ApplicationModelType; onInteract?: () => void }

const modelIds = new Set<string>(['g4-bar-chart', 'g5-position', 'g5-tree-planting']);
export function isApplicationModelType(id: string): id is ApplicationModelType { return modelIds.has(id); }

function Shell({ title, result, controls, children }: { title: string; result: string; controls: ReactNode; children: ReactNode }) {
  return <div className="math-model application-model"><div className="math-model__head"><span><i className="signal-dot is-live" />数据实验</span><strong>{result}</strong></div><div className="math-model__canvas"><h3>{title}</h3>{children}</div><div className="model-controls">{controls}</div></div>;
}

function BarChartBuild({ onInteract }: Pick<Props, 'onInteract'>) {
  const values = [6, 10, 4, 8];
  const labels = ['一组', '二组', '三组', '四组'];
  const [shown, setShown] = useState(1);
  const [unit, setUnit] = useState(1);
  const maxTick = 10;
  return <Shell title="从原始数据出发：统一刻度，再让柱高准确对应数量" result={`每格 ${unit} 人 · 已绘制 ${shown}/4 根`} controls={<><label>逐柱绘制 <output>{shown} 根</output><input type="range" min="1" max="4" value={shown} onChange={e => { setShown(Number(e.target.value)); onInteract?.(); }} /></label><div className="segmented-control"><button type="button" className={unit === 1 ? 'is-active' : ''} onClick={() => { setUnit(1); onInteract?.(); }}>每格1人</button><button type="button" className={unit === 2 ? 'is-active' : ''} onClick={() => { setUnit(2); onInteract?.(); }}>每格2人</button></div></>}>
    <div className="data-source-row">{values.map((value, index) => <span key={labels[index]}><b>{labels[index]}</b>{value} 人</span>)}</div>
    <svg className="application-svg" viewBox="0 0 430 260" role="img" aria-label={`条形统计图，每格${unit}人，已画${shown}根柱`}>
      {Array.from({ length: maxTick / unit + 1 }, (_, index) => { const value = index * unit; const y = 220 - value * 17; return <g key={value}><line x1="55" y1={y} x2="405" y2={y} className="chart-gridline"/><text x="42" y={y + 4} textAnchor="end">{value}</text></g>; })}
      <line x1="55" y1="30" x2="55" y2="220" className="chart-axis"/><line x1="55" y1="220" x2="405" y2="220" className="chart-axis"/>
      {values.map((value, index) => <g key={labels[index]} opacity={index < shown ? 1 : 0.12}><rect x={82 + index * 82} y={220 - value * 17} width="42" height={value * 17} className="chart-bar"/><text x={103 + index * 82} y={212 - value * 17} textAnchor="middle">{value}</text><text x={103 + index * 82} y="242" textAnchor="middle">{labels[index]}</text></g>)}
    </svg>
    <div className="model-proof is-valid"><strong>改成每格 {unit} 人后，刻度标签改变，但四组原始人数不能改变</strong></div>
  </Shell>;
}

function CoordinatePosition({ onInteract }: Pick<Props, 'onInteract'>) {
  const [column, setColumn] = useState(3);
  const [row, setRow] = useState(4);
  const ox = 65, oy = 225, step = 42;
  return <Shell title="先沿横轴找到第几列，再沿纵轴找到第几行" result={`A（${column}, ${row}）`} controls={<><label>列（横向） <output>{column}</output><input type="range" min="1" max="7" value={column} onChange={e => { setColumn(Number(e.target.value)); onInteract?.(); }} /></label><label>行（纵向） <output>{row}</output><input type="range" min="1" max="5" value={row} onChange={e => { setRow(Number(e.target.value)); onInteract?.(); }} /></label></>}>
    <svg className="application-svg coordinate-lab" viewBox="0 0 430 270" role="img" aria-label={`点A在第${column}列第${row}行，数对${column},${row}`}>
      {Array.from({ length: 8 }, (_, index) => <g key={`x${index}`}><line x1={ox + index * step} y1="15" x2={ox + index * step} y2={oy} className="coordinate-gridline"/><text x={ox + index * step} y="248" textAnchor="middle">{index}</text></g>)}
      {Array.from({ length: 6 }, (_, index) => <g key={`y${index}`}><line x1={ox} y1={oy - index * step} x2="380" y2={oy - index * step} className="coordinate-gridline"/><text x="48" y={oy - index * step + 4} textAnchor="end">{index}</text></g>)}
      <line x1={ox + column * step} y1={oy} x2={ox + column * step} y2={oy - row * step} className="coordinate-projection"/><line x1={ox} y1={oy - row * step} x2={ox + column * step} y2={oy - row * step} className="coordinate-projection"/>
      <circle cx={ox + column * step} cy={oy - row * step} r="9" className="coordinate-point"/><text x={ox + column * step + 16} y={oy - row * step - 12}>A（{column}, {row}）</text>
    </svg>
    <div className="model-proof is-valid"><strong>数对顺序不能交换：第一个数锁定列，第二个数锁定行</strong></div>
  </Shell>;
}

type PlantingMode = 'both' | 'one' | 'closed';
function TreePlanting({ onInteract }: Pick<Props, 'onInteract'>) {
  const [intervals, setIntervals] = useState(5);
  const [mode, setMode] = useState<PlantingMode>('both');
  const count = mode === 'both' ? intervals + 1 : mode === 'one' ? intervals : intervals;
  const positions = mode === 'both' ? Array.from({ length: intervals + 1 }, (_, i) => i) : mode === 'one' ? Array.from({ length: intervals }, (_, i) => i) : Array.from({ length: intervals }, (_, i) => i);
  return <Shell title="先数相邻两棵树之间的间隔，再看端点是否重合或种树" result={`${intervals} 个间隔 → ${count} 棵树`} controls={<><div className="segmented-control"><button type="button" className={mode === 'both' ? 'is-active' : ''} onClick={() => { setMode('both'); onInteract?.(); }}>两端都种</button><button type="button" className={mode === 'one' ? 'is-active' : ''} onClick={() => { setMode('one'); onInteract?.(); }}>一端种</button><button type="button" className={mode === 'closed' ? 'is-active' : ''} onClick={() => { setMode('closed'); onInteract?.(); }}>封闭一圈</button></div><label>间隔数 <output>{intervals}</output><input type="range" min="3" max="8" value={intervals} onChange={e => { setIntervals(Number(e.target.value)); onInteract?.(); }} /></label></>}>
    {mode === 'closed' ? <svg className="application-svg planting-lab" viewBox="0 0 430 250" role="img" aria-label={`封闭路线${intervals}个间隔${count}棵树`}><circle cx="215" cy="125" r="82" className="planting-route"/>{positions.map(index => { const angle = index * Math.PI * 2 / intervals - Math.PI / 2; return <g key={index} transform={`translate(${215 + Math.cos(angle) * 82} ${125 + Math.sin(angle) * 82})`}><circle r="10" className="tree-dot"/><text y="-16" textAnchor="middle">树</text></g>; })}<text x="215" y="130" textAnchor="middle">首尾重合</text></svg> : <svg className="application-svg planting-lab" viewBox="0 0 430 230" role="img" aria-label={`直线${intervals}个间隔${count}棵树`}><line x1="50" y1="125" x2="380" y2="125" className="planting-route"/>{Array.from({ length: intervals }, (_, index) => <text key={index} x={50 + (index + .5) * 330 / intervals} y="160" textAnchor="middle">间隔{index + 1}</text>)}{positions.map(index => <g key={index} transform={`translate(${50 + index * 330 / intervals} 125)`}><circle r="10" className="tree-dot"/><text y="-18" textAnchor="middle">树</text></g>)}</svg>}
    <div className="model-proof is-valid"><strong>{mode === 'both' ? '两端都种：棵数 = 间隔数 + 1' : mode === 'one' ? '只种一端：棵数 = 间隔数' : '封闭路线首尾相接：棵数 = 间隔数'}</strong></div>
  </Shell>;
}

export default function CourseApplicationModel({ type, onInteract }: Props) {
  switch (type) {
    case 'g4-bar-chart': return <BarChartBuild onInteract={onInteract}/>;
    case 'g5-position': return <CoordinatePosition onInteract={onInteract}/>;
    case 'g5-tree-planting': return <TreePlanting onInteract={onInteract}/>;
  }
}
