import { useState } from 'react';
import { Briefcase, Plus, Users, DollarSign, TrendingUp } from 'lucide-react';
import { useLivelihoodPrograms, useCreateLivelihoodProgram } from '../hooks/useModuleApi';

export default function LivelihoodsPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', program_type: 'cash_for_work', sector: 'agriculture', target_beneficiaries: 0, budget: 0, location: '', status: 'active', description: '' });

  const { data: programs = [], isLoading } = useLivelihoodPrograms({});
  const createProgram = useCreateLivelihoodProgram();

  const totalBudget = (programs || []).reduce((s, p) => s + (p.budget || 0), 0);
  const totalBeneficiaries = (programs || []).reduce((s, p) => s + (p.target_beneficiaries || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Briefcase className="w-8 h-8 text-amber-600" /><h1 className="text-2xl font-bold">سبل العيش والتمكين الاقتصادي</h1></div>
        <button onClick={() => setShowForm(true)} className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> برنامج جديد</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-amber-600">{(programs || []).length}</p><p className="text-sm text-[var(--text-secondary)]">البرامج</p></div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-green-600">{(programs || []).filter(p => p.status === 'active').length}</p><p className="text-sm text-[var(--text-secondary)]">برامج نشطة</p></div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-blue-600">{totalBeneficiaries.toLocaleString()}</p><p className="text-sm text-[var(--text-secondary)]">المستفيدون المستهدفون</p></div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-purple-600">${totalBudget.toLocaleString()}</p><p className="text-sm text-[var(--text-secondary)]">إجمالي الميزانية</p></div>
      </div>

      {showForm && (
        <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] space-y-4">
          <h3 className="font-semibold">برنامج سبل عيش جديد</h3>
          <div className="grid grid-cols-3 gap-4">
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="اسم البرنامج" className="border border-[var(--border)] rounded-lg px-3 py-2" />
            <select value={form.program_type} onChange={e => setForm(p => ({ ...p, program_type: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
              <option value="cash_for_work">نقد مقابل العمل</option><option value="vocational_training">تدريب مهني</option><option value="micro_enterprise">مشاريع صغيرة</option>
              <option value="agricultural">زراعي</option><option value="savings_group">مجموعات ادخار</option>
            </select>
            <select value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
              <option value="agriculture">زراعة</option><option value="livestock">ثروة حيوانية</option><option value="trade">تجارة</option><option value="services">خدمات</option><option value="manufacturing">تصنيع</option>
            </select>
            <input type="number" value={form.target_beneficiaries} onChange={e => setForm(p => ({ ...p, target_beneficiaries: parseInt(e.target.value) || 0 }))} placeholder="المستفيدون المستهدفون" className="border border-[var(--border)] rounded-lg px-3 py-2" />
            <input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: parseFloat(e.target.value) || 0 }))} placeholder="الميزانية ($)" className="border border-[var(--border)] rounded-lg px-3 py-2" />
            <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="الموقع" className="border border-[var(--border)] rounded-lg px-3 py-2" />
          </div>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف البرنامج" rows={2} className="border border-[var(--border)] rounded-lg px-3 py-2 w-full" />
          <div className="flex gap-2">
            <button onClick={async () => { await createProgram.mutateAsync(form); setShowForm(false); setForm({ name: '', program_type: 'cash_for_work', sector: 'agriculture', target_beneficiaries: 0, budget: 0, location: '', status: 'active', description: '' }); }}
              disabled={createProgram.isPending || !form.name} className="bg-amber-600 text-white px-6 py-2 rounded-lg">إنشاء البرنامج</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[var(--border)] rounded-lg">إلغاء</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {isLoading ? <p className="text-center p-4">جاري التحميل...</p> : (programs || []).map(p => (
          <div key={p.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                  <span>{p.program_type?.replace(/_/g, ' ')}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.target_beneficiaries} مستفيد</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${p.budget?.toLocaleString()}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {p.status === 'active' ? 'نشط' : p.status === 'completed' ? 'مكتمل' : 'مخطط'}
              </span>
            </div>
            {p.description && <p className="mt-2 text-sm text-[var(--text-secondary)]">{p.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
