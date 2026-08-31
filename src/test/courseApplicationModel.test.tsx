import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CourseApplicationModel, { type ApplicationModelType } from '@/components/CourseApplicationModel';

describe('batch A course application models', () => {
  it.each<ApplicationModelType>([
    'g3-smart-calculation',
    'g3-perimeter-area-puzzle',
    'g3-fraction-visual-reasoning',
    'g4-angle-shape-reasoning',
  ])('renders %s and updates its mathematical result', (type) => {
    const { unmount } = render(<CourseApplicationModel type={type} />);
    const result = screen.getByTestId('application-result');
    const before = result.textContent;
    const slider = screen.getAllByRole('slider')[0] as HTMLInputElement;
    const nextValue = Math.min(Number(slider.max), Number(slider.value) + Number(slider.step || 1));

    fireEvent.change(slider, { target: { value: String(nextValue) } });

    expect(result.textContent).not.toBe(before);
    unmount();
  });

  it('shows visibly different wholes when fraction comparison switches wholes', () => {
    render(<CourseApplicationModel type="g3-fraction-visual-reasoning" />);
    fireEvent.click(screen.getByRole('button', { name: '不同整体' }));

    const wholes = screen.getByRole('img').children;
    expect((wholes[0] as HTMLElement).style.width).toBe('100%');
    expect((wholes[1] as HTMLElement).style.width).toBe('70%');
  });

  it('keeps the cut diagram inside the original rectangle and responds to width', () => {
    render(<CourseApplicationModel type="g3-perimeter-area-puzzle" />);
    fireEvent.click(screen.getByRole('button', { name: '切割' }));

    const parts = screen.getByRole('img').children;
    expect((parts[0] as HTMLElement).style.width).toBe('120px');
    expect((parts[1] as HTMLElement).style.width).toBe('24px');
    expect((parts[0] as HTMLElement).style.height).toBe('72px');

    fireEvent.change(screen.getByRole('slider', { name: '图形的宽' }), { target: { value: '5' } });
    expect((parts[0] as HTMLElement).style.height).toBe('120px');
    expect((parts[1] as HTMLElement).style.height).toBe('120px');
  });
});
