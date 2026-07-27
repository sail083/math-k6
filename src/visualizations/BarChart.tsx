export interface BarChartProps {
  data?: number[];
  labels?: string[];
  maxValue?: number;
  className?: string;
}

export default function BarChart({
  data = [3, 5, 2, 7, 4],
  labels = ['A', 'B', 'C', 'D', 'E'],
  maxValue,
  className,
}: BarChartProps) {
  const svgW = 320;
  const svgH = 200;
  const chartLeft = 40;
  const chartRight = 300;
  const chartTop = 20;
  const chartBottom = 170;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const maxVal = maxValue ?? Math.ceil(Math.max(...data) * 1.1);
  const niceMax = Math.max(maxVal, 1);
  const tickCount = 5;
  const tickStep = niceMax / tickCount;

  const slotWidth = chartWidth / data.length;
  const barWidth = slotWidth * 0.6;

  const colors = ['#818cf8', '#6366f1', '#a5b4fc', '#4f46e5', '#818cf8', '#6366f1', '#a5b4fc'];

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {/* Y-axis tick lines + labels */}
      {Array.from({ length: tickCount + 1 }, (_, i) => {
        const val = i * tickStep;
        const y = chartBottom - (val / niceMax) * chartHeight;
        return (
          <g key={`tick${i}`}>
            <line
              x1={chartLeft}
              y1={y}
              x2={chartRight}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <text
              x={chartLeft - 6}
              y={y}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={10}
              fill="#6b7280"
            >
              {Math.round(val)}
            </text>
          </g>
        );
      })}

      {/* Axes */}
      <line x1={chartLeft} y1={chartTop} x2={chartLeft} y2={chartBottom} stroke="#6b7280" strokeWidth={1.5} />
      <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke="#6b7280" strokeWidth={1.5} />

      {/* Bars */}
      {data.map((val, i) => {
        const barH = (val / niceMax) * chartHeight;
        const x = chartLeft + i * slotWidth + (slotWidth - barWidth) / 2;
        const y = chartBottom - barH;
        return (
          <g key={`bar${i}`}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              fill={colors[i % colors.length]}
              rx={2}
            />
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize={11}
              fontWeight="bold"
              fill="#1f2937"
            >
              {val}
            </text>
            <text
              x={x + barWidth / 2}
              y={chartBottom + 16}
              textAnchor="middle"
              fontSize={11}
              fill="#6b7280"
            >
              {labels[i] ?? ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
