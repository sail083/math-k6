export interface ConeModelProps {
  radius?: number;
  height?: number;
  showComparison?: boolean;
  className?: string;
}

export default function ConeModel({
  radius = 40,
  height = 80,
  showComparison = false,
  className,
}: ConeModelProps) {
  if (showComparison) {
    return (
      <ConeComparison radius={radius} height={height} className={className} />
    );
  }

  const ry = radius * 0.28;
  const cx = 120;
  const topY = 50;
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
      {/* Cone body (triangle fill) */}
      <path
        d={`M ${cx},${topY} L ${cx - radius},${botY} L ${cx + radius},${botY} Z`}
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
      <line x1={cx} y1={topY} x2={cx - radius} y2={botY} stroke="#4f46e5" strokeWidth={1.5} />
      <line x1={cx} y1={topY} x2={cx + radius} y2={botY} stroke="#4f46e5" strokeWidth={1.5} />

      {/* Radius line */}
      <line x1={cx} y1={botY} x2={cx + radius} y2={botY} stroke="#ef4444" strokeWidth={1.5} />
      <text x={cx + radius / 2} y={botY + ry + 14} textAnchor="middle" fontSize={12} fill="#ef4444">
        r
      </text>

      {/* Height label (dashed center line) */}
      <line x1={cx} y1={topY} x2={cx} y2={botY} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3,3" />
      <text x={cx - 8} y={topY + height / 2} textAnchor="end" fontSize={12} fill="#6b7280">
        h
      </text>
    </svg>
  );
}

function ConeComparison({
  radius,
  height,
  className,
}: {
  radius: number;
  height: number;
  className?: string;
}) {
  const ry = radius * 0.28;
  const coneCx = 80;
  const cylCx = 220;
  const topY = 50;
  const botY = topY + height;
  const svgW = 320;
  const svgH = botY + ry + 40;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {/* === Cone === */}
      <path
        d={`M ${coneCx},${topY} L ${coneCx - radius},${botY} L ${coneCx + radius},${botY} Z`}
        fill="#e0e7ff"
        stroke="none"
      />
      <path
        d={`M ${coneCx - radius},${botY} A ${radius},${ry} 0 0,0 ${coneCx + radius},${botY}`}
        fill="#c7d2fe"
        stroke="#4f46e5"
        strokeWidth={1.5}
      />
      <path
        d={`M ${coneCx - radius},${botY} A ${radius},${ry} 0 0,1 ${coneCx + radius},${botY}`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth={1}
        strokeDasharray="4,3"
      />
      <line x1={coneCx} y1={topY} x2={coneCx - radius} y2={botY} stroke="#4f46e5" strokeWidth={1.5} />
      <line x1={coneCx} y1={topY} x2={coneCx + radius} y2={botY} stroke="#4f46e5" strokeWidth={1.5} />
      <text x={coneCx} y={botY + ry + 16} textAnchor="middle" fontSize={13} fill="#4f46e5" fontWeight="bold">
        圆锥
      </text>

      {/* === Cylinder === */}
      <rect x={cylCx - radius} y={topY} width={radius * 2} height={height} fill="#f3f4f6" stroke="none" />
      <ellipse cx={cylCx} cy={topY} rx={radius} ry={ry} fill="#d1d5db" stroke="#6b7280" strokeWidth={1.5} />
      <path
        d={`M ${cylCx - radius},${botY} A ${radius},${ry} 0 0,0 ${cylCx + radius},${botY}`}
        fill="#e5e7eb"
        stroke="#6b7280"
        strokeWidth={1.5}
      />
      <path
        d={`M ${cylCx - radius},${botY} A ${radius},${ry} 0 0,1 ${cylCx + radius},${botY}`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth={1}
        strokeDasharray="4,3"
      />
      <line x1={cylCx - radius} y1={topY} x2={cylCx - radius} y2={botY} stroke="#6b7280" strokeWidth={1.5} />
      <line x1={cylCx + radius} y1={topY} x2={cylCx + radius} y2={botY} stroke="#6b7280" strokeWidth={1.5} />
      <text x={cylCx} y={botY + ry + 16} textAnchor="middle" fontSize={13} fill="#6b7280" fontWeight="bold">
        圆柱
      </text>

      {/* Comparison label */}
      <text x={svgW / 2} y={topY - 18} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#4f46e5">
        V圆锥 = ⅓ × V圆柱
      </text>
    </svg>
  );
}
