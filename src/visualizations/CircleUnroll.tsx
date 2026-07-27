export interface CircleUnrollProps {
  radius?: number;
  sectors?: number;
  mode?: 'area' | 'perimeter';
  progress?: number;
  className?: string;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPoint(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number,
) {
  return { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function CircleUnroll({
  radius = 60,
  sectors = 12,
  mode = 'area',
  progress = 0.5,
  className,
}: CircleUnrollProps) {
  if (mode === 'perimeter') {
    return (
      <PerimeterUnroll
        radius={radius}
        progress={progress}
        className={className}
      />
    );
  }

  const svgW = 320;
  const svgH = 200;
  const cx = 160;
  const cy = 100;
  const r = radius;
  const sectorAngle = 360 / sectors;
  const p = Math.max(0, Math.min(1, progress));

  // Rectangle form layout
  const arcWidth = (2 * Math.PI * r) / sectors;
  const totalWidth = (sectors / 2) * arcWidth;
  const rectX = cx - totalWidth / 2;
  const rectTop = cy - r / 2;
  const rectBottom = cy + r / 2;

  const sectorData = Array.from({ length: sectors }, (_, i) => {
    const angle1 = -90 + i * sectorAngle;
    const angle2 = -90 + (i + 1) * sectorAngle;

    // Circle form points
    const circleApex = { x: cx, y: cy };
    const circleP1 = polarToCartesian(cx, cy, r, angle1);
    const circleP2 = polarToCartesian(cx, cy, r, angle2);

    // Rectangle form points
    const slot = Math.floor(i / 2);
    const xLeft = rectX + slot * arcWidth;
    const xRight = rectX + (slot + 1) * arcWidth;
    const xMid = (xLeft + xRight) / 2;

    let rectApex, rectP1, rectP2;
    if (i % 2 === 0) {
      // Pointing up (apex at bottom)
      rectApex = { x: xMid, y: rectBottom };
      rectP1 = { x: xLeft, y: rectTop };
      rectP2 = { x: xRight, y: rectTop };
    } else {
      // Pointing down (apex at top)
      rectApex = { x: xMid, y: rectTop };
      rectP1 = { x: xLeft, y: rectBottom };
      rectP2 = { x: xRight, y: rectBottom };
    }

    return {
      key: i,
      apex: lerpPoint(circleApex, rectApex, p),
      p1: lerpPoint(circleP1, rectP1, p),
      p2: lerpPoint(circleP2, rectP2, p),
      color: i % 2 === 0 ? '#818cf8' : '#a5b4fc',
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
      {sectorData.map((s) => (
        <path
          key={s.key}
          d={`M ${s.apex.x},${s.apex.y} L ${s.p1.x},${s.p1.y} L ${s.p2.x},${s.p2.y} Z`}
          fill={s.color}
          stroke="#4f46e5"
          strokeWidth={0.8}
          opacity={0.85}
        />
      ))}

      {p > 0.8 && (
        <>
          <text
            x={cx}
            y={rectTop - 12}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fill="#6b7280"
          >
            πr
          </text>
          <text
            x={rectX - 16}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fill="#6b7280"
          >
            r
          </text>
        </>
      )}
    </svg>
  );
}

function PerimeterUnroll({
  radius,
  progress,
  className,
}: {
  radius: number;
  progress: number;
  className?: string;
}) {
  const svgW = 340;
  const svgH = 160;
  const cx = 120;
  const cy = 80;
  const r = radius;
  const p = Math.max(0, Math.min(1, progress));
  const circumference = 2 * Math.PI * r;

  // Line end x when fully unrolled
  const lineEndX = cx + circumference;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {/* Circle (fading as progress increases) */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#818cf8"
        strokeWidth={2}
        opacity={1 - p * 0.7}
      />
      {/* Radius line */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + r}
        y2={cy}
        stroke="#ef4444"
        strokeWidth={1.5}
        opacity={1 - p * 0.7}
      />
      <text
        x={cx + r / 2}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fill="#ef4444"
        opacity={1 - p * 0.7}
      >
        r
      </text>

      {/* Unrolled line */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + circumference * p}
        y2={cy}
        stroke="#818cf8"
        strokeWidth={2}
      />
      {p > 0.05 && (
        <>
          <line
            x1={cx}
            y1={cy - 6}
            x2={cx}
            y2={cy + 6}
            stroke="#6b7280"
            strokeWidth={1.5}
          />
          {p > 0.95 && (
            <line
              x1={lineEndX}
              y1={cy - 6}
              x2={lineEndX}
              y2={cy + 6}
              stroke="#6b7280"
              strokeWidth={1.5}
            />
          )}
          <text
            x={cx + (circumference * p) / 2}
            y={cy + 22}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fill="#4f46e5"
            fontWeight="bold"
          >
            2πr
          </text>
        </>
      )}
    </svg>
  );
}
