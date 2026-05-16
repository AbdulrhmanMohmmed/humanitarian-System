import { useState } from 'react';
import { Shield, UserCheck, Plus, ArrowRight, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useProtectionCases, useCreateProtectionCase, useProtectionReferrals, useCreateReferral } from '../hooks/useModuleApi';

const STATUS_MAP = { open: { label: 'مفتوحة', color: 'bg-blue-100 text-blue-700' }, in_progress: { label: 'قيد المتابعة', color: 'bg-yellow-100 text-yellow-700' }, closed: { label: 'مغلقة', color: 'bg-green-100 text-green-700' }, referred: { label: 'محوّلة', color: 'bg-purple-100 text-purple-700' } };
const PRIORITY_MAP = { low: { label: 'منخفضة', color: 'bg-gray-100 text-gray-600' }, medium: { label: 'متوسطة', color: 'bg-yellow-100 text-yellow-700' }, high: { label: 'عالية', color: 'bg-orange-100 text-orange-700' }, critical: { label: 'حرجة', color: 'bg-red-100 text-red-700' } };

export default function ProtectionPage() {
  const [tab, setTab] = useState('cases');
  const [showForm, setShowForm] = useState(false);
  const [caseForm, setCaseForm] = useState({ case_type: 'GBV', priority: 'medium', description: '', beneficiary_id: '' });
  const [refForm, setRefForm] = useState({ case_id: '', referred_to: '', reason: '' });

  const { data: cases = [], isLoading: casesLoading } = useProtectionCases({});
  const createCase = useCreateProtectionCase();
  const { data: referrals = [], isLoading: refsLoading } = useProtectionReferrals({});
  const createReferral = useCreateReferral();

  const handleCreateCase = async () => {
    try {
      await createCase.mutateAsync({ ...caseForm, beneficiary_id: parseInt(caseForm.beneficiary_id) || undefined });
      setCaseForm({ case_type: 'GBV', priority: 'medium', description: '', beneficiary_id: '' });
      setShowForm(false);
    } catch (e) { console.error(e); }
  };

  const stats = { total: (cases || []).length, open: (cases || []).filter(c => c.status === 'open').length, critical: (cases || []).filter(c => c.priority === 'critical').length };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold">إدارة حالات الحماية</h1>
        </div>
        <button onClick={() => { setTab('cases'); setShowForm(true); }} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> حالة جديدة
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{stats.total}</p><p className="text-sm text-[var(--text-secondary)]">إجمالي الحالات</p>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.open}</p><p className="text-sm text-[var(--text-secondary)]">حالات مفتوحة</p>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{stats.critical}</p><p className="text-sm text-[var(--text-secondary)]">حالات حرجة</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)]">
        {[{ id: 'cases', label: 'الحالات', icon: Shield }, { id: 'referrals', label: 'الإحالات', icon: ArrowRight }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 ${tab === t.id ? 'border-purple-600 text-purple-600' : 'border-transparent text-[var(--text-secondary)]'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'cases' && (
        <div className="space-y-4">
          {showForm && (
            <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] space-y-4">
              <h3 className="font-semibold">تسجيل حالة حماية جديدة</h3>
              <div className="grid grid-cols-2 gap-4">
                <select value={caseForm.case_type} onChange={e => setCaseForm(p => ({ ...p, case_type: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="GBV">العنف القائم على النوع الاجتماعي</option>
                  <option value="child_protection">حماية الطفل</option>
                  <option value="trafficking">الاتجار بالبشر</option>
                  <option value="detention">الاحتجاز</option>
                  <option value="general">حماية عامة</option>
                </select>
                <select value={caseForm.priority} onChange={e => setCaseForm(p => ({ ...p, priority: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية</option><option value="critical">حرجة</option>
                </select>
                <input type="number" value={caseForm.beneficiary_id} onChange={e => setCaseForm(p => ({ ...p, beneficiary_id: e.target.value }))} placeholder="رقم المستفيد (اختياري)" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <textarea value={caseForm.description} onChange={e => setCaseForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف الحالة" rows={2} className="border border-[var(--border)] rounded-lg px-3 py-2" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateCase} disabled={createCase.isPending} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">تسجيل الحالة</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[var(--border)] rounded-lg">إلغاء</button>
              </div>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">رقم الحالة</th><th className="text-right p-3">النوع</th><th className="text-right p-3">الأولوية</th><th className="text-right p-3">الحالة</th><th className="text-right p-3">التاريخ</th></tr></thead>
              <tbody>
                {casesLoading ? <tr><td colSpan={5} className="p-4 text-center">جاري التحميل...</td></tr> :
                  (cases || []).map(c => (
                    <tr key={c.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                      <td className="p-3 font-mono text-xs">{c.case_number}</td>
                      <td className="p-3">{c.case_type}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${PRIORITY_MAP[c.priority]?.color || ''}`}>{PRIORITY_MAP[c.priority]?.label || c.priority}</span></td>
                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${STATUS_MAP[c.status]?.color || ''}`}>{STATUS_MAP[c.status]?.label || c.status}</span></td>
                      <td className="p-3 text-xs">{c.created_at ? new Date(c.created_at).toLocaleDateString('ar') : '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'referrals' && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
            <h3 className="font-semibold">إحالة جديدة</h3>
            <div className="grid grid-cols-3 gap-3">
              <input type="number" value={refForm.case_id} onChange={e => setRefForm(p => ({ ...p, case_id: e.target.value }))} placeholder="رقم الحالة" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              <input type="text" value={refForm.referred_to} onChange={e => setRefForm(p => ({ ...p, referred_to: e.target.value }))} placeholder="جهة الإحالة" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              <input type="text" value={refForm.reason} onChange={e => setRefForm(p => ({ ...p, reason: e.target.value }))} placeholder="سبب الإحالة" className="border border-[var(--border)] rounded-lg px-3 py-2" />
            </div>
            <button onClick={async () => { await createReferral.mutateAsync({ ...refForm, case_id: parseInt(refForm.case_id) }); setRefForm({ case_id: '', referred_to: '', reason: '' }); }}
              disabled={createReferral.isPending} className="bg-purple-600 text-white px-4 py-2 rounded-lg">إرسال الإحالة</button>
          </div>
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">الحالة</th><th className="text-right p-3">جهة الإحالة</th><th className="text-right p-3">السبب</th><th className="text-right p-3">التاريخ</th></tr></thead>
              <tbody>
                {refsLoading ? <tr><td colSpan={4} className="p-4 text-center">جاري التحميل...</td></tr> :
                  (referrals || []).map(r => (
                    <tr key={r.id} className="border-t border-[var(--border)]"><td className="p-3">{r.case_id}</td><td className="p-3">{r.referred_to}</td><td className="p-3">{r.reason}</td><td className="p-3 text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString('ar') : '-'}</td></tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
