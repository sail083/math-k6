export interface PieChartProps {
  data?: number[];
  labels?: string[];
  colors?: string[];
  className?: string;
}

const DEFAULT_COLORS = ['#818cf8', '#6366f1', '#a5b4fc', '#4f46e5', '#c7d2fe', '#818cf8'];

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx},${cy} L ${start.x},${start.y} A ${r},${r} 0 ${largeArc},1 ${end.x},${end.y} Z`;
}

export default function PieChart({
  data = [30, 40, 20, 10],
  labels = ['A', 'B', 'C', 'D'],
  colors = DEFAULT_COLORS,
  className,
}: PieChartProps) {
  const svgW = 300;
  const svgH = 200;
  const cx = 90;
  const cy = 100;
  const r = 75;
  const total = data.reduce((sum, v) => sum + v, 0) || 1;

  let cumulative = -90;
  const slices = data.map((val, i) => {
    const angle = (val / total) * 360;
    const startAngle = cumulative;
    const endAngle = cumulative + angle;
    const midAngle = (startAngle + endAngle) / 2;
    const labelPos = polarToCartesian(cx, cy, r * 0.62, midAngle);
    const pct = Math.round((val / total) * 100);
    cumulative = endAngle;
    return {
      key: i,
      path: sectorPath(cx, cy, r, startAngle, endAngle),
      color: colors[i % colors.length],
      label: labels[i] ?? `项${i + 1}`,
      value: val,
      pct,
      labelX: labelPos.x,
      labelY: labelPos.y,
      showLabel: angle > 20,
    };
  });

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {/* Slices */}
      {slices.map((s) => (
        <g key={s.key}>
          <path d={s.path} fill={s.color} stroke="#ffffff" strokeWidth={1.5} />
          {s.showLabel && (
            <>
              <text
                x={s.labelX}
                y={s.labelY - 4}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight="bold"
                fill="#ffffff"
              >
                {s.label}
              </text>
              <text
                x={s.labelX}
                y={s.labelY + 10}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fill="#ffffff"
                opacity={0.9}
              >
                {s.pct}%
              </text>
            </>
          )}
        </g>
      ))}

      {/* Legend */}
      {slices.map((s, i) => {
        const legendX = 185;
        const legendY = 45 + i * 28;
        return (
          <g key={`leg${i}`}>
            <rect
              x={legendX}
              y={legendY}
              width={14}
              height={14}
              rx={2}
              fill={s.color}
            />
            <text
              x={legendX + 20}
              y={legendY + 7}
              textAnchor="start"
              dominantBaseline="central"
              fontSize={12}
              fill="#374151"
            >
              {s.label}：{s.value}（{s.pct}%）
            </text>
          </g>
        );
      })}

      {/* Total */}
      <text
        x={cx}
        y={cy + r + 22}
        textAnchor="middle"
        fontSize={12}
        fill="#6b7280"
      >
        合计：{total}
      </text>
    </svg>
  );
}
