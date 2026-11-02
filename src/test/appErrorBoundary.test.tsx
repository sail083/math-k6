import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppErrorBoundary from '@/components/AppErrorBoundary';

function BrokenScreen(): never {
  throw new Error('stale lazy chunk');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AppErrorBoundary', () => {
  it('keeps a failed lazy route actionable instead of rendering a blank screen', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<AppErrorBoundary><BrokenScreen /></AppErrorBoundary>);

    expect(screen.getByRole('heading', { name: '刷新后继续学习' })).toBeVisible();
    expect(screen.getByRole('button', { name: '刷新到最新版本' })).toBeEnabled();
  });
});
