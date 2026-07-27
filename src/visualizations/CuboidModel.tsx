export interface CuboidModelProps {
  length?: number;
  width?: number;
  height?: number;
  showGrid?: boolean;
  mode?: 'volume' | 'surface';
  className?: string;
}

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

export default function CuboidModel({
  length = 4,
  width = 3,
  height = 2,
  showGrid = true,
  mode = 'volume',
  className,
}: CuboidModelProps) {
  const scale = 24;
  const Ls = length * scale;
  const Hs = height * scale;
  const du = scale * COS30;
  const dv = scale * SIN30;
  const dx = width * du;
  const dy = width * dv;

  const x0 = 50;
  const y0 = 70;

  // Key points
  const fBL = { x: x0, y: y0 + Hs };
  const fBR = { x: x0 + Ls, y: y0 + Hs };
  const fTR = { x: x0 + Ls, y: y0 };
  const fTL = { x: x0, y: y0 };
  const bBL = { x: x0 + dx, y: y0 + Hs - dy };
  const bBR = { x: x0 + Ls + dx, y: y0 + Hs - dy };
  const bTR = { x: x0 + Ls + dx, y: y0 - dy };
  const bTL = { x: x0 + dx, y: y0 - dy };

  const svgW = x0 + Ls + dx + 50;
  const svgH = y0 + Hs + 40;

  const isVolume = mode === 'volume';
  const frontFill = isVolume ? '#e0e7ff' : '#fca5a5';
  const topFill = isVolume ? '#c7d2fe' : '#f87171';
  const rightFill = isVolume ? '#a5b4fc' : '#ef4444';

  // Grid lines
  const gridLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

  if (showGrid) {
    // Front face: vertical (along length) and horizontal (along height)
    for (let i = 1; i < length; i++) {
      gridLines.push({ x1: x0 + i * scale, y1: y0, x2: x0 + i * scale, y2: y0 + Hs });
    }
    for (let j = 1; j < height; j++) {
      gridLines.push({ x1: x0, y1: y0 + j * scale, x2: x0 + Ls, y2: y0 + j * scale });
    }
    // Top face: along length and width
    for (let i = 1; i < width; i++) {
      gridLines.push({
        x1: x0 + i * du, y1: y0 - i * dv,
        x2: x0 + Ls + i * du, y2: y0 - i * dv,
      });
    }
    for (let j = 1; j < length; j++) {
      gridLines.push({
        x1: x0 + j * scale, y1: y0,
        x2: x0 + j * scale + dx, y2: y0 - dy,
      });
    }
    // Right face: along width and height
    for (let i = 1; i < width; i++) {
      gridLines.push({
        x1: x0 + Ls + i * du, y1: y0 - i * dv,
        x2: x0 + Ls + i * du, y2: y0 + Hs - i * dv,
      });
    }
    for (let j = 1; j < height; j++) {
      gridLines.push({
        x1: x0 + Ls, y1: y0 + j * scale,
        x2: x0 + Ls + dx, y2: y0 + j * scale - dy,
      });
    }
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {/* Top face */}
      <polygon
        points={`${fTL.x},${fTL.y} ${fTR.x},${fTR.y} ${bTR.x},${bTR.y} ${bTL.x},${bTL.y}`}
        fill={topFill}
        stroke="#4f46e5"
        strokeWidth={1.5}
      />
      {/* Right face */}
      <polygon
        points={`${fTR.x},${fTR.y} ${fBR.x},${fBR.y} ${bBR.x},${bBR.y} ${bTR.x},${bTR.y}`}
        fill={rightFill}
        stroke="#4f46e5"
        strokeWidth={1.5}
      />
      {/* Front face */}
      <polygon
        points={`${fBL.x},${fBL.y} ${fBR.x},${fBR.y} ${fTR.x},${fTR.y} ${fTL.x},${fTL.y}`}
        fill={frontFill}
        stroke="#4f46e5"
        strokeWidth={1.5}
      />

      {/* Grid lines */}
      {gridLines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="#6366f1"
          strokeWidth={0.6}
          opacity={0.5}
        />
      ))}

      {/* Hidden edges (dashed) */}
      <line x1={fBL.x} y1={fBL.y} x2={bBL.x} y2={bBL.y} stroke="#9ca3af" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={bBL.x} y1={bBL.y} x2={bBR.x} y2={bBR.y} stroke="#9ca3af" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={bBL.x} y1={bBL.y} x2={bTL.x} y2={bTL.y} stroke="#9ca3af" strokeWidth={1} strokeDasharray="4,3" />

      {/* Dimension labels */}
      <text x={x0 + Ls / 2} y={y0 + Hs + 18} textAnchor="middle" fontSize={13} fill="#6b7280">
        长 {length}
      </text>
      <text x={x0 + Ls + dx / 2 + 12} y={y0 + Hs - dy / 2 + 5} textAnchor="start" fontSize={13} fill="#6b7280">
        宽 {width}
      </text>
      <text x={x0 - 14} y={y0 + Hs / 2} textAnchor="middle" fontSize={13} fill="#6b7280" transform={`rotate(-90 ${x0 - 14} ${y0 + Hs / 2})`}>
        高 {height}
      </text>

      {/* Formula */}
      <text x={svgW / 2} y={svgH - 6} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#4f46e5">
        {isVolume
          ? `V = ${length}×${width}×${height} = ${length * width * height}`
          : `S = 2(${length}×${width}+${length}×${height}+${width}×${height}) = ${2 * (length * width + length * height + width * height)}`}
      </text>
    </svg>
  );
}
