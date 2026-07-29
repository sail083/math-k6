import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/* ---------- types ---------- */

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Phone + password login. Looks up email via get_email_by_phone RPC. */
  login: (phone: string, password: string) => Promise<{ error: string | null }>;
  /** Register with phone + password + email. Creates Supabase account with email. */
  register: (phone: string, password: string, email: string) => Promise<{ error: string | null }>;
  /** Send password reset email. */
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  /** Sign out. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ---------- provider ---------- */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes (handles session restore from storage)
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  /* ---- login ---- */
  const login = useCallback(async (phone: string, password: string) => {
    // Look up email by phone number via Supabase RPC
    const { data: email, error: rpcError } = await supabase.rpc(
      'get_email_by_phone',
      { phone_input: phone },
    );

    if (rpcError || !email) {
      return { error: '未找到该手机号对应的账户，请检查手机号或注册新账户。' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email as string,
      password,
    });

    if (error) {
      return { error: '手机号或密码不正确，请重试。' };
    }

    return { error: null };
  }, []);

  /* ---- register ---- */
  const register = useCallback(
    async (phone: string, password: string, email: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { phone },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: '该邮箱已被注册，请使用其他邮箱或直接登录。' };
        }
        return { error: `注册失败：${error.message}` };
      }

      return { error: null };
    },
    [],
  );

  /* ---- reset password ---- */
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      return { error: `发送重置邮件失败：${error.message}` };
    }

    return { error: null };
  }, []);

  /* ---- logout ---- */
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, login, register, resetPassword, logout }),
    [user, session, loading, login, register, resetPassword, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ---------- hook ---------- */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
