import { useState } from 'react';
import { Scale, Globe, Shield, Users, Plus, CheckCircle } from 'lucide-react';
import { useSphereStandards, useSeedSphere, useGrandBargain, useDoNoHarm, useCreateDoNoHarm, useGenderMarkers, useCreateGenderMarker, useDisabilityMarkers, useCreateDisabilityMarker } from '../hooks/useModuleApi';

export default function StandardsPage() {
  const [tab, setTab] = useState('sphere');
  const [showForm, setShowForm] = useState(false);
  const [dnhForm, setDnhForm] = useState({ project_id: '', assessment_type: 'conflict_analysis', findings: '', recommendations: '' });
  const [gmForm, setGmForm] = useState({ project_id: '', marker_code: '2a', justification: '' });
  const [dmForm, setDmForm] = useState({ project_id: '', marker_code: '2', justification: '' });

  const { data: sphere = [], isLoading: sphLoading } = useSphereStandards();
  const seedSphere = useSeedSphere();
  const { data: grandBargain = [], isLoading: gbLoading } = useGrandBargain();
  const { data: doNoHarm = [], isLoading: dnhLoading } = useDoNoHarm({});
  const createDnh = useCreateDoNoHarm();
  const { data: genderMarkers = [], isLoading: gmLoading } = useGenderMarkers({});
  const createGm = useCreateGenderMarker();
  const { data: disability = [], isLoading: dmLoading } = useDisabilityMarkers({});
  const createDm = useCreateDisabilityMarker();

  const tabs = [
    { id: 'sphere', label: 'معايير Sphere', icon: Globe },
    { id: 'grand_bargain', label: 'الصفقة الكبرى', icon: Scale },
    { id: 'dnh', label: 'Do No Harm', icon: Shield },
    { id: 'gender', label: 'مؤشر النوع الاجتماعي', icon: Users },
    { id: 'disability', label: 'مؤشر الإعاقة', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Scale className="w-8 h-8 text-rose-600" /><h1 className="text-2xl font-bold">المعايير الدولية والامتثال</h1></div>

      <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); }}
            className={`flex items-center gap-1 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap ${tab === t.id ? 'border-rose-600 text-rose-600' : 'border-transparent text-[var(--text-secondary)]'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'sphere' && (
        <div className="space-y-4">
          <button onClick={() => seedSphere.mutate({})} disabled={seedSphere.isPending}
            className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm">{seedSphere.isPending ? 'جاري التهيئة...' : 'تهيئة معايير Sphere الافتراضية'}</button>
          <div className="grid gap-3">
            {sphLoading ? <p className="text-center p-4">جاري التحميل...</p> : (sphere || []).map(s => (
              <div key={s.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
                <div className="flex items-start justify-between">
                  <div><h3 className="font-medium">{s.standard_name || s.name}</h3><p className="text-sm text-[var(--text-secondary)] mt-1">{s.description}</p></div>
                  <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs">{s.category || s.sector}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'grand_bargain' && (
        <div className="grid gap-3">
          {gbLoading ? <p className="text-center p-4">جاري التحميل...</p> :
            (grandBargain || []).length === 0 ? <p className="text-center p-8 text-[var(--text-secondary)]">لا توجد التزامات مسجلة</p> :
            (grandBargain || []).map(g => (
              <div key={g.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 flex justify-between items-center">
                <div><h3 className="font-medium">{g.commitment_name || g.title}</h3><p className="text-xs text-[var(--text-secondary)]">{g.description}</p></div>
                <span className={`px-3 py-1 rounded-full text-xs ${g.status === 'met' ? 'bg-green-100 text-green-700' : g.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                  {g.status === 'met' ? 'محقق' : g.status === 'partial' ? 'جزئي' : 'قيد التنفيذ'}
                </span>
              </div>
            ))}
        </div>
      )}

      {tab === 'dnh' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> تقييم جديد</button>
          {showForm && (
            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={dnhForm.project_id} onChange={e => setDnhForm(p => ({ ...p, project_id: e.target.value }))} placeholder="رقم المشروع" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={dnhForm.assessment_type} onChange={e => setDnhForm(p => ({ ...p, assessment_type: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="conflict_analysis">تحليل النزاع</option><option value="impact_assessment">تقييم الأثر</option><option value="risk_mitigation">تخفيف المخاطر</option>
                </select>
                <textarea value={dnhForm.findings} onChange={e => setDnhForm(p => ({ ...p, findings: e.target.value }))} placeholder="النتائج" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <textarea value={dnhForm.recommendations} onChange={e => setDnhForm(p => ({ ...p, recommendations: e.target.value }))} placeholder="التوصيات" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              </div>
              <button onClick={async () => { await createDnh.mutateAsync({ ...dnhForm, project_id: parseInt(dnhForm.project_id) }); setShowForm(false); }} className="bg-rose-600 text-white px-4 py-2 rounded-lg">حفظ</button>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">المشروع</th><th className="text-right p-3">النوع</th><th className="text-right p-3">النتائج</th><th className="text-right p-3">التاريخ</th></tr></thead>
              <tbody>{dnhLoading ? <tr><td colSpan={4} className="p-4 text-center">جاري التحميل...</td></tr> :
                (doNoHarm || []).map(d => (
                  <tr key={d.id} className="border-t border-[var(--border)]"><td className="p-3">{d.project_id}</td><td className="p-3 text-xs">{d.assessment_type}</td><td className="p-3 truncate max-w-xs">{d.findings}</td><td className="p-3 text-xs">{d.created_at ? new Date(d.created_at).toLocaleDateString('ar') : '-'}</td></tr>
                ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'gender' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> تقييم مؤشر النوع</button>
          {showForm && (
            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <input type="number" value={gmForm.project_id} onChange={e => setGmForm(p => ({ ...p, project_id: e.target.value }))} placeholder="رقم المشروع" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={gmForm.marker_code} onChange={e => setGmForm(p => ({ ...p, marker_code: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="0">0 - لا يراعي النوع</option><option value="1">1 - مراعاة محدودة</option><option value="2a">2a - مراعاة كبيرة</option><option value="2b">2b - هدف رئيسي</option>
                </select>
                <textarea value={gmForm.justification} onChange={e => setGmForm(p => ({ ...p, justification: e.target.value }))} placeholder="المبررات" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              </div>
              <button onClick={async () => { await createGm.mutateAsync({ ...gmForm, project_id: parseInt(gmForm.project_id) }); setShowForm(false); }} className="bg-rose-600 text-white px-4 py-2 rounded-lg">حفظ</button>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">المشروع</th><th className="text-right p-3">المؤشر</th><th className="text-right p-3">المبررات</th></tr></thead>
              <tbody>{gmLoading ? <tr><td colSpan={3} className="p-4 text-center">جاري التحميل...</td></tr> :
                (genderMarkers || []).map(g => (
                  <tr key={g.id} className="border-t border-[var(--border)]"><td className="p-3">{g.project_id}</td><td className="p-3"><span className="px-2 py-1 bg-pink-100 text-pink-700 rounded font-bold">{g.marker_code}</span></td><td className="p-3 text-sm">{g.justification}</td></tr>
                ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'disability' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> تقييم مؤشر الإعاقة</button>
          {showForm && (
            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <input type="number" value={dmForm.project_id} onChange={e => setDmForm(p => ({ ...p, project_id: e.target.value }))} placeholder="رقم المشروع" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={dmForm.marker_code} onChange={e => setDmForm(p => ({ ...p, marker_code: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="0">0 - لا يراعي الإعاقة</option><option value="1">1 - مراعاة أساسية</option><option value="2">2 - دمج فعّال</option><option value="3">3 - تمكين شامل</option>
                </select>
                <textarea value={dmForm.justification} onChange={e => setDmForm(p => ({ ...p, justification: e.target.value }))} placeholder="المبررات" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              </div>
              <button onClick={async () => { await createDm.mutateAsync({ ...dmForm, project_id: parseInt(dmForm.project_id) }); setShowForm(false); }} className="bg-rose-600 text-white px-4 py-2 rounded-lg">حفظ</button>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">المشروع</th><th className="text-right p-3">المؤشر</th><th className="text-right p-3">المبررات</th></tr></thead>
              <tbody>{dmLoading ? <tr><td colSpan={3} className="p-4 text-center">جاري التحميل...</td></tr> :
                (disability || []).map(d => (
                  <tr key={d.id} className="border-t border-[var(--border)]"><td className="p-3">{d.project_id}</td><td className="p-3"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-bold">{d.marker_code}</span></td><td className="p-3 text-sm">{d.justification}</td></tr>
                ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
