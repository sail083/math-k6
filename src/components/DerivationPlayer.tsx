import { useState, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { Derivation, ShapeSpec, LabelSpec } from '@/lib/types';
import AreaGrid from '@/visualizations/AreaGrid';

export interface DerivationPlayerProps {
  derivation: Derivation;
  className?: string;
}

// ===== Shape rendering =====

function renderShape(shape: ShapeSpec, isHighlighted: boolean): ReactNode {
  if (shape.visible === false) return null;

  const baseStyle: CSSProperties = {
    fill: shape.fill ?? 'none',
    stroke: shape.stroke ?? 'none',
    strokeWidth: shape.strokeWidth ?? 1,
    opacity: shape.opacity ?? 1,
    transition: 'all 0.4s ease-in-out',
  };

  if (isHighlighted) {
    baseStyle.filter = 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.6))';
  }

  // Build SVG transform string
  let transform = shape.transform ?? '';
  if (shape.rotation) {
    const cx = (shape.x ?? 0) + (shape.width ?? 0) / 2;
    const cy = (shape.y ?? 0) + (shape.height ?? 0) / 2;
    transform = `rotate(${shape.rotation} ${cx} ${cy}) ${transform}`;
  }

  switch (shape.type) {
    case 'grid': {
      const cols = shape.cols ?? 1;
      const rows = shape.rows ?? 1;
      const cellSize = shape.cellSize ?? 40;
      const showLabels = shape.data?.showLabels === true;
      const labelPad = showLabels ? 28 : 0;
      const totalW = cols * cellSize + labelPad;
      const totalH = rows * cellSize + labelPad;
      return (
        <svg
          key={shape.id}
          x={shape.x ?? 0}
          y={shape.y ?? 0}
          width={totalW}
          height={totalH}
          viewBox={`0 0 ${totalW} ${totalH}`}
          overflow="visible"
        >
          <AreaGrid
            rows={rows}
            cols={cols}
            cellSize={cellSize}
            highlightCells={shape.highlightCells}
            showCount={shape.showCount ?? false}
            showLabels={showLabels}
            fill={shape.fill}
            stroke={shape.stroke}
            animated={shape.data?.animated === true}
          />
        </svg>
      );
    }

    case 'rect':
      return (
        <rect
          key={shape.id}
          x={shape.x ?? 0}
          y={shape.y ?? 0}
          width={shape.width ?? 0}
          height={shape.height ?? 0}
          rx={shape.radius}
          transform={transform || undefined}
          style={baseStyle}
        />
      );

    case 'triangle':
    case 'parallelogram':
    case 'trapezoid': {
      const pointsStr = shape.points?.map((p) => `${p.x},${p.y}`).join(' ') ?? '';
      return (
        <polygon
          key={shape.id}
          points={pointsStr}
          transform={transform || undefined}
          style={baseStyle}
        />
      );
    }

    case 'circle':
      return (
        <circle
          key={shape.id}
          cx={shape.x ?? 0}
          cy={shape.y ?? 0}
          r={shape.radius ?? 0}
          transform={transform || undefined}
          style={baseStyle}
        />
      );

    case 'line':
    case 'arrow': {
      // Determine line endpoints
      let x1: number, y1: number, x2: number, y2: number;
      if (shape.points && shape.points.length >= 2) {
        x1 = shape.points[0].x;
        y1 = shape.points[0].y;
        x2 = shape.points[1].x;
        y2 = shape.points[1].y;
      } else {
        x1 = shape.x ?? 0;
        y1 = shape.y ?? 0;
        x2 = x1 + (shape.width ?? 0);
        y2 = y1 + (shape.height ?? 0);
      }

      if (shape.type === 'arrow') {
        const arrowColor = shape.stroke ?? shape.fill ?? '#4f46e5';
        const markerId = `arrow-${shape.id}`;
        return (
          <g key={shape.id}>
            <defs>
              <marker
                id={markerId}
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill={arrowColor} />
              </marker>
            </defs>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={shape.stroke ?? '#4f46e5'}
              strokeWidth={shape.strokeWidth ?? 2}
              markerEnd={`url(#${markerId})`}
              transform={transform || undefined}
              style={baseStyle}
            />
          </g>
        );
      }

      return (
        <line
          key={shape.id}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          transform={transform || undefined}
          style={baseStyle}
        />
      );
    }

    case 'text': {
      const anchorVal = shape.data?.anchor;
      const textAnchor =
        anchorVal === 'start' || anchorVal === 'middle' || anchorVal === 'end'
          ? anchorVal
          : 'middle';
      return (
        <text
          key={shape.id}
          x={shape.x ?? 0}
          y={shape.y ?? 0}
          textAnchor={textAnchor}
          dominantBaseline="central"
          fontSize={shape.fontSize ?? 14}
          fill={shape.textFill ?? shape.fill ?? '#374151'}
          transform={transform || undefined}
          style={baseStyle}
        >
          {shape.text}
        </text>
      );
    }

    default:
      return null;
  }
}

