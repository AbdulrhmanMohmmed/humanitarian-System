import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, MessageSquare, AlertTriangle, CheckCircle, Clock, Send } from 'lucide-react';

const CHANNELS = [
  { value: 'phone', label: 'هاتف' }, { value: 'box', label: 'صندوق شكاوى' },
  { value: 'email', label: 'بريد إلكتروني' }, { value: 'in_person', label: 'حضوري' },
  { value: 'sms', label: 'رسالة نصية' }, { value: 'whatsapp', label: 'واتساب' },
  { value: 'other', label: 'أخرى' },
];

const CATEGORIES = [
  { value: 'service_quality', label: 'جودة الخدمة' }, { value: 'staff_behavior', label: 'سلوك الموظفين' },
  { value: 'targeting', label: 'الاستهداف' }, { value: 'distribution', label: 'التوزيع' },
  { value: 'protection', label: 'الحماية' }, { value: 'safeguarding', label: 'الحماية من الاستغلال' },
  { value: 'fraud', label: 'احتيال' }, { value: 'suggestion', label: 'اقتراح' },
  { value: 'appreciation', label: 'تقدير' }, { value: 'other', label: 'أخرى' },
];

const PRIORITIES = [
  { value: 'low', label: 'منخفضة' }, { value: 'medium', label: 'متوسطة' },
  { value: 'high', label: 'عالية' }, { value: 'critical', label: 'حرجة' },
];

const STATUSES = [
  { value: 'received', label: 'مستلمة' }, { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'in_progress', label: 'قيد المعالجة' }, { value: 'resolved', label: 'تم الحل' },
  { value: 'closed', label: 'مغلقة' }, { value: 'escalated', label: 'مُصعّدة' },
];

