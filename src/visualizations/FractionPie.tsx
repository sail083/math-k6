export interface FractionPieProps {
  numerator: number;
  denominator: number;
  fill?: string;
  stroke?: string;
  showLabels?: boolean;
  mode?: 'pie' | 'bar';
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

export default function FractionPie({
  numerator,
  denominator,
  fill = '#818cf8',
  stroke = '#d1d5db',
  showLabels = true,
  mode = 'pie',
  className,
}: FractionPieProps) {
  if (mode === 'bar') {
    return (
      <FractionBar
        numerator={numerator}
        denominator={denominator}
        fill={fill}
        stroke={stroke}
        showLabels={showLabels}
        className={className}
      />
    );
  }

  const cx = 100;
  const cy = 100;
  const r = 80;
  const sectorAngle = 360 / denominator;

  const sectors = Array.from({ length: denominator }, (_, i) => {
    const startAngle = -90 + i * sectorAngle;
    const endAngle = -90 + (i + 1) * sectorAngle;
    return {
      key: i,
      path: sectorPath(cx, cy, r, startAngle, endAngle),
      isFilled: i < numerator,
    };
  });

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {sectors.map((s) => (
        <path
          key={s.key}
          d={s.path}
          fill={s.isFilled ? fill : '#f3f4f6'}
          stroke={stroke}
          strokeWidth={1.5}
        />
      ))}

      {showLabels && (
        <>
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={28}
            fontWeight="bold"
            fill="#1f2937"
          >
            {numerator}
          </text>
          <line
            x1={cx - 18}
            y1={cy}
            x2={cx + 18}
            y2={cy}
            stroke="#1f2937"
            strokeWidth={2}
          />
          <text
            x={cx}
            y={cy + 18}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={28}
            fontWeight="bold"
            fill="#1f2937"
          >
            {denominator}
          </text>
        </>
      )}
    </svg>
  );
}

function FractionBar({
  numerator,
  denominator,
  fill,
  stroke,
  showLabels,
  className,
}: Omit<FractionPieProps, 'mode'> & {
  numerator: number;
  denominator: number;
  fill: string;
  stroke: string;
  showLabels: boolean;
  className?: string;
}) {
  const barX = 20;
  const barY = 50;
  const barWidth = 200;
  const barHeight = 40;
  const partWidth = barWidth / denominator;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 240 120"
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {Array.from({ length: denominator }, (_, i) => (
        <rect
          key={i}
          x={barX + i * partWidth}
          y={barY}
          width={partWidth}
          height={barHeight}
          fill={i < numerator ? fill : '#f3f4f6'}
          stroke={stroke}
          strokeWidth={1.5}
        />
      ))}

      {showLabels && (
        <>
          <text
            x={barX + barWidth / 2}
            y={barY - 12}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={16}
            fontWeight="bold"
            fill="#1f2937"
          >
            {numerator}/{denominator}
          </text>
          <text
            x={barX + (numerator * partWidth) / 2}
            y={barY + barHeight / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fill="#ffffff"
            fontWeight="bold"
          >
            {numerator}
          </text>
          <text
            x={barX + barWidth - ((denominator - numerator) * partWidth) / 2}
            y={barY + barHeight / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fill="#6b7280"
            fontWeight="bold"
          >
            {denominator - numerator}
          </text>
        </>
      )}
    </svg>
  );
}
