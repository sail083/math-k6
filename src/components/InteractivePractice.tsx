import { lazy, Suspense, useState, type CSSProperties, type ReactNode } from 'react';
import type { VizType } from '@/lib/types';
import {
  isCourseModelType,
  isConceptModelType,
  isAdvancedModelType,
  isFoundationModelType,
  isGeometryModelType,
  isCourseMasteryModelCType,
  isApplicationModelType,
} from '@/lib/model-type-guards';

// ---------------------------------------------------------------------------
// Lazy-loaded course model components (heavy React modules)
// ---------------------------------------------------------------------------

const LazyCourseMathModel = lazy(() => import('@/components/CourseMathModel'));
const LazyCourseConceptModel = lazy(() => import('@/components/CourseConceptModel'));
const LazyCourseAdvancedModel = lazy(() => import('@/components/CourseAdvancedModel'));
const LazyCourseFoundationModel = lazy(() => import('@/components/CourseFoundationModel'));
const LazyCourseGeometryModel = lazy(() => import('@/components/CourseGeometryModel'));
const LazyCourseMasteryModelC = lazy(() => import('@/components/CourseMasteryModelC'));
const LazyCourseApplicationModel = lazy(() => import('@/components/CourseApplicationModel'));
const LazyColumnArithmeticLab = lazy(() => import('@/components/ColumnArithmeticLab'));

// ---------------------------------------------------------------------------
// Lightweight visualization components (kept eagerly – small SVG modules)
// ---------------------------------------------------------------------------

import AreaGrid from '@/visualizations/AreaGrid';
import BalanceScale from '@/visualizations/BalanceScale';
import BarChart from '@/visualizations/BarChart';
import CircleUnroll from '@/visualizations/CircleUnroll';
import ClockDial from '@/visualizations/ClockDial';
import ConeModel from '@/visualizations/ConeModel';
import CoordinateGrid from '@/visualizations/CoordinateGrid';
import CuboidModel from '@/visualizations/CuboidModel';
import CylinderModel from '@/visualizations/CylinderModel';
import FractionPie from '@/visualizations/FractionPie';
import NumberLine from '@/visualizations/NumberLine';
import PieChart from '@/visualizations/PieChart';
import PlaceValueChart from '@/visualizations/PlaceValueChart';
import ProbabilityModel from '@/visualizations/ProbabilityModel';
import Protractor from '@/visualizations/Protractor';
import ShapeTransform from '@/visualizations/ShapeTransform';

interface InteractivePracticeProps {
  vizType: VizType;
  title: string;
  knowledgePointId?: string;
  onInteract?: () => void;
}

interface PracticeState {
  label: string;
  valueText: string;
  min: number;
  max: number;
  step?: number;
  render: ReactNode;
}

type StandardVizType = Exclude<VizType,
  | 'column-arithmetic'
  | 'remainder-groups'
  | 'trial-division'
  | 'decimal-place-value'
  | 'decimal-product'
  | 'decimal-quotient'
  | 'fraction-product'
  | 'fraction-quotient'
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
  | 'coordinate-scale'
  | 'place-value-product'
  | 'perimeter-walk'
  | 'operation-laws'
  | 'partial-products'
  | 'fraction-common-parts'
  | 'circle-roll'
  | 'cylinder-layers'>;

const outcomeLabels = ['红', '蓝', '绿', '黄', '紫', '橙'];
const outcomeColors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#f97316'];

