import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CourseAdvancedModel from '@/components/CourseAdvancedModel';

describe('advanced model selection semantics', () => {
  it('exposes the active operation law', () => {
    render(<CourseAdvancedModel type="operation-laws" />);
    const exchange = screen.getByRole('button', { name: '交换' });
    const associate = screen.getByRole('button', { name: '结合' });
    const distribute = screen.getByRole('button', { name: '分配' });

    expect(exchange).toHaveAttribute('aria-pressed', 'false');
    expect(associate).toHaveAttribute('aria-pressed', 'false');
    expect(distribute).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(exchange);

    expect(exchange).toHaveAttribute('aria-pressed', 'true');
    expect(associate).toHaveAttribute('aria-pressed', 'false');
    expect(distribute).toHaveAttribute('aria-pressed', 'false');
  });
});
