import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Activity, BarChart3, History, Plus, Ruler, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import CustomFieldsForm from '../components/CustomFieldsForm';
import CustomizeModuleButton from '../components/CustomizeModuleButton';
import { useCustomization, renderCustomFieldValue } from '../hooks/useCustomization';

const TODAY = new Date().toISOString().slice(0, 10);

export default function Monitoring() {
  const [indicators, setIndicators] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [projects, setProjects] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [tab, setTab] = useState('indicators');
  const [showIndModal, setShowIndModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [indForm, setIndForm] = useState({ name: '', code: '', type: 'output', unit: '', target_value: 0, project_id: '', baseline: 0, frequency: 'شهري', custom_values: {} });
  const [surveyForm, setSurveyForm] = useState({ title: '', description: '', project_id: '', start_date: '', end_date: '' });
  const [measurementForm, setMeasurementForm] = useState({ value: '', date: TODAY, governorate: '', district: '', notes: '' });
  const { fields: customFields } = useCustomization('indicator');

  const load = () => {
    api.get('/monitoring/indicators').then((r) => setIndicators(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_indicators');
      if (local) setIndicators(JSON.parse(local));
    });
    api.get('/monitoring/surveys').then((r) => setSurveys(r.data)).catch(() => {});
    api.get('/projects/').then((r) => setProjects(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_projects');
      if (local) setProjects(JSON.parse(local));
    });
  };

  useEffect(() => {
    load();
  }, []);

  const loadMeasurements = async (indicator) => {
    setSelectedIndicator(indicator);
    setMeasurementForm({ value: '', date: TODAY, governorate: '', district: '', notes: '' });
    const res = await api.get(`/monitoring/measurements?indicator_id=${indicator.id}`);
    setMeasurements(res.data);
    setShowMeasurementModal(true);
  };

  const submitInd = async (e) => {
    e.preventDefault();
    await api.post('/monitoring/indicators', {
      ...indForm,
      target_value: parseFloat(indForm.target_value || 0),
      baseline: parseFloat(indForm.baseline || 0),
      project_id: parseInt(indForm.project_id),
    });
    setShowIndModal(false);
    setIndForm({ name: '', code: '', type: 'output', unit: '', target_value: 0, project_id: '', baseline: 0, frequency: 'شهري', custom_values: {} });
    load();
  };

  const submitMeasurement = async (e) => {
    e.preventDefault();
    await api.post('/monitoring/measurements', {
      indicator_id: selectedIndicator.id,
      value: parseFloat(measurementForm.value || 0),
      date: measurementForm.date,
      governorate: measurementForm.governorate || null,
      district: measurementForm.district || null,
      notes: measurementForm.notes || null,
    });
    await loadMeasurements(selectedIndicator);
    load();
  };

  const submitSurvey = async (e) => {
    e.preventDefault();
    await api.post('/monitoring/surveys', {
      ...surveyForm,
      project_id: surveyForm.project_id ? parseInt(surveyForm.project_id) : null,
      start_date: surveyForm.start_date || null,
      end_date: surveyForm.end_date || null,
    });
    setShowSurveyModal(false);
    setSurveyForm({ title: '', description: '', project_id: '', start_date: '', end_date: '' });
    load();
  };

  const chartData = indicators.map((indicator) => ({
    name: indicator.name.length > 20 ? `${indicator.name.substring(0, 20)}...` : indicator.name,
    المستهدف: indicator.target_value,
    الفعلي: indicator.actual_value,
  }));

  const measurementSummary = useMemo(() => {
    const latest = measurements[0];
    const total = measurements.reduce((sum, item) => sum + Number(item.value || 0), 0);
    return { latest, total };
  }, [measurements]);

  const indColumns = [
    { key: 'code', label: 'الرمز' },
    { key: 'name', label: 'المؤشر' },
    { key: 'type', label: 'النوع', render: (v) => <StatusBadge status={v} /> },
    { key: 'unit', label: 'الوحدة' },
    { key: 'target_value', label: 'المستهدف', render: (v) => Number(v || 0).toLocaleString() },
    {
      key: 'actual_value',
      label: 'الفعلي',
      render: (v, row) => {
        const pct = row.target_value > 0 ? (Number(v || 0) / row.target_value) * 100 : 0;
        return (
          <div className="flex items-center gap-2">
            <span>{Number(v || 0).toLocaleString()}</span>
            <div className="h-2 w-16 rounded-full bg-gray-200">
              <div className={`h-2 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
          </div>
        );
      },
    },
    { key: 'frequency', label: 'التكرار' },
    ...customFields.filter((field) => field.is_searchable).slice(0, 2).map((field) => ({
      key: `custom_${field.field_key}`,
      label: field.label_ar || field.label,
      render: (_, row) => renderCustomFieldValue(field, row.custom_values?.[field.field_key]),
    })),
  ];

  const surveyColumns = [
    { key: 'title', label: 'العنوان' },
    { key: 'description', label: 'الوصف' },
    { key: 'total_responses', label: 'الاستجابات' },
    { key: 'is_active', label: 'الحالة', render: (v) => <span className={`rounded-full px-2 py-0.5 text-xs ${v ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{v ? 'نشط' : 'منتهي'}</span> },
    { key: 'start_date', label: 'البداية' },
    { key: 'end_date', label: 'النهاية' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">المتابعة والمؤشرات (IPTT)</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">إدارة المؤشرات والقياسات الدورية والاستبيانات الميدانية للمشاريع.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CustomizeModuleButton entity="indicator" className="h-11" />
          <button onClick={() => setShowIndModal(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
            <Plus size={18} /> مؤشر جديد
          </button>
          <button onClick={() => setShowSurveyModal(true)} className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700">
            <Plus size={18} /> استبيان جديد
          </button>
        </div>
      </div>

      {indicators.length > 0 && (
        <div className="glass-card mb-8 rounded-2xl border border-slate-200/60 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">أداء المؤشرات: المستهدف مقابل الفعلي</h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="المستهدف" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="الفعلي" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mb-6 flex w-fit gap-3 rounded-xl bg-slate-200/50 p-1.5">
        <button onClick={() => setTab('indicators')} className={`rounded-lg px-5 py-2 text-sm font-bold transition-all duration-300 ${tab === 'indicators' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>المؤشرات ({indicators.length})</button>
        <button onClick={() => setTab('surveys')} className={`rounded-lg px-5 py-2 text-sm font-bold transition-all duration-300 ${tab === 'surveys' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>الاستبيانات الميدانية ({surveys.length})</button>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl border border-slate-200/60">
        {tab === 'indicators' && (
          <DataTable
            columns={indColumns}
            data={indicators}
            actions={[{ label: 'تسجيل قياس', icon: Ruler, className: 'text-emerald-600 hover:bg-emerald-500/10', onClick: loadMeasurements }]}
            onDelete={async (id) => { await api.delete(`/monitoring/indicators/${id}`); load(); }}
          />
        )}
        {tab === 'surveys' && <DataTable columns={surveyColumns} data={surveys} onDelete={async (id) => { await api.delete(`/monitoring/surveys/${id}`); load(); }} />}
      </div>

      <Modal isOpen={showIndModal} onClose={() => setShowIndModal(false)} title="إضافة مؤشر">
        <form onSubmit={submitInd} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">رمز المؤشر</label><input value={indForm.code} onChange={(e) => setIndForm({ ...indForm, code: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">النوع</label><select value={indForm.type} onChange={(e) => setIndForm({ ...indForm, type: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="output">مخرج</option><option value="outcome">نتيجة</option><option value="impact">أثر</option></select></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">اسم المؤشر *</label><input required value={indForm.name} onChange={(e) => setIndForm({ ...indForm, name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">الوحدة</label><input value={indForm.unit} onChange={(e) => setIndForm({ ...indForm, unit: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">المستهدف</label><input type="number" value={indForm.target_value} onChange={(e) => setIndForm({ ...indForm, target_value: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">خط الأساس</label><input type="number" value={indForm.baseline} onChange={(e) => setIndForm({ ...indForm, baseline: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">المشروع *</label><select required value={indForm.project_id} onChange={(e) => setIndForm({ ...indForm, project_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">التكرار</label><select value={indForm.frequency} onChange={(e) => setIndForm({ ...indForm, frequency: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="يومي">يومي</option><option value="أسبوعي">أسبوعي</option><option value="شهري">شهري</option><option value="ربع سنوي">ربع سنوي</option><option value="سنوي">سنوي</option></select></div>
          </div>
          <CustomFieldsForm fields={customFields} values={indForm.custom_values} onChange={(customValues) => setIndForm({ ...indForm, custom_values: customValues })} />
          <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-700">حفظ</button>
        </form>
      </Modal>

      <Modal isOpen={showMeasurementModal} onClose={() => setShowMeasurementModal(false)} title="تسجيل قياس مؤشر">
        {selectedIndicator && (
          <div className="space-y-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-blue-600">{selectedIndicator.code || 'بدون رمز'}</p>
                  <h3 className="mt-1 text-base font-black text-slate-800">{selectedIndicator.name}</h3>
                </div>
                <Target className="text-blue-600" size={22} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-slate-500">المستهدف</p><p className="font-black">{Number(selectedIndicator.target_value || 0).toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-500">الإجمالي الفعلي</p><p className="font-black">{Number(selectedIndicator.actual_value || 0).toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-500">آخر قياس</p><p className="font-black">{measurementSummary.latest?.date || '-'}</p></div>
              </div>
            </div>

            <form onSubmit={submitMeasurement} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium text-gray-700">قيمة القياس *</label><input required type="number" step="0.01" value={measurementForm.value} onChange={(e) => setMeasurementForm({ ...measurementForm, value: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div><label className="mb-1 block text-sm font-medium text-gray-700">تاريخ القياس *</label><input required type="date" value={measurementForm.date} onChange={(e) => setMeasurementForm({ ...measurementForm, date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="المحافظة" value={measurementForm.governorate} onChange={(e) => setMeasurementForm({ ...measurementForm, governorate: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
                <input placeholder="المديرية" value={measurementForm.district} onChange={(e) => setMeasurementForm({ ...measurementForm, district: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <textarea placeholder="ملاحظات القياس أو مصدر التحقق" value={measurementForm.notes} onChange={(e) => setMeasurementForm({ ...measurementForm, notes: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 font-medium text-white transition hover:bg-emerald-700">
                <Activity size={16} /> حفظ القياس
              </button>
            </form>

            <div className="rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 border-b bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
                <History size={16} /> سجل القياسات
              </div>
              <div className="max-h-60 overflow-y-auto">
                {measurements.map((measurement) => (
                  <div key={measurement.id} className="grid grid-cols-4 gap-3 border-b px-4 py-3 text-sm last:border-b-0">
                    <span className="font-bold">{measurement.date}</span>
                    <span>{Number(measurement.value || 0).toLocaleString()} {selectedIndicator.unit || ''}</span>
                    <span className="text-slate-500">{measurement.governorate || '-'} / {measurement.district || '-'}</span>
                    <span className="truncate text-slate-500">{measurement.notes || '-'}</span>
                  </div>
                ))}
                {measurements.length === 0 && <p className="py-8 text-center text-sm font-bold text-slate-400">لا توجد قياسات مسجلة لهذا المؤشر.</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showSurveyModal} onClose={() => setShowSurveyModal(false)} title="إضافة استبيان">
        <form onSubmit={submitSurvey} className="space-y-3">
          <div><label className="mb-1 block text-sm font-medium text-gray-700">عنوان الاستبيان *</label><input required value={surveyForm.title} onChange={(e) => setSurveyForm({ ...surveyForm, title: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">الوصف</label><textarea value={surveyForm.description} onChange={(e) => setSurveyForm({ ...surveyForm, description: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">المشروع</label><select value={surveyForm.project_id} onChange={(e) => setSurveyForm({ ...surveyForm, project_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">البداية</label><input type="date" value={surveyForm.start_date} onChange={(e) => setSurveyForm({ ...surveyForm, start_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">النهاية</label><input type="date" value={surveyForm.end_date} onChange={(e) => setSurveyForm({ ...surveyForm, end_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <button type="submit" className="w-full rounded-xl bg-purple-600 py-2.5 font-medium text-white transition hover:bg-purple-700">حفظ</button>
        </form>
      </Modal>
    </div>
  );
}
