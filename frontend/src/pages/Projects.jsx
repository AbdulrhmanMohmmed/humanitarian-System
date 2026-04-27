import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { Plus, FolderKanban, DollarSign, Target } from 'lucide-react';

export default function Projects() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', sector: '', description: '', budget: 0, target_beneficiaries: 0, governorate: '', donor: '', start_date: '', end_date: '' });

  const load = () => {
    api.get('/projects/').then(r => setData(r.data));
    api.get('/projects/stats').then(r => setStats(r.data));
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/projects/', { ...form, budget: parseFloat(form.budget), target_beneficiaries: parseInt(form.target_beneficiaries) });
    setShowModal(false);
    setForm({ code: '', name: '', sector: '', description: '', budget: 0, target_beneficiaries: 0, governorate: '', donor: '', start_date: '', end_date: '' });
    load();
  };

  const handleDelete = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
      await api.delete(`/projects/${id}`);
      load();
    }
  };

  const columns = [
    { key: 'code', label: 'الرمز' },
    { key: 'name', label: 'اسم المشروع' },
    { key: 'sector', label: 'القطاع' },
    { key: 'status', label: 'الحالة', render: (v) => <StatusBadge status={v} /> },
    { key: 'budget', label: 'الميزانية ($)', render: (v) => v?.toLocaleString() },
    { key: 'spent', label: 'المصروف ($)', render: (v) => v?.toLocaleString() },
    { key: 'target_beneficiaries', label: 'المستهدفين', render: (v) => v?.toLocaleString() },
    { key: 'donor', label: 'المانح' },
    { key: 'governorate', label: 'المحافظة' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المشاريع</h1>
          <p className="text-gray-500 text-sm mt-1">{data.length} مشروع</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          <Plus size={18} /> إضافة مشروع
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="إجمالي المشاريع" value={stats.total} icon={FolderKanban} color="blue" />
          <StatCard title="المشاريع النشطة" value={stats.active} icon={Target} color="green" />
          <StatCard title="إجمالي الميزانية ($)" value={stats.total_budget?.toLocaleString()} icon={DollarSign} color="orange" />
          <StatCard title="إجمالي المصروفات ($)" value={stats.total_spent?.toLocaleString()} icon={DollarSign} color="red" />
        </div>
      )}

      <DataTable columns={columns} data={data} onDelete={handleDelete} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="إضافة مشروع جديد">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رمز المشروع *</label>
              <input required value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">القطاع</label>
              <select value={form.sector} onChange={e => setForm({...form, sector: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">اختر القطاع</option>
                {["الصحة","التعليم","الأمن الغذائي","المياه والصرف الصحي","الحماية","المأوى"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المشروع *</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="2" className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الميزانية ($)</label>
              <input type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المستفيدين المستهدفين</label>
              <input type="number" value={form.target_beneficiaries} onChange={e => setForm({...form, target_beneficiaries: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البداية</label>
              <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ النهاية</label>
              <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
              <select value={form.governorate} onChange={e => setForm({...form, governorate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">اختر</option>
                {["صنعاء","عدن","تعز","الحديدة","إب","حضرموت","مأرب","ذمار","حجة","البيضاء"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المانح</label>
              <input value={form.donor} onChange={e => setForm({...form, donor: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">حفظ</button>
        </form>
      </Modal>
    </div>
  );
}
