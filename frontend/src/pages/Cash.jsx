import { useEffect, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { Banknote, CheckCircle, Clock, Edit3, Plus, Save, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const methodMap = {
  bank: 'تحويل بنكي',
  mobile_money: 'محفظة إلكترونية',
  hawala: 'حوالة',
  cash_in_hand: 'نقدي',
  voucher: 'قسيمة',
};
const statusOptions = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'approved', label: 'معتمد' },
  { value: 'disbursed', label: 'تم الصرف' },
  { value: 'received', label: 'تم الاستلام' },
  { value: 'failed', label: 'فشل' },
];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const TODAY = new Date().toISOString().slice(0, 10);

const emptyForm = {
  beneficiary_id: '',
  project_id: '',
  amount: 0,
  currency: 'YER',
  method: 'cash_in_hand',
  purpose: '',
  transfer_date: '',
  agent_name: '',
  agent_phone: '',
  notes: '',
};

export default function Cash() {
  const [transfers, setTransfers] = useState([]);
  const [stats, setStats] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    api.get('/cash/transfers').then((r) => setTransfers(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_cash_transfers');
      if (local) setTransfers(JSON.parse(local));
    });
    api.get('/cash/transfers/stats').then((r) => setStats(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_cash_stats');
      if (local) setStats(JSON.parse(local));
    });
    api.get('/beneficiaries/', { params: { limit: 1000 } }).then((r) => setBeneficiaries(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_beneficiaries') || localStorage.getItem('hiaos_beneficiaries');
      if (local) setBeneficiaries(JSON.parse(local));
    });
    api.get('/projects/').then((r) => setProjects(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_projects');
      if (local) setProjects(JSON.parse(local));
    });
  };

  useEffect(() => {
    load();
  }, []);

  const beneficiaryName = (id) => {
    const beneficiary = beneficiaries.find((item) => item.id === id);
    return beneficiary ? `${beneficiary.first_name} ${beneficiary.last_name}` : id;
  };

  const projectName = (id) => projects.find((project) => project.id === id)?.name || '-';

  const openCreate = () => {
    setEditingTransfer(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (transfer) => {
    setEditingTransfer(transfer);
    setForm({
      beneficiary_id: transfer.beneficiary_id || '',
      project_id: transfer.project_id || '',
      amount: transfer.amount || 0,
      currency: transfer.currency || 'YER',
      method: transfer.method || 'cash_in_hand',
      purpose: transfer.purpose || '',
      transfer_date: transfer.transfer_date || '',
      agent_name: transfer.agent_name || '',
      agent_phone: transfer.agent_phone || '',
      notes: transfer.notes || '',
      status: transfer.status || 'pending',
      received_date: transfer.received_date || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingTransfer) {
      await api.put(`/cash/transfers/${editingTransfer.id}`, {
        status: form.status,
        received_date: form.received_date || null,
        notes: form.notes || null,
      });
    } else {
      await api.post('/cash/transfers', {
        ...form,
        beneficiary_id: parseInt(form.beneficiary_id),
        project_id: form.project_id ? parseInt(form.project_id) : null,
        amount: parseFloat(form.amount || 0),
        transfer_date: form.transfer_date || null,
      });
    }
    setShowModal(false);
    setEditingTransfer(null);
    setForm(emptyForm);
    load();
  };

  const updateStatus = async (transfer, status) => {
    await api.put(`/cash/transfers/${transfer.id}`, {
      status,
      received_date: status === 'received' ? TODAY : transfer.received_date,
      notes: transfer.notes || null,
    });
    load();
  };

  const columns = [
    { key: 'reference', label: 'المرجع' },
    { key: 'beneficiary_id', label: 'المستفيد', render: (v) => beneficiaryName(v) },
    { key: 'project_id', label: 'المشروع', render: (v) => projectName(v) },
    { key: 'amount', label: 'المبلغ', render: (v, row) => `${Number(v || 0).toLocaleString()} ${row.currency === 'YER' ? 'ر.ي' : row.currency}` },
    { key: 'method', label: 'الطريقة', render: (v) => methodMap[v] || v },
    { key: 'purpose', label: 'الغرض' },
    { key: 'status', label: 'الحالة', render: (v) => <StatusBadge status={v} /> },
    { key: 'transfer_date', label: 'تاريخ التحويل' },
    { key: 'received_date', label: 'تاريخ الاستلام' },
  ];

  const methodChartData = stats?.by_method?.map((m) => ({
    name: methodMap[m.method] || m.method,
    value: m.count,
    amount: m.amount,
  })) || [];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">التحويلات النقدية والقسائم</h1>
          <p className="mt-1 text-sm text-gray-500">إنشاء التحويل، اعتماده، صرفه، وتسجيل استلام المستفيد.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
          <Plus size={18} /> تحويل جديد
        </button>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard title="إجمالي التحويلات" value={stats.total_amount?.toLocaleString()} icon={Banknote} color="blue" sub="ريال يمني" />
          <StatCard title="تم الصرف" value={stats.total_disbursed?.toLocaleString()} icon={TrendingUp} color="green" sub="ريال يمني" />
          <StatCard title="تم الاستلام" value={stats.total_received?.toLocaleString()} icon={CheckCircle} color="purple" sub="ريال يمني" />
          <StatCard title="قيد الانتظار" value={stats.pending_count} icon={Clock} color="orange" />
        </div>
      )}

      {methodChartData.length > 0 && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-800">التحويلات حسب طريقة الدفع</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={methodChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {methodChartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <DataTable
        columns={columns}
        data={transfers}
        actions={[
          { label: 'تعديل الحالة', icon: Edit3, className: 'text-blue-600 hover:bg-blue-500/10', onClick: openEdit },
        ]}
        onDelete={async (id) => { await api.delete(`/cash/transfers/${id}`); load(); }}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTransfer ? 'تعديل حالة التحويل' : 'تحويل نقدي جديد'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!editingTransfer ? (
            <>
              <div><label className="mb-1 block text-sm font-medium text-gray-700">المستفيد *</label><select required value={form.beneficiary_id} onChange={(e) => setForm({ ...form, beneficiary_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر المستفيد</option>{beneficiaries.map((b) => <option key={b.id} value={b.id}>{b.first_name} {b.last_name} - {b.national_id || b.phone || b.id}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-medium text-gray-700">المشروع</label><select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="">بدون مشروع</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium text-gray-700">المبلغ *</label><input required type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="mb-1 block text-sm font-medium text-gray-700">العملة</label><select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="YER">ريال يمني</option><option value="USD">دولار</option><option value="SAR">ريال سعودي</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium text-gray-700">طريقة الدفع</label><select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">{Object.entries(methodMap).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
                <div><label className="mb-1 block text-sm font-medium text-gray-700">الغرض</label><input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium text-gray-700">تاريخ التحويل</label><input type="date" value={form.transfer_date} onChange={(e) => setForm({ ...form, transfer_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="mb-1 block text-sm font-medium text-gray-700">اسم الوكيل</label><input value={form.agent_name} onChange={(e) => setForm({ ...form, agent_name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <input placeholder="هاتف الوكيل" value={form.agent_phone} onChange={(e) => setForm({ ...form, agent_phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </>
          ) : (
            <>
              <div className="rounded-xl border bg-gray-50 p-3 text-sm">
                <p className="font-bold">{editingTransfer.reference}</p>
                <p className="text-gray-500">{beneficiaryName(editingTransfer.beneficiary_id)} - {Number(editingTransfer.amount || 0).toLocaleString()} {editingTransfer.currency}</p>
              </div>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value, received_date: e.target.value === 'received' ? (form.received_date || TODAY) : form.received_date })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <input type="date" value={form.received_date} onChange={(e) => setForm({ ...form, received_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-4 gap-2">
                {statusOptions.slice(1).map((item) => (
                  <button key={item.value} type="button" onClick={() => updateStatus(editingTransfer, item.value)} className="rounded-lg border px-2 py-2 text-xs font-bold hover:bg-gray-50">{item.label}</button>
                ))}
              </div>
            </>
          )}
          <textarea placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-700">
            <Save size={16} /> حفظ
          </button>
        </form>
      </Modal>
    </div>
  );
}
