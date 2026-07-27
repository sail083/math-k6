export interface CoordinateGridProps {
  gridSize?: number;
  points?: Array<{ x: number; y: number }>;
  showLabels?: boolean;
  className?: string;
}

export default function CoordinateGrid({
  gridSize = 5,
  points = [{ x: 2, y: 3 }],
  showLabels = true,
  className,
}: CoordinateGridProps) {
  const unit = 36;
  const margin = 40;
  const originX = margin;
  const originY = margin + gridSize * unit;
  const svgW = margin + gridSize * unit + 30;
  const svgH = margin + gridSize * unit + 30;

  const toScreenX = (x: number) => originX + x * unit;
  const toScreenY = (y: number) => originY - y * unit;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      <defs>
        <marker id="cg-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#6b7280" />
        </marker>
      </defs>

      {/* Grid lines */}
      {Array.from({ length: gridSize + 1 }, (_, i) => (
        <g key={`v${i}`}>
          <line
            x1={originX + i * unit}
            y1={originY}
            x2={originX + i * unit}
            y2={originY - gridSize * unit}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
          <line
            x1={originX}
            y1={originY - i * unit}
            x2={originX + gridSize * unit}
            y2={originY - i * unit}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        </g>
      ))}

      {/* Axes */}
      <line
        x1={originX}
        y1={originY}
        x2={originX + gridSize * unit + 12}
        y2={originY}
        stroke="#6b7280"
        strokeWidth={2}
        markerEnd="url(#cg-arrow)"
      />
      <line
        x1={originX}
        y1={originY}
        x2={originX}
        y2={originY - gridSize * unit - 12}
        stroke="#6b7280"
        strokeWidth={2}
        markerEnd="url(#cg-arrow)"
      />

      {/* Axis labels */}
      {showLabels && (
        <>
          {Array.from({ length: gridSize + 1 }, (_, i) => (
            <g key={`lab${i}`}>
              <text
                x={originX + i * unit}
                y={originY + 16}
                textAnchor="middle"
                fontSize={11}
                fill="#6b7280"
              >
                {i}
              </text>
              {i > 0 && (
                <text
                  x={originX - 10}
                  y={originY - i * unit}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize={11}
                  fill="#6b7280"
                >
                  {i}
                </text>
              )}
            </g>
          ))}
          <text x={originX - 10} y={originY + 16} textAnchor="middle" fontSize={11} fill="#6b7280">0</text>
          <text x={svgW - 12} y={originY + 16} textAnchor="end" fontSize={12} fontWeight="bold" fill="#4f46e5">x</text>
          <text x={originX - 10} y={margin - 16} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#4f46e5">y</text>
        </>
      )}

      {/* Points */}
      {points.map((pt, i) => {
        const sx = toScreenX(pt.x);
        const sy = toScreenY(pt.y);
        return (
          <g key={`pt${i}`}>
            {/* Dashed guide lines */}
            <line x1={sx} y1={originY} x2={sx} y2={sy} stroke="#a5b4fc" strokeWidth={1} strokeDasharray="3,3" />
            <line x1={originX} y1={sy} x2={sx} y2={sy} stroke="#a5b4fc" strokeWidth={1} strokeDasharray="3,3" />
            {/* Point */}
            <circle cx={sx} cy={sy} r={6} fill="#818cf8" stroke="#fff" strokeWidth={2} />
            {showLabels && (
              <text
                x={sx + 10}
                y={sy - 8}
                textAnchor="start"
                fontSize={12}
                fontWeight="bold"
                fill="#4f46e5"
              >
                ({pt.x}, {pt.y})
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
