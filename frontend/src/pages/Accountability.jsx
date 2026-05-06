import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit3,
  MessageSquare,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import CustomFieldsForm from '../components/CustomFieldsForm';
import CustomizeModuleButton from '../components/CustomizeModuleButton';
import { renderCustomFieldValue, useCustomization } from '../hooks/useCustomization';

const CHANNELS = [
  { value: 'phone', label: 'هاتف' },
  { value: 'box', label: 'صندوق شكاوى' },
  { value: 'email', label: 'بريد إلكتروني' },
  { value: 'in_person', label: 'حضوري' },
  { value: 'sms', label: 'رسالة نصية' },
  { value: 'whatsapp', label: 'واتساب' },
  { value: 'other', label: 'أخرى' },
];

const CATEGORIES = [
  { value: 'service_quality', label: 'جودة الخدمة' },
  { value: 'staff_behavior', label: 'سلوك الموظفين' },
  { value: 'targeting', label: 'الاستهداف' },
  { value: 'distribution', label: 'التوزيع' },
  { value: 'protection', label: 'الحماية' },
  { value: 'safeguarding', label: 'الحماية من الاستغلال' },
  { value: 'fraud', label: 'احتيال' },
  { value: 'suggestion', label: 'اقتراح' },
  { value: 'appreciation', label: 'تقدير' },
  { value: 'other', label: 'أخرى' },
];

const PRIORITIES = [
  { value: 'low', label: 'منخفضة' },
  { value: 'medium', label: 'متوسطة' },
  { value: 'high', label: 'عالية' },
  { value: 'critical', label: 'حرجة' },
];

const STATUSES = [
  { value: 'received', label: 'مستلمة' },
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'in_progress', label: 'قيد المعالجة' },
  { value: 'referred', label: 'محالة' },
  { value: 'resolved', label: 'تم الحل' },
  { value: 'closed', label: 'مغلقة' },
  { value: 'escalated', label: 'مصعدة' },
];

const SATISFACTION = [
  { value: 'very_satisfied', label: 'راض جدا' },
  { value: 'satisfied', label: 'راض' },
  { value: 'neutral', label: 'محايد' },
  { value: 'dissatisfied', label: 'غير راض' },
  { value: 'very_dissatisfied', label: 'غير راض جدا' },
];

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const statColorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  amber: 'bg-amber-100 text-amber-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  rose: 'bg-rose-100 text-rose-600',
  red: 'bg-red-100 text-red-600',
};

const emptyForm = {
  subject: '',
  description: '',
  channel: 'phone',
  category: 'other',
  priority: 'medium',
  complainant_name: '',
  complainant_phone: '',
  complainant_location: '',
  is_anonymous: false,
  is_sensitive: false,
  project_id: '',
  response_deadline: '',
  custom_values: {},
};