export default function Accountability() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({});
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [form, setForm] = useState({
    subject: '', description: '', channel: 'phone', category: 'other',
    priority: 'medium', complainant_name: '', complainant_phone: '',
    complainant_location: '', is_anonymous: false, is_sensitive: false, project_id: '',
  });

  const load = () => {
    const params = filterStatus ? `?status=${filterStatus}` : '';
    api.get(`/accountability/complaints${params}`).then(r => setComplaints(r.data));
    api.get('/accountability/stats').then(r => setStats(r.data));
    api.get('/projects/').then(r => setProjects(r.data));
  };
  useEffect(() => { load(); }, [filterStatus]);

  const submitComplaint = async (e) => {
    e.preventDefault();
    await api.post('/accountability/complaints', {
      ...form,
      project_id: form.project_id ? parseInt(form.project_id) : null,
    });
    setShowCreateModal(false);
    setForm({ subject: '', description: '', channel: 'phone', category: 'other', priority: 'medium', complainant_name: '', complainant_phone: '', complainant_location: '', is_anonymous: false, is_sensitive: false, project_id: '' });
    load();
  };

  const viewComplaint = async (complaint) => {
    const r = await api.get(`/accountability/complaints/${complaint.id}`);
    setSelectedComplaint(r.data);
    setShowDetailModal(true);
  };

  const updateStatus = async (status) => {
    await api.put(`/accountability/complaints/${selectedComplaint.id}`, { status });
    const r = await api.get(`/accountability/complaints/${selectedComplaint.id}`);
    setSelectedComplaint(r.data);
    load();
  };

  const addResponse = async () => {
    if (!responseText.trim()) return;
    await api.post(`/accountability/complaints/${selectedComplaint.id}/responses`, {
      response_text: responseText,
    });
    setResponseText('');
    const r = await api.get(`/accountability/complaints/${selectedComplaint.id}`);
    setSelectedComplaint(r.data);
  };

  const priorityColors = { low: 'bg-gray-100 text-gray-600', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };

  const columns = [
    { key: 'reference_number', label: 'الرقم المرجعي', render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'subject', label: 'الموضوع', render: v => v?.length > 40 ? v.substring(0, 40) + '...' : v },
    { key: 'category', label: 'الفئة', render: v => CATEGORIES.find(c => c.value === v)?.label || v },
    { key: 'priority', label: 'الأولوية', render: v => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[v] || ''}`}>{PRIORITIES.find(p => p.value === v)?.label || v}</span> },
    { key: 'status', label: 'الحالة', render: v => <StatusBadge status={v} /> },
    { key: 'channel', label: 'القناة', render: v => CHANNELS.find(c => c.value === v)?.label || v },
    { key: 'id', label: 'إجراءات', render: (v, row) => (
      <button onClick={() => viewComplaint(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="عرض التفاصيل">
        <MessageSquare size={15} />
      </button>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">آلية الشكاوى والملاحظات (CFM)</h1>
          <p className="text-sm text-gray-500 mt-1">استقبال وتتبع ومعالجة شكاوى وملاحظات المستفيدين</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          <Plus size={18} /> تسجيل شكوى / ملاحظة
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><MessageSquare size={24} className="text-blue-600" /></div>
            <div><p className="text-sm text-gray-500">الإجمالي</p><p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center"><Clock size={24} className="text-yellow-600" /></div>
            <div><p className="text-sm text-gray-500">قيد المعالجة</p><p className="text-2xl font-bold text-gray-800">{(stats.received || 0) + (stats.in_progress || 0)}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><CheckCircle size={24} className="text-green-600" /></div>
            <div><p className="text-sm text-gray-500">تم الحل</p><p className="text-2xl font-bold text-gray-800">{stats.resolved || 0}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center"><AlertTriangle size={24} className="text-red-600" /></div>
            <div><p className="text-sm text-gray-500">مُصعّدة</p><p className="text-2xl font-bold text-gray-800">{stats.escalated || 0}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">تصفية:</span>
          <button onClick={() => setFilterStatus('')} className={`px-3 py-1 rounded-lg text-sm ${!filterStatus ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>الكل</button>
          {STATUSES.map(s => (
            <button key={s.value} onClick={() => setFilterStatus(s.value)} className={`px-3 py-1 rounded-lg text-sm ${filterStatus === s.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{s.label}</button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={complaints} onDelete={async (id) => { await api.delete(`/accountability/complaints/${id}`); load(); }} />

      {/* Create Complaint Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="تسجيل شكوى / ملاحظة جديدة">
        <form onSubmit={submitComplaint} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الموضوع *</label>
            <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف *</label>
            <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">القناة</label>
              <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المشتكي</label>
              <input value={form.complainant_name} onChange={e => setForm({ ...form, complainant_name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">هاتف المشتكي</label>
              <input value={form.complainant_phone} onChange={e => setForm({ ...form, complainant_phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
              <input value={form.complainant_location} onChange={e => setForm({ ...form, complainant_location: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label>
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">بدون مشروع</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.is_anonymous} onChange={e => setForm({ ...form, is_anonymous: e.target.checked })} className="rounded" />
              شكوى مجهولة
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.is_sensitive} onChange={e => setForm({ ...form, is_sensitive: e.target.checked })} className="rounded" />
              حساسة (حماية)
            </label>
          </div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">تسجيل الشكوى</button>
        </form>
      </Modal>

      {/* Complaint Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`شكوى: ${selectedComplaint?.reference_number || ''}`}>
        {selectedComplaint && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 mb-1">{selectedComplaint.subject}</h4>
              <p className="text-sm text-gray-600 mb-3">{selectedComplaint.description}</p>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                <span>القناة: {CHANNELS.find(c => c.value === selectedComplaint.channel)?.label}</span>
                <span>الفئة: {CATEGORIES.find(c => c.value === selectedComplaint.category)?.label}</span>
                <span>الأولوية: {PRIORITIES.find(p => p.value === selectedComplaint.priority)?.label}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="text-sm text-gray-500 mt-1">تحديث الحالة:</span>
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => updateStatus(s.value)}
                  className={`px-2 py-1 rounded text-xs ${selectedComplaint.status === s.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="border-t pt-3">
              <h4 className="font-bold text-gray-700 mb-2">الردود والإجراءات</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {selectedComplaint.responses?.length === 0 && <p className="text-sm text-gray-400">لا توجد ردود بعد</p>}
                {selectedComplaint.responses?.map(r => (
                  <div key={r.id} className="bg-blue-50 rounded-lg p-3 text-sm">
                    <p className="text-gray-700">{r.response_text}</p>
                    {r.action_taken && <p className="text-gray-500 mt-1 text-xs">الإجراء: {r.action_taken}</p>}
                    <p className="text-gray-400 mt-1 text-xs">{new Date(r.created_at).toLocaleString('ar')}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  placeholder="اكتب رداً أو إجراءً..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button onClick={addResponse} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
