import { useState } from 'react';
import { Home, Plus, Users, MapPin, Wrench } from 'lucide-react';
import { useCamps, useCreateCamp, useCampServices } from '../hooks/useModuleApi';

export default function CampManagement() {
  const [showForm, setShowForm] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [form, setForm] = useState({ name: '', location: '', capacity: 0, current_population: 0, camp_type: 'formal', status: 'active' });

  const { data: camps = [], isLoading } = useCamps({});
  const createCamp = useCreateCamp();
  const { data: services = [] } = useCampServices(selectedCamp);

  const totalPop = (camps || []).reduce((s, c) => s + (c.current_population || 0), 0);
  const totalCap = (camps || []).reduce((s, c) => s + (c.capacity || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Home className="w-8 h-8 text-teal-600" /><h1 className="text-2xl font-bold">إدارة المخيمات</h1></div>
        <button onClick={() => setShowForm(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> مخيم جديد</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-teal-600">{(camps || []).length}</p><p className="text-sm text-[var(--text-secondary)]">إجمالي المخيمات</p></div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-blue-600">{totalPop.toLocaleString()}</p><p className="text-sm text-[var(--text-secondary)]">إجمالي السكان</p></div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-green-600">{totalCap.toLocaleString()}</p><p className="text-sm text-[var(--text-secondary)]">السعة الإجمالية</p></div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-orange-600">{totalCap > 0 ? Math.round(totalPop / totalCap * 100) : 0}%</p><p className="text-sm text-[var(--text-secondary)]">نسبة الإشغال</p></div>
      </div>

      {showForm && (
        <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] space-y-4">
          <h3 className="font-semibold">تسجيل مخيم جديد</h3>
          <div className="grid grid-cols-3 gap-4">
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="اسم المخيم" className="border border-[var(--border)] rounded-lg px-3 py-2" />
            <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="الموقع" className="border border-[var(--border)] rounded-lg px-3 py-2" />
            <select value={form.camp_type} onChange={e => setForm(p => ({ ...p, camp_type: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
              <option value="formal">رسمي</option><option value="informal">غير رسمي</option><option value="transit">عبور</option><option value="collective_center">مركز إيواء جماعي</option>
            </select>
            <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: parseInt(e.target.value) || 0 }))} placeholder="السعة" className="border border-[var(--border)] rounded-lg px-3 py-2" />
            <input type="number" value={form.current_population} onChange={e => setForm(p => ({ ...p, current_population: parseInt(e.target.value) || 0 }))} placeholder="السكان الحاليون" className="border border-[var(--border)] rounded-lg px-3 py-2" />
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
              <option value="active">نشط</option><option value="planned">مخطط</option><option value="closed">مغلق</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={async () => { await createCamp.mutateAsync(form); setShowForm(false); setForm({ name: '', location: '', capacity: 0, current_population: 0, camp_type: 'formal', status: 'active' }); }}
              disabled={createCamp.isPending || !form.name} className="bg-teal-600 text-white px-6 py-2 rounded-lg">حفظ</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[var(--border)] rounded-lg">إلغاء</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {isLoading ? <p className="text-center p-4">جاري التحميل...</p> : (camps || []).map(c => {
          const occ = c.capacity > 0 ? Math.round(c.current_population / c.capacity * 100) : 0;
          return (
            <div key={c.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedCamp(selectedCamp === c.id ? null : c.id)}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{c.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.location || 'غير محدد'}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.current_population?.toLocaleString()} / {c.capacity?.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'planned' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{c.status === 'active' ? 'نشط' : c.status === 'planned' ? 'مخطط' : 'مغلق'}</span>
                  <span className={`px-2 py-1 rounded text-xs font-mono ${occ > 90 ? 'bg-red-100 text-red-700' : occ > 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{occ}%</span>
                </div>
              </div>
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full ${occ > 90 ? 'bg-red-500' : occ > 70 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(occ, 100)}%` }} />
              </div>
              {selectedCamp === c.id && services && (
                <div className="mt-4 border-t border-[var(--border)] pt-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1"><Wrench className="w-3 h-3" /> الخدمات المتاحة</h4>
                  <div className="flex flex-wrap gap-2">
                    {(services || []).length === 0 ? <span className="text-sm text-[var(--text-secondary)]">لا توجد خدمات مسجلة</span> :
                      services.map(s => <span key={s.id} className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs">{s.service_type}: {s.provider}</span>)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
