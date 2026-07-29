import { useState } from 'react';
import type { VizType } from '@/lib/types';

type AdvancedModelType = Extract<VizType,
  | 'place-value-product'
  | 'perimeter-walk'
  | 'operation-laws'
  | 'partial-products'
  | 'fraction-common-parts'
  | 'circle-roll'
  | 'cylinder-layers'>;

interface Props { type: AdvancedModelType; onInteract?: () => void }

const advancedTypes = new Set<VizType>(['place-value-product','perimeter-walk','operation-laws','partial-products','fraction-common-parts','circle-roll','cylinder-layers']);
export function isAdvancedModelType(type: VizType): type is AdvancedModelType { return advancedTypes.has(type); }

function Shell({ title, result, controls, children }: { title: string; result: string; controls: React.ReactNode; children: React.ReactNode }) {
  return <div className="math-model advanced-model"><div className="math-model__head"><span><i className="signal-dot is-live"/>动手试</span><strong>{result}</strong></div><div className="math-model__canvas"><h3>{title}</h3>{children}</div><div className="model-controls">{controls}</div></div>;
}

function PlaceValueProduct({ onInteract }: Pick<Props,'onInteract'>) {
  const [multiplier,setMultiplier]=useState(3); const number=234; const parts=[200,30,4]; const products=parts.map(v=>v*multiplier);
  return <Shell title="把多位数按数位拆开，每一部分都乘同一个数" result={`${number} × ${multiplier} = ${number*multiplier}`} controls={<label>一位数乘数 <output>{multiplier}</output><input type="range" min="2" max="5" value={multiplier} onChange={e=>{setMultiplier(Number(e.target.value));onInteract?.();}}/></label>}><div className="place-product"><div className="place-product__parts">{parts.map((part,index)=><div key={part}><span>{['百','十','个'][index]}位</span><strong>{part}</strong><i>× {multiplier}</i><b>{products[index]}</b></div>)}</div><div className="model-proof is-valid"><strong>{products.join(' + ')} = {number*multiplier}</strong></div></div></Shell>;
}

function PerimeterWalk({ onInteract }: Pick<Props,'onInteract'>) {
  const [length,setLength]=useState(6); const [width,setWidth]=useState(3); const perimeter=2*(length+width);
  return <Shell title="周长是沿边界走一圈，不是图形里面有多少格" result={`C = ${length}×2 + ${width}×2 = ${perimeter}`} controls={<><label>长 <output>{length}</output><input type="range" min="3" max="9" value={length} onChange={e=>{setLength(Number(e.target.value));onInteract?.();}}/></label><label>宽 <output>{width}</output><input type="range" min="2" max="6" value={width} onChange={e=>{setWidth(Number(e.target.value));onInteract?.();}}/></label></>}><svg className="perimeter-svg" viewBox="0 0 500 260"><rect x="90" y="50" width={length*42} height={width*35}/><text x={90+length*21} y="38">长 {length}</text><text x="60" y={50+width*18}>宽 {width}</text><circle cx="90" cy="50" r="8"/><path d={`M90 50 H${90+length*42} V${50+width*35} H90 Z`}/></svg><div className="model-proof is-valid"><strong>两条长边相等，两条宽边相等，所以 C=2×(长+宽)</strong></div></Shell>;
}

function OperationLaws({ onInteract }: Pick<Props,'onInteract'>) {
  const [law,setLaw]=useState<'exchange'|'associate'|'distribute'>('distribute'); const [a,setA]=useState(3); const b=4,c=2;
  const expression=law==='exchange'?`${a}+${b} = ${b}+${a}`:law==='associate'?`(${a}+${b})+${c} = ${a}+(${b}+${c})`:`${a}×(${b}+${c}) = ${a}×${b}+${a}×${c}`;
  const result=law==='distribute'?a*(b+c):a+b+c;
  return <Shell title="改变计算顺序或拆分方式，总量必须保持不变" result={`${expression} = ${result}`} controls={<><div className="segmented-control"><button type="button" className={law==='exchange'?'is-active':''} onClick={()=>{setLaw('exchange');onInteract?.();}}>交换</button><button type="button" className={law==='associate'?'is-active':''} onClick={()=>{setLaw('associate');onInteract?.();}}>结合</button><button type="button" className={law==='distribute'?'is-active':''} onClick={()=>{setLaw('distribute');onInteract?.();}}>分配</button></div><label>改变 a <output>{a}</output><input type="range" min="2" max="6" value={a} onChange={e=>{setA(Number(e.target.value));onInteract?.();}}/></label></>}><div className="law-model">{law==='distribute'?<><div className="law-area"><i style={{flex:b}}>a×b</i><i style={{flex:c}}>a×c</i></div><b>=</b><div className="law-area whole"><i>a×(b+c)</i></div></>:<><div className="law-beads">{Array.from({length:result},(_,i)=><i key={i}/>)}</div><b>=</b><div className="law-beads regrouped">{Array.from({length:result},(_,i)=><i key={i}/>)}</div></>}</div></Shell>;
}

