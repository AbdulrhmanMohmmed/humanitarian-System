import { useState } from 'react';
import { Siren, Plus, MapPin, Clock, AlertTriangle, Users, FileText } from 'lucide-react';
import { useEmergencies, useCreateEmergency, useRapidAssessments, useCreateAssessment } from '../hooks/useModuleApi';

const SEVERITY_MAP = { minor: { label: 'طفيفة', color: 'bg-gray-100 text-gray-700' }, moderate: { label: 'معتدلة', color: 'bg-yellow-100 text-yellow-700' }, major: { label: 'كبيرة', color: 'bg-orange-100 text-orange-700' }, catastrophic: { label: 'كارثية', color: 'bg-red-100 text-red-700' } };

export default function EmergencyPage() {
  const [tab, setTab] = useState('emergencies');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', emergency_type: 'natural_disaster', severity: 'moderate', location: '', affected_population: 0, description: '' });
  const [assessForm, setAssessForm] = useState({ emergency_id: '', sector: 'shelter', findings: '', priority_actions: '', estimated_affected: 0 });

  const { data: emergencies = [], isLoading } = useEmergencies({});
  const createEmergency = useCreateEmergency();
  const { data: assessments = [], isLoading: assLoading } = useRapidAssessments({});
  const createAssessment = useCreateAssessment();

  const activeCount = (emergencies || []).filter(e => e.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Siren className="w-8 h-8 text-red-600" />
          <h1 className="text-2xl font-bold">الاستجابة للطوارئ</h1>
        </div>
        <button onClick={() => { setTab('emergencies'); setShowForm(true); }} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> إعلان طوارئ
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{activeCount}</p><p className="text-sm text-[var(--text-secondary)]">طوارئ نشطة</p>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center">
          <p className="text-3xl font-bold text-orange-600">{(emergencies || []).length}</p><p className="text-sm text-[var(--text-secondary)]">إجمالي الطوارئ</p>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{(assessments || []).length}</p><p className="text-sm text-[var(--text-secondary)]">التقييمات السريعة</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)]">
        {[{ id: 'emergencies', label: 'الطوارئ', icon: Siren }, { id: 'assessments', label: 'التقييمات السريعة', icon: FileText }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 ${tab === t.id ? 'border-red-600 text-red-600' : 'border-transparent text-[var(--text-secondary)]'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'emergencies' && (
        <div className="space-y-4">
          {showForm && (
            <div className="bg-[var(--card)] p-6 rounded-xl border border-red-200 space-y-4">
              <h3 className="font-semibold text-red-600">إعلان طوارئ جديد</h3>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="اسم الطوارئ" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={form.emergency_type} onChange={e => setForm(p => ({ ...p, emergency_type: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="natural_disaster">كارثة طبيعية</option><option value="conflict">نزاع مسلح</option><option value="epidemic">وباء</option><option value="displacement">نزوح</option><option value="famine">مجاعة</option>
                </select>
                <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="minor">طفيفة</option><option value="moderate">معتدلة</option><option value="major">كبيرة</option><option value="catastrophic">كارثية</option>
                </select>
                <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="الموقع" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={form.affected_population} onChange={e => setForm(p => ({ ...p, affected_population: parseInt(e.target.value) || 0 }))} placeholder="عدد المتأثرين" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="الوصف" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              </div>
              <div className="flex gap-2">
                <button onClick={async () => { await createEmergency.mutateAsync(form); setShowForm(false); setForm({ name: '', emergency_type: 'natural_disaster', severity: 'moderate', location: '', affected_population: 0, description: '' }); }}
                  disabled={createEmergency.isPending || !form.name} className="bg-red-600 text-white px-6 py-2 rounded-lg">إعلان الطوارئ</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[var(--border)] rounded-lg">إلغاء</button>
              </div>
            </div>
          )}
          <div className="grid gap-4">
            {isLoading ? <p className="text-center p-4">جاري التحميل...</p> : (emergencies || []).map(e => (
              <div key={e.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{e.name}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.location || 'غير محدد'}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {e.affected_population?.toLocaleString() || 0} متأثر</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${SEVERITY_MAP[e.severity]?.color || ''}`}>{SEVERITY_MAP[e.severity]?.label || e.severity}</span>
                    <span className={`px-2 py-1 rounded text-xs ${e.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{e.status === 'active' ? 'نشطة' : 'منتهية'}</span>
                  </div>
                </div>
                {e.description && <p className="mt-2 text-sm text-[var(--text-secondary)]">{e.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'assessments' && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
            <h3 className="font-semibold">تقييم سريع جديد</h3>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={assessForm.emergency_id} onChange={e => setAssessForm(p => ({ ...p, emergency_id: e.target.value }))} placeholder="رقم الطوارئ" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              <select value={assessForm.sector} onChange={e => setAssessForm(p => ({ ...p, sector: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                <option value="shelter">المأوى</option><option value="food">الغذاء</option><option value="wash">المياه والصرف</option><option value="health">الصحة</option><option value="protection">الحماية</option><option value="education">التعليم</option>
              </select>
              <textarea value={assessForm.findings} onChange={e => setAssessForm(p => ({ ...p, findings: e.target.value }))} placeholder="النتائج" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              <textarea value={assessForm.priority_actions} onChange={e => setAssessForm(p => ({ ...p, priority_actions: e.target.value }))} placeholder="الإجراءات ذات الأولوية" className="border border-[var(--border)] rounded-lg px-3 py-2" />
            </div>
            <button onClick={async () => { await createAssessment.mutateAsync({ ...assessForm, emergency_id: parseInt(assessForm.emergency_id) }); setAssessForm({ emergency_id: '', sector: 'shelter', findings: '', priority_actions: '', estimated_affected: 0 }); }}
              disabled={createAssessment.isPending} className="bg-red-600 text-white px-4 py-2 rounded-lg">تسجيل التقييم</button>
          </div>
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">الطوارئ</th><th className="text-right p-3">القطاع</th><th className="text-right p-3">النتائج</th><th className="text-right p-3">التاريخ</th></tr></thead>
              <tbody>
                {assLoading ? <tr><td colSpan={4} className="p-4 text-center">جاري التحميل...</td></tr> :
                  (assessments || []).map(a => (
                    <tr key={a.id} className="border-t border-[var(--border)]"><td className="p-3">{a.emergency_id}</td><td className="p-3">{a.sector}</td><td className="p-3 truncate max-w-xs">{a.findings}</td><td className="p-3 text-xs">{a.created_at ? new Date(a.created_at).toLocaleDateString('ar') : '-'}</td></tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
