import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { Plus, Banknote, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const methodMap = { bank: 'تحويل بنكي', mobile_money: 'محفظة إلكترونية', hawala: 'حوالة', cash_in_hand: 'نقدي', voucher: 'قسيمة' };
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Cash() {
  const [transfers, setTransfers] = useState([]);
  const [stats, setStats] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ beneficiary_id: '', amount: 0, currency: 'YER', method: 'cash_in_hand', purpose: '', transfer_date: '', agent_name: '' });

  const load = () => {
    api.get('/cash/transfers').then(r => setTransfers(r.data));
    api.get('/cash/transfers/stats').then(r => setStats(r.data));
    api.get('/beneficiaries/', { params: { limit: 200 } }).then(r => setBeneficiaries(r.data));
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/cash/transfers', { ...form, beneficiary_id: parseInt(form.beneficiary_id), amount: parseFloat(form.amount) });
    setShowModal(false);
    setForm({ beneficiary_id: '', amount: 0, currency: 'YER', method: 'cash_in_hand', purpose: '', transfer_date: '', agent_name: '' });
    load();
  };

  const columns = [
    { key: 'reference', label: 'المرجع' },
    { key: 'beneficiary_id', label: 'المستفيد', render: v => { const b = beneficiaries.find(x => x.id === v); return b ? `${b.first_name} ${b.last_name}` : v; }},
    { key: 'amount', label: 'المبلغ', render: (v, row) => `${v?.toLocaleString()} ${row.currency === 'YER' ? 'ر.ي' : '$'}` },
    { key: 'method', label: 'الطريقة', render: v => methodMap[v] || v },
    { key: 'purpose', label: 'الغرض' },
    { key: 'status', label: 'الحالة', render: v => <StatusBadge status={v} /> },
    { key: 'transfer_date', label: 'التاريخ' },
  ];

  const methodChartData = stats?.by_method?.map(m => ({
    name: methodMap[m.method] || m.method,
    value: m.count,
    amount: m.amount,
  })) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">التحويلات النقدية والقسائم</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          <Plus size={18} /> تحويل جديد
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="إجمالي التحويلات" value={stats.total_amount?.toLocaleString()} icon={Banknote} color="blue" sub="ريال يمني" />
          <StatCard title="تم الصرف" value={stats.total_disbursed?.toLocaleString()} icon={TrendingUp} color="green" sub="ريال يمني" />
          <StatCard title="تم الاستلام" value={stats.total_received?.toLocaleString()} icon={CheckCircle} color="purple" sub="ريال يمني" />
          <StatCard title="قيد الانتظار" value={stats.pending_count} icon={Clock} color="orange" />
        </div>
      )}

      {methodChartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">التحويلات حسب طريقة الدفع</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={methodChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {methodChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <DataTable columns={columns} data={transfers} onDelete={async (id) => { await api.delete(`/cash/transfers/${id}`); load(); }} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="تحويل نقدي جديد">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">المستفيد *</label><select required value={form.beneficiary_id} onChange={e => setForm({...form, beneficiary_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر المستفيد</option>{beneficiaries.map(b => <option key={b.id} value={b.id}>{b.first_name} {b.last_name} - {b.national_id}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المبلغ *</label><input required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">العملة</label><select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="YER">ريال يمني</option><option value="USD">دولار</option><option value="SAR">ريال سعودي</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label><select value={form.method} onChange={e => setForm({...form, method: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">{Object.entries(methodMap).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">الغرض</label><select value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر</option>{["إيجار","غذاء","صحة","تعليم","سبل عيش"].map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التحويل</label><input type="date" value={form.transfer_date} onChange={e => setForm({...form, transfer_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم الوكيل</label><input value={form.agent_name} onChange={e => setForm({...form, agent_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">إرسال التحويل</button>
        </form>
      </Modal>
    </div>
  );
}
