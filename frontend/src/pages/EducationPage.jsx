import { useState } from 'react';
import { GraduationCap, Plus, BarChart3, School, Users } from 'lucide-react';
import { useSchools, useCreateSchool, useEducationDashboard } from '../hooks/useModuleApi';

export default function EducationPage() {
  const [tab, setTab] = useState('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', school_type: 'primary', status: 'active', total_students: 0, total_teachers: 0, has_wash: false, has_feeding: false });

  const { data: dashboard, isLoading: dashLoading } = useEducationDashboard();
  const { data: schools = [], isLoading: schLoading } = useSchools({});
  const createSchool = useCreateSchool();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><GraduationCap className="w-8 h-8 text-indigo-600" /><h1 className="text-2xl font-bold">التعليم في حالات الطوارئ</h1></div>
        <button onClick={() => { setTab('schools'); setShowForm(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> مدرسة جديدة</button>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)]">
        {[{ id: 'dashboard', label: 'لوحة القيادة', icon: BarChart3 }, { id: 'schools', label: 'المدارس', icon: School }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 ${tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[var(--text-secondary)]'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="grid grid-cols-4 gap-4">
          {dashLoading ? <p className="col-span-4 text-center p-4">جاري التحميل...</p> : (
            <>
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-indigo-600">{dashboard?.total_schools || (schools || []).length}</p><p className="text-sm text-[var(--text-secondary)]">إجمالي المدارس</p></div>
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-blue-600">{dashboard?.total_students || (schools || []).reduce((s, sch) => s + (sch.total_students || 0), 0)}</p><p className="text-sm text-[var(--text-secondary)]">إجمالي الطلاب</p></div>
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-green-600">{dashboard?.total_teachers || (schools || []).reduce((s, sch) => s + (sch.total_teachers || 0), 0)}</p><p className="text-sm text-[var(--text-secondary)]">إجمالي المعلمين</p></div>
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-purple-600">{dashboard?.active_schools || (schools || []).filter(s => s.status === 'active').length}</p><p className="text-sm text-[var(--text-secondary)]">مدارس نشطة</p></div>
            </>
          )}
        </div>
      )}

      {tab === 'schools' && (
        <div className="space-y-4">
          {showForm && (
            <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] space-y-4">
              <h3 className="font-semibold">تسجيل مدرسة جديدة</h3>
              <div className="grid grid-cols-3 gap-3">
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="اسم المدرسة" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="الموقع" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={form.school_type} onChange={e => setForm(p => ({ ...p, school_type: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="primary">ابتدائي</option><option value="secondary">ثانوي</option><option value="tls">مساحة تعلم مؤقتة</option><option value="accelerated">تعلم معجّل</option>
                </select>
                <input type="number" value={form.total_students} onChange={e => setForm(p => ({ ...p, total_students: parseInt(e.target.value) || 0 }))} placeholder="عدد الطلاب" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={form.total_teachers} onChange={e => setForm(p => ({ ...p, total_teachers: parseInt(e.target.value) || 0 }))} placeholder="عدد المعلمين" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <div className="flex items-center gap-4 px-3">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.has_wash} onChange={e => setForm(p => ({ ...p, has_wash: e.target.checked }))} /> مياه ونظافة</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.has_feeding} onChange={e => setForm(p => ({ ...p, has_feeding: e.target.checked }))} /> تغذية مدرسية</label>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => { await createSchool.mutateAsync(form); setShowForm(false); setForm({ name: '', location: '', school_type: 'primary', status: 'active', total_students: 0, total_teachers: 0, has_wash: false, has_feeding: false }); }}
                  disabled={createSchool.isPending || !form.name} className="bg-indigo-600 text-white px-6 py-2 rounded-lg">حفظ</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[var(--border)] rounded-lg">إلغاء</button>
              </div>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">المدرسة</th><th className="text-right p-3">الموقع</th><th className="text-right p-3">النوع</th><th className="text-right p-3">الطلاب</th><th className="text-right p-3">المعلمين</th><th className="text-right p-3">الحالة</th></tr></thead>
              <tbody>
                {schLoading ? <tr><td colSpan={6} className="p-4 text-center">جاري التحميل...</td></tr> :
                  (schools || []).map(s => (
                    <tr key={s.id} className="border-t border-[var(--border)]">
                      <td className="p-3 font-medium">{s.name}</td><td className="p-3">{s.location}</td>
                      <td className="p-3 text-xs">{s.school_type === 'primary' ? 'ابتدائي' : s.school_type === 'secondary' ? 'ثانوي' : s.school_type === 'tls' ? 'TLS' : 'معجّل'}</td>
                      <td className="p-3">{s.total_students}</td><td className="p-3">{s.total_teachers}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.status === 'active' ? 'نشطة' : 'مغلقة'}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
