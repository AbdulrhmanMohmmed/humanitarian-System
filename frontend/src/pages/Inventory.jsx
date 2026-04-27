import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { Plus, Package, AlertTriangle, Warehouse, DollarSign } from 'lucide-react';

const catMap = { food: 'غذائي', medicine: 'طبي', shelter: 'مأوى', wash: 'مياه وصرف', nfi: 'مواد غير غذائية', education: 'تعليم', other: 'أخرى' };

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('items');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showWhModal, setShowWhModal] = useState(false);
  const [showDistModal, setShowDistModal] = useState(false);
  const [itemForm, setItemForm] = useState({ name: '', category: 'food', quantity: 0, unit: '', min_stock: 0, warehouse_id: '', unit_cost: 0 });
  const [whForm, setWhForm] = useState({ name: '', code: '', location: '', governorate: '', capacity: 0 });
  const [distForm, setDistForm] = useState({ title: '', distribution_date: '', location: '', governorate: '', warehouse_id: '' });

  const load = () => {
    api.get('/inventory/items').then(r => setItems(r.data));
    api.get('/inventory/warehouses').then(r => setWarehouses(r.data));
    api.get('/inventory/distributions').then(r => setDistributions(r.data));
    api.get('/inventory/items/stats').then(r => setStats(r.data));
  };
  useEffect(() => { load(); }, []);

  const submitItem = async (e) => { e.preventDefault(); await api.post('/inventory/items', { ...itemForm, quantity: parseFloat(itemForm.quantity), min_stock: parseFloat(itemForm.min_stock), unit_cost: parseFloat(itemForm.unit_cost), warehouse_id: parseInt(itemForm.warehouse_id) }); setShowItemModal(false); load(); };
  const submitWh = async (e) => { e.preventDefault(); await api.post('/inventory/warehouses', { ...whForm, capacity: parseFloat(whForm.capacity) }); setShowWhModal(false); load(); };
  const submitDist = async (e) => { e.preventDefault(); await api.post('/inventory/distributions', { ...distForm, warehouse_id: distForm.warehouse_id ? parseInt(distForm.warehouse_id) : null }); setShowDistModal(false); load(); };

  const itemColumns = [
    { key: 'name', label: 'المادة' },
    { key: 'category', label: 'التصنيف', render: v => catMap[v] || v },
    { key: 'quantity', label: 'الكمية', render: (v, row) => (<span className={v <= row.min_stock ? 'text-red-600 font-bold' : ''}>{v?.toLocaleString()}</span>) },
    { key: 'unit', label: 'الوحدة' },
    { key: 'min_stock', label: 'الحد الأدنى' },
    { key: 'unit_cost', label: 'سعر الوحدة ($)' },
    { key: 'warehouse_id', label: 'المخزن', render: v => warehouses.find(w => w.id === v)?.name || v },
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
    { key: 'distribution_date', label: 'التاريخ' },
    { key: 'location', label: 'الموقع' },
    { key: 'governorate', label: 'المحافظة' },
    { key: 'total_beneficiaries', label: 'المستفيدين' },
    { key: 'status', label: 'الحالة', render: v => <StatusBadge status={v} /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">المخازن وسلسلة الإمداد</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowWhModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition"><Plus size={18} /> مخزن</button>
          <button onClick={() => setShowItemModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"><Plus size={18} /> مادة</button>
          <button onClick={() => setShowDistModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"><Plus size={18} /> توزيع</button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="إجمالي المواد" value={stats.total_items} icon={Package} color="blue" />
          <StatCard title="مواد منخفضة المخزون" value={stats.low_stock} icon={AlertTriangle} color="red" />
          <StatCard title="المخازن" value={warehouses.length} icon={Warehouse} color="purple" />
          <StatCard title="القيمة الإجمالية ($)" value={stats.total_value?.toLocaleString()} icon={DollarSign} color="green" />
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('items')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'items' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>المواد</button>
        <button onClick={() => setTab('warehouses')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'warehouses' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>المخازن</button>
        <button onClick={() => setTab('distributions')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'distributions' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>التوزيعات</button>
      </div>

      {tab === 'items' && <DataTable columns={itemColumns} data={items} onDelete={async (id) => { await api.delete(`/inventory/items/${id}`); load(); }} />}
      {tab === 'warehouses' && <DataTable columns={whColumns} data={warehouses} onDelete={async (id) => { await api.delete(`/inventory/warehouses/${id}`); load(); }} />}
      {tab === 'distributions' && <DataTable columns={distColumns} data={distributions} onDelete={async (id) => { await api.delete(`/inventory/distributions/${id}`); load(); }} />}

      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title="إضافة مادة">
        <form onSubmit={submitItem} className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم المادة *</label><input required value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label><select value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500">{Object.entries(catMap).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المخزن *</label><select required value={itemForm.warehouse_id} onChange={e => setItemForm({...itemForm, warehouse_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label><input type="number" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label><input value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى</label><input type="number" value={itemForm.min_stock} onChange={e => setItemForm({...itemForm, min_stock: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">سعر الوحدة ($)</label><input type="number" step="0.01" value={itemForm.unit_cost} onChange={e => setItemForm({...itemForm, unit_cost: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">حفظ</button>
        </form>
      </Modal>

      <Modal isOpen={showWhModal} onClose={() => setShowWhModal(false)} title="إضافة مخزن">
        <form onSubmit={submitWh} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم المخزن *</label><input required value={whForm.name} onChange={e => setWhForm({...whForm, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">الرمز *</label><input required value={whForm.code} onChange={e => setWhForm({...whForm, code: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label><input value={whForm.location} onChange={e => setWhForm({...whForm, location: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label><select value={whForm.governorate} onChange={e => setWhForm({...whForm, governorate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر</option>{["صنعاء","عدن","تعز","الحديدة","إب","حضرموت","مأرب","ذمار","حجة","البيضاء"].map(g => <option key={g} value={g}>{g}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">السعة</label><input type="number" value={whForm.capacity} onChange={e => setWhForm({...whForm, capacity: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition font-medium">حفظ</button>
        </form>
      </Modal>

      <Modal isOpen={showDistModal} onClose={() => setShowDistModal(false)} title="إضافة توزيع">
        <form onSubmit={submitDist} className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">العنوان *</label><input required value={distForm.title} onChange={e => setDistForm({...distForm, title: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label><input type="date" value={distForm.distribution_date} onChange={e => setDistForm({...distForm, distribution_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المخزن</label><select value={distForm.warehouse_id} onChange={e => setDistForm({...distForm, warehouse_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label><input value={distForm.location} onChange={e => setDistForm({...distForm, location: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label><select value={distForm.governorate} onChange={e => setDistForm({...distForm, governorate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"><option value="">اختر</option>{["صنعاء","عدن","تعز","الحديدة","إب","حضرموت","مأرب","ذمار","حجة","البيضاء"].map(g => <option key={g} value={g}>{g}</option>)}</select></div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium">حفظ</button>
        </form>
      </Modal>
    </div>
  );
}
