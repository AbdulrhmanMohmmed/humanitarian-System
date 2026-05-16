import { useState } from 'react';
import { AlertTriangle, Plus, BarChart3, Bell, TrendingUp, ArrowDown, ArrowUp } from 'lucide-react';
import { useEarlyWarningIndicators, useCreateEwIndicator, useUpdateEwValue, useEarlyWarningAlerts } from '../hooks/useModuleApi';

const ALERT_COLORS = { warning: 'bg-yellow-100 text-yellow-700 border-yellow-200', critical: 'bg-red-100 text-red-700 border-red-200', info: 'bg-blue-100 text-blue-700 border-blue-200' };

export default function EarlyWarningPage() {
  const [tab, setTab] = useState('indicators');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'food_security', unit: '', warning_threshold: '', critical_threshold: '', current_value: 0, location: '' });
  const [updateId, setUpdateId] = useState(null);
  const [updateValue, setUpdateValue] = useState('');

  const { data: indicators = [], isLoading: indLoading } = useEarlyWarningIndicators({});
  const createIndicator = useCreateEwIndicator();
  const updateEwValue = useUpdateEwValue();
  const { data: alerts = [], isLoading: alertLoading } = useEarlyWarningAlerts();

  const criticalCount = (alerts || []).filter(a => a.level === 'critical').length;
  const warningCount = (alerts || []).filter(a => a.level === 'warning').length;

  const handleUpdateValue = async (id) => {
    try {
      await updateEwValue.mutateAsync({ id, value: parseFloat(updateValue) });
      setUpdateId(null);
      setUpdateValue('');
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-yellow-600" /><h1 className="text-2xl font-bold">نظام الإنذار المبكر</h1></div>
        <button onClick={() => { setTab('indicators'); setShowForm(true); }} className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> مؤشر جديد</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-blue-600">{(indicators || []).length}</p><p className="text-sm text-[var(--text-secondary)]">المؤشرات</p></div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-yellow-600">{warningCount}</p><p className="text-sm text-yellow-600">تحذيرات</p></div>
        <div className="bg-[var(--card)] rounded-xl border border-red-200 p-4 text-center"><p className="text-3xl font-bold text-red-600">{criticalCount}</p><p className="text-sm text-red-600">إنذارات حرجة</p></div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-green-600">{(alerts || []).length}</p><p className="text-sm text-[var(--text-secondary)]">إجمالي التنبيهات</p></div>
      </div>

      {criticalCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 flex items-start gap-3">
          <Bell className="w-5 h-5 text-red-600 mt-0.5 animate-pulse" />
          <div><p className="font-medium text-red-700">تنبيه حرج: {criticalCount} مؤشر تجاوز الحد الحرج</p><p className="text-sm text-red-600">يرجى مراجعة المؤشرات واتخاذ الإجراءات اللازمة فوراً</p></div>
        </div>
      )}

      <div className="flex gap-2 border-b border-[var(--border)]">
        {[{ id: 'indicators', label: 'المؤشرات', icon: TrendingUp }, { id: 'alerts', label: 'التنبيهات', icon: Bell }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 ${tab === t.id ? 'border-yellow-600 text-yellow-600' : 'border-transparent text-[var(--text-secondary)]'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'indicators' && (
        <div className="space-y-4">
          {showForm && (
            <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] space-y-4">
              <h3 className="font-semibold">مؤشر إنذار مبكر جديد</h3>
              <div className="grid grid-cols-3 gap-3">
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="اسم المؤشر" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="food_security">أمن غذائي</option><option value="health">صحة</option><option value="conflict">نزاع</option><option value="displacement">نزوح</option><option value="weather">طقس</option><option value="economic">اقتصادي</option>
                </select>
                <input type="text" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="وحدة القياس" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={form.warning_threshold} onChange={e => setForm(p => ({ ...p, warning_threshold: e.target.value }))} placeholder="حد التحذير" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={form.critical_threshold} onChange={e => setForm(p => ({ ...p, critical_threshold: e.target.value }))} placeholder="الحد الحرج" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="الموقع" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              </div>
              <div className="flex gap-2">
                <button onClick={async () => { await createIndicator.mutateAsync({ ...form, warning_threshold: parseFloat(form.warning_threshold), critical_threshold: parseFloat(form.critical_threshold) }); setShowForm(false); setForm({ name: '', category: 'food_security', unit: '', warning_threshold: '', critical_threshold: '', current_value: 0, location: '' }); }}
                  disabled={createIndicator.isPending || !form.name} className="bg-yellow-600 text-white px-6 py-2 rounded-lg">إنشاء المؤشر</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[var(--border)] rounded-lg">إلغاء</button>
              </div>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">المؤشر</th><th className="text-right p-3">الفئة</th><th className="text-right p-3">القيمة الحالية</th><th className="text-right p-3">حد التحذير</th><th className="text-right p-3">الحد الحرج</th><th className="text-right p-3">تحديث</th></tr></thead>
              <tbody>
                {indLoading ? <tr><td colSpan={6} className="p-4 text-center">جاري التحميل...</td></tr> :
                  (indicators || []).map(ind => {
                    const isWarning = ind.current_value >= ind.warning_threshold && ind.current_value < ind.critical_threshold;
                    const isCritical = ind.current_value >= ind.critical_threshold;
                    return (
                      <tr key={ind.id} className={`border-t border-[var(--border)] ${isCritical ? 'bg-red-50 dark:bg-red-900/10' : isWarning ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
                        <td className="p-3 font-medium">{ind.name}</td><td className="p-3 text-xs">{ind.category}</td>
                        <td className="p-3">
                          <span className={`font-mono font-bold ${isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'}`}>{ind.current_value} {ind.unit}</span>
                        </td>
                        <td className="p-3 font-mono text-yellow-600">{ind.warning_threshold}</td>
                        <td className="p-3 font-mono text-red-600">{ind.critical_threshold}</td>
                        <td className="p-3">
                          {updateId === ind.id ? (
                            <div className="flex gap-1">
                              <input type="number" value={updateValue} onChange={e => setUpdateValue(e.target.value)} className="border border-[var(--border)] rounded px-2 py-1 w-20" />
                              <button onClick={() => handleUpdateValue(ind.id)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">حفظ</button>
                            </div>
                          ) : (
                            <button onClick={() => { setUpdateId(ind.id); setUpdateValue(ind.current_value?.toString() || '0'); }} className="text-blue-600 text-xs hover:underline">تحديث</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'alerts' && (
        <div className="space-y-3">
          {alertLoading ? <p className="text-center p-4">جاري التحميل...</p> :
            (alerts || []).length === 0 ? <p className="text-center p-8 text-[var(--text-secondary)]">لا توجد تنبيهات حالياً</p> :
            (alerts || []).map(a => (
              <div key={a.id} className={`p-4 rounded-xl border ${ALERT_COLORS[a.level] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {a.level === 'critical' ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    <span className="font-medium">{a.message || `تنبيه: ${a.indicator_name || 'مؤشر'} تجاوز الحد`}</span>
                  </div>
                  <span className="text-xs">{a.created_at ? new Date(a.created_at).toLocaleString('ar') : '-'}</span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
