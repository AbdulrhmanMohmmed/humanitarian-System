import { useState, useEffect } from 'react';
import api from '../services/api';
import { ListChecks, Plus } from 'lucide-react';

const STATUS_LABELS = { pending: 'معلقة', in_progress: 'قيد التنفيذ', completed: 'مكتملة', overdue: 'متأخرة', cancelled: 'ملغاة' };
const STATUS_COLORS = { pending: 'bg-gray-100 text-gray-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-400' };
const PRIORITY_COLORS = { high: 'text-red-600', medium: 'text-yellow-600', low: 'text-green-600' };

export default function Recommendations() {
  const [recs, setRecs] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', source: '', assigned_to: '', responsible_department: '', deadline: '', priority: 'medium' });

  const load = () => {
    api.get('/recommendations/').then(r => setRecs(r.data));
    api.get('/recommendations/dashboard').then(r => setDashboard(r.data));
  };
  useEffect(load, []);

  const submit = async () => {
    await api.post('/recommendations/', null, { params: form });
    setShowModal(false);
    setForm({ title: '', description: '', source: '', assigned_to: '', responsible_department: '', deadline: '', priority: 'medium' });
    load();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/recommendations/${id}`, null, { params: { status } });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ListChecks /> متابعة تنفيذ التوصيات</h1>
          <p className="text-sm text-gray-500 mt-1">التوصيات، الإجراءات التصحيحية، المسؤوليات والمواعيد</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">
          <Plus size={18} /> توصية جديدة
        </button>
      </div>

      {dashboard && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 border"><p className="text-sm text-gray-600">الإجمالي</p><p className="text-2xl font-bold">{dashboard.total}</p></div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100"><p className="text-sm text-blue-600">قيد التنفيذ</p><p className="text-2xl font-bold text-blue-700">{dashboard.by_status?.in_progress || 0}</p></div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100"><p className="text-sm text-green-600">مكتملة</p><p className="text-2xl font-bold text-green-700">{dashboard.by_status?.completed || 0}</p></div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100"><p className="text-sm text-red-600">متأخرة</p><p className="text-2xl font-bold text-red-700">{dashboard.overdue}</p></div>
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">التوصية</th>
              <th className="px-4 py-3 text-right">المصدر</th>
              <th className="px-4 py-3 text-right">المسؤول</th>
              <th className="px-4 py-3 text-right">الموعد</th>
              <th className="px-4 py-3 text-right">الأولوية</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {recs.map(r => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{r.title}</td>
                <td className="px-4 py-3">{r.source || '-'}</td>
                <td className="px-4 py-3">{r.assigned_to || '-'}</td>
                <td className="px-4 py-3">{r.deadline || '-'}</td>
                <td className={`px-4 py-3 font-bold ${PRIORITY_COLORS[r.priority] || ''}`}>{r.priority === 'high' ? 'عالي' : r.priority === 'medium' ? 'متوسط' : 'منخفض'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[r.status] || ''}`}>{STATUS_LABELS[r.status] || r.status}</span></td>
                <td className="px-4 py-3 space-x-1">
                  {r.status === 'pending' && <button onClick={() => updateStatus(r.id, 'in_progress')} className="text-blue-600 text-xs">بدء</button>}
                  {r.status === 'in_progress' && <button onClick={() => updateStatus(r.id, 'completed')} className="text-green-600 text-xs">إكمال</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recs.length === 0 && <p className="text-center py-8 text-gray-400">لا توجد توصيات بعد</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">توصية جديدة</h2>
            <div className="space-y-3">
              <input type="text" placeholder="عنوان التوصية" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border rounded-lg p-2" />
              <textarea placeholder="الوصف" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded-lg p-2" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="المصدر (تقييم، زيارة، تدقيق...)" value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="border rounded-lg p-2" />
                <input type="text" placeholder="المسؤول" value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} className="border rounded-lg p-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="border rounded-lg p-2" />
                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="border rounded-lg p-2">
                  <option value="high">أولوية عالية</option>
                  <option value="medium">أولوية متوسطة</option>
                  <option value="low">أولوية منخفضة</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={submit} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">حفظ</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
