import { useState } from 'react';
import { Droplets, Plus, BarChart3, Beaker, AlertTriangle, CheckCircle } from 'lucide-react';
import { useWaterPoints, useCreateWaterPoint, useWaterTests, useCreateWaterTest, useWashDashboard } from '../hooks/useModuleApi';

export default function WashPage() {
  const [tab, setTab] = useState('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [wpForm, setWpForm] = useState({ name: '', location: '', water_source_type: 'borehole', status: 'functional', population_served: 0, water_quality_status: 'safe' });
  const [testForm, setTestForm] = useState({ water_point_id: '', ph_level: '', turbidity: '', chlorine_residual: '', e_coli_count: 0, result: 'safe' });

  const { data: dashboard, isLoading: dashLoading } = useWashDashboard();
  const { data: waterPoints = [], isLoading: wpLoading } = useWaterPoints({});
  const createWp = useCreateWaterPoint();
  const { data: tests = [], isLoading: testLoading } = useWaterTests({});
  const createTest = useCreateWaterTest();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Droplets className="w-8 h-8 text-cyan-600" /><h1 className="text-2xl font-bold">المياه والصرف الصحي والنظافة (WASH)</h1></div>
        <button onClick={() => { setTab('points'); setShowForm(true); }} className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> نقطة مياه جديدة
        </button>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)]">
        {[{ id: 'dashboard', label: 'لوحة القيادة', icon: BarChart3 }, { id: 'points', label: 'نقاط المياه', icon: Droplets }, { id: 'tests', label: 'فحوصات الجودة', icon: Beaker }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 ${tab === t.id ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-[var(--text-secondary)]'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-4">
          {dashLoading ? <p className="text-center p-4">جاري التحميل...</p> : (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-cyan-600">{dashboard?.total_water_points || 0}</p><p className="text-sm text-[var(--text-secondary)]">إجمالي نقاط المياه</p></div>
              <div className="bg-[var(--card)] rounded-xl border border-green-200 p-4 text-center"><p className="text-3xl font-bold text-green-600">{dashboard?.functional || 0}</p><p className="text-sm text-green-600">نقاط فعّالة</p></div>
              <div className="bg-[var(--card)] rounded-xl border border-blue-200 p-4 text-center"><p className="text-3xl font-bold text-blue-600">{dashboard?.safe_water || 0}</p><p className="text-sm text-blue-600">مياه آمنة</p></div>
              <div className="bg-[var(--card)] rounded-xl border border-purple-200 p-4 text-center"><p className="text-3xl font-bold text-purple-600">{(dashboard?.total_served || 0).toLocaleString()}</p><p className="text-sm text-purple-600">السكان المخدومين</p></div>
            </div>
          )}
        </div>
      )}

      {tab === 'points' && (
        <div className="space-y-4">
          {showForm && (
            <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] space-y-4">
              <h3 className="font-semibold">تسجيل نقطة مياه جديدة</h3>
              <div className="grid grid-cols-3 gap-3">
                <input type="text" value={wpForm.name} onChange={e => setWpForm(p => ({ ...p, name: e.target.value }))} placeholder="اسم نقطة المياه" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="text" value={wpForm.location} onChange={e => setWpForm(p => ({ ...p, location: e.target.value }))} placeholder="الموقع" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={wpForm.water_source_type} onChange={e => setWpForm(p => ({ ...p, water_source_type: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="borehole">بئر عميق</option><option value="well">بئر يدوي</option><option value="spring">نبع</option><option value="river">نهر</option><option value="tap">صنبور</option><option value="tank">خزان</option>
                </select>
                <select value={wpForm.status} onChange={e => setWpForm(p => ({ ...p, status: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="functional">فعّال</option><option value="non_functional">معطّل</option><option value="needs_repair">يحتاج إصلاح</option>
                </select>
                <input type="number" value={wpForm.population_served} onChange={e => setWpForm(p => ({ ...p, population_served: parseInt(e.target.value) || 0 }))} placeholder="السكان المخدومين" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={wpForm.water_quality_status} onChange={e => setWpForm(p => ({ ...p, water_quality_status: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="safe">آمنة</option><option value="contaminated">ملوّثة</option><option value="unknown">غير مفحوصة</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => { await createWp.mutateAsync(wpForm); setShowForm(false); }} disabled={createWp.isPending || !wpForm.name} className="bg-cyan-600 text-white px-6 py-2 rounded-lg">حفظ</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[var(--border)] rounded-lg">إلغاء</button>
              </div>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">الاسم</th><th className="text-right p-3">الموقع</th><th className="text-right p-3">النوع</th><th className="text-right p-3">الحالة</th><th className="text-right p-3">جودة المياه</th><th className="text-right p-3">السكان</th></tr></thead>
              <tbody>
                {wpLoading ? <tr><td colSpan={6} className="p-4 text-center">جاري التحميل...</td></tr> :
                  (waterPoints || []).map(w => (
                    <tr key={w.id} className="border-t border-[var(--border)]">
                      <td className="p-3 font-medium">{w.name}</td><td className="p-3">{w.location}</td><td className="p-3 text-xs">{w.water_source_type}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${w.status === 'functional' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{w.status === 'functional' ? 'فعّال' : w.status === 'needs_repair' ? 'يحتاج إصلاح' : 'معطّل'}</span></td>
                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${w.water_quality_status === 'safe' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{w.water_quality_status === 'safe' ? 'آمنة' : 'ملوّثة'}</span></td>
                      <td className="p-3">{w.population_served?.toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
            <h3 className="font-semibold">فحص جودة مياه جديد</h3>
            <div className="grid grid-cols-3 gap-3">
              <select value={testForm.water_point_id} onChange={e => setTestForm(p => ({ ...p, water_point_id: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                <option value="">اختر نقطة المياه</option>{(waterPoints || []).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <input type="number" value={testForm.ph_level} onChange={e => setTestForm(p => ({ ...p, ph_level: e.target.value }))} placeholder="مستوى pH" step="0.1" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              <input type="number" value={testForm.turbidity} onChange={e => setTestForm(p => ({ ...p, turbidity: e.target.value }))} placeholder="التعكر (NTU)" step="0.1" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              <input type="number" value={testForm.chlorine_residual} onChange={e => setTestForm(p => ({ ...p, chlorine_residual: e.target.value }))} placeholder="الكلور المتبقي" step="0.01" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              <input type="number" value={testForm.e_coli_count} onChange={e => setTestForm(p => ({ ...p, e_coli_count: parseInt(e.target.value) || 0 }))} placeholder="E.Coli (CFU/100ml)" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              <select value={testForm.result} onChange={e => setTestForm(p => ({ ...p, result: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                <option value="safe">آمنة</option><option value="contaminated">ملوّثة</option>
              </select>
            </div>
            <button onClick={async () => { await createTest.mutateAsync({ ...testForm, water_point_id: parseInt(testForm.water_point_id) }); setTestForm({ water_point_id: '', ph_level: '', turbidity: '', chlorine_residual: '', e_coli_count: 0, result: 'safe' }); }}
              disabled={createTest.isPending || !testForm.water_point_id} className="bg-cyan-600 text-white px-4 py-2 rounded-lg">تسجيل الفحص</button>
          </div>
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">نقطة المياه</th><th className="text-right p-3">pH</th><th className="text-right p-3">التعكر</th><th className="text-right p-3">النتيجة</th><th className="text-right p-3">التاريخ</th></tr></thead>
              <tbody>
                {testLoading ? <tr><td colSpan={5} className="p-4 text-center">جاري التحميل...</td></tr> :
                  (tests || []).map(t => (
                    <tr key={t.id} className="border-t border-[var(--border)]">
                      <td className="p-3">{t.water_point_id}</td><td className="p-3">{t.ph_level}</td><td className="p-3">{t.turbidity}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${t.result === 'safe' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.result === 'safe' ? 'آمنة' : 'ملوّثة'}</span></td>
                      <td className="p-3 text-xs">{t.test_date || '-'}</td>
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
