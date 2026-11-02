import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[App] Render failed', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <section className="w-full max-w-md rounded-2xl border border-indigo-100 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-bold text-indigo-600">学习中心需要更新</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">刷新后继续学习</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">页面暂时无法显示，请联网后刷新重试。</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 min-h-11 rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200">
              刷新到最新版本
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
