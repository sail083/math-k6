import { useEffect, useState } from 'react';

export default function PwaUpdateNotice() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let active = true;

    const watchRegistration = (next: ServiceWorkerRegistration) => {
      if (!active) return;
      setRegistration(next);
      setHasUpdate(!!next.waiting);
      void next.update().catch(() => undefined);
      next.addEventListener('updatefound', () => {
        const worker = next.installing;
        worker?.addEventListener('statechange', () => {
          if (active && worker.state === 'installed' && navigator.serviceWorker.controller) {
            setHasUpdate(true);
          }
        });
      });
    };

    void navigator.serviceWorker.ready.then((next) => {
      if (next) watchRegistration(next);
    });

    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') void navigator.serviceWorker.getRegistration().then((next) => next?.update()).catch(() => undefined);
    };
    document.addEventListener('visibilitychange', refreshOnVisible);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
  }, []);

  if (!hasUpdate || !registration?.waiting) return null;

  return (
    <aside role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-indigo-200 bg-white p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
      <p className="text-sm font-semibold text-slate-800">新版本已准备好，更新后可避免旧版页面白屏。</p>
      <button
        type="button"
        disabled={refreshing}
        onClick={() => {
          setRefreshing(true);
          navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        }}
        className="min-h-11 shrink-0 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:bg-slate-400"
      >
        {refreshing ? '正在更新' : '立即更新'}
      </button>
    </aside>
  );
}
