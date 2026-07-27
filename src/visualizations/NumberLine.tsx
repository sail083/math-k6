export interface NumberLineProps {
  min?: number;
  max?: number;
  step?: number;
  highlightPoints?: number[];
  showLabels?: boolean;
  className?: string;
}

export default function NumberLine({
  min = 0,
  max = 10,
  step = 1,
  highlightPoints = [],
  showLabels = true,
  className,
}: NumberLineProps) {
  const padding = 30;
  const lineY = 45;
  const tickHeight = 10;
  const svgWidth = 320;
  const svgHeight = 80;
  const usableWidth = svgWidth - padding * 2;
  const range = max - min;

  const posOf = (val: number) =>
    padding + ((val - min) / range) * usableWidth;

  const ticks: number[] = [];
  for (let v = min; v <= max + 0.0001; v += step) {
    ticks.push(Math.round(v * 100) / 100);
  }

  const highlightSet = new Set(highlightPoints);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      <defs>
        <marker
          id="nl-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#6b7280" />
        </marker>
      </defs>

      {/* 主线 + 箭头 */}
      <line
        x1={padding}
        y1={lineY}
        x2={svgWidth - padding + 6}
        y2={lineY}
        stroke="#6b7280"
        strokeWidth={2}
        markerEnd="url(#nl-arrow)"
      />
      <line
        x1={padding - 6}
        y1={lineY}
        x2={svgWidth - padding}
        y2={lineY}
        stroke="#6b7280"
        strokeWidth={2}
        markerStart="url(#nl-arrow)"
      />

      {/* 刻度 + 标签 */}
      {ticks.map((val) => {
        const x = posOf(val);
        const isHighlight = highlightSet.has(val);
        return (
          <g key={val}>
            <line
              x1={x}
              y1={lineY - tickHeight / 2}
              x2={x}
              y2={lineY + tickHeight / 2}
              stroke="#6b7280"
              strokeWidth={1.5}
            />
            {showLabels && (
              <text
                x={x}
                y={lineY + tickHeight / 2 + 14}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fill="#6b7280"
              >
                {val}
              </text>
            )}
            {isHighlight && (
              <>
                <circle
                  cx={x}
                  cy={lineY}
                  r={7}
                  fill="#818cf8"
                  stroke="#fff"
                  strokeWidth={2}
                />
                {showLabels && (
                  <text
                    x={x}
                    y={lineY - 16}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={12}
                    fontWeight="bold"
                    fill="#4f46e5"
                  >
                    {val}
                  </text>
                )}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
