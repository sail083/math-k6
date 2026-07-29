import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProgressProvider } from '@/context/ProgressContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

const HomePage = lazy(() => import('@/pages/HomePage'));
const GradePage = lazy(() => import('@/pages/GradePage'));
const KnowledgePointPage = lazy(() => import('@/pages/KnowledgePointPage'));
const ProgressDashboard = lazy(() => import('@/pages/ProgressDashboard'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));

const SuspenseFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-slate-400">加载中...</div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProgressProvider>
          <Layout>
            <Suspense fallback={<SuspenseFallback />}>
              <Routes>
                <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/grade/:grade" element={<ProtectedRoute><GradePage /></ProtectedRoute>} />
                <Route path="/kp/:id" element={<ProtectedRoute><KnowledgePointPage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><ProgressDashboard /></ProtectedRoute>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        </ProgressProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
