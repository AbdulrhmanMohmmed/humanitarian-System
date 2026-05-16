import { useState } from 'react';
import { Apple, Plus, BarChart3, AlertTriangle } from 'lucide-react';
import { useNutritionScreenings, useCreateScreening, useNutritionDashboard } from '../hooks/useModuleApi';

const CLASS_MAP = { SAM: { label: 'سوء تغذية حاد شديد', color: 'bg-red-100 text-red-700' }, MAM: { label: 'سوء تغذية حاد معتدل', color: 'bg-orange-100 text-orange-700' }, normal: { label: 'طبيعي', color: 'bg-green-100 text-green-700' } };

export default function NutritionPage() {
  const [tab, setTab] = useState('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ beneficiary_id: '', muac: '', weight: '', height: '', age_months: '' });

  const { data: dashboard, isLoading: dashLoading } = useNutritionDashboard();
  const { data: screenings = [], isLoading: scrLoading } = useNutritionScreenings({});
  const createScreening = useCreateScreening();

  const handleSubmit = async () => {
    try {
      await createScreening.mutateAsync({
        beneficiary_id: parseInt(form.beneficiary_id),
        muac: parseFloat(form.muac) || undefined,
        weight: parseFloat(form.weight) || undefined,
        height: parseFloat(form.height) || undefined,
        age_months: parseInt(form.age_months) || undefined,
      });
      setForm({ beneficiary_id: '', muac: '', weight: '', height: '', age_months: '' });
      setShowForm(false);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Apple className="w-8 h-8 text-orange-600" /><h1 className="text-2xl font-bold">إدارة التغذية</h1></div>
        <button onClick={() => { setTab('screenings'); setShowForm(true); }} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> فحص جديد
        </button>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)]">
        {[{ id: 'dashboard', label: 'لوحة القيادة', icon: BarChart3 }, { id: 'screenings', label: 'الفحوصات', icon: Apple }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 ${tab === t.id ? 'border-orange-600 text-orange-600' : 'border-transparent text-[var(--text-secondary)]'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-4">
          {dashLoading ? <p className="text-center p-4">جاري التحميل...</p> : (
            <>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-blue-600">{dashboard?.total_screenings || 0}</p><p className="text-sm text-[var(--text-secondary)]">إجمالي الفحوصات</p></div>
                <div className="bg-[var(--card)] rounded-xl border border-red-200 p-4 text-center"><p className="text-3xl font-bold text-red-600">{dashboard?.sam_count || 0}</p><p className="text-sm text-red-600">SAM حاد شديد</p></div>
                <div className="bg-[var(--card)] rounded-xl border border-orange-200 p-4 text-center"><p className="text-3xl font-bold text-orange-600">{dashboard?.mam_count || 0}</p><p className="text-sm text-orange-600">MAM حاد معتدل</p></div>
                <div className="bg-[var(--card)] rounded-xl border border-green-200 p-4 text-center"><p className="text-3xl font-bold text-green-600">{dashboard?.normal_count || 0}</p><p className="text-sm text-green-600">طبيعي</p></div>
              </div>
              {(dashboard?.sam_count || 0) > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div><p className="font-medium text-red-700">تحذير: حالات SAM مكتشفة</p><p className="text-sm text-red-600">يوجد {dashboard.sam_count} حالة سوء تغذية حاد شديد تحتاج تدخل فوري</p></div>
                </div>
              )}
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
                <h3 className="font-semibold mb-4">توزيع حالات التغذية</h3>
                <div className="flex gap-2 h-8">
                  {dashboard?.total_screenings > 0 && (
                    <>
                      {dashboard?.sam_count > 0 && <div className="bg-red-500 rounded" style={{ width: `${(dashboard.sam_count / dashboard.total_screenings) * 100}%` }} title={`SAM: ${dashboard.sam_count}`} />}
                      {dashboard?.mam_count > 0 && <div className="bg-orange-500 rounded" style={{ width: `${(dashboard.mam_count / dashboard.total_screenings) * 100}%` }} title={`MAM: ${dashboard.mam_count}`} />}
                      {dashboard?.normal_count > 0 && <div className="bg-green-500 rounded" style={{ width: `${(dashboard.normal_count / dashboard.total_screenings) * 100}%` }} title={`Normal: ${dashboard.normal_count}`} />}
                    </>
                  )}
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded" /> SAM</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded" /> MAM</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> طبيعي</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'screenings' && (
        <div className="space-y-4">
          {showForm && (
            <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] space-y-4">
              <h3 className="font-semibold">فحص تغذية جديد</h3>
              <div className="grid grid-cols-5 gap-3">
                <input type="number" value={form.beneficiary_id} onChange={e => setForm(p => ({ ...p, beneficiary_id: e.target.value }))} placeholder="رقم المستفيد" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={form.muac} onChange={e => setForm(p => ({ ...p, muac: e.target.value }))} placeholder="MUAC (مم)" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} placeholder="الوزن (كجم)" step="0.1" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={form.height} onChange={e => setForm(p => ({ ...p, height: e.target.value }))} placeholder="الطول (سم)" step="0.1" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={form.age_months} onChange={e => setForm(p => ({ ...p, age_months: e.target.value }))} placeholder="العمر (أشهر)" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSubmit} disabled={createScreening.isPending || !form.beneficiary_id} className="bg-orange-600 text-white px-6 py-2 rounded-lg">تسجيل الفحص</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[var(--border)] rounded-lg">إلغاء</button>
              </div>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">#</th><th className="text-right p-3">المستفيد</th><th className="text-right p-3">MUAC</th><th className="text-right p-3">الوزن</th><th className="text-right p-3">التصنيف</th><th className="text-right p-3">التاريخ</th></tr></thead>
              <tbody>
                {scrLoading ? <tr><td colSpan={6} className="p-4 text-center">جاري التحميل...</td></tr> :
                  (screenings || []).map(s => (
                    <tr key={s.id} className="border-t border-[var(--border)]">
                      <td className="p-3 font-mono text-xs">{s.id}</td><td className="p-3">{s.beneficiary_id}</td><td className="p-3">{s.muac} مم</td><td className="p-3">{s.weight} كجم</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${CLASS_MAP[s.classification]?.color || 'bg-gray-100 text-gray-600'}`}>{CLASS_MAP[s.classification]?.label || s.classification}</span></td>
                      <td className="p-3 text-xs">{s.screening_date || '-'}</td>
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
