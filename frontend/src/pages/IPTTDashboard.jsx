import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart3, Plus, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

const COLOR_MAP = { green: 'bg-green-100 text-green-700', yellow: 'bg-yellow-100 text-yellow-700', red: 'bg-red-100 text-red-700' };
const COLOR_LABELS = { green: 'جيد', yellow: 'متوسط', red: 'ضعيف' };

export default function IPTTDashboard() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ indicator_id: '', project_id: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1, target_value: 0, actual_value: 0, deviation_explanation: '', corrective_action: '' });

  useEffect(() => {
    api.get('/projects/').then(r => setProjects(r.data));
    api.get('/iptt/alerts').then(r => setAlerts(r.data.alerts || []));
  }, []);

  useEffect(() => {
    if (selectedProject) {
      api.get(`/iptt/summary/${selectedProject}`).then(r => setSummary(r.data));
    }
  }, [selectedProject]);

  const submit = async () => {
    await api.post('/iptt/', null, { params: form });
    setShowModal(false);
    if (selectedProject) api.get(`/iptt/summary/${selectedProject}`).then(r => setSummary(r.data));
    api.get('/iptt/alerts').then(r => setAlerts(r.data.alerts || []));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><BarChart3 /> جدول تتبع أداء المؤشرات (IPTT)</h1>
          <p className="text-sm text-gray-500 mt-1">إدخال شهري، تراكمي، مقارنة المستهدف بالمنجز، ألوان تنبيه</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
          <Plus size={18} /> إدخال بيانات
        </button>
      </div>

      <div className="mb-4">
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="border rounded-lg px-4 py-2 w-64">
          <option value="">اختر المشروع</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-red-700 flex items-center gap-2 mb-2"><AlertTriangle size={18} /> تنبيهات الأداء ({alerts.length})</h3>
          {alerts.slice(0, 5).map((a, i) => (
            <p key={i} className="text-sm text-red-600 mb-1">● {a.indicator_name} - الفترة {a.period}: نسبة الإنجاز {a.achievement_rate}%</p>
          ))}
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-5 border border-green-100">
              <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle size={14} /> أداء جيد</p>
              <p className="text-3xl font-bold text-green-700">{summary.summary.green}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-100">
              <p className="text-sm text-yellow-600">أداء متوسط</p>
              <p className="text-3xl font-bold text-yellow-700">{summary.summary.yellow}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-5 border border-red-100">
              <p className="text-sm text-red-600 flex items-center gap-1"><AlertTriangle size={14} /> أداء ضعيف</p>
              <p className="text-3xl font-bold text-red-700">{summary.summary.red}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right">الرمز</th>
                  <th className="px-4 py-3 text-right">المؤشر</th>
                  <th className="px-4 py-3 text-right">الوحدة</th>
                  <th className="px-4 py-3 text-right">خط الأساس</th>
                  <th className="px-4 py-3 text-right">المستهدف السنوي</th>
                  <th className="px-4 py-3 text-right">الفعلي التراكمي</th>
                  <th className="px-4 py-3 text-right">نسبة الإنجاز</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {(summary.indicators || []).map(ind => (
                  <tr key={ind.indicator_id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono">{ind.code}</td>
                    <td className="px-4 py-3">{ind.name}</td>
                    <td className="px-4 py-3">{ind.unit}</td>
                    <td className="px-4 py-3">{ind.baseline}</td>
                    <td className="px-4 py-3 font-bold">{ind.annual_target}</td>
                    <td className="px-4 py-3 font-bold">{ind.cumulative_actual}</td>
                    <td className="px-4 py-3 font-bold">{ind.achievement_rate}%</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${COLOR_MAP[ind.status_color]}`}>{COLOR_LABELS[ind.status_color]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">إدخال بيانات IPTT</h2>
            <div className="space-y-3">
              <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="w-full border rounded-lg p-2">
                <option value="">اختر المشروع</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" placeholder="رقم المؤشر" value={form.indicator_id} onChange={e => setForm({...form, indicator_id: e.target.value})} className="w-full border rounded-lg p-2" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="السنة" value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="border rounded-lg p-2" />
                <input type="number" placeholder="الشهر (1-12)" value={form.month} onChange={e => setForm({...form, month: e.target.value})} className="border rounded-lg p-2" min={1} max={12} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="المستهدف" value={form.target_value} onChange={e => setForm({...form, target_value: e.target.value})} className="border rounded-lg p-2" />
                <input type="number" placeholder="الفعلي" value={form.actual_value} onChange={e => setForm({...form, actual_value: e.target.value})} className="border rounded-lg p-2" />
              </div>
              <textarea placeholder="تفسير الانحراف" value={form.deviation_explanation} onChange={e => setForm({...form, deviation_explanation: e.target.value})} className="w-full border rounded-lg p-2" rows={2} />
              <textarea placeholder="الخطة التصحيحية" value={form.corrective_action} onChange={e => setForm({...form, corrective_action: e.target.value})} className="w-full border rounded-lg p-2" rows={2} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={submit} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">حفظ</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
