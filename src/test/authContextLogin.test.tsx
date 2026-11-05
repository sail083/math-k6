import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const auth = vi.hoisted(() => ({
  getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  setSession: vi.fn(),
}));
const functions = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock('@/lib/supabase', () => ({ supabase: { auth, functions } }));

function LoginHarness() {
  const { login } = useAuth();
  return <button type="button" onClick={() => void login(' Student_A ', 'correct-password')}>登录</button>;
}

describe('identifier login', () => {
  beforeEach(() => {
    functions.invoke.mockReset();
    auth.setSession.mockReset();
  });

  it('uses the protected Edge Function and stores only the returned session tokens', async () => {
    functions.invoke.mockResolvedValueOnce({
      data: { access_token: 'access-token', refresh_token: 'refresh-token' },
      error: null,
    });
    auth.setSession.mockResolvedValueOnce({ error: null });

    render(<AuthProvider><LoginHarness /></AuthProvider>);
    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    await vi.waitFor(() => {
      expect(functions.invoke).toHaveBeenCalledWith('login-with-identifier', {
        body: { identifier: 'student_a', password: 'correct-password' },
      });
    });
    expect(auth.setSession).toHaveBeenCalledWith({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
  });

  it('does not create a session when the Edge Function rejects credentials', async () => {
    functions.invoke.mockResolvedValueOnce({ data: null, error: new Error('invalid_credentials') });

    render(<AuthProvider><LoginHarness /></AuthProvider>);
    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    await vi.waitFor(() => expect(functions.invoke).toHaveBeenCalled());
    expect(auth.setSession).not.toHaveBeenCalled();
  });
});