function getPracticeState(vizType: StandardVizType, value: number): PracticeState {
  switch (vizType) {
    case 'area-grid': {
      const count = Math.round(value);
      return { label: '涂色格数', valueText: `${count} 格`, min: 1, max: 12, render: <AreaGrid rows={3} cols={4} cellSize={48} highlightCells={Array.from({ length: count }, (_, index) => ({ row: Math.floor(index / 4), col: index % 4 }))} showCount showLabels animated /> };
    }
    case 'fraction-pie': {
      const numerator = Math.round(value);
      return { label: '分子', valueText: `${numerator} / 8`, min: 0, max: 8, render: <FractionPie numerator={numerator} denominator={8} showLabels /> };
    }
    case 'number-line': {
      const point = Math.round(value);
      return { label: '数轴上的点', valueText: String(point), min: 0, max: 10, render: <NumberLine min={0} max={10} step={1} highlightPoints={[point]} showLabels /> };
    }
    case 'shape-transform': {
      const stage = Math.round(value);
      const shapes = ['triangle', 'parallelogram', 'trapezoid'] as const;
      return { label: '图形与剪拼', valueText: ['三角形', '平行四边形', '梯形'][stage], min: 0, max: 2, render: <ShapeTransform shape={shapes[stage]} showCutLine showTransform={stage > 0} /> };
    }
    case 'circle-unroll': {
      const progress = value / 100;
      return { label: '展开进度', valueText: `${Math.round(value)}%`, min: 0, max: 100, render: <CircleUnroll radius={60} sectors={12} mode="area" progress={progress} /> };
    }
    case 'cuboid-model': {
      const length = Math.round(value);
      return { label: '长方体的长', valueText: `${length} 格`, min: 2, max: 6, render: <CuboidModel length={length} width={3} height={2} showGrid mode="volume" /> };
    }
    case 'cylinder-model': {
      const unfolded = value === 1;
      return { label: '观察方式', valueText: unfolded ? '展开图' : '立体图', min: 0, max: 1, render: <CylinderModel radius={40} height={80} showUnfold={unfolded} /> };
    }
    case 'cone-model': {
      const comparison = value === 1;
      return { label: '观察方式', valueText: comparison ? '与圆柱比较' : '圆锥模型', min: 0, max: 1, render: <ConeModel radius={40} height={80} showComparison={comparison} /> };
    }
    case 'balance-scale': {
      const right = Math.round(value);
      return { label: '右边砝码', valueText: `${right}`, min: 1, max: 9, render: <BalanceScale leftWeight={5} rightWeight={right} showValues /> };
    }
    case 'coordinate-grid': {
      const x = Math.round(value);
      return { label: '点的横坐标', valueText: `(${x}, 3)`, min: 0, max: 5, render: <CoordinateGrid gridSize={5} points={[{ x, y: 3 }]} showLabels /> };
    }
    case 'bar-chart': {
      const height = Math.round(value);
      return { label: 'D 组数据', valueText: String(height), min: 1, max: 10, render: <BarChart data={[3, 5, 2, height, 4]} labels={['A', 'B', 'C', 'D', 'E']} maxValue={10} /> };
    }
    case 'place-value-chart': {
      const number = Math.round(value);
      return { label: '改变数值', valueText: String(number), min: 1000, max: 9999, step: 111, render: <PlaceValueChart number={number} places={['千', '百', '十', '个']} /> };
    }
    case 'protractor': {
      const angle = Math.round(value);
      return { label: '角度', valueText: `${angle}°`, min: 0, max: 180, render: <Protractor angle={angle} showAngle /> };
    }
    case 'clock-dial': {
      const minute = Math.round(value / 5) * 5;
      return { label: '分针', valueText: `3:${String(minute).padStart(2, '0')}`, min: 0, max: 55, step: 5, render: <ClockDial hour={3} minute={minute} second={0} showLabels /> };
    }
    case 'probability-model': {
      const count = Math.round(value);
      return { label: '转盘结果数', valueText: `${count} 种`, min: 2, max: 6, render: <ProbabilityModel outcomes={outcomeLabels.slice(0, count)} colors={outcomeColors.slice(0, count)} /> };
    }
    case 'pie-chart': {
      const first = Math.round(value);
      return { label: 'A 类占比', valueText: `${first}%`, min: 10, max: 70, render: <PieChart data={[first, 100 - first]} labels={['A', '其他']} /> };
    }
  }
}

