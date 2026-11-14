import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ColumnArithmeticLab from '@/components/ColumnArithmeticLab';

describe('column arithmetic lab selection semantics', () => {
  it('exposes the active operation and calculation step', () => {
    render(<ColumnArithmeticLab />);
    const addition = screen.getByRole('button', { name: '进位加法' });
    const subtraction = screen.getByRole('button', { name: '退位减法' });
    const firstStep = screen.getByRole('button', { name: '查看第 1 步' });
    const secondStep = screen.getByRole('button', { name: '查看第 2 步' });

    expect(addition).toHaveAttribute('aria-pressed', 'true');
    expect(subtraction).toHaveAttribute('aria-pressed', 'false');
    expect(firstStep).toHaveAttribute('aria-pressed', 'true');
    expect(secondStep).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(secondStep);
    expect(firstStep).toHaveAttribute('aria-pressed', 'false');
    expect(secondStep).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(subtraction);
    expect(addition).toHaveAttribute('aria-pressed', 'false');
    expect(subtraction).toHaveAttribute('aria-pressed', 'true');
    expect(firstStep).toHaveAttribute('aria-pressed', 'true');
    expect(secondStep).toHaveAttribute('aria-pressed', 'false');
  });
});