function renderLabel(label: LabelSpec, index: number): ReactNode {
  return (
    <text
      key={label.id ?? `label-${index}`}
      x={label.x}
      y={label.y}
      textAnchor={label.anchor ?? 'middle'}
      dominantBaseline="central"
      fontSize={label.fontSize ?? 14}
      fill={label.fill ?? '#374151'}
    >
      {label.text}
    </text>
  );
}

// ===== Component =====

export default function DerivationPlayer({ derivation, className }: DerivationPlayerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const steps = derivation.steps;
  const totalSteps = steps.length;
  const step = steps[currentStep];
  const scene = step?.scene;
  const highlightIds = scene?.highlight;

  // Auto-play: advance every 3s, pause at last step
  useEffect(() => {
    if (!isAutoPlaying || !isVisible) return;
    if (currentStep >= totalSteps - 1) {
      setIsAutoPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [isAutoPlaying, isVisible, currentStep, totalSteps]);

  // Reset to step 0 when derivation changes
  useEffect(() => {
    setCurrentStep(0);
    setIsAutoPlaying(false);
  }, [derivation]);

  // IntersectionObserver: pause auto-play when off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goToStep = (index: number) => {
    setCurrentStep(Math.max(0, Math.min(index, totalSteps - 1)));
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    goToStep(currentStep - 1);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    goToStep(currentStep + 1);
  };

  const handleAutoPlay = () => {
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(0);
    }
    setIsAutoPlaying((prev) => !prev);
  };

  const handleReplay = () => {
    setIsAutoPlaying(false);
    setCurrentStep(0);
  };

  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div ref={containerRef} className={`derivation-player ${className ?? ''}`}>

      {/* Progress indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-gray-500 tabular-nums">
            第 {currentStep + 1} / {totalSteps} 步
          </span>
          <span className="lesson-kicker"><span className={`signal-dot ${isAutoPlaying ? 'is-live' : ''}`} /> {isAutoPlaying ? '正在演示' : '等待操作'}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Derivation title */}
      <h3 className="text-lg font-bold text-indigo-700 mb-3">{derivation.title}</h3>

      {/* Step title */}
      {step && (
        <h4 className="text-base font-semibold text-gray-800 mb-3">{step.title}</h4>
      )}

      {/* SVG Scene rendering area */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4 flex items-center justify-center min-h-[300px]">
        {scene ? (
          <svg
            viewBox="0 0 400 300"
            preserveAspectRatio="xMidYMid meet"
            className="w-full max-w-md"
          >
            <g key={currentStep} className="derivation-step-enter">
              {scene.shapes.map((shape) =>
                renderShape(shape, highlightIds?.includes(shape.id) ?? false),
              )}
              {scene.labels.map((label, idx) => renderLabel(label, idx))}
            </g>
          </svg>
        ) : (
          <p className="text-gray-400 text-sm">暂无场景内容</p>
        )}
      </div>

      {/* Narration text */}
      {step?.narration && (
        <p className="text-gray-700 mb-3 leading-relaxed">{step.narration}</p>
      )}

      {/* Formula display */}
      {scene?.formula && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4 text-center">
          <code className="text-xl font-mono text-indigo-700">{scene.formula}</code>
        </div>
      )}

      {/* Hint */}
      {step?.hint && (
        <p className="text-sm text-gray-500 italic mb-3">💡 {step.hint}</p>
      )}

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStep === 0}
          aria-label="上一步"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          上一步
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentStep >= totalSteps - 1}
          aria-label="下一步"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
        >
          下一步
        </button>
        <button
          type="button"
          onClick={handleAutoPlay}
          aria-label={isAutoPlaying ? '暂停自动播放' : '自动播放'}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
        >
          {isAutoPlaying ? '暂停' : '自动播放'}
        </button>
        <button
          type="button"
          onClick={handleReplay}
          aria-label="重播"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          重播
        </button>
      </div>
    </div>
  );
}
