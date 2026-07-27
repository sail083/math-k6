export interface ClockDialProps {
  hour?: number;
  minute?: number;
  second?: number;
  showLabels?: boolean;
  className?: string;
}

export default function ClockDial({
  hour = 3,
  minute = 30,
  second = 0,
  showLabels = true,
  className,
}: ClockDialProps) {
  const svgW = 200;
  const svgH = 200;
  const cx = 100;
  const cy = 100;
  const r = 85;

  // Angles (degrees, 0 = top, clockwise)
  const hourPos = (hour % 12) + minute / 60;
  const hourAngle = hourPos * 30; // 360/12 = 30 per hour
  const minuteAngle = minute * 6; // 360/60 = 6 per minute
  const secondAngle = second * 6;

  // Convert to SVG angle (0 = right, counter-clockwise positive)
  // SVG angle = clockAngle - 90 (measuring from positive x-axis, clockwise positive in SVG)
  const toRad = (clockDeg: number) => ((clockDeg - 90) * Math.PI) / 180;

  const handEnd = (lengthRatio: number, clockDeg: number) => {
    const rad = toRad(clockDeg);
    return {
      x: cx + r * lengthRatio * Math.cos(rad),
      y: cy + r * lengthRatio * Math.sin(rad),
    };
  };

  const hourEnd = handEnd(0.5, hourAngle);
  const minuteEnd = handEnd(0.72, minuteAngle);
  const secondEnd = handEnd(0.8, secondAngle);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {/* Clock face */}
      <circle cx={cx} cy={cy} r={r} fill="#f9fafb" stroke="#d1d5db" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={r - 6} fill="none" stroke="#e5e7eb" strokeWidth={1} />

      {/* Hour marks + labels */}
      {Array.from({ length: 12 }, (_, i) => {
        const clockDeg = (i + 1) * 30;
        const rad = toRad(clockDeg);
        const outerX = cx + (r - 2) * Math.cos(rad);
        const outerY = cy + (r - 2) * Math.sin(rad);
        const innerX = cx + (r - 12) * Math.cos(rad);
        const innerY = cy + (r - 12) * Math.sin(rad);
        return (
          <g key={`mark${i}`}>
            <line
              x1={outerX}
              y1={outerY}
              x2={innerX}
              y2={innerY}
              stroke="#6b7280"
              strokeWidth={2}
            />
            {showLabels && (
              <text
                x={cx + (r - 24) * Math.cos(rad)}
                y={cy + (r - 24) * Math.sin(rad)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={13}
                fontWeight="bold"
                fill="#374151"
              >
                {i + 1}
              </text>
            )}
          </g>
        );
      })}

      {/* Minute tick marks */}
      {Array.from({ length: 60 }, (_, i) => {
        if (i % 5 === 0) return null;
        const clockDeg = i * 6;
        const rad = toRad(clockDeg);
        const outerX = cx + (r - 2) * Math.cos(rad);
        const outerY = cy + (r - 2) * Math.sin(rad);
        const innerX = cx + (r - 8) * Math.cos(rad);
        const innerY = cy + (r - 8) * Math.sin(rad);
        return (
          <line
            key={`min${i}`}
            x1={outerX}
            y1={outerY}
            x2={innerX}
            y2={innerY}
            stroke="#9ca3af"
            strokeWidth={1}
          />
        );
      })}

      {/* Hour hand */}
      <line
        x1={cx}
        y1={cy}
        x2={hourEnd.x}
        y2={hourEnd.y}
        stroke="#1f2937"
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* Minute hand */}
      <line
        x1={cx}
        y1={cy}
        x2={minuteEnd.x}
        y2={minuteEnd.y}
        stroke="#4f46e5"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Second hand */}
      <line
        x1={cx}
        y1={cy}
        x2={secondEnd.x}
        y2={secondEnd.y}
        stroke="#ef4444"
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={5} fill="#1f2937" />
      <circle cx={cx} cy={cy} r={2.5} fill="#f9fafb" />

      {/* Time label */}
      {showLabels && (
        <text
          x={cx}
          y={cy + r * 0.55}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fontWeight="bold"
          fill="#6b7280"
        >
          {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
        </text>
      )}
    </svg>
  );
}
