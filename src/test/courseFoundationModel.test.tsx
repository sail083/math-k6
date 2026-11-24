import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CourseFoundationModel from '@/components/CourseFoundationModel';

describe('foundation model selection semantics', () => {
  it('exposes the active fraction operation', () => {
    render(<CourseFoundationModel type="g3-fraction-add-sub" />);
    const add = screen.getByRole('button', { name: '合并' });
    const subtract = screen.getByRole('button', { name: '拿走' });

    expect(add).toHaveAttribute('aria-pressed', 'true');
    expect(subtract).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(subtract);

    expect(add).toHaveAttribute('aria-pressed', 'false');
    expect(subtract).toHaveAttribute('aria-pressed', 'true');
  });
});
