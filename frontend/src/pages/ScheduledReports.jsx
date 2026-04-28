import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, FileText, Image } from 'lucide-react';
import api from '../services/api';

export default function ScheduledReports() {
  const [schedules, setSchedules] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [infographic, setInfographic] = useState(null);
  const [form, setForm] = useState({ project_id: '', report_type: 'monthly_meal', frequency: 'monthly', day_of_month: 1, recipients: '' });

  useEffect(() => {
    api.get('/scheduled-reports/schedules').then(r => setSchedules(r.data || [])).catch(() => {});
    api.get('/scheduled-reports/available-types').then(r => setReportTypes(r.data || [])).catch(() => {});
    api.get('/projects/').then(r => setProjects(r.data.projects || r.data || [])).catch(() => {});
  }, []);

  const createSchedule = async () => {
    try {
      await api.post('/scheduled-reports/schedule', {
        ...form, project_id: parseInt(form.project_id),
        recipients: form.recipients.split(',').map(e => e.trim()).filter(Boolean),
      });
      setShowNew(false);
      api.get('/scheduled-reports/schedules').then(r => setSchedules(r.data || []));
    } catch (e) { console.error(e); }
  };

  const deleteSchedule = async (id) => {
    await api.delete(`/scheduled-reports/schedule/${id}`);
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const loadInfographic = async (pid) => {
    try {
      const res = await api.get(`/scheduled-reports/generate-infographic/${pid}`);
      setInfographic(res.data);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Calendar size={28} /> التقارير المجدولة والإنفوجرافيك</h1>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white"><Plus size={16} /> جدولة جديدة</button>
      </div>

      {showNew && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">جدولة تقرير جديد</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select className="bg-gray-700 text-white rounded-lg px-4 py-2" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>
              <option value="">اختر المشروع</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="bg-gray-700 text-white rounded-lg px-4 py-2" value={form.report_type} onChange={e => setForm({ ...form, report_type: e.target.value })}>
              {reportTypes.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
            </select>
            <select className="bg-gray-700 text-white rounded-lg px-4 py-2" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
            </select>
            {form.frequency === 'monthly' && <input type="number" className="bg-gray-700 text-white rounded-lg px-4 py-2" placeholder="يوم الشهر (1-28)" min={1} max={28} value={form.day_of_month} onChange={e => setForm({ ...form, day_of_month: parseInt(e.target.value) })} />}
            <input className="bg-gray-700 text-white rounded-lg px-4 py-2 md:col-span-2" placeholder="البريد الإلكتروني (فاصلة بين المستلمين)" value={form.recipients} onChange={e => setForm({ ...form, recipients: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={createSchedule} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-white">إنشاء الجدولة</button>
            <button onClick={() => setShowNew(false)} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white">إلغاء</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Clock size={18} /> الجداول النشطة</h2>
          {schedules.length === 0 ? <p className="text-gray-400 text-center py-4">لا توجد جداول تقارير</p> : (
            <div className="space-y-3">{schedules.map(s => (
              <div key={s.id} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{reportTypes.find(t => t.key === s.report_type)?.name || s.report_type}</p>
                  <p className="text-gray-400 text-sm">{s.frequency === 'weekly' ? 'أسبوعي' : 'شهري'} • التالي: {s.next_run || 'غير محدد'}</p>
                </div>
                <button onClick={() => deleteSchedule(s.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
              </div>
            ))}</div>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Image size={18} /> إنفوجرافيك المشروع</h2>
          <div className="space-y-2 mb-4">
            {projects.map(p => (
              <button key={p.id} onClick={() => loadInfographic(p.id)} className="w-full text-right bg-gray-700 hover:bg-gray-600 rounded-lg p-3 text-white">{p.name}</button>
            ))}
          </div>
        </div>
      </div>

      {infographic && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">إنفوجرافيك: {infographic.project?.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: infographic.colors?.primary + '22' }}>
              <p className="text-3xl font-bold text-white">{infographic.headline_numbers?.total_beneficiaries?.toLocaleString()}</p>
              <p className="text-gray-300 text-sm">مستفيد فعلي</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: infographic.colors?.success + '22' }}>
              <p className="text-3xl font-bold text-green-400">{infographic.performance?.overall_achievement}%</p>
              <p className="text-gray-300 text-sm">نسبة الإنجاز</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: infographic.colors?.warning + '22' }}>
              <p className="text-3xl font-bold text-yellow-400">{infographic.accountability?.total_complaints}</p>
              <p className="text-gray-300 text-sm">شكاوى</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: infographic.colors?.danger + '22' }}>
              <p className="text-3xl font-bold text-blue-400">{infographic.monitoring?.field_visits}</p>
              <p className="text-gray-300 text-sm">زيارات ميدانية</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-900/20 rounded-lg p-3 text-center"><p className="text-xl font-bold text-green-400">{infographic.performance?.on_track}</p><p className="text-xs text-gray-300">على المسار</p></div>
            <div className="bg-yellow-900/20 rounded-lg p-3 text-center"><p className="text-xl font-bold text-yellow-400">{infographic.performance?.at_risk}</p><p className="text-xs text-gray-300">معرض للخطر</p></div>
            <div className="bg-red-900/20 rounded-lg p-3 text-center"><p className="text-xl font-bold text-red-400">{infographic.performance?.off_track}</p><p className="text-xs text-gray-300">متأخر</p></div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><FileText size={18} /> أنواع التقارير المتاحة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reportTypes.map(t => (
            <div key={t.key} className="bg-gray-700 rounded-lg p-3">
              <p className="text-white font-medium">{t.name}</p>
              <p className="text-gray-400 text-sm">{t.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