function defaultValue(vizType: StandardVizType): number {
  const defaults: Record<StandardVizType, number> = {
    'area-grid': 6,
    'fraction-pie': 3,
    'number-line': 5,
    'shape-transform': 1,
    'circle-unroll': 0,
    'cuboid-model': 4,
    'cylinder-model': 0,
    'cone-model': 0,
    'balance-scale': 5,
    'coordinate-grid': 2,
    'bar-chart': 7,
    'place-value-chart': 3254,
    'protractor': 60,
    'clock-dial': 30,
    'probability-model': 4,
    'pie-chart': 40,
  };
  return defaults[vizType];
}

function StandardPractice({ vizType, title, onInteract }: Omit<InteractivePracticeProps, 'knowledgePointId'> & { vizType: StandardVizType }) {
  const [value, setValue] = useState(() => defaultValue(vizType));
  const state = getPracticeState(vizType, value);
  const progress = ((value - state.min) / (state.max - state.min)) * 100;

  return (
    <div className="practice-workbench">
      <div className="workbench-status">
        <span><i className="signal-dot is-live" /> 实时模型</span>
        <strong>{state.valueText}</strong>
      </div>
      <div className="practice-canvas" aria-live="polite">
        <div key={`${vizType}-${value}`} className="interactive-practice-visual">{state.render}</div>
      </div>
      <div className="practice-console">
        <div className="practice-console__label">
          <label htmlFor={`practice-${vizType}`}>{state.label}</label>
          <span>拖动变量，观察模型响应</span>
        </div>
        <input
          id={`practice-${vizType}`}
          type="range"
          min={state.min}
          max={state.max}
          step={state.step ?? 1}
          value={value}
          onChange={(event) => {
            setValue(Number(event.target.value));
            onInteract?.();
          }}
          className="practice-range"
          style={{ '--range-progress': `${progress}%` } as CSSProperties}
          aria-label={`${title}：${state.label}`}
        />
      </div>
    </div>
  );
}

const ModelLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="skeleton skeleton-block w-full" />
  </div>
);

export default function InteractivePractice({ vizType, title, knowledgePointId, onInteract }: InteractivePracticeProps) {
  if (knowledgePointId && isGeometryModelType(knowledgePointId)) {
    return <Suspense fallback={<ModelLoadingFallback />}><LazyCourseGeometryModel type={knowledgePointId} onInteract={onInteract} /></Suspense>;
  }
  if (knowledgePointId && isCourseMasteryModelCType(knowledgePointId)) {
    return <Suspense fallback={<ModelLoadingFallback />}><LazyCourseMasteryModelC type={knowledgePointId} onInteract={onInteract} /></Suspense>;
  }
  if (knowledgePointId && isFoundationModelType(knowledgePointId)) {
    return <Suspense fallback={<ModelLoadingFallback />}><LazyCourseFoundationModel type={knowledgePointId} onInteract={onInteract} /></Suspense>;
  }
  if (knowledgePointId && isApplicationModelType(knowledgePointId)) {
    return <Suspense fallback={<ModelLoadingFallback />}><LazyCourseApplicationModel type={knowledgePointId} onInteract={onInteract} /></Suspense>;
  }
  if (vizType === 'column-arithmetic' || knowledgePointId === 'g3-add-sub-10000') {
    return <Suspense fallback={<ModelLoadingFallback />}><LazyColumnArithmeticLab onInteract={onInteract} /></Suspense>;
  }
  if (isCourseModelType(vizType)) {
    return <Suspense fallback={<ModelLoadingFallback />}><LazyCourseMathModel type={vizType} onInteract={onInteract} /></Suspense>;
  }
  if (isConceptModelType(vizType)) {
    return <Suspense fallback={<ModelLoadingFallback />}><LazyCourseConceptModel type={vizType} onInteract={onInteract} /></Suspense>;
  }
  if (isAdvancedModelType(vizType)) {
    return <Suspense fallback={<ModelLoadingFallback />}><LazyCourseAdvancedModel type={vizType} onInteract={onInteract} /></Suspense>;
  }
  return <StandardPractice vizType={vizType} title={title} onInteract={onInteract} />;
}

export function hasCourseSpecificModel(id: string) {
  return isGeometryModelType(id) || isCourseMasteryModelCType(id) || isFoundationModelType(id) || isApplicationModelType(id);
}
