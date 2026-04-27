import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { Plus, Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Finance() {
  const [grants, setGrants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [grantStats, setGrantStats] = useState(null);
  const [txSummary, setTxSummary] = useState(null);
  const [tab, setTab] = useState('grants');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [grantForm, setGrantForm] = useState({ code: '', name: '', donor: '', amount: 0, currency: 'USD', start_date: '', end_date: '' });
  const [txForm, setTxForm] = useState({ type: 'expense', amount: 0, currency: 'USD', description: '', category: '', grant_id: '', transaction_date: '' });

  const load = () => {
    api.get('/finance/grants').then(r => setGrants(r.data));
    api.get('/finance/transactions').then(r => setTransactions(r.data));
    api.get('/finance/grants/stats').then(r => setGrantStats(r.data));
    api.get('/finance/transactions/summary').then(r => setTxSummary(r.data));
  };
  useEffect(() => { load(); }, []);

  const submitGrant = async (e) => {
    e.preventDefault();
    await api.post('/finance/grants', { ...grantForm, amount: parseFloat(grantForm.amount) });
    setShowGrantModal(false);
    setGrantForm({ code: '', name: '', donor: '', amount: 0, currency: 'USD', start_date: '', end_date: '' });
    load();
  };

  const submitTx = async (e) => {
    e.preventDefault();
    await api.post('/finance/transactions', { ...txForm, amount: parseFloat(txForm.amount), grant_id: txForm.grant_id ? parseInt(txForm.grant_id) : null });
    setShowTxModal(false);
    setTxForm({ type: 'expense', amount: 0, currency: 'USD', description: '', category: '', grant_id: '', transaction_date: '' });
    load();
  };

  const grantColumns = [
    { key: 'code', label: 'الرمز' },
    { key: 'name', label: 'اسم المنحة' },
    { key: 'donor', label: 'المانح' },
    { key: 'amount', label: 'المبلغ ($)', render: v => v?.toLocaleString() },
    { key: 'spent', label: 'المصروف ($)', render: v => v?.toLocaleString() },
    { key: 'status', label: 'الحالة', render: v => <StatusBadge status={v} /> },
    { key: 'start_date', label: 'البداية' },
    { key: 'end_date', label: 'النهاية' },
  ];

  const txColumns = [
    { key: 'reference', label: 'المرجع' },
    { key: 'type', label: 'النوع', render: v => <StatusBadge status={v} /> },
    { key: 'amount', label: 'المبلغ ($)', render: v => v?.toLocaleString() },
    { key: 'category', label: 'التصنيف' },
    { key: 'description', label: 'الوصف' },
    { key: 'transaction_date', label: 'التاريخ' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">الإدارة المالية</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowGrantModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
            <Plus size={18} /> إضافة منحة
          </button>
          <button onClick={() => setShowTxModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition">
            <Plus size={18} /> إضافة معاملة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="إجمالي المنح ($)" value={grantStats?.total_amount?.toLocaleString() || 0} icon={Wallet} color="blue" />
        <StatCard title="إجمالي الإيرادات ($)" value={txSummary?.total_income?.toLocaleString() || 0} icon={TrendingUp} color="green" />
        <StatCard title="إجمالي المصروفات ($)" value={txSummary?.total_expense?.toLocaleString() || 0} icon={TrendingDown} color="red" />
        <StatCard title="الرصيد ($)" value={txSummary?.balance?.toLocaleString() || 0} icon={PiggyBank} color="purple" />
      </div>

      {grantStats?.by_donor && grantStats.by_donor.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">التمويل حسب المانح</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={grantStats.by_donor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="donor" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} name="المبلغ ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('grants')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'grants' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>المنح</button>
        <button onClick={() => setTab('transactions')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'transactions' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>المعاملات المالية</button>
      </div>

      {tab === 'grants' ? (
        <DataTable columns={grantColumns} data={grants} onDelete={async (id) => { await api.delete(`/finance/grants/${id}`); load(); }} />
      ) : (
        <DataTable columns={txColumns} data={transactions} />
      )}

      <Modal isOpen={showGrantModal} onClose={() => setShowGrantModal(false)} title="إضافة منحة">
        <form onSubmit={submitGrant} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">رمز المنحة *</label><input required value={grantForm.code} onChange={e => setGrantForm({...grantForm, code: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المانح *</label><input required value={grantForm.donor} onChange={e => setGrantForm({...grantForm, donor: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم المنحة *</label><input required value={grantForm.name} onChange={e => setGrantForm({...grantForm, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المبلغ *</label><input required type="number" value={grantForm.amount} onChange={e => setGrantForm({...grantForm, amount: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">العملة</label><select value={grantForm.currency} onChange={e => setGrantForm({...grantForm, currency: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="USD">دولار</option><option value="YER">ريال يمني</option><option value="SAR">ريال سعودي</option><option value="EUR">يورو</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البداية</label><input type="date" value={grantForm.start_date} onChange={e => setGrantForm({...grantForm, start_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">تاريخ النهاية</label><input type="date" value={grantForm.end_date} onChange={e => setGrantForm({...grantForm, end_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">حفظ</button>
        </form>
      </Modal>

      <Modal isOpen={showTxModal} onClose={() => setShowTxModal(false)} title="إضافة معاملة مالية">
        <form onSubmit={submitTx} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">النوع *</label><select required value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="expense">مصروف</option><option value="income">إيراد</option><option value="transfer">تحويل</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المبلغ *</label><input required type="number" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label><input value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label><select value={txForm.category} onChange={e => setTxForm({...txForm, category: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر</option>{["رواتب","إيجارات","مشتريات","سفر","تدريب","معدات","خدمات"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المنحة</label><select value={txForm.grant_id} onChange={e => setTxForm({...txForm, grant_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر</option>{grants.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label><input type="date" value={txForm.transaction_date} onChange={e => setTxForm({...txForm, transaction_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium">حفظ</button>
        </form>
      </Modal>
    </div>
  );
}
