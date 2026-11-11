import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CourseConceptModel from '@/components/CourseConceptModel';

describe('concept model selection semantics', () => {
  it.each([
    ['measurement-lab', '长度', '质量'],
    ['fraction-compare-model', '同分母', '同分子'],
    ['line-relations', '平行', '垂直'],
    ['quadrilateral-constraints', '平行四边形', '梯形'],
    ['probability-experiment', '20次', '100次'],
  ] as const)('exposes the active selection for %s', (type, initialName, nextName) => {
    render(<CourseConceptModel type={type} />);
    const initial = screen.getByRole('button', { name: initialName });
    const next = screen.getByRole('button', { name: nextName });
    expect(initial).toHaveAttribute('aria-pressed', 'true');
    expect(next).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(next);
    expect(initial).toHaveAttribute('aria-pressed', 'false');
    expect(next).toHaveAttribute('aria-pressed', 'true');
  });
});
