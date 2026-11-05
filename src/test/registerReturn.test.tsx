import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

const auth = vi.hoisted(() => ({ register: vi.fn() }));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ register: auth.register }),
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}{location.hash}</output>;
}

function fillRegistrationForm() {
  fireEvent.change(screen.getByLabelText('手机号'), { target: { value: '13800138000' } });
  fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'student@example.com' } });
  fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'correct-pass' } });
  fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: 'correct-pass' } });
  fireEvent.click(screen.getByRole('button', { name: '注册' }));
}

describe('registration return path', () => {
  beforeEach(() => auth.register.mockReset());
  afterEach(() => vi.useRealTimers());

  it('keeps a protected course URL when login directs a new learner to register', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: '/math/kp/g3-fraction-intro', search: '?target=frac.notation', hash: '#practice' } } }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<><RegisterPage /><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: '立即注册' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/register');
    expect(screen.getByRole('heading', { name: '注册新账户' })).toBeInTheDocument();
  });

  it('returns an auto-signed-in learner to the original course URL', async () => {
    auth.register.mockResolvedValue({ error: null });
    render(
      <MemoryRouter initialEntries={[{ pathname: '/register', state: { from: { pathname: '/math/kp/g3-fraction-intro', search: '?target=frac.notation', hash: '#practice' } } }]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/math/kp/g3-fraction-intro" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fillRegistrationForm();

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/math/kp/g3-fraction-intro?target=frac.notation#practice'));
  });

  it('rejects a password that cannot satisfy the production password policy', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes><Route path="/register" element={<RegisterPage />} /></Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('手机号'), { target: { value: '13800138000' } });
    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'student@example.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'short7!' } });
    fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: 'short7!' } });
    fireEvent.click(screen.getByRole('button', { name: '注册' }));

    expect(screen.getByRole('alert')).toHaveTextContent('密码至少需要8个字符');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('returns an email-confirmation signup to login with its original target', async () => {
    vi.useFakeTimers();
    auth.register.mockResolvedValue({ error: '注册成功！请检查邮箱中的确认邮件，确认后即可登录。' });
    render(
      <MemoryRouter initialEntries={[{ pathname: '/register', state: { from: { pathname: '/math/map', search: '?target=frac.notation', hash: '#path' } } }]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => fillRegistrationForm());
    expect(screen.getByRole('status')).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });

    expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '立即注册' })).toBeInTheDocument();
  });
});
