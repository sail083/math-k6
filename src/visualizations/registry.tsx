import type { ComponentType } from 'react';
import type { VizType } from '@/lib/types';
import AreaGrid from './AreaGrid';
import FractionPie from './FractionPie';
import NumberLine from './NumberLine';
import ShapeTransform from './ShapeTransform';
import CircleUnroll from './CircleUnroll';
import CuboidModel from './CuboidModel';
import CylinderModel from './CylinderModel';
import ConeModel from './ConeModel';
import BalanceScale from './BalanceScale';
import CoordinateGrid from './CoordinateGrid';
import BarChart from './BarChart';
import PlaceValueChart from './PlaceValueChart';
import Protractor from './Protractor';
import ClockDial from './ClockDial';
import ProbabilityModel from './ProbabilityModel';
import PieChart from './PieChart';

// Base props that all visualization demo components should accept
export interface VizDemoProps {
  className?: string;
}

// area-grid 演示：4×3 方格图，每格 1 平方厘米
const AreaGridDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <AreaGrid
    rows={3}
    cols={4}
    cellSize={50}
    highlightCells={Array.from({ length: 12 }, (_, i) => ({
      row: Math.floor(i / 4),
      col: i % 4,
    }))}
    showCount={true}
    showLabels={true}
    fill="#818cf8"
    animated={true}
    className={className}
  />
);

// fraction-pie 演示：3/4 饼图
const FractionPieDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <FractionPie numerator={3} denominator={4} showLabels={true} className={className} />
);

// number-line 演示：0-10 数轴
const NumberLineDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <NumberLine min={0} max={10} step={1} showLabels={true} className={className} />
);

// shape-transform 演示：平行四边形 + 裁剪线
const ShapeTransformDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <ShapeTransform shape="parallelogram" showCutLine={true} className={className} />
);

// circle-unroll 演示：12 等分圆
const CircleUnrollDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <CircleUnroll radius={60} sectors={12} mode="area" progress={0} className={className} />
);

// cuboid-model 演示：4×3×2 长方体
const CuboidModelDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <CuboidModel length={4} width={3} height={2} showGrid={true} mode="volume" className={className} />
);

// cylinder-model 演示：圆柱
const CylinderModelDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <CylinderModel radius={40} height={80} showUnfold={false} className={className} />
);

// cone-model 演示：圆锥
const ConeModelDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <ConeModel radius={40} height={80} showComparison={false} className={className} />
);

// balance-scale 演示：5=5 平衡天平
const BalanceScaleDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <BalanceScale leftWeight={5} rightWeight={5} showValues={true} className={className} />
);

// coordinate-grid 演示：5×5 坐标系，点(2,3)
const CoordinateGridDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <CoordinateGrid gridSize={5} points={[{ x: 2, y: 3 }]} showLabels={true} className={className} />
);

// bar-chart 演示：5 条柱状图
const BarChartDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <BarChart
    data={[3, 5, 2, 7, 4]}
    labels={['A', 'B', 'C', 'D', 'E']}
    className={className}
  />
);

// place-value-chart 演示：3254 的数位
const PlaceValueChartDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <PlaceValueChart number={3254} places={['千', '百', '十', '个']} className={className} />
);

// protractor 演示：60° 角
const ProtractorDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <Protractor angle={60} showAngle={true} className={className} />
);

// clock-dial 演示：3:30
const ClockDialDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <ClockDial hour={3} minute={30} second={0} showLabels={true} className={className} />
);

// probability-model 演示：4 色转盘
const ProbabilityModelDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <ProbabilityModel
    outcomes={['红', '蓝', '绿', '黄']}
    colors={['#ef4444', '#3b82f6', '#22c55e', '#eab308']}
    className={className}
  />
);

// pie-chart 演示：4 扇形饼图
const PieChartDemo: ComponentType<VizDemoProps> = ({ className }) => (
  <PieChart
    data={[30, 40, 20, 10]}
    labels={['A', 'B', 'C', 'D']}
    className={className}
  />
);

// Registry mapping vizType → demo component
export const VIZ_REGISTRY: Partial<Record<VizType, ComponentType<VizDemoProps>>> = {
  'area-grid': AreaGridDemo,
  'fraction-pie': FractionPieDemo,
  'number-line': NumberLineDemo,
  'shape-transform': ShapeTransformDemo,
  'circle-unroll': CircleUnrollDemo,
  'cuboid-model': CuboidModelDemo,
  'cylinder-model': CylinderModelDemo,
  'cone-model': ConeModelDemo,
  'balance-scale': BalanceScaleDemo,
  'coordinate-grid': CoordinateGridDemo,
  'bar-chart': BarChartDemo,
  'place-value-chart': PlaceValueChartDemo,
  'protractor': ProtractorDemo,
  'clock-dial': ClockDialDemo,
  'probability-model': ProbabilityModelDemo,
  'pie-chart': PieChartDemo,
};

// Helper to check if a vizType is registered
export function isVizRegistered(vizType: VizType): boolean {
  return vizType in VIZ_REGISTRY;
}
