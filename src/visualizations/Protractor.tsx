export interface ProtractorProps {
  angle?: number;
  showAngle?: boolean;
  className?: string;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

export default function Protractor({
  angle = 60,
  showAngle = true,
  className,
}: ProtractorProps) {
  const svgW = 300;
  const svgH = 190;
  const cx = 150;
  const cy = 160;
  const r = 130;
  const innerR = r - 12;

  // Clamp angle to 0–180
  const ang = Math.max(0, Math.min(180, angle));
  const arcR = 30;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {/* Protractor body (semicircle) */}
      <path
        d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy} Z`}
        fill="#f3f4f6"
        stroke="#9ca3af"
        strokeWidth={1.5}
      />
      <path
        d={`M ${cx - innerR},${cy} A ${innerR},${innerR} 0 0,1 ${cx + innerR},${cy}`}
        fill="none"
        stroke="#d1d5db"
        strokeWidth={1}
      />

      {/* Degree ticks: major every 30°, minor every 10° */}
      {Array.from({ length: 19 }, (_, i) => {
        const deg = i * 10;
        const isMajor = deg % 30 === 0;
        const tickR1 = r;
        const tickR2 = isMajor ? innerR - 6 : innerR;
        const p1 = polar(cx, cy, tickR1, deg);
        const p2 = polar(cx, cy, tickR2, deg);
        return (
          <g key={`tick${deg}`}>
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#6b7280"
              strokeWidth={isMajor ? 1.5 : 1}
            />
            {isMajor && (
              <text
                x={polar(cx, cy, innerR - 14, deg).x}
                y={polar(cx, cy, innerR - 14, deg).y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                fill="#6b7280"
              >
                {deg}°
              </text>
            )}
          </g>
        );
      })}

      {/* Base line */}
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#6b7280" strokeWidth={1.5} />

      {/* Angle rays */}
      {/* Reference ray (along base, pointing right) */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + r * 0.75}
        y2={cy}
        stroke="#4f46e5"
        strokeWidth={2}
      />
      {/* Angle ray */}
      {(() => {
        const end = polar(cx, cy, r * 0.75, ang);
        return (
          <line
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="#ef4444"
            strokeWidth={2}
          />
        );
      })()}

      {/* Angle arc */}
      {(() => {
        const start = polar(cx, cy, arcR, 0);
        const end = polar(cx, cy, arcR, ang);
        const largeArc = ang > 180 ? 1 : 0;
        return (
          <path
            d={`M ${start.x},${start.y} A ${arcR},${arcR} 0 ${largeArc},0 ${end.x},${end.y}`}
            fill="none"
            stroke="#818cf8"
            strokeWidth={2}
          />
        );
      })()}

      {/* Angle label */}
      {showAngle && (
        <>
          {(() => {
            const arcR = 30;
            const midAng = ang / 2;
            const labelPos = polar(cx, cy, arcR + 16, midAng);
            return (
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={16}
                fontWeight="bold"
                fill="#4f46e5"
              >
                {ang}°
              </text>
            );
          })()}
        </>
      )}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill="#4f46e5" />
    </svg>
  );
}
