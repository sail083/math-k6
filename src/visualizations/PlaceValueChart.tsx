export interface PlaceValueChartProps {
  number?: number;
  places?: string[];
  className?: string;
}

export default function PlaceValueChart({
  number = 3254,
  places = ['千', '百', '十', '个'],
  className,
}: PlaceValueChartProps) {
  const svgW = 300;
  const svgH = 170;
  const colCount = places.length;
  const chartLeft = 20;
  const chartWidth = 260;
  const colWidth = chartWidth / colCount;
  const headerY = 28;
  const boxTop = 48;
  const boxBottom = 108;
  const digitY = (boxTop + boxBottom) / 2;
  const expandY = 140;

  // Extract digits (pad with leading zeros to match places length)
  const numStr = String(number).padStart(colCount, '0');
  const digits = numStr
    .slice(-colCount)
    .split('')
    .map((d) => parseInt(d, 10));

  // Expanded form values
  const expandValues = digits.map((d, i) => {
    const power = colCount - 1 - i;
    return d * Math.pow(10, power);
  });

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {/* Column headers */}
      {places.map((place, i) => (
        <text
          key={`hdr${i}`}
          x={chartLeft + i * colWidth + colWidth / 2}
          y={headerY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontWeight="bold"
          fill="#4f46e5"
        >
          {place}
        </text>
      ))}

      {/* Header underline */}
      <line
        x1={chartLeft}
        y1={boxTop - 6}
        x2={chartLeft + chartWidth}
        y2={boxTop - 6}
        stroke="#c7d2fe"
        strokeWidth={1.5}
      />

      {/* Digit boxes + digits */}
      {digits.map((digit, i) => (
        <g key={`col${i}`}>
          <rect
            x={chartLeft + i * colWidth}
            y={boxTop}
            width={colWidth}
            height={boxBottom - boxTop}
            fill={i % 2 === 0 ? '#e0e7ff' : '#f3f4f6'}
            stroke="#a5b4fc"
            strokeWidth={1.5}
          />
          <text
            x={chartLeft + i * colWidth + colWidth / 2}
            y={digitY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={28}
            fontWeight="bold"
            fill="#1f2937"
          >
            {digit}
          </text>
        </g>
      ))}

      {/* Expanded form */}
      <text
        x={svgW / 2}
        y={expandY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fill="#6b7280"
      >
        {expandValues
          .filter((v) => v > 0)
          .map((v) => v.toLocaleString())
          .join(' + ')}
        {' = '}
        {number.toLocaleString()}
      </text>
    </svg>
  );
}
