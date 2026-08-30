import { useState, type ReactNode } from 'react';

export type ApplicationModelType =
  | 'g4-bar-chart'
  | 'g5-position'
  | 'g5-tree-planting'
  | 'g3-cycle-pattern'
  | 'g3-systematic-enumeration'
  | 'g4-sum-difference'
  | 'g4-sum-difference-multiple'
  | 'g5-chicken-rabbit';

interface Props { type: ApplicationModelType; onInteract?: () => void }

const modelIds = new Set<string>([
  'g4-bar-chart', 'g5-position', 'g5-tree-planting',
  'g3-cycle-pattern', 'g3-systematic-enumeration',
  'g4-sum-difference', 'g4-sum-difference-multiple', 'g5-chicken-rabbit',
]);
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

function PatternBoard({ type, onInteract }: Pick<Props, 'onInteract'> & { type: 'cycle' | 'enumeration' }) {
  const [first, setFirst] = useState(type === 'cycle' ? 4 : 3);
  const [second, setSecond] = useState(type === 'cycle' ? 11 : 2);
  if (type === 'cycle') {
    const symbols = ['红', '黄', '蓝', '绿', '紫', '橙'].slice(0, first);
    const remainder = second % first;
    const answer = symbols[(second - 1) % first];
    return <Shell title="把重复的一段圈成一组，再用余数定位" result={`第 ${second} 个是${answer}`} controls={<><label>每组数量 <output>{first}</output><input type="range" min="3" max="6" value={first} onChange={e => { setFirst(Number(e.target.value)); onInteract?.(); }}/></label><label>要找的位置 <output>{second}</output><input type="range" min="7" max="24" value={second} onChange={e => { setSecond(Number(e.target.value)); onInteract?.(); }}/></label></>}>
      <div className="flex flex-wrap justify-center gap-2 py-8" aria-label={`按${symbols.join('、')}循环排列，第${second}个是${answer}`}>{Array.from({ length: second }, (_, index) => <span key={index} className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${index === second - 1 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}>{symbols[index % first]}</span>)}</div>
      <div className="model-proof is-valid"><strong>{second} ÷ {first} 的余数是 {remainder}；{remainder === 0 ? `正好落在一组最后一个` : `落在每组第 ${remainder} 个`}</strong></div>
    </Shell>;
  }
  const colors = ['红', '蓝', '黄', '绿'].slice(0, first);
  const shapes = ['圆', '方', '三角', '星'].slice(0, second);
  return <Shell title="先固定一种颜色，再把所有形状依次配完" result={`${first} × ${second} = ${first * second} 种`} controls={<><label>颜色数 <output>{first}</output><input type="range" min="2" max="4" value={first} onChange={e => { setFirst(Number(e.target.value)); onInteract?.(); }}/></label><label>形状数 <output>{second}</output><input type="range" min="2" max="4" value={second} onChange={e => { setSecond(Number(e.target.value)); onInteract?.(); }}/></label></>}>
    <div className="grid grid-cols-2 gap-2 py-6 sm:grid-cols-4" aria-label={`${first}种颜色和${second}种形状共有${first * second}种搭配`}>{colors.flatMap(color => shapes.map(shape => <span key={`${color}-${shape}`} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-center text-sm font-semibold text-indigo-700">{color}{shape}</span>))}</div>
    <div className="model-proof is-valid"><strong>固定颜色逐行列出，每行 {second} 种，共 {first} 行，不重也不漏</strong></div>
  </Shell>;
}

function QuantityBars({ type, onInteract }: Pick<Props, 'onInteract'> & { type: 'sum-difference' | 'multiple' | 'chicken-rabbit' }) {
  const [first, setFirst] = useState(type === 'sum-difference' ? 60 : type === 'multiple' ? 10 : 12);
  const [second, setSecond] = useState(type === 'sum-difference' ? 12 : type === 'multiple' ? 3 : 5);
  if (type === 'chicken-rabbit') {
    const rabbits = Math.min(second, first);
    const chickens = first - rabbits;
    const feet = chickens * 2 + rabbits * 4;
    return <Shell title="先假设全是鸡，每替换一只兔就多 2 只脚" result={`${first} 个头 · ${feet} 只脚`} controls={<><label>总头数 <output>{first}</output><input type="range" min="8" max="18" value={first} onChange={e => { const value = Number(e.target.value); setFirst(value); setSecond(current => Math.min(current, value)); onInteract?.(); }}/></label><label>其中兔数 <output>{rabbits}</output><input type="range" min="1" max={first} value={rabbits} onChange={e => { setSecond(Number(e.target.value)); onInteract?.(); }}/></label></>}>
      <div className="flex flex-wrap justify-center gap-2 py-8" aria-label={`${chickens}只鸡和${rabbits}只兔`}>{Array.from({ length: first }, (_, index) => <span key={index} className={`rounded-lg px-3 py-2 text-sm font-bold ${index < rabbits ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>{index < rabbits ? '兔 4脚' : '鸡 2脚'}</span>)}</div>
      <div className="model-proof is-valid"><strong>全是鸡有 {first * 2} 只脚，多出的 {feet - first * 2} 只脚 ÷ 2 = {rabbits} 只兔</strong></div>
    </Shell>;
  }
  if (type === 'multiple') {
    const small = first, large = first * second;
    return <Shell title="把较小量看作 1 份，较大量就是几份" result={`${small} 与 ${large} · ${second} 倍`} controls={<><label>一倍量 <output>{first}</output><input type="range" min="6" max="18" value={first} onChange={e => { setFirst(Number(e.target.value)); onInteract?.(); }}/></label><label>倍数 <output>{second}</output><input type="range" min="2" max="5" value={second} onChange={e => { setSecond(Number(e.target.value)); onInteract?.(); }}/></label></>}>
      <div className="space-y-4 py-8"><div className="h-10 rounded bg-sky-300" style={{ width: `${100 / second}%` }} aria-label={`较小量${small}`}/><div className="flex gap-1">{Array.from({ length: second }, (_, index) => <span key={index} className="h-10 flex-1 rounded bg-indigo-400" aria-label={`第${index + 1}份，每份${small}`}/>)}</div></div>
      <div className="model-proof is-valid"><strong>和是 {small + large}，差是 {large - small}；都由一倍量 {small} 组成</strong></div>
    </Shell>;
  }
  const total = first, difference = Math.min(second, first - 2);
  const small = (total - difference) / 2, large = small + difference;
  return <Shell title="先从总量里去掉差，剩下两份同样多" result={`${large} 与 ${small}`} controls={<><label>总量 <output>{first}</output><input type="range" min="40" max="80" step="2" value={first} onChange={e => { setFirst(Number(e.target.value)); onInteract?.(); }}/></label><label>相差 <output>{difference}</output><input type="range" min="2" max="20" step="2" value={difference} onChange={e => { setSecond(Number(e.target.value)); onInteract?.(); }}/></label></>}>
    <div className="space-y-4 py-8"><div className="flex"><span className="h-10 bg-indigo-400" style={{ width: `${small / large * 72}%` }}/><span className="h-10 bg-amber-300" style={{ width: `${difference / large * 72}%` }}/></div><div className="h-10 bg-sky-300" style={{ width: `${small / large * 72}%` }}/></div>
    <div className="model-proof is-valid"><strong>较小量 =（{total} − {difference}）÷ 2 = {small}；较大量 = {large}</strong></div>
  </Shell>;
}

export default function CourseApplicationModel({ type, onInteract }: Props) {
  switch (type) {
    case 'g4-bar-chart': return <BarChartBuild onInteract={onInteract}/>;
    case 'g5-position': return <CoordinatePosition onInteract={onInteract}/>;
    case 'g5-tree-planting': return <TreePlanting onInteract={onInteract}/>;
    case 'g3-cycle-pattern': return <PatternBoard type="cycle" onInteract={onInteract}/>;
    case 'g3-systematic-enumeration': return <PatternBoard type="enumeration" onInteract={onInteract}/>;
    case 'g4-sum-difference': return <QuantityBars type="sum-difference" onInteract={onInteract}/>;
    case 'g4-sum-difference-multiple': return <QuantityBars type="multiple" onInteract={onInteract}/>;
    case 'g5-chicken-rabbit': return <QuantityBars type="chicken-rabbit" onInteract={onInteract}/>;
  }
}
