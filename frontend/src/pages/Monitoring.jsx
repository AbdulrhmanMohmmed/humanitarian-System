import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, BarChart3, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Monitoring() {
  const [indicators, setIndicators] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tab, setTab] = useState('indicators');
  const [showIndModal, setShowIndModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [indForm, setIndForm] = useState({ name: '', code: '', type: 'output', unit: '', target_value: 0, project_id: '', baseline: 0, frequency: 'شهري' });
  const [surveyForm, setSurveyForm] = useState({ title: '', description: '', project_id: '', start_date: '', end_date: '' });

  const load = () => {
    api.get('/monitoring/indicators').then(r => setIndicators(r.data));
    api.get('/monitoring/surveys').then(r => setSurveys(r.data));
    api.get('/projects/').then(r => setProjects(r.data));
  };
  useEffect(() => { load(); }, []);

  const submitInd = async (e) => {
    e.preventDefault();
    await api.post('/monitoring/indicators', { ...indForm, target_value: parseFloat(indForm.target_value), baseline: parseFloat(indForm.baseline), project_id: parseInt(indForm.project_id) });
    setShowIndModal(false);
    setIndForm({ name: '', code: '', type: 'output', unit: '', target_value: 0, project_id: '', baseline: 0, frequency: 'شهري' });
    load();
  };

  const submitSurvey = async (e) => {
    e.preventDefault();
    await api.post('/monitoring/surveys', { ...surveyForm, project_id: surveyForm.project_id ? parseInt(surveyForm.project_id) : null });
    setShowSurveyModal(false);
    setSurveyForm({ title: '', description: '', project_id: '', start_date: '', end_date: '' });
    load();
  };

  const chartData = indicators.map(ind => ({
    name: ind.name.length > 20 ? ind.name.substring(0, 20) + '...' : ind.name,
    المستهدف: ind.target_value,
    الفعلي: ind.actual_value,
  }));

  const indColumns = [
    { key: 'code', label: 'الرمز' },
    { key: 'name', label: 'المؤشر' },
    { key: 'type', label: 'النوع', render: v => <StatusBadge status={v} /> },
    { key: 'unit', label: 'الوحدة' },
    { key: 'target_value', label: 'المستهدف', render: v => v?.toLocaleString() },
    { key: 'actual_value', label: 'الفعلي', render: (v, row) => {
      const pct = row.target_value > 0 ? (v / row.target_value * 100) : 0;
      return (
        <div className="flex items-center gap-2">
          <span>{v?.toLocaleString()}</span>
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
        </div>
      );
    }},
    { key: 'frequency', label: 'التكرار' },
  ];

  const surveyColumns = [
    { key: 'title', label: 'العنوان' },
    { key: 'description', label: 'الوصف' },
    { key: 'total_responses', label: 'الاستجابات' },
    { key: 'is_active', label: 'الحالة', render: v => <span className={`px-2 py-0.5 rounded-full text-xs ${v ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{v ? 'نشط' : 'منتهي'}</span> },
    { key: 'start_date', label: 'البداية' },
    { key: 'end_date', label: 'النهاية' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">المتابعة والتقييم</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowIndModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"><Plus size={18} /> مؤشر</button>
          <button onClick={() => setShowSurveyModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"><Plus size={18} /> استبيان</button>
        </div>
      </div>

      {indicators.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">أداء المؤشرات: المستهدف مقابل الفعلي</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="المستهدف" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="الفعلي" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('indicators')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'indicators' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>المؤشرات ({indicators.length})</button>
        <button onClick={() => setTab('surveys')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'surveys' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>الاستبيانات ({surveys.length})</button>
      </div>

      {tab === 'indicators' && <DataTable columns={indColumns} data={indicators} onDelete={async (id) => { await api.delete(`/monitoring/indicators/${id}`); load(); }} />}
      {tab === 'surveys' && <DataTable columns={surveyColumns} data={surveys} onDelete={async (id) => { await api.delete(`/monitoring/surveys/${id}`); load(); }} />}

      <Modal isOpen={showIndModal} onClose={() => setShowIndModal(false)} title="إضافة مؤشر">
        <form onSubmit={submitInd} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">رمز المؤشر</label><input value={indForm.code} onChange={e => setIndForm({...indForm, code: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">النوع</label><select value={indForm.type} onChange={e => setIndForm({...indForm, type: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="output">مخرج</option><option value="outcome">نتيجة</option><option value="impact">أثر</option></select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم المؤشر *</label><input required value={indForm.name} onChange={e => setIndForm({...indForm, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label><input value={indForm.unit} onChange={e => setIndForm({...indForm, unit: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المستهدف</label><input type="number" value={indForm.target_value} onChange={e => setIndForm({...indForm, target_value: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">خط الأساس</label><input type="number" value={indForm.baseline} onChange={e => setIndForm({...indForm, baseline: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المشروع *</label><select required value={indForm.project_id} onChange={e => setIndForm({...indForm, project_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">التكرار</label><select value={indForm.frequency} onChange={e => setIndForm({...indForm, frequency: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="يومي">يومي</option><option value="أسبوعي">أسبوعي</option><option value="شهري">شهري</option><option value="ربع سنوي">ربع سنوي</option><option value="سنوي">سنوي</option></select></div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">حفظ</button>
        </form>
      </Modal>

      <Modal isOpen={showSurveyModal} onClose={() => setShowSurveyModal(false)} title="إضافة استبيان">
        <form onSubmit={submitSurvey} className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">عنوان الاستبيان *</label><input required value={surveyForm.title} onChange={e => setSurveyForm({...surveyForm, title: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label><textarea value={surveyForm.description} onChange={e => setSurveyForm({...surveyForm, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label><select value={surveyForm.project_id} onChange={e => setSurveyForm({...surveyForm, project_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">البداية</label><input type="date" value={surveyForm.start_date} onChange={e => setSurveyForm({...surveyForm, start_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">النهاية</label><input type="date" value={surveyForm.end_date} onChange={e => setSurveyForm({...surveyForm, end_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium">حفظ</button>
        </form>
      </Modal>
    </div>
  );
}
