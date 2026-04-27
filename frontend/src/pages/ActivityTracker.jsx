import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart3, Plus, X, Calendar } from 'lucide-react';

const STATUS_COLORS = { planned: 'bg-gray-100 text-gray-600', active: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', delayed: 'bg-red-100 text-red-700' };
const STATUS_LABELS = { planned: 'مخطط', active: 'نشط', completed: 'مكتمل', delayed: 'متأخر' };

export default function ActivityTracker() {
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [ganttData, setGanttData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ project_id: '', name: '', description: '', start_date: '', end_date: '', responsible: '' });

  const load = () => {
    api.get('/projects/').then(r => setProjects(r.data));
    const url = selectedProject ? `/activities/?project_id=${selectedProject}` : '/activities/';
    api.get(url).then(r => setActivities(r.data));
    if (selectedProject) {
      api.get(`/activities/gantt/${selectedProject}`).then(r => setGanttData(r.data)).catch(() => setGanttData(null));
    }
  };
  useEffect(load, [selectedProject]);

  const submit = async () => {
    await api.post('/activities/', { ...form, project_id: parseInt(form.project_id) });
    setShowModal(false);
    setForm({ project_id: '', name: '', description: '', start_date: '', end_date: '', responsible: '' });
    load();
  };

  const updateProgress = async (id, progress) => {
    await api.put(`/activities/${id}`, { progress: parseInt(progress) });
    load();
  };

  const daysBetween = (start, end) => {
    if (!start || !end) return 0;
    return Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">تتبع الأنشطة</h1>
          <p className="text-sm text-gray-500 mt-1">Gantt Chart ومقارنة المخطط مقابل المنجز</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          <Plus size={18} /> إضافة نشاط
        </button>
      </div>

      <div className="mb-6">
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 bg-white">
          <option value="">جميع المشاريع</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {ganttData && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-600">إجمالي الأنشطة</p>
            <p className="text-2xl font-bold text-blue-700">{ganttData.summary.total}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-sm text-green-600">متوسط التقدم</p>
            <p className="text-2xl font-bold text-green-700">{ganttData.summary.avg_progress}%</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-sm text-emerald-600">في الموعد</p>
            <p className="text-2xl font-bold text-emerald-700">{ganttData.summary.on_track}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-sm text-red-600">متأخر</p>
            <p className="text-2xl font-bold text-red-700">{ganttData.summary.delayed}</p>
          </div>
        </div>
      )}

      {/* Gantt-like view */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><BarChart3 size={18} /> مخطط جانت</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-48">النشاط</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-24">البداية</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-24">النهاية</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-20">المدة</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">التقدم</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-20">الحالة</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 w-24">الانحراف</th>
              </tr>
            </thead>
            <tbody>
              {(ganttData?.activities || activities).map(a => {
                const variance = a.variance_days || (a.actual_end && a.end_date ? daysBetween(a.end_date, a.actual_end) : null);
                return (
                  <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 text-gray-500">{a.start_date || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{a.end_date || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{daysBetween(a.start_date, a.end_date)} يوم</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${a.progress}%` }}></div>
                        </div>
                        <input type="number" min="0" max="100" value={a.progress} onChange={e => updateProgress(a.id, e.target.value)} className="w-14 text-xs border rounded px-1 py-0.5" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[a.status] || 'bg-gray-100'}`}>{STATUS_LABELS[a.status] || a.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {variance !== null && variance !== undefined && (
                        <span className={`text-xs font-medium ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {variance > 0 ? `+${variance} يوم` : variance === 0 ? 'في الموعد' : `${variance} يوم`}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {activities.length === 0 && !ganttData && <div className="text-center py-8 text-gray-400">لا توجد أنشطة</div>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">إضافة نشاط</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="اسم النشاط *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200">
                <option value="">اختر المشروع *</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <textarea placeholder="الوصف" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" placeholder="تاريخ البداية" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                <input type="date" placeholder="تاريخ النهاية" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
              </div>
              <input placeholder="المسؤول" value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" />
              <button onClick={submit} disabled={!form.name || !form.project_id} className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50">حفظ النشاط</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
