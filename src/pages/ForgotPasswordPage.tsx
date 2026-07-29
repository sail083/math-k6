import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!EMAIL_RE.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setSubmitting(true);
    const { error: resetError } = await resetPassword(email);
    setSubmitting(false);

    if (resetError) {
      setError(resetError);
      return;
    }

    setSent(true);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--color-title)' }}>
          重置密码
        </h1>
        <p className="text-center text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
          输入注册时使用的邮箱，我们将发送重置链接
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

        {sent ? (
          <div className="text-center py-6">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ background: '#f0fdf4', color: 'var(--color-success)' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 4 4L19 6" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-title)' }}>
              邮件已发送
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
              请查看 <strong>{email}</strong> 的收件箱，点击链接重置密码。
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              返回登录
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>
                邮箱地址
              </label>
              <input
                id="reset-email"
                type="email"
                placeholder="请输入注册时的邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--color-border)' }}
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-60"
              style={{ background: submitting ? 'var(--color-muted)' : 'var(--color-primary)' }}
            >
              {submitting ? '发送中...' : '发送重置链接'}
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-muted)' }}>
          <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
            返回登录
          </Link>
        </p>
      </div>
    </div>
  );
}
