import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const MIN_PASSWORD_LENGTH = 8;

export default function UpdatePasswordPage() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`密码至少需要 ${MIN_PASSWORD_LENGTH} 位`);
    if (password !== confirmation) return setError('两次输入的密码不一致');

    setSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    setSubmitting(false);
    if (updateError) return setError('重置链接无效或已过期，请重新申请。');
    setSaved(true);
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold" style={{ color: 'var(--color-title)' }}>设置新密码</h1>
        <p className="mb-6 text-center text-sm" style={{ color: 'var(--color-muted)' }}>请设置一个至少 8 位的新密码。</p>
        {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}
        {saved ? (
          <div className="text-center">
            <p className="mb-6 text-sm font-medium text-green-700">密码已更新，现在可以用新密码登录。</p>
            <Link to="/login" className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white" style={{ background: 'var(--color-primary)' }}>前往登录</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold" style={{ color: 'var(--color-text)' }}>新密码
              <input aria-label="新密码" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required className="mt-1.5 h-12 w-full rounded-xl border px-4 text-sm" style={{ borderColor: 'var(--color-border)' }} />
            </label>
            <label className="block text-sm font-semibold" style={{ color: 'var(--color-text)' }}>确认新密码
              <input aria-label="确认新密码" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required className="mt-1.5 h-12 w-full rounded-xl border px-4 text-sm" style={{ borderColor: 'var(--color-border)' }} />
            </label>
            <button type="submit" disabled={submitting} className="h-12 w-full rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'var(--color-primary)' }}>{submitting ? '保存中...' : '保存新密码'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
