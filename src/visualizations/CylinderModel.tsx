export interface CylinderModelProps {
  radius?: number;
  height?: number;
  showUnfold?: boolean;
  className?: string;
}

export default function CylinderModel({
  radius = 40,
  height = 80,
  showUnfold = false,
  className,
}: CylinderModelProps) {
  if (showUnfold) {
    return <CylinderUnfold radius={radius} height={height} className={className} />;
  }

  const ry = radius * 0.28;
  const cx = 120;
  const topY = 60;
  const botY = topY + height;
  const svgW = 240;
  const svgH = botY + ry + 30;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {/* Side body (rectangle between ellipse centers) */}
      <rect
        x={cx - radius}
        y={topY}
        width={radius * 2}
        height={height}
        fill="#e0e7ff"
        stroke="none"
      />

      {/* Bottom back arc (dashed) */}
      <path
        d={`M ${cx - radius},${botY} A ${radius},${ry} 0 0,1 ${cx + radius},${botY}`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth={1.5}
        strokeDasharray="4,3"
      />
      {/* Bottom front arc (solid) */}
      <path
        d={`M ${cx - radius},${botY} A ${radius},${ry} 0 0,0 ${cx + radius},${botY}`}
        fill="#c7d2fe"
        stroke="#4f46e5"
        strokeWidth={1.5}
      />

      {/* Side edges */}
      <line x1={cx - radius} y1={topY} x2={cx - radius} y2={botY} stroke="#4f46e5" strokeWidth={1.5} />
      <line x1={cx + radius} y1={topY} x2={cx + radius} y2={botY} stroke="#4f46e5" strokeWidth={1.5} />

      {/* Top ellipse */}
      <ellipse
        cx={cx}
        cy={topY}
        rx={radius}
        ry={ry}
        fill="#a5b4fc"
        stroke="#4f46e5"
        strokeWidth={1.5}
      />

      {/* Radius label */}
      <line x1={cx} y1={topY} x2={cx + radius} y2={topY} stroke="#ef4444" strokeWidth={1.5} />
      <text x={cx + radius / 2} y={topY - 8} textAnchor="middle" fontSize={12} fill="#ef4444">
        r
      </text>

      {/* Height label */}
      <text x={cx + radius + 12} y={topY + height / 2} textAnchor="start" fontSize={12} fill="#6b7280">
        h={height}
      </text>
    </svg>
  );
}

function CylinderUnfold({
  radius,
  height,
  className,
}: {
  radius: number;
  height: number;
  className?: string;
}) {
  const circumference = 2 * Math.PI * radius;
  const rectW = circumference;
  const rectH = height;
  const cx = rectW / 2 + 20;
  const rectY = 80;
  const svgW = rectW + 40;
  const svgH = rectY + rectH + radius * 2 + 50;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {/* Top circle */}
      <ellipse cx={cx} cy={rectY - 20} rx={radius} ry={radius * 0.28} fill="#a5b4fc" stroke="#4f46e5" strokeWidth={1.5} />

      {/* Lateral surface (rectangle) */}
      <rect
        x={cx - rectW / 2}
        y={rectY}
        width={rectW}
        height={rectH}
        fill="#e0e7ff"
        stroke="#4f46e5"
        strokeWidth={1.5}
      />
      <text x={cx} y={rectY + rectH / 2} textAnchor="middle" dominantBaseline="central" fontSize={13} fill="#6b7280">
        2πr × h
      </text>

      {/* Bottom circle */}
      <ellipse cx={cx} cy={rectY + rectH + 20} rx={radius} ry={radius * 0.28} fill="#c7d2fe" stroke="#4f46e5" strokeWidth={1.5} />

      {/* Labels */}
      <text x={cx} y={rectY - 20 - radius * 0.28 - 12} textAnchor="middle" fontSize={12} fill="#6b7280">
        上底 πr²
      </text>
      <text x={cx} y={rectY + rectH + 20 + radius * 0.28 + 18} textAnchor="middle" fontSize={12} fill="#6b7280">
        下底 πr²
      </text>
    </svg>
  );
}
