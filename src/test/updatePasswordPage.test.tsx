import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UpdatePasswordPage from '@/pages/UpdatePasswordPage';

const updatePassword = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ updatePassword }),
}));

describe('UpdatePasswordPage', () => {
  it('rejects mismatched passwords and submits a valid replacement', async () => {
    render(<MemoryRouter><UpdatePasswordPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('新密码'), { target: { value: 'new-password' } });
    fireEvent.change(screen.getByLabelText('确认新密码'), { target: { value: 'different-password' } });
    fireEvent.click(screen.getByRole('button', { name: '保存新密码' }));
    expect(screen.getByRole('alert')).toHaveTextContent('两次输入的密码不一致');

    fireEvent.change(screen.getByLabelText('确认新密码'), { target: { value: 'new-password' } });
    fireEvent.click(screen.getByRole('button', { name: '保存新密码' }));
    expect(await screen.findByText('密码已更新，现在可以用新密码登录。')).toBeInTheDocument();
    expect(updatePassword).toHaveBeenCalledWith('new-password');
  });
});
