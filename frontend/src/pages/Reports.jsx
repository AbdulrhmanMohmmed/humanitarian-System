import { useState, useEffect } from 'react';
import api from '../services/api';
import { FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react';

const REPORT_TYPES = [
  { value: 'project_progress', label: 'تقرير تقدم المشاريع', icon: '📊' },
  { value: 'beneficiary_list', label: 'قائمة المستفيدين', icon: '👥' },
  { value: 'financial_summary', label: 'الملخص المالي', icon: '💰' },
  { value: 'indicator_tracking', label: 'تتبع المؤشرات', icon: '📈' },
  { value: 'survey_analysis', label: 'تحليل الاستبيانات', icon: '📋' },
];

const GOVERNORATES = [
  'صنعاء', 'عدن', 'تعز', 'الحديدة', 'إب', 'ذمار', 'حجة', 'عمران',
  'صعدة', 'المهرة', 'حضرموت', 'شبوة', 'أبين', 'لحج', 'الضالع',
  'البيضاء', 'مأرب', 'الجوف', 'ريمة', 'المحويت', 'سقطرى',
];

export default function Reports() {
  const [projects, setProjects] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [format, setFormat] = useState('excel');
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [formId, setFormId] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    api.get('/projects/').then(r => setProjects(r.data));
    api.get('/data-collection/forms').then(r => setForms(r.data));
  }, []);

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
        title: title || null,
      }, { responseType: 'blob' });

      const ext = format === 'excel' ? 'xlsx' : 'docx';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title || 'تقرير'}_${new Date().toISOString().split('T')[0]}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">توليد التقارير</h1>
          <p className="text-sm text-gray-500 mt-1">إنشاء تقارير احترافية بصيغة Excel أو Word</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Report Type Selection */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4">اختر نوع التقرير</h3>
            <div className="grid grid-cols-2 gap-3">
              {REPORT_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition text-right ${
                    selectedType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="font-medium text-gray-700">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedType && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-800 mb-4">خيارات التقرير</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">عنوان التقرير</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="عنوان التقرير (اختياري)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label>
                    <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">جميع المشاريع</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  {selectedType === 'beneficiary_list' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
                      <select value={governorate} onChange={e => setGovernorate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">جميع المحافظات</option>
                        {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  )}
                  {selectedType === 'survey_analysis' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">النموذج</label>
                      <select value={formId} onChange={e => setFormId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">اختر النموذج</option>
                        {forms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                {['project_progress', 'financial_summary', 'indicator_tracking'].includes(selectedType) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Format & Download */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-6">
            <h3 className="font-bold text-gray-800 mb-4">صيغة التقرير</h3>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setFormat('excel')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition ${
                  format === 'excel' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileSpreadsheet size={24} className="text-green-600" />
                <div className="text-right">
                  <p className="font-medium text-gray-700">Excel (.xlsx)</p>
                  <p className="text-xs text-gray-400">جداول بيانات مع تنسيق</p>
                </div>
              </button>
              <button
                onClick={() => setFormat('word')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition ${
                  format === 'word' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText size={24} className="text-blue-600" />
                <div className="text-right">
                  <p className="font-medium text-gray-700">Word (.docx)</p>
                  <p className="text-xs text-gray-400">تقرير نصي احترافي</p>
                </div>
              </button>
            </div>

            <button
              onClick={generateReport}
              disabled={!selectedType || loading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                selectedType && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> جاري التوليد...</>
              ) : (
                <><Download size={18} /> توليد وتحميل التقرير</>
              )}
            </button>

            {!selectedType && (
              <p className="text-xs text-gray-400 text-center mt-3">اختر نوع التقرير أولاً</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
