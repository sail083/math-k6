import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CourseMasteryModelC from '@/components/CourseMasteryModelC';

describe('mastery cuboid surface selection semantics', () => {
  it('exposes the active lid state', () => {
    render(<CourseMasteryModelC type="g5-cuboid-surface" />);
    const withLid = screen.getByRole('button', { name: '有盖' });
    const withoutLid = screen.getByRole('button', { name: '无盖' });

    expect(withLid).toHaveAttribute('aria-pressed', 'true');
    expect(withoutLid).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(withoutLid);

    expect(withLid).toHaveAttribute('aria-pressed', 'false');
    expect(withoutLid).toHaveAttribute('aria-pressed', 'true');
  });
});
