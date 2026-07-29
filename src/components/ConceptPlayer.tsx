import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import type { KnowledgePointMeta } from '@/lib/types';
import type { VizDemoProps } from '@/visualizations/registry';

interface ConceptPlayerProps {
  meta: KnowledgePointMeta;
  visualization?: ComponentType<VizDemoProps>;
  onInteract?: () => void;
}

export default function ConceptPlayer({ meta, visualization: Visualization, onInteract }: ConceptPlayerProps) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const steps = meta.objectives.length > 0 ? meta.objectives : ['观察图形变化', '总结数学规律'];

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      setStep((current) => {
        if (current >= steps.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [playing, step, steps.length]);

  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [meta.id]);

  const togglePlayback = () => {
    if (!playing && step === steps.length - 1) setStep(0);
    setPlaying((value) => !value);
    onInteract?.();
  };

  return (
    <div className="concept-player">
      <div className="concept-player__head">
        <div>
          <p className="lesson-kicker"><span className={`signal-dot ${playing ? 'is-live' : ''}`} /> {Visualization ? '动态演示' : '关键推理'}</p>
          <h3>{Visualization ? `${meta.title}是怎样变化的？` : `${meta.title}的思考路径`}</h3>
        </div>
        <span className="step-counter">STEP {step + 1} / {steps.length}</span>
      </div>

      <div className="concept-stage" aria-live="polite">
        {Visualization ? (
          <div key={`${meta.id}-${step}`} className="concept-visual">
            <Visualization step={step} stepCount={steps.length} />
          </div>
        ) : (
          <div className="principle-focus"><span>{step + 1}</span><p>{steps[step]}</p></div>
        )}
      </div>

      <div className="observation-line">
        <span>观察焦点</span>
        <p>{steps[step]}</p>
      </div>

      <div className="player-controls">
        <button type="button" aria-label="上一步" onClick={() => { setPlaying(false); setStep((value) => Math.max(0, value - 1)); onInteract?.(); }} disabled={step === 0} className="icon-control">←</button>
        <button type="button" onClick={togglePlayback} className="primary-control">
          {playing ? '暂停演示' : step === steps.length - 1 ? '重新演示' : '自动演示'}
        </button>
        <button type="button" aria-label="下一步" onClick={() => { setPlaying(false); setStep((value) => Math.min(steps.length - 1, value + 1)); onInteract?.(); }} disabled={step === steps.length - 1} className="icon-control">→</button>
      </div>
    </div>
  );
}