export default function Accountability() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({});
  const [detailedStats, setDetailedStats] = useState({});
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [resolution, setResolution] = useState('');
  const [satisfaction, setSatisfaction] = useState('');
  const [satisfactionFeedback, setSatisfactionFeedback] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', project_id: '', search: '' });
  const [form, setForm] = useState(emptyForm);
  const { fields: customFields, listsBySlug } = useCustomization('complaint');
  const categoryOptions = listsBySlug.complaint_categories?.length ? listsBySlug.complaint_categories : CATEGORIES;

  const load = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    api.get(`/accountability/complaints?${params.toString()}`).then((r) => setComplaints(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_complaints');
      if (local) {
        let data = JSON.parse(local);
        if (filters.status) data = data.filter(c => c.status === filters.status);
        if (filters.category) data = data.filter(c => c.category === filters.category);
        if (filters.search) data = data.filter(c => (c.description || '').includes(filters.search));
        setComplaints(data);
      }
    });
    api.get('/accountability/stats').then((r) => setStats(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_cfm_stats');
      if (local) setStats(JSON.parse(local));
    });
    api.get('/accountability/stats/detailed').then((r) => setDetailedStats(r.data)).catch(() => {});
    api.get('/projects/').then((r) => setProjects(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_projects');
      if (local) setProjects(JSON.parse(local));
    });
  };

  useEffect(() => {
    load();
  }, [filters]);

  const submitComplaint = async (e) => {
    e.preventDefault();
    await api.post('/accountability/complaints', {
      ...form,
      project_id: form.project_id ? parseInt(form.project_id) : null,
      response_deadline: form.response_deadline ? new Date(form.response_deadline).toISOString() : null,
    });
    setShowCreateModal(false);
    setForm(emptyForm);
    load();
  };

  const viewComplaint = async (complaint) => {
    const r = await api.get(`/accountability/complaints/${complaint.id}`);
    setSelectedComplaint(r.data);
    setResolution(r.data.resolution || '');
    setSatisfaction('');
    setSatisfactionFeedback('');
  };

  const refreshSelected = async () => {
    const r = await api.get(`/accountability/complaints/${selectedComplaint.id}`);
    setSelectedComplaint(r.data);
    load();
  };

  const updateComplaint = async (payload) => {
    await api.put(`/accountability/complaints/${selectedComplaint.id}`, payload);
    refreshSelected();
  };

  const addResponse = async () => {
    if (!responseText.trim() && !actionTaken.trim()) return;
    await api.post(`/accountability/complaints/${selectedComplaint.id}/responses`, {
      response_text: responseText,
      action_taken: actionTaken || null,
    });
    setResponseText('');
    setActionTaken('');
    refreshSelected();
  };

  const autoClassify = async () => {
    await api.post(`/accountability/complaints/${selectedComplaint.id}/auto-classify`);
    refreshSelected();
  };

  const recordSatisfaction = async () => {
    if (!satisfaction) return;
    await api.put(`/accountability/complaints/${selectedComplaint.id}/satisfaction`, null, {
      params: {
        satisfaction_score: satisfaction,
        satisfaction_feedback: satisfactionFeedback || undefined,
      },
    });
    setSatisfaction('');
    setSatisfactionFeedback('');
    refreshSelected();
  };

  const radarInsights = useMemo(() => {
    const topCategory = [...(detailedStats.by_category || [])].sort((a, b) => b.count - a.count)[0];
    const topChannel = [...(detailedStats.by_channel || [])].sort((a, b) => b.count - a.count)[0];
    return {
      topCategory: topCategory?.category || 'لا توجد بيانات',
      topChannel: topChannel?.channel || 'لا توجد بيانات',
      avgResolution: detailedStats.avg_resolution_days ?? 0,
    };
  }, [detailedStats]);

  const columns = [
    { key: 'reference_number', label: 'الرقم المرجعي', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'subject', label: 'الموضوع', render: (v) => v?.length > 42 ? `${v.substring(0, 42)}...` : v },
    { key: 'category', label: 'الفئة', render: (v) => categoryOptions.find((c) => c.value === v)?.label_ar || categoryOptions.find((c) => c.value === v)?.label || v },
    { key: 'priority', label: 'الأولوية', render: (v) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[v] || ''}`}>{PRIORITIES.find((p) => p.value === v)?.label || v}</span> },
    { key: 'status', label: 'الحالة', render: (v) => <StatusBadge status={v} /> },
    { key: 'channel', label: 'القناة', render: (v) => CHANNELS.find((c) => c.value === v)?.label || v },
    { key: 'response_deadline', label: 'الموعد النهائي', render: (v, row) => {
      const overdue = v && !['resolved', 'closed'].includes(row.status) && new Date(v) < new Date();
      return <span className={overdue ? 'font-bold text-red-600' : ''}>{v ? String(v).slice(0, 10) : '-'}</span>;
    } },
    ...customFields.filter((field) => field.is_searchable).slice(0, 2).map((field) => ({
      key: `custom_${field.field_key}`,
      label: field.label_ar || field.label,
      render: (_v, row) => renderCustomFieldValue(field, row.custom_values?.[field.field_key]),
    })),
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">إدارة المساءلة والشكاوى (CFM)</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">استقبال، تصنيف، إسناد، معالجة، إغلاق، وقياس رضا المستفيدين.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CustomizeModuleButton entity="complaint" className="h-11" />
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
            <Plus size={18} /> تسجيل شكوى / ملاحظة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'إجمالي الشكاوى', value: stats.total || 0, icon: MessageSquare, color: 'blue' },
          { label: 'قيد المعالجة', value: (stats.received || 0) + (stats.in_progress || 0), icon: Clock, color: 'amber' },
          { label: 'تم الحل', value: stats.resolved || 0, icon: CheckCircle, color: 'emerald' },
          { label: 'مصعدة', value: stats.escalated || 0, icon: AlertTriangle, color: 'rose' },
          { label: 'متأخرة', value: stats.overdue || 0, icon: ShieldCheck, color: 'red' },
        ].map((item) => (
          <div key={item.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm font-semibold text-slate-500">{item.label}</p>
                <h3 className="text-3xl font-bold text-slate-800">{item.value}</h3>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${statColorClasses[item.color]}`}>
                <item.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 rounded-2xl border border-indigo-200/60 bg-indigo-50/50 p-5 md:grid-cols-4">
        <div>
          <p className="text-xs font-black text-indigo-600">الرادار المجتمعي</p>
          <p className="mt-1 text-lg font-black text-slate-800">مؤشرات CFM حية</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-bold text-slate-500">أكثر فئة</p>
          <p className="mt-1 font-black text-slate-700">{categoryOptions.find((c) => c.value === radarInsights.topCategory)?.label_ar || categoryOptions.find((c) => c.value === radarInsights.topCategory)?.label || radarInsights.topCategory}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-bold text-slate-500">أكثر قناة</p>
          <p className="mt-1 font-black text-slate-700">{CHANNELS.find((c) => c.value === radarInsights.topChannel)?.label || radarInsights.topChannel}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-bold text-slate-500">متوسط الإغلاق</p>
          <p className="mt-1 font-black text-slate-700">{radarInsights.avgResolution} يوم</p>
        </div>
      </div>

      <div className="glass-card flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/60 p-5">
        <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="بحث بالموضوع أو الرقم..." className="h-10 min-w-64 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
          <option value="">كل الحالات</option>
          {STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
          <option value="">كل الفئات</option>
          {categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label_ar || item.label || item.value}</option>)}
        </select>
        <select value={filters.project_id} onChange={(e) => setFilters({ ...filters, project_id: e.target.value })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
          <option value="">كل المشاريع</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl border border-slate-200/60">
        <DataTable
          columns={columns}
          data={complaints}
          actions={[{ label: 'إدارة', icon: Edit3, className: 'text-blue-600 hover:bg-blue-500/10', onClick: viewComplaint }]}
          onDelete={async (id) => { await api.delete(`/accountability/complaints/${id}`); load(); }}
        />
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="تسجيل شكوى / ملاحظة جديدة">
        <form onSubmit={submitComplaint} className="space-y-3">
          <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="الموضوع *" className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="الوصف *" className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
          <div className="grid grid-cols-3 gap-3">
            <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2">{CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2">{categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label_ar || c.label || c.value}</option>)}</select>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2">{PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input value={form.complainant_name} onChange={(e) => setForm({ ...form, complainant_name: e.target.value })} placeholder="اسم المشتكي" className="rounded-lg border border-gray-200 px-3 py-2" />
            <input value={form.complainant_phone} onChange={(e) => setForm({ ...form, complainant_phone: e.target.value })} placeholder="هاتف المشتكي" className="rounded-lg border border-gray-200 px-3 py-2" />
            <input value={form.complainant_location} onChange={(e) => setForm({ ...form, complainant_location: e.target.value })} placeholder="الموقع" className="rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2">
              <option value="">بدون مشروع</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <input type="datetime-local" value={form.response_deadline} onChange={(e) => setForm({ ...form, response_deadline: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={form.is_anonymous} onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })} /> شكوى مجهولة</label>
            <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={form.is_sensitive} onChange={(e) => setForm({ ...form, is_sensitive: e.target.checked })} /> حساسة</label>
          </div>
          <CustomFieldsForm fields={customFields} values={form.custom_values} onChange={(customValues) => setForm({ ...form, custom_values: customValues })} />
          <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-700">تسجيل الشكوى</button>
        </form>
      </Modal>

      <Modal isOpen={Boolean(selectedComplaint)} onClose={() => setSelectedComplaint(null)} title={`شكوى: ${selectedComplaint?.reference_number || ''}`}>
        {selectedComplaint && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-gray-800">{selectedComplaint.subject}</h4>
                  <p className="mt-1 text-sm text-gray-600">{selectedComplaint.description}</p>
                </div>
                <button onClick={autoClassify} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white">
                  <Sparkles size={14} /> تصنيف ذكي
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                <span>القناة: {CHANNELS.find((c) => c.value === selectedComplaint.channel)?.label}</span>
                <span>الفئة: {categoryOptions.find((c) => c.value === selectedComplaint.category)?.label_ar || categoryOptions.find((c) => c.value === selectedComplaint.category)?.label}</span>
                <span>الأولوية: {PRIORITIES.find((p) => p.value === selectedComplaint.priority)?.label}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <select value={selectedComplaint.status} onChange={(e) => updateComplaint({ status: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select value={selectedComplaint.priority} onChange={(e) => updateComplaint({ priority: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <select value={selectedComplaint.category} onChange={(e) => updateComplaint({ category: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
                {categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label_ar || c.label || c.value}</option>)}
              </select>
            </div>

            <div className="space-y-2 rounded-xl border p-3">
              <label className="text-sm font-bold text-gray-700">قرار الحل / الإغلاق</label>
              <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
              <button onClick={() => updateComplaint({ resolution, status: selectedComplaint.status })} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 text-sm font-bold text-white"><Save size={15} /> حفظ القرار</button>
            </div>

            <div className="border-t pt-3">
              <h4 className="mb-2 font-bold text-gray-700">الردود والإجراءات</h4>
              <div className="mb-3 max-h-40 space-y-2 overflow-y-auto">
                {selectedComplaint.responses?.length === 0 && <p className="text-sm text-gray-400">لا توجد ردود بعد</p>}
                {selectedComplaint.responses?.map((r) => (
                  <div key={r.id} className="rounded-lg bg-blue-50 p-3 text-sm">
                    <p className="text-gray-700">{r.response_text}</p>
                    {r.action_taken && <p className="mt-1 text-xs text-gray-500">الإجراء: {r.action_taken}</p>}
                    <p className="mt-1 text-xs text-gray-400">{new Date(r.created_at).toLocaleString('ar')}</p>
                  </div>
                ))}
              </div>
              <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="اكتب ردًا..." className="mb-2 w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
              <div className="flex gap-2">
                <input value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} placeholder="الإجراء المتخذ..." className="flex-1 rounded-lg border px-3 py-2 text-sm" />
                <button onClick={addResponse} className="rounded-lg bg-blue-600 px-4 py-2 text-white"><Send size={16} /></button>
              </div>
            </div>

            <div className="rounded-xl border p-3">
              <h4 className="mb-2 font-bold text-gray-700">قياس رضا المشتكي</h4>
              <div className="flex gap-2">
                <select value={satisfaction} onChange={(e) => setSatisfaction(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                  <option value="">اختر الرضا</option>
                  {SATISFACTION.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <input value={satisfactionFeedback} onChange={(e) => setSatisfactionFeedback(e.target.value)} placeholder="ملاحظات الرضا" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
                <button onClick={recordSatisfaction} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white">حفظ</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
