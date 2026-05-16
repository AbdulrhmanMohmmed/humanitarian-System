import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { useBulkImport } from '../hooks/useModuleApi';
import api from '../services/api';

const ENTITIES = [
  { value: 'beneficiaries', label: 'المستفيدون' },
  { value: 'projects', label: 'المشاريع' },
  { value: 'grants', label: 'المنح' },
  { value: 'transactions', label: 'المعاملات المالية' },
];

export default function BulkOperationsPage() {
  const [tab, setTab] = useState('export');
  const [exportEntity, setExportEntity] = useState('beneficiaries');
  const [exportFormat, setExportFormat] = useState('json');
  const [importEntity, setImportEntity] = useState('beneficiaries');
  const [exportData, setExportData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

  const bulkImport = useBulkImport();

  const handleExport = async () => {
    setExportLoading(true);
    setExportData(null);
    try {
      const { data } = await api.get(`/bulk/export/${exportEntity}`, { params: { format: exportFormat } });
      setExportData(data);
      if (exportFormat === 'csv' && typeof data === 'string') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${exportEntity}_export.csv`; a.click();
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${exportEntity}_export.json`; a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      setExportData({ error: e.response?.data?.detail || e.message });
    } finally { setExportLoading(false); }
  };

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    try {
      const result = await bulkImport.mutateAsync({ entityType: importEntity, file });
      setImportResult(result);
    } catch (e) {
      setImportResult({ error: e.response?.data?.detail || e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Database className="w-8 h-8 text-slate-600" /><h1 className="text-2xl font-bold">العمليات المجمّعة (استيراد/تصدير)</h1></div>

      <div className="flex gap-2 border-b border-[var(--border)]">
        {[{ id: 'export', label: 'تصدير البيانات', icon: Download }, { id: 'import', label: 'استيراد البيانات', icon: Upload }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 ${tab === t.id ? 'border-slate-600 text-slate-600' : 'border-transparent text-[var(--text-secondary)]'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'export' && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] space-y-4">
            <h3 className="font-semibold">تصدير البيانات</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">نوع البيانات</label>
                <select value={exportEntity} onChange={e => setExportEntity(e.target.value)} className="border border-[var(--border)] rounded-lg px-3 py-2 w-full">
                  {ENTITIES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">صيغة التصدير</label>
                <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="border border-[var(--border)] rounded-lg px-3 py-2 w-full">
                  <option value="json">JSON</option><option value="csv">CSV</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={handleExport} disabled={exportLoading}
                  className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 w-full flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> {exportLoading ? 'جاري التصدير...' : 'تصدير'}
                </button>
              </div>
            </div>
          </div>
          {exportData && (
            <div className={`p-4 rounded-xl border ${exportData.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              {exportData.error ? (
                <div className="flex items-center gap-2 text-red-700"><AlertCircle className="w-5 h-5" /> خطأ: {exportData.error}</div>
              ) : (
                <div className="flex items-center gap-2 text-green-700"><CheckCircle className="w-5 h-5" /> تم التصدير بنجاح — {Array.isArray(exportData) ? exportData.length : exportData.count || 0} سجل</div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'import' && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] space-y-4">
            <h3 className="font-semibold">استيراد البيانات</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">نوع البيانات</label>
                <select value={importEntity} onChange={e => setImportEntity(e.target.value)} className="border border-[var(--border)] rounded-lg px-3 py-2 w-full">
                  {ENTITIES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">اختر ملف (CSV/JSON)</label>
                <input type="file" ref={fileRef} accept=".csv,.json" className="border border-[var(--border)] rounded-lg px-3 py-1.5 w-full text-sm" />
              </div>
              <div className="flex items-end">
                <button onClick={handleImport} disabled={bulkImport.isPending}
                  className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 w-full flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> {bulkImport.isPending ? 'جاري الاستيراد...' : 'استيراد'}
                </button>
              </div>
            </div>
          </div>
          {importResult && (
            <div className={`p-4 rounded-xl border ${importResult.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              {importResult.error ? (
                <div className="flex items-center gap-2 text-red-700"><AlertCircle className="w-5 h-5" /> خطأ: {importResult.error}</div>
              ) : (
                <div className="flex items-center gap-2 text-green-700"><CheckCircle className="w-5 h-5" /> تم الاستيراد بنجاح — {importResult.imported || importResult.count || 0} سجل</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
