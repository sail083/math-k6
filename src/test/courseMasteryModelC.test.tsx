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

describe('mastery circle area selection semantics', () => {
  it('exposes the active sector count', () => {
    render(<CourseMasteryModelC type="g6-circle-area" />);
    const eight = screen.getByRole('button', { name: '8 等分' });
    const sixteen = screen.getByRole('button', { name: '16 等分' });
    const thirtyTwo = screen.getByRole('button', { name: '32 等分' });
    const sixtyFour = screen.getByRole('button', { name: '64 等分' });

    expect(eight).toHaveAttribute('aria-pressed', 'false');
    expect(sixteen).toHaveAttribute('aria-pressed', 'true');
    expect(thirtyTwo).toHaveAttribute('aria-pressed', 'false');
    expect(sixtyFour).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(sixtyFour);

    expect(eight).toHaveAttribute('aria-pressed', 'false');
    expect(sixteen).toHaveAttribute('aria-pressed', 'false');
    expect(thirtyTwo).toHaveAttribute('aria-pressed', 'false');
    expect(sixtyFour).toHaveAttribute('aria-pressed', 'true');
  });
});
