export interface ProbabilityModelProps {
  outcomes?: string[];
  colors?: string[];
  className?: string;
}

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

export default function ProbabilityModel({
  outcomes = ['红', '蓝', '绿', '黄'],
  colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'],
  className,
}: ProbabilityModelProps) {
  const svgW = 200;
  const svgH = 220;
  const cx = 100;
  const cy = 100;
  const r = 80;
  const count = outcomes.length;
  const sectorAngle = 360 / count;

  const sectors = Array.from({ length: count }, (_, i) => {
    const startAngle = -90 + i * sectorAngle;
    const endAngle = -90 + (i + 1) * sectorAngle;
    const midAngle = -90 + (i + 0.5) * sectorAngle;
    const labelPos = polarToCartesian(cx, cy, r * 0.6, midAngle);
    return {
      key: i,
      path: sectorPath(cx, cy, r, startAngle, endAngle),
      color: colors[i % colors.length],
      label: outcomes[i],
      labelX: labelPos.x,
      labelY: labelPos.y,
      prob: `${(100 / count).toFixed(0)}%`,
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
      {/* Sectors */}
      {sectors.map((s) => (
        <g key={s.key}>
          <path
            d={s.path}
            fill={s.color}
            stroke="#ffffff"
            strokeWidth={2}
          />
          <text
            x={s.labelX}
            y={s.labelY - 6}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={14}
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
            {s.prob}
          </text>
        </g>
      ))}

      {/* Outer circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#374151" strokeWidth={2} />

      {/* Center hub */}
      <circle cx={cx} cy={cy} r={6} fill="#374151" />

      {/* Pointer */}
      <polygon
        points={`${cx - 7},${cy - r - 8} ${cx + 7},${cy - r - 8} ${cx},${cy - r + 8}`}
        fill="#1f2937"
        stroke="#ffffff"
        strokeWidth={1}
      />

      {/* Total outcomes label */}
      <text
        x={cx}
        y={svgH - 10}
        textAnchor="middle"
        fontSize={12}
        fill="#6b7280"
      >
        共 {count} 种可能，每种概率 {`${(100 / count).toFixed(0)}%`}
      </text>
    </svg>
  );
}
