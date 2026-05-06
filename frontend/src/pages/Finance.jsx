import { useEffect, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { Edit3, Plus, PiggyBank, Save, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CustomFieldsForm from '../components/CustomFieldsForm';
import CustomizeModuleButton from '../components/CustomizeModuleButton';
import { useCustomization, renderCustomFieldValue } from '../hooks/useCustomization';

const EMPTY_GRANT = {
  code: '',
  name: '',
  donor: '',
  amount: 0,
  currency: 'USD',
  status: 'pending',
  start_date: '',
  end_date: '',
  project_id: '',
  conditions: '',
  custom_values: {},
};

const EMPTY_TX = {
  reference: '',
  type: 'expense',
  amount: 0,
  currency: 'USD',
  description: '',
  category: '',
  grant_id: '',
  project_id: '',
  transaction_date: '',
  custom_values: {},
};

const GRANT_STATUS = [
  { value: 'pending', label: 'قيد المراجعة' },
  { value: 'approved', label: 'معتمدة' },
  { value: 'active', label: 'نشطة' },
  { value: 'completed', label: 'مكتملة' },
  { value: 'rejected', label: 'مرفوضة' },
];

const cleanDate = (value) => value || null;
const cleanId = (value) => (value ? parseInt(value) : null);

export default function Finance() {
  const [grants, setGrants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [grantStats, setGrantStats] = useState(null);
  const [txSummary, setTxSummary] = useState(null);
  const [tab, setTab] = useState('grants');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [editingGrant, setEditingGrant] = useState(null);
  const [editingTx, setEditingTx] = useState(null);
  const [grantForm, setGrantForm] = useState(EMPTY_GRANT);
  const [txForm, setTxForm] = useState(EMPTY_TX);
  const { fields: grantFields } = useCustomization('grant');
  const { fields: txFields, listsBySlug } = useCustomization('transaction');
  const transactionCategories = listsBySlug.transaction_categories?.length ? listsBySlug.transaction_categories : ['رواتب', 'إيجارات', 'مشتريات', 'سفر', 'تدريب', 'معدات', 'خدمات'].map((value) => ({ value, label_ar: value }));

  const load = () => {
    api.get('/finance/grants').then((r) => setGrants(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_grants');
      if (local) setGrants(JSON.parse(local));
    });
    api.get('/finance/transactions').then((r) => setTransactions(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_transactions');
      if (local) setTransactions(JSON.parse(local));
    });
    api.get('/finance/grants/stats').then((r) => setGrantStats(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_grant_stats');
      if (local) setGrantStats(JSON.parse(local));
    });
    api.get('/finance/transactions/summary').then((r) => setTxSummary(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_transaction_summary');
      if (local) setTxSummary(JSON.parse(local));
    });
    api.get('/projects/').then((r) => setProjects(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_projects');
      if (local) setProjects(JSON.parse(local));
    });
  };

  useEffect(() => {
    load();
  }, []);

  const openGrant = (grant = null) => {
    setEditingGrant(grant);
    setGrantForm(grant ? {
      code: grant.code || '',
      name: grant.name || '',
      donor: grant.donor || '',
      amount: grant.amount || 0,
      currency: grant.currency || 'USD',
      status: grant.status || 'pending',
      start_date: grant.start_date || '',
      end_date: grant.end_date || '',
      project_id: grant.project_id || '',
      conditions: grant.conditions || '',
      custom_values: grant.custom_values || {},
    } : EMPTY_GRANT);
    setShowGrantModal(true);
  };

  const openTx = (tx = null) => {
    setEditingTx(tx);
    setTxForm(tx ? {
      reference: tx.reference || '',
      type: tx.type || 'expense',
      amount: tx.amount || 0,
      currency: tx.currency || 'USD',
      description: tx.description || '',
      category: tx.category || '',
      grant_id: tx.grant_id || '',
      project_id: tx.project_id || '',
      transaction_date: tx.transaction_date || '',
      custom_values: tx.custom_values || {},
    } : EMPTY_TX);
    setShowTxModal(true);
  };

  const grantPayload = {
    ...grantForm,
    amount: parseFloat(grantForm.amount || 0),
    project_id: cleanId(grantForm.project_id),
    start_date: cleanDate(grantForm.start_date),
    end_date: cleanDate(grantForm.end_date),
  };

  const txPayload = {
    ...txForm,
    amount: parseFloat(txForm.amount || 0),
    grant_id: cleanId(txForm.grant_id),
    project_id: cleanId(txForm.project_id),
    transaction_date: cleanDate(txForm.transaction_date),
  };

  const submitGrant = async (e) => {
    e.preventDefault();
    if (editingGrant) {
      await api.put(`/finance/grants/${editingGrant.id}`, grantPayload);
    } else {
      await api.post('/finance/grants', grantPayload);
    }
    setShowGrantModal(false);
    setEditingGrant(null);
    setGrantForm(EMPTY_GRANT);
    load();
  };

  const submitTx = async (e) => {
    e.preventDefault();
    if (editingTx) {
      await api.put(`/finance/transactions/${editingTx.id}`, txPayload);
    } else {
      await api.post('/finance/transactions', txPayload);
    }
    setShowTxModal(false);
    setEditingTx(null);
    setTxForm(EMPTY_TX);
    load();
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm('هل تريد حذف هذه المعاملة؟')) return;
    await api.delete(`/finance/transactions/${id}`);
    load();
  };

  const deleteGrant = async (id) => {
    if (!window.confirm('هل تريد حذف هذه المنحة؟')) return;
    await api.delete(`/finance/grants/${id}`);
    load();
  };

  const projectName = (id) => projects.find((project) => project.id === id)?.name || '-';
  const grantName = (id) => grants.find((grant) => grant.id === id)?.name || '-';

  const grantColumns = [
    { key: 'code', label: 'الرمز' },
    { key: 'name', label: 'اسم المنحة' },
    { key: 'donor', label: 'المانح' },
    { key: 'amount', label: 'المبلغ', render: (v, row) => `${Number(v || 0).toLocaleString()} ${row.currency || ''}` },
    { key: 'spent', label: 'المصروف', render: (v, row) => `${Number(v || 0).toLocaleString()} ${row.currency || ''}` },
    { key: 'project_id', label: 'المشروع', render: (v) => projectName(v) },
    { key: 'status', label: 'الحالة', render: (v) => <StatusBadge status={v} /> },
    { key: 'start_date', label: 'البداية' },
    { key: 'end_date', label: 'النهاية' },
    ...grantFields.filter((field) => field.is_searchable).slice(0, 2).map((field) => ({
      key: `custom_${field.field_key}`,
      label: field.label_ar || field.label,
      render: (_, row) => renderCustomFieldValue(field, row.custom_values?.[field.field_key]),
    })),
  ];

  const txColumns = [
    { key: 'reference', label: 'المرجع' },
    { key: 'type', label: 'النوع', render: (v) => <StatusBadge status={v} /> },
    { key: 'amount', label: 'المبلغ', render: (v, row) => `${Number(v || 0).toLocaleString()} ${row.currency || ''}` },
    { key: 'category', label: 'التصنيف' },
    { key: 'grant_id', label: 'المنحة', render: (v) => grantName(v) },
    { key: 'project_id', label: 'المشروع', render: (v) => projectName(v) },
    { key: 'description', label: 'الوصف' },
    { key: 'transaction_date', label: 'التاريخ' },
    ...txFields.filter((field) => field.is_searchable).slice(0, 2).map((field) => ({
      key: `custom_${field.field_key}`,
      label: field.label_ar || field.label,
      render: (_, row) => renderCustomFieldValue(field, row.custom_values?.[field.field_key]),
    })),
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الإدارة المالية</h1>
          <p className="mt-1 text-sm text-gray-500">إدارة المنح والمعاملات وربط المصروفات بالمشاريع ومصادر التمويل.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CustomizeModuleButton entity={tab === 'grants' ? 'grant' : 'transaction'} className="h-10" />
          <button onClick={() => openGrant()} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
            <Plus size={18} /> إضافة منحة
          </button>
          <button onClick={() => openTx()} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700">
            <Plus size={18} /> إضافة معاملة
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="إجمالي المنح" value={grantStats?.total_amount?.toLocaleString() || 0} icon={Wallet} color="blue" />
        <StatCard title="إجمالي الإيرادات" value={txSummary?.total_income?.toLocaleString() || 0} icon={TrendingUp} color="green" />
        <StatCard title="إجمالي المصروفات" value={txSummary?.total_expense?.toLocaleString() || 0} icon={TrendingDown} color="red" />
        <StatCard title="الرصيد" value={txSummary?.balance?.toLocaleString() || 0} icon={PiggyBank} color="purple" />
      </div>

      {grantStats?.by_donor?.length > 0 && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-800">التمويل حسب المانح</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={grantStats.by_donor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="donor" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} name="المبلغ" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab('grants')} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'grants' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>المنح</button>
        <button onClick={() => setTab('transactions')} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'transactions' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>المعاملات المالية</button>
      </div>

      {tab === 'grants' ? (
        <DataTable
          columns={grantColumns}
          data={grants}
          actions={[{ label: 'تعديل', icon: Edit3, className: 'text-blue-600 hover:bg-blue-500/10', onClick: openGrant }]}
          onDelete={deleteGrant}
        />
      ) : (
        <DataTable
          columns={txColumns}
          data={transactions}
          actions={[{ label: 'تعديل', icon: Edit3, className: 'text-blue-600 hover:bg-blue-500/10', onClick: openTx }]}
          onDelete={deleteTransaction}
        />
      )}

      <Modal isOpen={showGrantModal} onClose={() => setShowGrantModal(false)} title={editingGrant ? 'تعديل منحة' : 'إضافة منحة'}>
        <form onSubmit={submitGrant} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">رمز المنحة *</label><input required value={grantForm.code} onChange={(e) => setGrantForm({ ...grantForm, code: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">المانح *</label><input required value={grantForm.donor} onChange={(e) => setGrantForm({ ...grantForm, donor: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">اسم المنحة *</label><input required value={grantForm.name} onChange={(e) => setGrantForm({ ...grantForm, name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">المبلغ *</label><input required type="number" value={grantForm.amount} onChange={(e) => setGrantForm({ ...grantForm, amount: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">العملة</label><select value={grantForm.currency} onChange={(e) => setGrantForm({ ...grantForm, currency: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="USD">دولار</option><option value="YER">ريال يمني</option><option value="SAR">ريال سعودي</option><option value="EUR">يورو</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">الحالة</label><select value={grantForm.status} onChange={(e) => setGrantForm({ ...grantForm, status: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">{GRANT_STATUS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">المشروع</label><select value={grantForm.project_id} onChange={(e) => setGrantForm({ ...grantForm, project_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="">بدون مشروع</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">تاريخ البداية</label><input type="date" value={grantForm.start_date} onChange={(e) => setGrantForm({ ...grantForm, start_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">تاريخ النهاية</label><input type="date" value={grantForm.end_date} onChange={(e) => setGrantForm({ ...grantForm, end_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">الشروط والقيود</label><textarea value={grantForm.conditions} onChange={(e) => setGrantForm({ ...grantForm, conditions: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" rows={2} /></div>
          <CustomFieldsForm fields={grantFields} values={grantForm.custom_values} onChange={(customValues) => setGrantForm({ ...grantForm, custom_values: customValues })} />
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-700">
            <Save size={16} /> حفظ
          </button>
        </form>
      </Modal>

      <Modal isOpen={showTxModal} onClose={() => setShowTxModal(false)} title={editingTx ? 'تعديل معاملة مالية' : 'إضافة معاملة مالية'}>
        <form onSubmit={submitTx} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">المرجع</label><input value={txForm.reference} onChange={(e) => setTxForm({ ...txForm, reference: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">النوع *</label><select required value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"><option value="expense">مصروف</option><option value="income">إيراد</option><option value="transfer">تحويل</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">المبلغ *</label><input required type="number" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">العملة</label><select value={txForm.currency} onChange={(e) => setTxForm({ ...txForm, currency: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"><option value="USD">دولار</option><option value="YER">ريال يمني</option><option value="SAR">ريال سعودي</option><option value="EUR">يورو</option></select></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">الوصف</label><input value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">التصنيف</label><select value={txForm.category} onChange={(e) => setTxForm({ ...txForm, category: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"><option value="">اختر</option>{transactionCategories.map((category) => <option key={category.value} value={category.value}>{category.label_ar || category.label || category.value}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">المنحة</label><select value={txForm.grant_id} onChange={(e) => setTxForm({ ...txForm, grant_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"><option value="">اختر</option>{grants.map((grant) => <option key={grant.id} value={grant.id}>{grant.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">المشروع</label><select value={txForm.project_id} onChange={(e) => setTxForm({ ...txForm, project_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"><option value="">بدون مشروع</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">التاريخ</label><input type="date" value={txForm.transaction_date} onChange={(e) => setTxForm({ ...txForm, transaction_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          </div>
          <CustomFieldsForm fields={txFields} values={txForm.custom_values} onChange={(customValues) => setTxForm({ ...txForm, custom_values: customValues })} />
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 font-medium text-white transition hover:bg-emerald-700">
            <Save size={16} /> حفظ
          </button>
        </form>
      </Modal>
    </div>
  );
}