function PartialProducts({ onInteract }: Pick<Props,'onInteract'>) {
  const [tens,setTens]=useState(2); const [ones,setOnes]=useState(4); const multiplicand=123; const p1=multiplicand*ones,p2=multiplicand*tens*10;
  return <Shell title="两位数拆成几十和几个，两个部分积相加" result={`${multiplicand} × ${tens}${ones} = ${p2} + ${p1} = ${p1+p2}`} controls={<><label>十位 <output>{tens}</output><input type="range" min="1" max="5" value={tens} onChange={e=>{setTens(Number(e.target.value));onInteract?.();}}/></label><label>个位 <output>{ones}</output><input type="range" min="1" max="9" value={ones} onChange={e=>{setOnes(Number(e.target.value));onInteract?.();}}/></label></>}><div className="partial-products"><div className="partial-area"><div style={{flex:tens*2}}><span>123 × {tens*10}</span><strong>{p2}</strong></div><div style={{flex:ones}}><span>123 × {ones}</span><strong>{p1}</strong></div></div><div className="model-proof is-valid"><strong>第二行部分积乘的是{tens}个十，所以末尾有一个0</strong></div></div></Shell>;
}

function gcd(a:number,b:number):number{return b===0?a:gcd(b,a%b)}
function FractionCommonParts({ onInteract }: Pick<Props,'onInteract'>) {
  const [denominator,setDenominator]=useState(3); const d1=2,d2=denominator; const common=d1*d2/gcd(d1,d2); const n1=common/d1,n2=common/d2; const sum=n1+n2; const factor=gcd(sum,common);
  const strip=(filled:number,total:number)=><div className="common-strip" style={{gridTemplateColumns:`repeat(${total},1fr)`}}>{Array.from({length:total},(_,i)=><i key={i} className={i<filled?'filled':''}/>)}</div>;
  return <Shell title="先把两个整体分成同样大小的份，才能合并份数" result={`1/2 + 1/${d2} = ${n1}/${common} + ${n2}/${common} = ${sum/factor}/${common/factor}`} controls={<label>第二个分母 <output>{d2}</output><input type="range" min="3" max="6" value={denominator} onChange={e=>{setDenominator(Number(e.target.value));onInteract?.();}}/></label>}><div className="common-parts"><div><span>1/2 → {n1}/{common}</span>{strip(n1,common)}</div><b>＋</b><div><span>1/{d2} → {n2}/{common}</span>{strip(n2,common)}</div></div><div className="model-proof is-valid"><strong>通分只把份切细，两个分数的大小都没有改变</strong></div></Shell>;
}

function CircleRoll({ onInteract }: Pick<Props,'onInteract'>) {
  const [radius,setRadius]=useState(40); const [progress,setProgress]=useState(0); const diameter=radius*2; const circumference=Math.round(Math.PI*diameter*10)/10;
  const visualRadius=radius*0.75; const rolledLength=2*Math.PI*visualRadius*progress/100; const startX=55+visualRadius; const centerX=startX+rolledLength;
  return <Shell title="圆滚动一周，圆周展开成一条与周长等长的线" result={`C ÷ d ≈ ${Math.PI.toFixed(2)} · C ≈ ${circumference}`} controls={<><label>半径 <output>{radius}</output><input type="range" min="25" max="55" step="5" value={radius} onChange={e=>{setRadius(Number(e.target.value));onInteract?.();}}/></label><label>滚动进度 <output>{progress}%</output><input type="range" min="0" max="100" step="10" value={progress} onChange={e=>{setProgress(Number(e.target.value));onInteract?.();}}/></label></>}><svg className="circle-roll-svg" viewBox="0 0 430 250"><line x1="55" y1="190" x2="385" y2="190"/><line className="unrolled" data-testid="unrolled-circumference" x1="55" y1="215" x2={55+rolledLength} y2="215"/><g transform={`translate(${centerX} ${190-visualRadius}) rotate(${progress*3.6})`}><circle r={visualRadius}/><line x1="0" y1="0" x2="0" y2={-visualRadius}/></g><text x="215" y="238" textAnchor="middle">展开长度随滚动同步增加</text></svg></Shell>;
}

function CylinderLayers({ onInteract }: Pick<Props,'onInteract'>) {
  const [radius,setRadius]=useState(3); const [height,setHeight]=useState(4); const base=Math.round(Math.PI*radius*radius*100)/100; const volume=Math.round(base*height*100)/100;
  return <Shell title="每一层都是同样大的底面，层数就是高" result={`V = ${base} × ${height} = ${volume}`} controls={<><label>底面半径 <output>{radius}</output><input type="range" min="2" max="5" value={radius} onChange={e=>{setRadius(Number(e.target.value));onInteract?.();}}/></label><label>高/层数 <output>{height}</output><input type="range" min="2" max="6" value={height} onChange={e=>{setHeight(Number(e.target.value));onInteract?.();}}/></label></>}><div className="cylinder-layers">{Array.from({length:height},(_,index)=><i key={index} style={{width:`${radius*38}px`,bottom:`${index*24}px`}}><span>{index===height-1?'底面积 πr²':''}</span></i>)}</div><div className="model-proof is-valid"><strong>{height}层相同底面积相加，就是底面积×高</strong></div></Shell>;
}

export default function CourseAdvancedModel({type,onInteract}:Props){switch(type){case'place-value-product':return <PlaceValueProduct onInteract={onInteract}/>;case'perimeter-walk':return <PerimeterWalk onInteract={onInteract}/>;case'operation-laws':return <OperationLaws onInteract={onInteract}/>;case'partial-products':return <PartialProducts onInteract={onInteract}/>;case'fraction-common-parts':return <FractionCommonParts onInteract={onInteract}/>;case'circle-roll':return <CircleRoll onInteract={onInteract}/>;case'cylinder-layers':return <CylinderLayers onInteract={onInteract}/>;}}
