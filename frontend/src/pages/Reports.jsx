import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import {
  Download,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Loader2,
  RadioTower,
  ShieldCheck,
} from 'lucide-react';

const REPORT_TYPES = [
  { value: 'project_progress', label: 'تقرير تقدم المشاريع', description: 'المشاريع، الميزانية، المؤشرات، ونسب الإنجاز.' },
  { value: 'beneficiary_list', label: 'قائمة المستفيدين', description: 'كشف مستفيدين قابل للتصفية حسب المحافظة.' },
  { value: 'financial_summary', label: 'الملخص المالي', description: 'الإيرادات، المصروفات، الرصيد، وتفاصيل المعاملات.' },
  { value: 'indicator_tracking', label: 'تتبع المؤشرات IPTT', description: 'المستهدف مقابل الفعلي ونسب الإنجاز.' },
  { value: 'distribution_report', label: 'تقرير التوزيعات', description: 'التوزيعات والمستلمين وحالة الاستلام.' },
  { value: 'survey_analysis', label: 'تحليل الاستبيانات', description: 'تحليل نماذج جمع البيانات والاستجابات.' },
];

const GOVERNORATES = [
  'صنعاء', 'عدن', 'تعز', 'الحديدة', 'إب', 'ذمار', 'حجة', 'عمران',
  'صعدة', 'المهرة', 'حضرموت', 'شبوة', 'أبين', 'لحج', 'الضالع',
  'البيضاء', 'مأرب', 'الجوف', 'ريمة', 'المحويت', 'سقطرى',
];

const STANDARD_EXPORTS = [
  { key: 'ocha', label: 'OCHA 5W Matrix', icon: FileSpreadsheet, endpoint: '/reports/export-ocha-5w', fileName: 'OCHA_5W_Report.xlsx' },
  { key: 'iati', label: 'IATI XML', icon: FileCode2, endpoint: '/reports/export-iati', fileName: 'IATI_Export.xml' },
];

export default function Reports() {
  const [projects, setProjects] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [standardLoading, setStandardLoading] = useState('');
  const [selectedType, setSelectedType] = useState('project_progress');
  const [format, setFormat] = useState('excel');
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [formId, setFormId] = useState('');
  const [title, setTitle] = useState('');
  const [cfmPreview, setCfmPreview] = useState(null);

  useEffect(() => {
    api.get('/projects/').then((r) => setProjects(r.data)).catch(() => {});
    api.get('/data-collection/forms').then((r) => setForms(r.data)).catch(() => {});
    api.get('/reports/generate-cfm').then((r) => setCfmPreview(r.data)).catch(() => {});
  }, []);

  const selected = useMemo(() => REPORT_TYPES.find((item) => item.value === selectedType), [selectedType]);

  const downloadBlob = (data, fileName) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const generateReport = async () => {
    if (!selectedType) return;
    setLoading(true);
    try {
      const res = await api.post('/reports/generate', {
        report_type: selectedType,
        format,
        project_id: projectId ? parseInt(projectId) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        governorate: governorate || null,
        form_id: formId ? parseInt(formId) : null,
        title: title || selected?.label || 'تقرير',
      }, { responseType: 'blob' });

      const ext = format === 'excel' ? 'xlsx' : 'docx';
      downloadBlob(res.data, `${title || selected?.label || 'تقرير'}_${new Date().toISOString().split('T')[0]}.${ext}`);
    } finally {
      setLoading(false);
    }
  };

  const exportStandard = async (item) => {
    setStandardLoading(item.key);
    try {
      const res = await api.get(item.endpoint, { responseType: 'blob' });
      downloadBlob(res.data, item.fileName);
    } finally {
      setStandardLoading('');
    }
  };

  const loadCfmPreview = async () => {
    const res = await api.get('/reports/generate-cfm', {
      params: { project_id: projectId || undefined },
    });
    setCfmPreview(res.data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">مركز التقارير والتصدير</h1>
        <p className="mt-1 text-sm text-gray-500">تقارير تشغيلية قابلة للتنزيل، مع صادرات معيارية للجهات الإنسانية والمانحين.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-5">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-gray-800">اختر نوع التقرير</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`rounded-xl border-2 p-4 text-right transition ${
                    selectedType === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className="font-bold text-gray-800">{type.label}</p>
                  <p className="mt-1 text-xs text-gray-500">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-gray-800">خيارات التقرير</h3>
            <div className="space-y-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان التقرير" className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid gap-3 md:grid-cols-2">
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">جميع المشاريع</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {selectedType === 'beneficiary_list' && (
                  <select value={governorate} onChange={(e) => setGovernorate(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">جميع المحافظات</option>
                    {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                )}
                {selectedType === 'survey_analysis' && (
                  <select value={formId} onChange={(e) => setFormId(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">اختر النموذج</option>
                    {forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
                  </select>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-800"><RadioTower size={18} /> صادرات معيارية جاهزة</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {STANDARD_EXPORTS.map((item) => (
                <button key={item.key} onClick={() => exportStandard(item)} className="flex items-center justify-between rounded-xl border p-4 text-right transition hover:border-blue-300 hover:bg-blue-50">
                  <div className="flex items-center gap-3">
                    <item.icon className="text-blue-600" size={24} />
                    <div>
                      <p className="font-bold text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.fileName}</p>
                    </div>
                  </div>
                  {standardLoading === item.key ? <Loader2 className="animate-spin text-blue-600" size={18} /> : <Download size={18} className="text-gray-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-gray-800">صيغة التقرير</h3>
            <div className="mb-6 space-y-3">
              <button onClick={() => setFormat('excel')} className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 transition ${format === 'excel' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <FileSpreadsheet size={24} className="text-green-600" />
                <div className="text-right"><p className="font-medium text-gray-700">Excel (.xlsx)</p><p className="text-xs text-gray-400">جداول قابلة للتحليل</p></div>
              </button>
              <button onClick={() => setFormat('word')} className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 transition ${format === 'word' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <FileText size={24} className="text-blue-600" />
                <div className="text-right"><p className="font-medium text-gray-700">Word (.docx)</p><p className="text-xs text-gray-400">تقرير سردي جاهز</p></div>
              </button>
            </div>
            <button onClick={generateReport} disabled={!selectedType || loading} className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-medium transition ${selectedType && !loading ? 'bg-blue-600 text-white hover:bg-blue-700' : 'cursor-not-allowed bg-gray-200 text-gray-400'}`}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> جاري التوليد...</> : <><Download size={18} /> توليد وتحميل التقرير</>}
            </button>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-indigo-900"><ShieldCheck size={18} /> ملخص CFM مباشر</h3>
            <div className="space-y-2 text-sm text-indigo-900">
              <div className="flex justify-between"><span>إجمالي الشكاوى</span><b>{cfmPreview?.total_complaints ?? '-'}</b></div>
              <div className="flex justify-between"><span>حالات حساسة</span><b>{cfmPreview?.sensitive_cases ?? '-'}</b></div>
              <div className="flex justify-between"><span>متوسط الإغلاق</span><b>{cfmPreview?.avg_resolution_days ?? '-'} يوم</b></div>
            </div>
            <button onClick={loadCfmPreview} className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-sm font-bold text-white">تحديث المعاينة</button>
          </div>
        </div>
      </div>
    </div>
  );
}
