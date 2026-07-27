import type { CSSProperties } from 'react';

export interface AreaGridProps {
  rows: number;
  cols: number;
  cellSize?: number;
  highlightCells?: Array<{ row: number; col: number }>;
  showCount?: boolean;
  showLabels?: boolean;
  fill?: string;
  stroke?: string;
  animated?: boolean;
  className?: string;
}

const ANIM_NAME = 'areagrid-cell-fadein';
const LABEL_PADDING = 28;

export default function AreaGrid({
  rows,
  cols,
  cellSize = 40,
  highlightCells = [],
  showCount = false,
  showLabels = false,
  fill = '#818cf8',
  stroke = '#d1d5db',
  animated = false,
  className,
}: AreaGridProps) {
  const padX = showLabels ? LABEL_PADDING : 0;
  const padY = showLabels ? LABEL_PADDING : 0;
  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;
  const svgWidth = gridWidth + padX;
  const svgHeight = gridHeight + padY;

  // Build highlight lookup map: "row,col" -> sequence index
  const highlightMap = new Map<string, number>();
  highlightCells.forEach((cell, idx) => {
    highlightMap.set(`${cell.row},${cell.col}`, idx);
  });

  // Generate all cells as a flat array
  const cellElements: Array<{
    key: string;
    x: number;
    y: number;
    isHighlighted: boolean;
    highlightIdx: number;
  }> = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const highlightIdx = highlightMap.get(key);
      const isHighlighted = highlightIdx !== undefined;
      cellElements.push({
        key,
        x: padX + c * cellSize,
        y: padY + r * cellSize,
        isHighlighted,
        highlightIdx: highlightIdx ?? 0,
      });
    }
  }

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      overflow="visible"
    >
      {animated && (
        <style>{`
          @keyframes ${ANIM_NAME} {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      )}

      {/* Row/column count labels */}
      {showLabels && (
        <>
          <text
            x={padX + gridWidth / 2}
            y={padY / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={14}
            fill="#6b7280"
            fontWeight="bold"
          >
            {cols} 列
          </text>
          <text
            x={padX / 2}
            y={padY + gridHeight / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={14}
            fill="#6b7280"
            fontWeight="bold"
            transform={`rotate(-90 ${padX / 2} ${padY + gridHeight / 2})`}
          >
            {rows} 行
          </text>
        </>
      )}

      {/* Grid cells */}
      {cellElements.map((cell) => {
        const style: CSSProperties = {};
        if (animated && cell.isHighlighted) {
          style.animationName = ANIM_NAME;
          style.animationDuration = '0.4s';
          style.animationFillMode = 'both';
          style.animationDelay = `${cell.highlightIdx * 0.08}s`;
        }

        return (
          <g key={cell.key} style={style}>
            <rect
              x={cell.x}
              y={cell.y}
              width={cellSize}
              height={cellSize}
              fill={cell.isHighlighted ? fill : 'none'}
              stroke={stroke}
              strokeWidth={1}
            />
            {showCount && cell.isHighlighted && (
              <text
                x={cell.x + cellSize / 2}
                y={cell.y + cellSize / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={cellSize * 0.4}
                fill="#ffffff"
                fontWeight="bold"
              >
                {cell.highlightIdx + 1}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
