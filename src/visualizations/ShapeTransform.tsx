export interface ShapeTransformProps {
  shape?: 'parallelogram' | 'triangle' | 'trapezoid';
  showCutLine?: boolean;
  showTransform?: boolean;
  className?: string;
}

interface ShapeData {
  points: string;
  polygon: Array<{ x: number; y: number }>;
  cutLine: { x1: number; y1: number; x2: number; y2: number };
  arrow: { x1: number; y1: number; x2: number; y2: number };
  baseLabel: { x: number; y: number; text: string };
  heightLabel: { x: number; y: number; text: string };
}

function getShapeData(shape: string): ShapeData {
  switch (shape) {
    case 'parallelogram': {
      const pts = [
        { x: 50, y: 140 },
        { x: 210, y: 140 },
        { x: 250, y: 60 },
        { x: 90, y: 60 },
      ];
      return {
        points: pts.map((p) => `${p.x},${p.y}`).join(' '),
        polygon: pts,
        cutLine: { x1: 90, y1: 60, x2: 90, y2: 140 },
        arrow: { x1: 60, y1: 100, x2: 235, y2: 100 },
        baseLabel: { x: 130, y: 158, text: '底' },
        heightLabel: { x: 75, y: 100, text: '高' },
      };
    }
    case 'triangle': {
      const pts = [
        { x: 60, y: 140 },
        { x: 220, y: 140 },
        { x: 140, y: 50 },
      ];
      return {
        points: pts.map((p) => `${p.x},${p.y}`).join(' '),
        polygon: pts,
        cutLine: { x1: 140, y1: 50, x2: 140, y2: 140 },
        arrow: { x1: 100, y1: 95, x2: 180, y2: 95 },
        baseLabel: { x: 140, y: 158, text: '底' },
        heightLabel: { x: 155, y: 95, text: '高' },
      };
    }
    case 'trapezoid': {
      const pts = [
        { x: 40, y: 140 },
        { x: 260, y: 140 },
        { x: 210, y: 60 },
        { x: 90, y: 60 },
      ];
      return {
        points: pts.map((p) => `${p.x},${p.y}`).join(' '),
        polygon: pts,
        cutLine: { x1: 90, y1: 60, x2: 90, y2: 140 },
        arrow: { x1: 60, y1: 100, x2: 235, y2: 100 },
        baseLabel: { x: 150, y: 158, text: '下底' },
        heightLabel: { x: 75, y: 100, text: '高' },
      };
    }
    default:
      return getShapeData('parallelogram');
  }
}

export default function ShapeTransform({
  shape = 'parallelogram',
  showCutLine = false,
  showTransform = false,
  className,
}: ShapeTransformProps) {
  const data = getShapeData(shape);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 300 180"
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      <defs>
        <marker
          id="st-arrow"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="#22c55e" />
        </marker>
      </defs>

      {/* 形状主体 */}
      <polygon
        points={data.points}
        fill="#e0e7ff"
        stroke="#6366f1"
        strokeWidth={2}
      />

      {/* 裁剪线（虚线） */}
      {showCutLine && (
        <line
          x1={data.cutLine.x1}
          y1={data.cutLine.y1}
          x2={data.cutLine.x2}
          y2={data.cutLine.y2}
          stroke="#ef4444"
          strokeWidth={1.5}
          strokeDasharray="5,4"
        />
      )}

      {/* 变换箭头 */}
      {showTransform && (
        <>
          <line
            x1={data.arrow.x1}
            y1={data.arrow.y1}
            x2={data.arrow.x2}
            y2={data.arrow.y2}
            stroke="#22c55e"
            strokeWidth={2}
            strokeDasharray="4,3"
            markerEnd="url(#st-arrow)"
          />
          <text
            x={(data.arrow.x1 + data.arrow.x2) / 2}
            y={data.arrow.y1 - 10}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            fill="#16a34a"
            fontWeight="bold"
          >
            割补
          </text>
        </>
      )}

      {/* 标签 */}
      <text
        x={data.baseLabel.x}
        y={data.baseLabel.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fill="#6b7280"
      >
        {data.baseLabel.text}
      </text>
      {showCutLine && (
        <text
          x={data.heightLabel.x}
          y={data.heightLabel.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fill="#ef4444"
        >
          {data.heightLabel.text}
        </text>
      )}
    </svg>
  );
}
