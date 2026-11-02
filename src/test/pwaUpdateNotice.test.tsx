import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PwaUpdateNotice from '@/components/PwaUpdateNotice';

afterEach(() => vi.unstubAllGlobals());

describe('PWA update notice', () => {
  it('offers an installed update and asks the waiting worker to activate', async () => {
    const postMessage = vi.fn();
    const registration = {
      waiting: { postMessage },
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
    };
    const serviceWorker = {
      ready: Promise.resolve(registration),
      controller: {},
      addEventListener: vi.fn(),
      getRegistration: vi.fn().mockResolvedValue(registration),
    };
    vi.stubGlobal('navigator', { ...navigator, serviceWorker });
    render(<PwaUpdateNotice />);
    fireEvent.click(await screen.findByRole('button', { name: '立即更新' }));
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(serviceWorker.addEventListener).toHaveBeenCalledWith('controllerchange', expect.any(Function), { once: true });
    expect(screen.getByRole('button', { name: '正在更新' })).toBeDisabled();
  });
});
