import { useState, useEffect } from 'react';
import api from '../services/api';
import { MapPin, Plus, X, ClipboardList, Eye } from 'lucide-react';

const STATUS_LABELS = { planned: 'مخطط', in_progress: 'قيد التنفيذ', completed: 'مكتمل', cancelled: 'ملغي' };
const STATUS_COLORS = { planned: 'bg-blue-100 text-blue-700', in_progress: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

export default function FieldVisits() {
  const [visits, setVisits] = useState([]);
  const [checklists, setChecklists] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showChecklist, setShowChecklist] = useState(null);
  const [form, setForm] = useState({ title: '', visit_date: '', location: '', governorate: '', district: '', visit_type: 'monitoring', team_members: '', objectives: '' });

  const load = () => api.get('/field-visits/').then(r => setVisits(r.data));
  useEffect(() => { load(); api.get('/field-visits/checklists').then(r => setChecklists(r.data)); }, []);

  const submit = async () => {
    await api.post('/field-visits/', null, { params: form });
    setShowModal(false);
    setForm({ title: '', visit_date: '', location: '', governorate: '', district: '', visit_type: 'monitoring', team_members: '', objectives: '' });
    load();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/field-visits/${id}`, null, { params: { status } });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><MapPin /> إدارة الزيارات الميدانية</h1>
          <p className="text-sm text-gray-500 mt-1">خطة الزيارات، قوائم التحقق، التوصيات والإجراءات التصحيحية</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition">
          <Plus size={18} /> زيارة جديدة
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm text-blue-600">مخطط لها</p>
          <p className="text-2xl font-bold text-blue-700">{visits.filter(v => v.status === 'planned').length}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <p className="text-sm text-yellow-600">قيد التنفيذ</p>
          <p className="text-2xl font-bold text-yellow-700">{visits.filter(v => v.status === 'in_progress').length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-sm text-green-600">مكتملة</p>
          <p className="text-2xl font-bold text-green-700">{visits.filter(v => v.status === 'completed').length}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-600">الإجمالي</p>
          <p className="text-2xl font-bold text-gray-700">{visits.length}</p>
        </div>
      </div>

      {checklists && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {Object.entries(checklists).map(([key, cl]) => (
            <button key={key} onClick={() => setShowChecklist(cl)} className="bg-white rounded-xl p-4 border hover:border-teal-300 hover:shadow transition text-right">
              <ClipboardList size={20} className="text-teal-600 mb-2" />
              <p className="font-medium text-sm">{cl.name}</p>
              <p className="text-xs text-gray-400">{cl.items.length} عنصر</p>
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">العنوان</th>
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">الموقع</th>
              <th className="px-4 py-3 text-right">المحافظة</th>
              <th className="px-4 py-3 text-right">النوع</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {visits.map(v => (
              <tr key={v.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{v.title}</td>
                <td className="px-4 py-3">{v.visit_date}</td>
                <td className="px-4 py-3">{v.location}</td>
                <td className="px-4 py-3">{v.governorate}</td>
                <td className="px-4 py-3">{v.visit_type}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[v.status] || ''}`}>{STATUS_LABELS[v.status] || v.status}</span></td>
                <td className="px-4 py-3">
                  {v.status === 'planned' && <button onClick={() => updateStatus(v.id, 'in_progress')} className="text-yellow-600 text-xs">بدء</button>}
                  {v.status === 'in_progress' && <button onClick={() => updateStatus(v.id, 'completed')} className="text-green-600 text-xs mr-2">إكمال</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visits.length === 0 && <p className="text-center py-8 text-gray-400">لا توجد زيارات بعد</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">زيارة ميدانية جديدة</h2>
            <div className="space-y-3">
              <input type="text" placeholder="عنوان الزيارة" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border rounded-lg p-2" />
              <input type="date" value={form.visit_date} onChange={e => setForm({...form, visit_date: e.target.value})} className="w-full border rounded-lg p-2" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="الموقع" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="border rounded-lg p-2" />
                <input type="text" placeholder="المحافظة" value={form.governorate} onChange={e => setForm({...form, governorate: e.target.value})} className="border rounded-lg p-2" />
              </div>
              <select value={form.visit_type} onChange={e => setForm({...form, visit_type: e.target.value})} className="w-full border rounded-lg p-2">
                <option value="monitoring">مراقبة عامة</option>
                <option value="distribution">مراقبة توزيعات</option>
                <option value="pdm">مراقبة ما بعد التوزيع</option>
                <option value="site_verification">تحقق من المواقع</option>
              </select>
              <input type="text" placeholder="فريق الزيارة" value={form.team_members} onChange={e => setForm({...form, team_members: e.target.value})} className="w-full border rounded-lg p-2" />
              <textarea placeholder="أهداف الزيارة" value={form.objectives} onChange={e => setForm({...form, objectives: e.target.value})} className="w-full border rounded-lg p-2" rows={2} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={submit} className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">حفظ</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showChecklist && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{showChecklist.name}</h2>
              <button onClick={() => setShowChecklist(null)}><X size={20} /></button>
            </div>
            <div className="space-y-2">
              {showChecklist.items.map((item, i) => (
                <label key={i} className="flex items-start gap-2 text-sm p-2 rounded hover:bg-gray-50">
                  <input type="checkbox" className="mt-1" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
