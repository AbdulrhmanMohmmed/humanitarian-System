import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Application render error', error, info);
  }

  resetSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('hiaos_branding');
    window.location.href = '/login?reset=1';
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900" dir="rtl">
        <div className="w-full max-w-xl rounded-2xl border border-rose-100 bg-white p-6 shadow-xl">
          <p className="text-xs font-black uppercase text-rose-600">Application Error</p>
          <h1 className="mt-2 text-2xl font-black">تعذر تشغيل الواجهة</h1>
          <p className="mt-3 text-sm font-medium text-slate-600">
            حدث خطأ أثناء تحميل الواجهة. يمكن إعادة ضبط الجلسة المحلية ثم تسجيل الدخول من جديد.
          </p>
          <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-slate-950 p-4 text-left text-xs text-rose-100" dir="ltr">
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button onClick={this.resetSession} className="mt-5 h-11 rounded-xl bg-rose-600 px-5 text-sm font-black text-white hover:bg-rose-700">
            إعادة ضبط الجلسة وفتح تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }
}
