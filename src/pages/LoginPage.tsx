import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { isValidLoginIdentifier } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidLoginIdentifier(identifier)) {
      setError('请输入有效的用户名或11位手机号码');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }

    setSubmitting(true);
    const { error: loginError } = await login(identifier, password);
    setSubmitting(false);

    if (loginError) {
      setError(loginError);
      return;
    }

    navigate(from, { replace: true });
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--color-title)' }}>
          登录
        </h1>
        <p className="text-center text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
          使用用户名或手机号登录您的账户
        </p>

        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm font-medium"
            style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-identifier" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
              用户名或手机号
            </label>
            <input
              id="login-identifier"
              type="text"
              maxLength={32}
              placeholder="请输入用户名或手机号"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-border)' }}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
              密码
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-border)' }}
              autoComplete="current-password"
              required
              minLength={6}
            />
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              忘记密码?
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-60"
            style={{ background: submitting ? 'var(--color-muted)' : 'var(--color-primary)' }}
          >
            {submitting ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-muted)' }}>
          还没有账户?{' '}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}
