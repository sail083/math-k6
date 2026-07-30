import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const PHONE_RE = /^1[3-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!PHONE_RE.test(phone)) {
      setError('请输入有效的11位手机号码');
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setSubmitting(true);
    const { error: regError } = await register(phone, password, email);
    setSubmitting(false);

    if (regError) {
      // If the message contains "确认邮箱", it's a success with email confirmation needed
      if (regError.includes('确认邮箱')) {
        setSuccess(regError);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      } else {
        setError(regError);
      }
      return;
    }

    // Email confirmation disabled — user is auto-logged in
    navigate('/', { replace: true });
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--color-title)' }}>
          注册新账户
        </h1>
        <p className="text-center text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
          创建账户，同步学习进度
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

        {success && (
          <div
            className="mb-4 p-3 rounded-lg text-sm font-medium"
            style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
            role="status"
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-phone" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
              手机号
            </label>
            <input
              id="reg-phone"
              type="tel"
              inputMode="numeric"
              maxLength={11}
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full h-12 px-4 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-border)' }}
              autoComplete="tel"
              required
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
              邮箱
            </label>
            <input
              id="reg-email"
              type="email"
              placeholder="请输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-border)' }}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
              密码
            </label>
            <input
              id="reg-password"
              type="password"
              placeholder="至少6个字符"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-border)' }}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
              确认密码
            </label>
            <input
              id="reg-confirm"
              type="password"
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-border)' }}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-60"
            style={{ background: submitting ? 'var(--color-muted)' : 'var(--color-primary)' }}
          >
            {submitting ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-muted)' }}>
          已有账户?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
