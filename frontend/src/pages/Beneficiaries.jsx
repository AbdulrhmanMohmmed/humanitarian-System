import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Search, Users } from 'lucide-react';

export default function Beneficiaries() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', national_id: '', gender: 'male', phone: '', governorate: '', district: '', household_size: 1, vulnerability_score: 0 });

  const load = () => api.get('/beneficiaries/', { params: { search, limit: 100 } }).then(r => setData(r.data));
  useEffect(() => { load(); }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/beneficiaries/', form);
    setShowModal(false);
    setForm({ first_name: '', last_name: '', national_id: '', gender: 'male', phone: '', governorate: '', district: '', household_size: 1, vulnerability_score: 0 });
    load();
  };

  const handleDelete = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا المستفيد؟')) {
      await api.delete(`/beneficiaries/${id}`);
      load();
    }
  };

  const columns = [
    { key: 'national_id', label: 'رقم الهوية' },
    { key: 'first_name', label: 'الاسم', render: (v, row) => `${row.first_name} ${row.last_name}` },
    { key: 'gender', label: 'الجنس', render: (v) => <StatusBadge status={v} /> },
    { key: 'governorate', label: 'المحافظة' },
    { key: 'district', label: 'المديرية' },
    { key: 'household_size', label: 'حجم الأسرة' },
    { key: 'vulnerability_score', label: 'درجة الضعف', render: (v) => (
      <span className={`font-medium ${v >= 7 ? 'text-red-600' : v >= 4 ? 'text-orange-600' : 'text-green-600'}`}>{v}</span>
    )},
    { key: 'status', label: 'الحالة', render: (v) => <StatusBadge status={v} /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المستفيدين</h1>
          <p className="text-gray-500 text-sm mt-1">{data.length} مستفيد مسجل</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          <Plus size={18} /> إضافة مستفيد
        </button>
      </div>

      <div className="mb-4 relative">
        <Search size={18} className="absolute right-3 top-3 text-gray-400" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو رقم الهوية أو رقم الهاتف..."
          className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <DataTable columns={columns} data={data} onDelete={handleDelete} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="إضافة مستفيد جديد">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الأول *</label>
              <input required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم العائلة *</label>
              <input required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهوية</label>
            <input value={form.national_id} onChange={e => setForm({...form, national_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الجنس</label>
              <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
              <select value={form.governorate} onChange={e => setForm({...form, governorate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">اختر المحافظة</option>
                {["صنعاء","عدن","تعز","الحديدة","إب","حضرموت","مأرب","ذمار","حجة","البيضاء"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المديرية</label>
              <input value={form.district} onChange={e => setForm({...form, district: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حجم الأسرة</label>
              <input type="number" min="1" value={form.household_size} onChange={e => setForm({...form, household_size: parseInt(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">درجة الضعف (0-10)</label>
              <input type="number" min="0" max="10" step="0.1" value={form.vulnerability_score} onChange={e => setForm({...form, vulnerability_score: parseFloat(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">حفظ</button>
        </form>
      </Modal>
    </div>
  );
}
