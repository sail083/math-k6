export interface BalanceScaleProps {
  leftWeight?: number;
  rightWeight?: number;
  showValues?: boolean;
  className?: string;
}

export default function BalanceScale({
  leftWeight = 5,
  rightWeight = 5,
  showValues = true,
  className,
}: BalanceScaleProps) {
  const svgW = 280;
  const svgH = 200;
  const cx = 140;
  const pivotY = 65;
  const beamHalf = 80;
  const stringLen = 30;
  const panRx = 30;
  const panRy = 8;

  const diff = rightWeight - leftWeight;
  const maxTilt = 15;
  const tiltDeg = Math.max(-maxTilt, Math.min(maxTilt, diff * 3));
  const tiltRad = (tiltDeg * Math.PI) / 180;

  const leftEnd = {
    x: cx - beamHalf * Math.cos(tiltRad),
    y: pivotY - beamHalf * Math.sin(tiltRad),
  };
  const rightEnd = {
    x: cx + beamHalf * Math.cos(tiltRad),
    y: pivotY + beamHalf * Math.sin(tiltRad),
  };

  const leftPan = { x: leftEnd.x, y: leftEnd.y + stringLen };
  const rightPan = { x: rightEnd.x, y: rightEnd.y + stringLen };

  const isBalanced = leftWeight === rightWeight;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {/* Base */}
      <polygon
        points={`${cx - 30},${svgH - 15} ${cx + 30},${svgH - 15} ${cx},${svgH - 40}`}
        fill="#9ca3af"
        stroke="#6b7280"
        strokeWidth={1.5}
      />
      {/* Stand */}
      <line x1={cx} y1={svgH - 40} x2={cx} y2={pivotY} stroke="#6b7280" strokeWidth={3} />
      {/* Pivot triangle */}
      <polygon
        points={`${cx - 12},${pivotY + 8} ${cx + 12},${pivotY + 8} ${cx},${pivotY - 4}`}
        fill="#6b7280"
      />

      {/* Beam */}
      <line
        x1={leftEnd.x}
        y1={leftEnd.y}
        x2={rightEnd.x}
        y2={rightEnd.y}
        stroke="#4f46e5"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Strings */}
      <line x1={leftEnd.x} y1={leftEnd.y} x2={leftPan.x} y2={leftPan.y} stroke="#9ca3af" strokeWidth={1.5} />
      <line x1={rightEnd.x} y1={rightEnd.y} x2={rightPan.x} y2={rightPan.y} stroke="#9ca3af" strokeWidth={1.5} />

      {/* Left pan */}
      <ellipse cx={leftPan.x} cy={leftPan.y} rx={panRx} ry={panRy} fill="#e0e7ff" stroke="#6366f1" strokeWidth={1.5} />
      <path
        d={`M ${leftPan.x - panRx},${leftPan.y} Q ${leftPan.x},${leftPan.y + 12} ${leftPan.x + panRx},${leftPan.y}`}
        fill="#c7d2fe"
        stroke="#6366f1"
        strokeWidth={1.5}
      />
      {/* Right pan */}
      <ellipse cx={rightPan.x} cy={rightPan.y} rx={panRx} ry={panRy} fill="#e0e7ff" stroke="#6366f1" strokeWidth={1.5} />
      <path
        d={`M ${rightPan.x - panRx},${rightPan.y} Q ${rightPan.x},${rightPan.y + 12} ${rightPan.x + panRx},${rightPan.y}`}
        fill="#c7d2fe"
        stroke="#6366f1"
        strokeWidth={1.5}
      />

      {/* Weight values */}
      {showValues && (
        <>
          <text
            x={leftPan.x}
            y={leftPan.y + 26}
            textAnchor="middle"
            fontSize={14}
            fontWeight="bold"
            fill={isBalanced ? '#16a34a' : '#1f2937'}
          >
            {leftWeight}
          </text>
          <text
            x={rightPan.x}
            y={rightPan.y + 26}
            textAnchor="middle"
            fontSize={14}
            fontWeight="bold"
            fill={isBalanced ? '#16a34a' : '#1f2937'}
          >
            {rightWeight}
          </text>
        </>
      )}

      {/* Status label */}
      <text
        x={cx}
        y={22}
        textAnchor="middle"
        fontSize={14}
        fontWeight="bold"
        fill={isBalanced ? '#16a34a' : '#ef4444'}
      >
        {isBalanced ? '⚖ 平衡' : leftWeight > rightWeight ? '左边重' : '右边重'}
      </text>
    </svg>
  );
}
