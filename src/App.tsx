import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProgressProvider } from '@/context/ProgressContext';
import Layout from '@/components/Layout';

const HomePage = lazy(() => import('@/pages/HomePage'));
const GradePage = lazy(() => import('@/pages/GradePage'));
const KnowledgePointPage = lazy(() => import('@/pages/KnowledgePointPage'));
const ProgressDashboard = lazy(() => import('@/pages/ProgressDashboard'));

const SuspenseFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-slate-400">加载中...</div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <ProgressProvider>
        <Layout>
          <Suspense fallback={<SuspenseFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/grade/:grade" element={<GradePage />} />
              <Route path="/kp/:id" element={<KnowledgePointPage />} />
              <Route path="/dashboard" element={<ProgressDashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </ProgressProvider>
    </BrowserRouter>
  );
}
