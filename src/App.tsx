import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProgressProvider } from '@/context/ProgressContext';
import ProtectedRoute from '@/components/ProtectedRoute';

const Layout = lazy(() => import('@/components/Layout'));
const LearningCenterPage = lazy(() => import('@/pages/LearningCenterPage'));
const LanguageSubjectPage = lazy(() => import('@/pages/LanguageSubjectPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const GradePage = lazy(() => import('@/pages/GradePage'));
const KnowledgePointPage = lazy(() => import('@/pages/KnowledgePointPage'));
const ProgressDashboard = lazy(() => import('@/pages/ProgressDashboard'));
const KnowledgeMapPage = lazy(() => import('@/pages/KnowledgeMapPage'));
const SkillRepairPage = lazy(() => import('@/pages/SkillRepairPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));

const SuspenseFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-slate-400">加载中...</div>
  </div>
);

function MathShell() {
  return (
    <ProtectedRoute>
      <Layout><Outlet /></Layout>
    </ProtectedRoute>
  );
}

function AuthShell() {
  return (
    <div className="app-frame flex min-h-screen flex-col">
      <main id="main-content" className="app-main flex items-center justify-center">
        <div className="w-full"><Outlet /></div>
      </main>
    </div>
  );
}

function ProgressScope({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return <ProgressProvider key={user?.id ?? 'signed-out'}>{children}</ProgressProvider>;
}

export function LegacyMathRedirect() {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`/math${pathname}${search}${hash}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProgressScope>
          <Suspense fallback={<SuspenseFallback />}>
            <Routes>
              <Route path="/" element={<ProtectedRoute><LearningCenterPage /></ProtectedRoute>} />
              <Route path="/chinese" element={<ProtectedRoute><LanguageSubjectPage subject="chinese" /></ProtectedRoute>} />
              <Route path="/chinese/:lessonId" element={<ProtectedRoute><LanguageSubjectPage subject="chinese" /></ProtectedRoute>} />
              <Route path="/english" element={<ProtectedRoute><LanguageSubjectPage subject="english" /></ProtectedRoute>} />
              <Route path="/english/:lessonId" element={<ProtectedRoute><LanguageSubjectPage subject="english" /></ProtectedRoute>} />
              <Route path="/math" element={<MathShell />}>
                <Route index element={<HomePage />} />
                <Route path="grade/:grade" element={<GradePage />} />
                <Route path="kp/:id" element={<KnowledgePointPage />} />
                <Route path="dashboard" element={<ProgressDashboard />} />
                <Route path="map" element={<KnowledgeMapPage />} />
                <Route path="repair/:skillId" element={<SkillRepairPage />} />
              </Route>

              {/* ponytail: keep one compatibility hop until existing math links move under /math. */}
              <Route path="/grade/*" element={<LegacyMathRedirect />} />
              <Route path="/kp/*" element={<LegacyMathRedirect />} />
              <Route path="/dashboard" element={<LegacyMathRedirect />} />
              <Route path="/map" element={<LegacyMathRedirect />} />
              <Route path="/repair/*" element={<LegacyMathRedirect />} />

              <Route element={<AuthShell />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ProgressScope>
      </AuthProvider>
    </BrowserRouter>
  );
}
