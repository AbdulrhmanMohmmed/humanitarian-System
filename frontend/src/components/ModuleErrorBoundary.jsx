import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ModuleErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error(`[${this.props.moduleName || 'Module'}] Error:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const moduleName = this.props.moduleName || 'الوحدة';

    return (
      <div className="flex items-center justify-center p-8" dir="rtl">
        <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
            <div>
              <h3 className="text-lg font-bold text-amber-900">خطأ في {moduleName}</h3>
              <p className="mt-1 text-sm text-amber-700">
                حدث خطأ أثناء تحميل هذا القسم. يمكنك المحاولة مرة أخرى أو العودة للرئيسية.
              </p>
            </div>
          </div>

          <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-slate-900 p-3 text-left text-xs text-amber-200" dir="ltr">
            {this.state.error?.message || String(this.state.error)}
          </pre>

          <div className="mt-4 flex gap-3">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </button>
            <a
              href="/"
              className="flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100"
            >
              <Home className="h-4 w-4" />
              الرئيسية
            </a>
          </div>
        </div>
      </div>
    );
  }
}
