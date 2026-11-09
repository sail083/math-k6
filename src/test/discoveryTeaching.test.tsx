import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import DiscoveryLesson from '@/components/DiscoveryLesson';
import CourseGeometryModel from '@/components/CourseGeometryModel';
import { getKnowledgePointById } from '@/lib/content';
import { buildDiscoveryContent } from '@/lib/learningContent';

describe('reviewed mathematics discovery', () => {
  it('measures from the right-facing zero ray rather than displaying the supplementary angle', () => {
    render(<CourseGeometryModel type="g4-angle-measure" />);
    for (const angle of [10, 60, 90, 120, 170]) {
      fireEvent.change(screen.getByRole('slider'), { target: { value: angle } });
      const svg = screen.getByRole('img', { name: `量角器测得${angle}度` });
      const ray = svg.querySelector('.geo-ray')!;
      const x = Number(ray.getAttribute('x2')) - Number(ray.getAttribute('x1'));
      const y = Number(ray.getAttribute('y1')) - Number(ray.getAttribute('y2'));
      expect(Math.atan2(y, x) * 180 / Math.PI).toBeCloseTo(angle, 8);
      const arc = svg.querySelector('.geo-arc')!.getAttribute('d')!.split(' ').slice(-2).map(Number);
      expect(Math.atan2(205 - arc[1], arc[0] - 200) * 180 / Math.PI).toBeCloseTo(angle, 8);
    }
  });
  it('renders all triangle vertices with measured angles matching their labels and classification', () => {
    render(<CourseGeometryModel type="g4-triangle" />);
    expect(screen.getByRole('button', { name: '锐角三角形' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '直角三角形' })).toHaveAttribute('aria-pressed', 'false');
    for (const kind of ['锐角', '直角', '钝角']) {
      const button = screen.getByRole('button', { name: `${kind}三角形` });
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'true');
      const svg = screen.getByRole('img', { name: new RegExp(`^${kind}三角形`) });
      const points = svg.querySelector('polygon')!.getAttribute('points')!.split(' ').map(point => point.split(',').map(Number));
      const labels = Array.from(svg.querySelectorAll('text')).slice(1);
      const measured = points.map(([x, y], index) => {
        const u = [points[(index + 1) % 3][0] - x, points[(index + 1) % 3][1] - y];
        const v = [points[(index + 2) % 3][0] - x, points[(index + 2) % 3][1] - y];
        const angle = Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))))) * 180 / Math.PI;
        expect(angle).toBeCloseTo(parseFloat(labels[index].textContent!), 8);
        expect(Number(labels[index].getAttribute('x'))).toBeCloseTo(x, 8);
        expect(Number(labels[index].getAttribute('y')) - y).toBe(index === 2 ? -12 : 24);
        return angle;
      });
      expect(measured.reduce((sum, angle) => sum + angle, 0)).toBeCloseTo(180, 8);
      const largest = Math.max(...measured);
      if (kind === '锐角') expect(largest).toBeLessThan(90);
      else if (kind === '直角') expect(largest).toBeCloseTo(90, 8);
      else expect(largest).toBeGreaterThan(90);
    }
  });
  it('exposes the active area transformation step to assistive technology', () => {
    render(<CourseGeometryModel type="g5-parallelogram-area" />);
    const original = screen.getByRole('button', { name: '原图' });
    const cut = screen.getByRole('button', { name: '切开' });
    expect(original).toHaveAttribute('aria-pressed', 'true');
    expect(cut).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(cut);
    expect(original).toHaveAttribute('aria-pressed', 'false');
    expect(cut).toHaveAttribute('aria-pressed', 'true');
  });
  it.each(['g6-proportion', 'g4-triangle', 'g5-fraction-meaning', 'g3-fraction-compare', 'g3-fraction-add-sub', 'g3-fraction-intro'])('%s checks understanding without a visible answer sketch', (id) => {
    const meta = getKnowledgePointById(id)!.meta;
    const content = buildDiscoveryContent(meta, '');
    const onComplete = vi.fn();
    render(<DiscoveryLesson meta={meta} explanation="" prediction="先观察" interactionCount={2} onComplete={onComplete} onStartChallenge={vi.fn()} />);
    for (let step = 0; step < 3; step++) fireEvent.click(screen.getByRole('button', { name: /继续学习/ }));
    expect(screen.getByRole('heading', { name: content.check!.prompt })).toBeVisible();
    expect(screen.queryByLabelText(`${meta.title}概念关系图`)).not.toBeInTheDocument();
    const choices = within(document.querySelector('.retrieval-check') as HTMLElement).getAllByRole('button');
    fireEvent.click(choices.find((item) => item.textContent !== content.check!.correctAnswer)!);
    fireEvent.click(screen.getByRole('button', { name: '看看选得对不对' }));
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: content.check!.correctAnswer }));
    fireEvent.click(screen.getByRole('button', { name: '看看选得对不对' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
