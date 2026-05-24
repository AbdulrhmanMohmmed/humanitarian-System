import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../contexts/ToastContext';
import {
  Banknote, Building2, Calendar, ChevronDown, DollarSign, FileText,
  Handshake, MapPin, MessageSquare, PieChart, Plus, Save, Send,
  Target, TrendingUp, Users,
} from 'lucide-react';
import { cn } from '../lib/utils';

const TABS = ['لوحة التحكم', 'المقترحات', 'فرص التمويل', 'الأقساط', 'الزيارات', 'التواصل'];

export default function DonorPortal() {
  const { addToast } = useToast();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({});
  const [proposals, setProposals] = useState([]);
  const [proposalStats, setProposalStats] = useState({});
  const [funding, setFunding] = useState([]);
  const [fundingStats, setFundingStats] = useState({});
  const [installments, setInstallments] = useState([]);
  const [visits, setVisits] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    const calls = [
      api.get('/donor-portal/dashboard').then(r => setDashboard(r.data)).catch(() => {}),
      api.get('/donor-portal/proposals').then(r => setProposals(r.data.items || [])).catch(() => {}),
      api.get('/donor-portal/proposals/stats').then(r => setProposalStats(r.data)).catch(() => {}),
      api.get('/donor-portal/funding').then(r => setFunding(r.data.items || [])).catch(() => {}),
      api.get('/donor-portal/funding/stats').then(r => setFundingStats(r.data)).catch(() => {}),
      api.get('/donor-portal/installments').then(r => setInstallments(r.data.items || [])).catch(() => {}),
      api.get('/donor-portal/visits').then(r => setVisits(r.data.items || [])).catch(() => {}),
      api.get('/donor-portal/communications').then(r => setCommunications(r.data.items || [])).catch(() => {}),
    ];
    Promise.allSettled(calls).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateProposal = async () => {
    try {
      await api.post('/donor-portal/proposals', form);
      addToast('تم إنشاء المقترح بنجاح', 'success');
      setShowModal(null);
      load();
    } catch (e) {
      addToast(e.response?.data?.detail || 'حدث خطأ', 'error');
    }
  };

  const handleUpdateProposalStatus = async (id, status) => {
    try {
      await api.put(`/donor-portal/proposals/${id}`, { status });
      addToast('تم تحديث حالة المقترح', 'success');
      load();
    } catch (e) {
      addToast(e.response?.data?.detail || 'حدث خطأ', 'error');
    }
  };

  const handleConvertProposal = async (id) => {
    try {
      const res = await api.post(`/donor-portal/proposals/${id}/convert`);
      addToast(res.data.message, 'success');
      load();
    } catch (e) {
      addToast(e.response?.data?.detail || 'حدث خطأ', 'error');
    }
  };

  const handleCreateFunding = async () => {
    try {
      await api.post('/donor-portal/funding', form);
      addToast('تم إضافة فرصة التمويل', 'success');
      setShowModal(null);
      load();
    } catch (e) {
      addToast(e.response?.data?.detail || 'حدث خطأ', 'error');
    }
  };

  const handleCreateInstallment = async () => {
    try {
      await api.post('/donor-portal/installments', { ...form, amount: parseFloat(form.amount), grant_id: parseInt(form.grant_id) });
      addToast('تم إضافة القسط', 'success');
      setShowModal(null);
      load();
    } catch (e) {
      addToast(e.response?.data?.detail || 'حدث خطأ', 'error');
    }
  };

  const handleDisburse = async (id) => {
    try {
      await api.put(`/donor-portal/installments/${id}/disburse`);
      addToast('تم صرف القسط', 'success');
      load();
    } catch (e) {
      addToast(e.response?.data?.detail || 'حدث خطأ', 'error');
    }
  };

  const handleCreateVisit = async () => {
    try {
      await api.post('/donor-portal/visits', form);
      addToast('تم جدولة الزيارة', 'success');
      setShowModal(null);
      load();
    } catch (e) {
      addToast(e.response?.data?.detail || 'حدث خطأ', 'error');
    }
  };

  const handleCreateComm = async () => {
    try {
      await api.post('/donor-portal/communications', form);
      addToast('تم إرسال الرسالة', 'success');
      setShowModal(null);
      load();
    } catch (e) {
      addToast(e.response?.data?.detail || 'حدث خطأ', 'error');
    }
  };

  const statusMap = {
    draft: 'مسودة', internal_review: 'مراجعة داخلية', submitted: 'مقدم', under_review: 'قيد المراجعة',
    revision_requested: 'طلب تعديل', approved: 'معتمد', rejected: 'مرفوض', converted: 'محوّل لمشروع',
    open: 'مفتوح', closing_soon: 'يغلق قريباً', closed: 'مغلق', awarded: 'ممنوح',
    scheduled: 'مجدول', requested: 'مطلوب', disbursed: 'مصروف', delayed: 'متأخر',
    confirmed: 'مؤكد', completed: 'مكتمل', cancelled: 'ملغي', postponed: 'مؤجل',
  };

  const d = dashboard;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">بوابة المانحين</h1>
          <p className="text-sm text-slate-500">إدارة المقترحات وفرص التمويل والأقساط والزيارات</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b pb-1">
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} className={cn('whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium', tab === i ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700')}>
            {t}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard icon={Handshake} label="المنح النشطة" value={d.grants?.active || 0} sub={`${d.grants?.total || 0} إجمالي`} color="blue" />
            <StatCard icon={Target} label="المشاريع النشطة" value={d.projects?.active || 0} sub={`${d.projects?.total || 0} إجمالي`} color="indigo" />
            <StatCard icon={FileText} label="مقترحات قيد الانتظار" value={d.proposals?.pending || 0} sub={`${d.proposals?.total || 0} إجمالي`} color="amber" />
            <StatCard icon={DollarSign} label="أقساط معلقة" value={d.installments?.pending || 0} sub={`${d.installments?.total || 0} إجمالي`} color="emerald" />
            <StatCard icon={Calendar} label="زيارات قادمة" value={d.upcoming_visits || 0} color="purple" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold">حالة المقترحات</h3>
              {Object.entries(proposalStats.by_status || {}).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b py-2 last:border-0">
                  <span className="text-sm text-slate-600">{statusMap[k] || k}</span>
                  <span className="font-bold">{v}</span>
                </div>
              ))}
              {!Object.keys(proposalStats.by_status || {}).length && <p className="text-sm text-slate-400">لا توجد مقترحات بعد</p>}
            </div>
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold">إحصائيات التمويل</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-slate-600">إجمالي الميزانية المطلوبة</span><span className="font-bold">${(proposalStats.total_budget_requested || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-sm text-slate-600">الميزانية المعتمدة</span><span className="font-bold text-emerald-600">${(proposalStats.approved_budget || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-sm text-slate-600">معدل النجاح</span><span className="font-bold text-blue-600">{proposalStats.success_rate || 0}%</span></div>
                <div className="flex justify-between"><span className="text-sm text-slate-600">فرص تمويل مفتوحة</span><span className="font-bold">{fundingStats.open || 0}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proposals */}
      {tab === 1 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setForm({ title: '', sector: '', budget_requested: 0, duration_months: 12, target_beneficiaries: 0, summary: '' }); setShowModal('proposal'); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> مقترح جديد
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'title', label: 'عنوان المقترح' },
              { key: 'code', label: 'الرمز' },
              { key: 'sector', label: 'القطاع' },
              { key: 'budget_requested', label: 'الميزانية', render: r => `$${(r.budget_requested || 0).toLocaleString()}` },
              { key: 'status', label: 'الحالة', render: r => <StatusBadge status={r.status} label={statusMap[r.status] || r.status} /> },
              { key: 'actions', label: 'إجراءات', render: r => (
                <div className="flex gap-1">
                  {r.status === 'draft' && <button onClick={() => handleUpdateProposalStatus(r.id, 'submitted')} className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100">تقديم</button>}
                  {r.status === 'submitted' && <button onClick={() => handleUpdateProposalStatus(r.id, 'approved')} className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100">اعتماد</button>}
                  {r.status === 'approved' && <button onClick={() => handleConvertProposal(r.id)} className="rounded bg-purple-50 px-2 py-1 text-xs text-purple-700 hover:bg-purple-100">تحويل لمشروع</button>}
                  <button onClick={async () => { await api.delete(`/donor-portal/proposals/${r.id}`); addToast('تم الحذف', 'success'); load(); }} className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100">حذف</button>
                </div>
              )},
            ]}
            data={proposals}
            loading={loading}
            emptyMessage="لا توجد مقترحات"
          />
        </div>
      )}

      {/* Funding Opportunities */}
      {tab === 2 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setForm({ title: '', donor_name: '', sector: '', description: '', min_amount: 0, max_amount: 0, closing_date: '' }); setShowModal('funding'); }} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> فرصة تمويل جديدة
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {funding.map(f => (
              <div key={f.id} className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900 line-clamp-2">{f.title}</h3>
                  <StatusBadge status={f.status} label={statusMap[f.status] || f.status} />
                </div>
                {f.donor_name && <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><Building2 className="h-3.5 w-3.5" />{f.donor_name}</p>}
                {f.sector && <p className="mt-1 text-xs text-blue-600 bg-blue-50 rounded px-2 py-0.5 inline-block">{f.sector}</p>}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">المبلغ:</span>
                  <span className="font-bold text-emerald-600">
                    {f.min_amount && f.max_amount ? `$${f.min_amount.toLocaleString()} - $${f.max_amount.toLocaleString()}` : f.max_amount ? `حتى $${f.max_amount.toLocaleString()}` : 'غير محدد'}
                  </span>
                </div>
                {f.closing_date && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    آخر موعد: {new Date(f.closing_date).toLocaleDateString('ar')}
                  </div>
                )}
                <button onClick={async () => { await api.delete(`/donor-portal/funding/${f.id}`); addToast('تم الحذف', 'success'); load(); }} className="mt-3 w-full rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50">حذف</button>
              </div>
            ))}
            {!funding.length && <p className="col-span-full text-center text-sm text-slate-400 py-8">لا توجد فرص تمويل</p>}
          </div>
        </div>
      )}

      {/* Installments */}
      {tab === 3 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setForm({ grant_id: '', amount: '', scheduled_date: '', notes: '' }); setShowModal('installment'); }} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> قسط جديد
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'grant_id', label: 'المنحة' },
              { key: 'installment_number', label: 'رقم القسط' },
              { key: 'amount', label: 'المبلغ', render: r => `$${(r.amount || 0).toLocaleString()}` },
              { key: 'scheduled_date', label: 'تاريخ الاستحقاق', render: r => r.scheduled_date ? new Date(r.scheduled_date).toLocaleDateString('ar') : '-' },
              { key: 'status', label: 'الحالة', render: r => <StatusBadge status={r.status} label={statusMap[r.status] || r.status} /> },
              { key: 'actions', label: 'إجراءات', render: r => (
                r.status !== 'disbursed' ? <button onClick={() => handleDisburse(r.id)} className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100">صرف</button> : <span className="text-xs text-slate-400">تم الصرف</span>
              )},
            ]}
            data={installments}
            loading={loading}
            emptyMessage="لا توجد أقساط"
          />
        </div>
      )}

      {/* Visits */}
      {tab === 4 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setForm({ title: '', visit_date: '', location: '', agenda: '' }); setShowModal('visit'); }} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700">
              <Plus className="h-4 w-4" /> جدولة زيارة
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'title', label: 'عنوان الزيارة' },
              { key: 'visit_date', label: 'التاريخ', render: r => r.visit_date ? new Date(r.visit_date).toLocaleDateString('ar') : '-' },
              { key: 'location', label: 'الموقع' },
              { key: 'status', label: 'الحالة', render: r => <StatusBadge status={r.status} label={statusMap[r.status] || r.status} /> },
            ]}
            data={visits}
            loading={loading}
            emptyMessage="لا توجد زيارات"
          />
        </div>
      )}

      {/* Communications */}
      {tab === 5 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setForm({ subject: '', message: '', channel: 'email' }); setShowModal('communication'); }} className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800">
              <Send className="h-4 w-4" /> رسالة جديدة
            </button>
          </div>
          <div className="space-y-3">
            {communications.map(c => (
              <div key={c.id} className={cn('rounded-xl border p-4', c.direction === 'incoming' ? 'bg-blue-50 border-blue-200' : 'bg-white')}>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{c.subject}</h4>
                  <span className="text-xs text-slate-500">{c.sent_at ? new Date(c.sent_at).toLocaleDateString('ar') : ''}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{c.message}</p>
                <div className="mt-2 flex gap-2 text-xs text-slate-400">
                  <span>{c.direction === 'incoming' ? 'وارد' : 'صادر'}</span>
                  <span>• {c.channel}</span>
                </div>
              </div>
            ))}
            {!communications.length && <p className="text-center text-sm text-slate-400 py-8">لا توجد رسائل</p>}
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showModal === 'proposal'} onClose={() => setShowModal(null)} title="مقترح جديد">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">عنوان المقترح *</label>
            <input type="text" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">القطاع</label>
            <select value={form.sector || ''} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">اختر القطاع</option>
              {['WASH', 'Protection', 'Health', 'Education', 'Food Security', 'Shelter', 'Livelihoods', 'Camp Management'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">الميزانية المطلوبة ($)</label>
            <input type="number" value={form.budget_requested || ''} onChange={e => setForm(f => ({ ...f, budget_requested: parseFloat(e.target.value) || 0 }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">المدة (أشهر)</label>
            <input type="number" value={form.duration_months || ''} onChange={e => setForm(f => ({ ...f, duration_months: parseInt(e.target.value) || 12 }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">المستفيدون المستهدفون</label>
            <input type="number" value={form.target_beneficiaries || ''} onChange={e => setForm(f => ({ ...f, target_beneficiaries: parseInt(e.target.value) || 0 }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">الملخص</label>
            <textarea value={form.summary || ''} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" rows={3} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setShowModal(null)} className="rounded-lg border px-4 py-2 text-sm">إلغاء</button>
          <button onClick={handleCreateProposal} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"><Save className="h-4 w-4" /> إنشاء</button>
        </div>
      </Modal>

      <Modal isOpen={showModal === 'funding'} onClose={() => setShowModal(null)} title="فرصة تمويل جديدة">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">عنوان الفرصة *</label>
            <input type="text" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">اسم المانح</label>
            <input type="text" value={form.donor_name || ''} onChange={e => setForm(f => ({ ...f, donor_name: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">القطاع</label>
            <input type="text" value={form.sector || ''} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">الحد الأدنى ($)</label>
            <input type="number" value={form.min_amount || ''} onChange={e => setForm(f => ({ ...f, min_amount: parseFloat(e.target.value) || 0 }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">الحد الأقصى ($)</label>
            <input type="number" value={form.max_amount || ''} onChange={e => setForm(f => ({ ...f, max_amount: parseFloat(e.target.value) || 0 }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">آخر موعد للتقديم</label>
            <input type="datetime-local" value={form.closing_date || ''} onChange={e => setForm(f => ({ ...f, closing_date: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">الوصف</label>
            <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" rows={3} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setShowModal(null)} className="rounded-lg border px-4 py-2 text-sm">إلغاء</button>
          <button onClick={handleCreateFunding} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"><Save className="h-4 w-4" /> إضافة</button>
        </div>
      </Modal>

      <Modal isOpen={showModal === 'installment'} onClose={() => setShowModal(null)} title="قسط جديد">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">رقم المنحة *</label>
            <input type="number" value={form.grant_id || ''} onChange={e => setForm(f => ({ ...f, grant_id: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">المبلغ *</label>
            <input type="number" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">تاريخ الاستحقاق *</label>
            <input type="datetime-local" value={form.scheduled_date || ''} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ملاحظات</label>
            <input type="text" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setShowModal(null)} className="rounded-lg border px-4 py-2 text-sm">إلغاء</button>
          <button onClick={handleCreateInstallment} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"><Save className="h-4 w-4" /> إضافة</button>
        </div>
      </Modal>

      <Modal isOpen={showModal === 'visit'} onClose={() => setShowModal(null)} title="جدولة زيارة جديدة">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">عنوان الزيارة *</label>
            <input type="text" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">التاريخ *</label>
            <input type="datetime-local" value={form.visit_date || ''} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">الموقع</label>
            <input type="text" value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">جدول الأعمال</label>
            <textarea value={form.agenda || ''} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" rows={3} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setShowModal(null)} className="rounded-lg border px-4 py-2 text-sm">إلغاء</button>
          <button onClick={handleCreateVisit} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"><Save className="h-4 w-4" /> جدولة</button>
        </div>
      </Modal>

      <Modal isOpen={showModal === 'communication'} onClose={() => setShowModal(null)} title="رسالة جديدة">
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">الموضوع *</label>
            <input type="text" value={form.subject || ''} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">القناة</label>
            <select value={form.channel || 'email'} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="email">بريد إلكتروني</option>
              <option value="phone">هاتف</option>
              <option value="meeting">اجتماع</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">الرسالة *</label>
            <textarea value={form.message || ''} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="w-full rounded-lg border px-3 py-2 text-sm" rows={4} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setShowModal(null)} className="rounded-lg border px-4 py-2 text-sm">إلغاء</button>
          <button onClick={handleCreateComm} className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800"><Send className="h-4 w-4" /> إرسال</button>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50', indigo: 'text-indigo-600 bg-indigo-50',
    amber: 'text-amber-600 bg-amber-50', emerald: 'text-emerald-600 bg-emerald-50',
    purple: 'text-purple-600 bg-purple-50',
  };
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={cn('rounded-lg p-2', colors[color])}><Icon className="h-5 w-5" /></div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
