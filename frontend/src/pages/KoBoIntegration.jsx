import { useState, useEffect } from 'react';
import { Upload, Download, Link, FileSpreadsheet, CheckCircle2, ExternalLink } from 'lucide-react';
import api from '../services/api';

export default function KoBoIntegration() {
  const [forms, setForms] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [exportResult, setExportResult] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);

  useEffect(() => {
    api.get('/data-collection/forms').then(r => setForms(r.data || [])).catch(() => {});
    api.get('/kobo/connection-test').then(r => setConnectionStatus(r.data)).catch(() => {});
  }, []);

  const exportForm = async (formId) => {
    try {
      const res = await api.get(`/kobo/export-xlsform/${formId}`);
      setExportResult(res.data);
      setSelectedForm(formId);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FileSpreadsheet size={28} /> تكامل KoBoToolbox</h1>
      </div>

      {connectionStatus && (
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={20} className="text-green-400" />
            <h2 className="text-lg font-semibold text-white">حالة التكامل: {connectionStatus.status === 'ready' ? 'جاهز' : 'غير متصل'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-gray-400 text-sm">الإصدارات المدعومة</p>
              {connectionStatus.supported_versions?.map((v, i) => <p key={i} className="text-white text-sm">{v}</p>)}
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-gray-400 text-sm">صيغ التصدير</p>
              {connectionStatus.export_formats?.map((f, i) => <p key={i} className="text-white text-sm">{f}</p>)}
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-gray-400 text-sm">صيغ الاستيراد</p>
              {connectionStatus.import_formats?.map((f, i) => <p key={i} className="text-white text-sm">{f}</p>)}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Download size={18} /> تصدير إلى KoBo (XLSForm)</h2>
          {forms.length === 0 ? (
            <p className="text-gray-400 text-center py-4">لا توجد نماذج. أنشئ نموذجاً أولاً.</p>
          ) : (
            <div className="space-y-3">
              {forms.map(f => (
                <div key={f.id} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{f.title}</h3>
                    <p className="text-gray-400 text-sm">{f.status}</p>
                  </div>
                  <button onClick={() => exportForm(f.id)} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-white text-sm flex items-center gap-1">
                    <Download size={14} /> تصدير XLSForm
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Upload size={18} /> استيراد من KoBo</h2>
          <div className="text-gray-300 space-y-3 text-sm">
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="font-medium text-white mb-2">خطوات الاستيراد:</p>
              <p>1. اذهب إلى KoBoToolbox واختر النموذج</p>
              <p>2. اختر Data → Downloads → JSON</p>
              <p>3. انسخ رابط API من Settings</p>
              <p>4. استخدم POST /api/kobo/import-submissions/form_id</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="font-medium text-white mb-2">الروابط المفيدة:</p>
              <a href="https://kf.kobotoolbox.org" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline"><ExternalLink size={14} /> KoBoToolbox</a>
              <a href="https://support.kobotoolbox.org/api.html" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline mt-1"><ExternalLink size={14} /> KoBo API Documentation</a>
            </div>
          </div>
        </div>
      </div>

      {exportResult && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">نتيجة التصدير - {exportResult.form_title}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-700 rounded-lg p-3"><p className="text-gray-400 text-sm">معرف النموذج</p><p className="text-white">{exportResult.form_id}</p></div>
            <div className="bg-gray-700 rounded-lg p-3"><p className="text-gray-400 text-sm">عدد الأسئلة</p><p className="text-white">{exportResult.survey?.length || 0}</p></div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3">
            <p className="text-gray-400 text-sm mb-2">تعليمات</p>
            {exportResult.instructions && Object.entries(exportResult.instructions).map(([k, v]) => (
              <p key={k} className="text-white text-sm py-1"><span className="text-blue-400">{k}:</span> {v}</p>
            ))}
          </div>
          <details className="mt-3">
            <summary className="text-blue-400 cursor-pointer text-sm">عرض هيكل XLSForm (JSON)</summary>
            <pre className="bg-gray-900 rounded-lg p-3 mt-2 text-green-400 text-xs overflow-x-auto max-h-60 overflow-y-auto">{JSON.stringify(exportResult.survey, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
