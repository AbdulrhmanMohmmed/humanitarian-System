import { useEffect, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { AlertTriangle, CheckCircle2, DollarSign, Edit3, Package, Plus, Save, Trash2, Warehouse } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const catMap = { food: 'غذائي', medicine: 'طبي', shelter: 'مأوى', wash: 'مياه وصرف', nfi: 'مواد غير غذائية', education: 'تعليم', other: 'أخرى' };
const distStatus = [
  { value: 'planned', label: 'مخطط' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
];
const governorates = ['صنعاء', 'عدن', 'تعز', 'الحديدة', 'إب', 'حضرموت', 'مأرب', 'ذمار', 'حجة', 'البيضاء'];

export default function Inventory() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [distributionItems, setDistributionItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('items');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showWhModal, setShowWhModal] = useState(false);
  const [showDistModal, setShowDistModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', category: 'food', quantity: 0, unit: '', min_stock: 0, warehouse_id: '', unit_cost: 0 });
  const [whForm, setWhForm] = useState({ name: '', code: '', location: '', governorate: '', capacity: 0 });
  const [distForm, setDistForm] = useState({ title: '', project_id: '', distribution_date: '', location: '', governorate: '', warehouse_id: '', status: 'planned', notes: '' });
  const [recipientForm, setRecipientForm] = useState({ beneficiary_id: '', item_name: '', quantity: 1, unit: '', notes: '' });

  const load = () => {
    api.get('/inventory/items').then((r) => setItems(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_inventory_items');
      if (local) setItems(JSON.parse(local));
    });
    api.get('/inventory/warehouses').then((r) => setWarehouses(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_warehouses');
      if (local) setWarehouses(JSON.parse(local));
    });
    api.get('/inventory/distributions').then((r) => setDistributions(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_distributions');
      if (local) setDistributions(JSON.parse(local));
    });
    api.get('/inventory/items/stats').then((r) => setStats(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_inventory_stats');
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

  const loadDistributionItems = async (distribution) => {
    setSelectedDistribution(distribution);
    setDistForm({
      title: distribution.title || '',
      project_id: distribution.project_id || '',
      distribution_date: distribution.distribution_date || '',
      location: distribution.location || '',
      governorate: distribution.governorate || '',
      warehouse_id: distribution.warehouse_id || '',
      status: distribution.status || 'planned',
      notes: distribution.notes || '',
    });
    const res = await api.get(`/inventory/distributions/${distribution.id}/items`);
    setDistributionItems(res.data);
  };

  const submitItem = async (e) => {
    e.preventDefault();
    await api.post('/inventory/items', {
      ...itemForm,
      quantity: parseFloat(itemForm.quantity || 0),
      min_stock: parseFloat(itemForm.min_stock || 0),
      unit_cost: parseFloat(itemForm.unit_cost || 0),
      warehouse_id: parseInt(itemForm.warehouse_id),
    });
    setShowItemModal(false);
    load();
  };

  const submitWh = async (e) => {
    e.preventDefault();
    await api.post('/inventory/warehouses', { ...whForm, capacity: parseFloat(whForm.capacity || 0) });
    setShowWhModal(false);
    load();
  };

  const submitDist = async (e) => {
    e.preventDefault();
    const payload = {
      ...distForm,
      project_id: distForm.project_id ? parseInt(distForm.project_id) : null,
      warehouse_id: distForm.warehouse_id ? parseInt(distForm.warehouse_id) : null,
      distribution_date: distForm.distribution_date || null,
    };
    if (selectedDistribution) {
      await api.put(`/inventory/distributions/${selectedDistribution.id}`, payload);
      await loadDistributionItems({ ...selectedDistribution, ...payload });
    } else {
      await api.post('/inventory/distributions', payload);
      setShowDistModal(false);
    }
    load();
  };

  const addRecipient = async (e) => {
    e.preventDefault();
    await api.post(`/inventory/distributions/${selectedDistribution.id}/items`, {
      ...recipientForm,
      beneficiary_id: parseInt(recipientForm.beneficiary_id),
      quantity: parseFloat(recipientForm.quantity || 0),
    });
    setRecipientForm({ beneficiary_id: '', item_name: '', quantity: 1, unit: '', notes: '' });
    const refreshed = distributions.find((d) => d.id === selectedDistribution.id) || selectedDistribution;
    await loadDistributionItems(refreshed);
    load();
  };

  const markReceived = async (recipient, received) => {
    await api.put(`/inventory/distribution-items/${recipient.id}`, { received, notes: recipient.notes || null });
    await loadDistributionItems(selectedDistribution);
  };

  const deleteRecipient = async (id) => {
    await api.delete(`/inventory/distribution-items/${id}`);
    await loadDistributionItems(selectedDistribution);
    load();
  };

  const beneficiaryName = (id) => {
    const beneficiary = beneficiaries.find((item) => item.id === id);
    return beneficiary ? `${beneficiary.first_name} ${beneficiary.last_name}` : id;
  };
  const warehouseName = (id) => warehouses.find((item) => item.id === id)?.name || id || '-';
  const projectName = (id) => projects.find((item) => item.id === id)?.name || '-';

  const itemColumns = [
    { key: 'name', label: 'المادة' },
    { key: 'category', label: 'التصنيف', render: (v) => catMap[v] || v },
    { key: 'quantity', label: 'الكمية', render: (v, row) => (<span className={v <= row.min_stock ? 'font-bold text-red-600' : ''}>{Number(v || 0).toLocaleString()}</span>) },
    { key: 'unit', label: 'الوحدة' },
    { key: 'min_stock', label: 'الحد الأدنى' },
    { key: 'unit_cost', label: 'سعر الوحدة', render: (v, row) => `${Number(v || 0).toLocaleString()} ${row.currency || ''}` },
    { key: 'warehouse_id', label: 'المخزن', render: (v) => warehouseName(v) },
  ];

  const whColumns = [
    { key: 'code', label: 'الرمز' },
    { key: 'name', label: 'الاسم' },
    { key: 'location', label: 'الموقع' },
    { key: 'governorate', label: 'المحافظة' },
    { key: 'capacity', label: 'السعة' },
  ];

  const distColumns = [
    { key: 'title', label: 'العنوان' },
    { key: 'project_id', label: 'المشروع', render: (v) => projectName(v) },
    { key: 'distribution_date', label: 'التاريخ' },
    { key: 'location', label: 'الموقع' },
    { key: 'governorate', label: 'المحافظة' },
    { key: 'total_beneficiaries', label: 'المستفيدين' },
    { key: 'status', label: 'الحالة', render: (v) => <StatusBadge status={v} /> },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المخازن وسلسلة الإمداد</h1>
          <p className="mt-1 text-sm text-gray-500">إدارة المخزون، إنشاء التوزيعات، وتسجيل استلام المستفيدين.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowWhModal(true)} className="flex items-center gap-2 rounded-xl bg-gray-600 px-4 py-2 text-white transition hover:bg-gray-700"><Plus size={18} /> مخزن</button>
          <button onClick={() => setShowItemModal(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"><Plus size={18} /> مادة</button>
          <button onClick={() => { setSelectedDistribution(null); setDistForm({ title: '', project_id: '', distribution_date: '', location: '', governorate: '', warehouse_id: '', status: 'planned', notes: '' }); setShowDistModal(true); }} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700"><Plus size={18} /> توزيع</button>
        </div>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard title="إجمالي المواد" value={stats.total_items} icon={Package} color="blue" />
          <StatCard title="مواد منخفضة المخزون" value={stats.low_stock} icon={AlertTriangle} color="red" />
          <StatCard title="المخازن" value={warehouses.length} icon={Warehouse} color="purple" />
          <StatCard title="القيمة الإجمالية" value={stats.total_value?.toLocaleString()} icon={DollarSign} color="green" />
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab('items')} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'items' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>المواد</button>
        <button onClick={() => setTab('warehouses')} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'warehouses' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>المخازن</button>
        <button onClick={() => setTab('distributions')} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'distributions' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>التوزيعات</button>
      </div>

      {tab === 'items' && <DataTable columns={itemColumns} data={items} onDelete={async (id) => { await api.delete(`/inventory/items/${id}`); load(); }} />}
      {tab === 'warehouses' && <DataTable columns={whColumns} data={warehouses} onDelete={async (id) => { await api.delete(`/inventory/warehouses/${id}`); load(); }} />}
      {tab === 'distributions' && (
        <DataTable
          columns={distColumns}
          data={distributions}
          actions={[{ label: 'إدارة المستلمين', icon: Edit3, className: 'text-emerald-600 hover:bg-emerald-500/10', onClick: loadDistributionItems }]}
          onDelete={async (id) => { await api.delete(`/inventory/distributions/${id}`); load(); }}
        />
      )}

      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title="إضافة مادة">
        <form onSubmit={submitItem} className="space-y-3">
          <input required placeholder="اسم المادة" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="grid grid-cols-2 gap-3">
            <select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">{Object.entries(catMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select>
            <select required value={itemForm.warehouse_id} onChange={(e) => setItemForm({ ...itemForm, warehouse_id: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر المخزن</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="number" placeholder="الكمية" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="الوحدة" value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" placeholder="الحد الأدنى" value={itemForm.min_stock} onChange={(e) => setItemForm({ ...itemForm, min_stock: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <input type="number" step="0.01" placeholder="سعر الوحدة" value={itemForm.unit_cost} onChange={(e) => setItemForm({ ...itemForm, unit_cost: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700">حفظ</button>
        </form>
      </Modal>

      <Modal isOpen={showWhModal} onClose={() => setShowWhModal(false)} title="إضافة مخزن">
        <form onSubmit={submitWh} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="اسم المخزن" value={whForm.name} onChange={(e) => setWhForm({ ...whForm, name: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            <input required placeholder="الرمز" value={whForm.code} onChange={(e) => setWhForm({ ...whForm, code: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <input placeholder="الموقع" value={whForm.location} onChange={(e) => setWhForm({ ...whForm, location: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="grid grid-cols-2 gap-3">
            <select value={whForm.governorate} onChange={(e) => setWhForm({ ...whForm, governorate: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر المحافظة</option>{governorates.map((g) => <option key={g} value={g}>{g}</option>)}</select>
            <input type="number" placeholder="السعة" value={whForm.capacity} onChange={(e) => setWhForm({ ...whForm, capacity: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" className="w-full rounded-xl bg-gray-600 py-2.5 font-medium text-white hover:bg-gray-700">حفظ</button>
        </form>
      </Modal>

      <Modal isOpen={showDistModal} onClose={() => setShowDistModal(false)} title="إضافة توزيع">
        <form onSubmit={submitDist} className="space-y-3">
          <input required placeholder="عنوان التوزيع" value={distForm.title} onChange={(e) => setDistForm({ ...distForm, title: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="grid grid-cols-2 gap-3">
            <select value={distForm.project_id} onChange={(e) => setDistForm({ ...distForm, project_id: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="">بدون مشروع</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <select value={distForm.warehouse_id} onChange={(e) => setDistForm({ ...distForm, warehouse_id: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر المخزن</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={distForm.distribution_date} onChange={(e) => setDistForm({ ...distForm, distribution_date: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={distForm.status} onChange={(e) => setDistForm({ ...distForm, status: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">{distStatus.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="الموقع" value={distForm.location} onChange={(e) => setDistForm({ ...distForm, location: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={distForm.governorate} onChange={(e) => setDistForm({ ...distForm, governorate: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر المحافظة</option>{governorates.map((g) => <option key={g} value={g}>{g}</option>)}</select>
          </div>
          <textarea placeholder="ملاحظات" value={distForm.notes} onChange={(e) => setDistForm({ ...distForm, notes: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-700"><Save size={16} /> حفظ</button>
        </form>
      </Modal>

      {selectedDistribution && (
        <Modal isOpen={Boolean(selectedDistribution)} onClose={() => setSelectedDistribution(null)} title="إدارة مستلمي التوزيع">
          <div className="space-y-5">
            <form onSubmit={submitDist} className="space-y-3 rounded-xl border bg-gray-50 p-3">
              <input value={distForm.title} onChange={(e) => setDistForm({ ...distForm, title: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
              <div className="grid grid-cols-2 gap-3">
                <select value={distForm.status} onChange={(e) => setDistForm({ ...distForm, status: e.target.value })} className="rounded-lg border px-3 py-2">{distStatus.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
                <input type="date" value={distForm.distribution_date} onChange={(e) => setDistForm({ ...distForm, distribution_date: e.target.value })} className="rounded-lg border px-3 py-2" />
              </div>
              <button onClick={() => { toast.show('تم حفظ بيانات التوزيع بنجاح'); }} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 font-bold text-white"><Save size={16} /> حفظ بيانات التوزيع</button>
            </form>

            <form onSubmit={addRecipient} className="space-y-3 rounded-xl border p-3">
              <div className="grid grid-cols-2 gap-3">
                <select required value={recipientForm.beneficiary_id} onChange={(e) => setRecipientForm({ ...recipientForm, beneficiary_id: e.target.value })} className="rounded-lg border px-3 py-2">
                  <option value="">اختر المستفيد</option>
                  {beneficiaries.map((b) => <option key={b.id} value={b.id}>{b.first_name} {b.last_name} - {b.national_id || b.phone || b.id}</option>)}
                </select>
                <input placeholder="المادة/السلة" value={recipientForm.item_name} onChange={(e) => setRecipientForm({ ...recipientForm, item_name: e.target.value })} className="rounded-lg border px-3 py-2" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="الكمية" value={recipientForm.quantity} onChange={(e) => setRecipientForm({ ...recipientForm, quantity: e.target.value })} className="rounded-lg border px-3 py-2" />
                <input placeholder="الوحدة" value={recipientForm.unit} onChange={(e) => setRecipientForm({ ...recipientForm, unit: e.target.value })} className="rounded-lg border px-3 py-2" />
                <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 font-bold text-white">إضافة</button>
              </div>
            </form>

            <div className="max-h-80 overflow-y-auto rounded-xl border">
              {distributionItems.map((recipient) => (
                <div key={recipient.id} className="grid grid-cols-12 items-center gap-2 border-b p-3 text-sm last:border-b-0">
                  <div className="col-span-4 font-bold">{beneficiaryName(recipient.beneficiary_id)}</div>
                  <div className="col-span-3 text-gray-500">{recipient.item_name || '-'} - {recipient.quantity} {recipient.unit || ''}</div>
                  <div className="col-span-2">{recipient.received ? <span className="text-emerald-600">تم الاستلام</span> : <span className="text-amber-600">لم يستلم</span>}</div>
                  <div className="col-span-3 flex justify-end gap-2">
                    <button onClick={() => markReceived(recipient, !recipient.received)} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" title="تسجيل الاستلام"><CheckCircle2 size={16} /></button>
                    <button onClick={() => deleteRecipient(recipient.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="حذف"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {distributionItems.length === 0 && <p className="py-8 text-center text-sm text-gray-400">لم تتم إضافة مستفيدين لهذا التوزيع بعد.</p>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
