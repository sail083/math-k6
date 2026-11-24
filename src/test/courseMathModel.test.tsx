import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CourseMathModel from '@/components/CourseMathModel';

describe('math model selection semantics', () => {
  it('exposes the active trial-division example', () => {
    render(<CourseMathModel type="trial-division" />);
    const first = screen.getByRole('button', { name: '196 ÷ 39' });
    const second = screen.getByRole('button', { name: '84 ÷ 21' });
    expect(first).toHaveAttribute('aria-pressed', 'true');
    expect(second).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(second);
    expect(first).toHaveAttribute('aria-pressed', 'false');
    expect(second).toHaveAttribute('aria-pressed', 'true');
  });

  it('exposes the active decimal operation', () => {
    render(<CourseMathModel type="decimal-place-value" />);
    const add = screen.getByRole('button', { name: '小数加法' });
    const subtract = screen.getByRole('button', { name: '小数减法' });
    expect(add).toHaveAttribute('aria-pressed', 'true');
    expect(subtract).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(subtract);
    expect(add).toHaveAttribute('aria-pressed', 'false');
    expect(subtract).toHaveAttribute('aria-pressed', 'true');
  });

  it('exposes the active decimal-division scale', () => {
    render(<CourseMathModel type="decimal-quotient" />);
    const unchanged = screen.getByRole('button', { name: '1.2 ÷ 0.3' });
    const scaled = screen.getByRole('button', { name: '同时扩大 10 倍' });
    expect(unchanged).toHaveAttribute('aria-pressed', 'true');
    expect(scaled).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(scaled);
    expect(unchanged).toHaveAttribute('aria-pressed', 'false');
    expect(scaled).toHaveAttribute('aria-pressed', 'true');
  });
});
