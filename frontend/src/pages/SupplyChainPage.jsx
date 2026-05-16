import { useState } from 'react';
import { Package, Plus, BarChart3, AlertTriangle, Truck, Clock } from 'lucide-react';
import { useStockMovements, useCreateStockMovement, useBatches, useCreateBatch, useExpiryAlerts, useLastMileDeliveries, useCreateDelivery } from '../hooks/useModuleApi';

export default function SupplyChainPage() {
  const [tab, setTab] = useState('stock');
  const [showForm, setShowForm] = useState(false);
  const [stockForm, setStockForm] = useState({ item_name: '', movement_type: 'in', quantity: 0, warehouse: '', reference: '' });
  const [batchForm, setBatchForm] = useState({ item_name: '', batch_number: '', quantity: 0, expiry_date: '', supplier: '' });
  const [deliveryForm, setDeliveryForm] = useState({ destination: '', items_description: '', vehicle_id: '', driver_name: '', status: 'pending' });

  const { data: stock = [], isLoading: stkLoading } = useStockMovements({});
  const createStock = useCreateStockMovement();
  const { data: batches = [], isLoading: bchLoading } = useBatches({});
  const createBatch = useCreateBatch();
  const { data: expiryAlerts = [] } = useExpiryAlerts();
  const { data: deliveries = [], isLoading: delLoading } = useLastMileDeliveries({});
  const createDelivery = useCreateDelivery();

  const tabs = [
    { id: 'stock', label: 'حركة المخزون', icon: Package },
    { id: 'batches', label: 'الدفعات', icon: BarChart3 },
    { id: 'expiry', label: 'تنبيهات الانتهاء', icon: AlertTriangle },
    { id: 'delivery', label: 'التوصيل', icon: Truck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Package className="w-8 h-8 text-sky-600" /><h1 className="text-2xl font-bold">سلسلة الإمداد المتقدمة</h1></div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-sky-600">{(stock || []).length}</p><p className="text-sm text-[var(--text-secondary)]">حركات المخزون</p></div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-blue-600">{(batches || []).length}</p><p className="text-sm text-[var(--text-secondary)]">الدفعات</p></div>
        <div className="bg-[var(--card)] rounded-xl border border-red-200 p-4 text-center"><p className="text-3xl font-bold text-red-600">{(expiryAlerts || []).length}</p><p className="text-sm text-red-600">تنبيهات انتهاء</p></div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center"><p className="text-3xl font-bold text-green-600">{(deliveries || []).filter(d => d.status === 'delivered').length}</p><p className="text-sm text-[var(--text-secondary)]">تم التوصيل</p></div>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)]">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 ${tab === t.id ? 'border-sky-600 text-sky-600' : 'border-transparent text-[var(--text-secondary)]'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> حركة جديدة</button>
          {showForm && (
            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-5 gap-3">
                <input type="text" value={stockForm.item_name} onChange={e => setStockForm(p => ({ ...p, item_name: e.target.value }))} placeholder="اسم الصنف" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={stockForm.movement_type} onChange={e => setStockForm(p => ({ ...p, movement_type: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="in">وارد</option><option value="out">صادر</option><option value="transfer">تحويل</option><option value="adjustment">تعديل</option>
                </select>
                <input type="number" value={stockForm.quantity} onChange={e => setStockForm(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} placeholder="الكمية" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="text" value={stockForm.warehouse} onChange={e => setStockForm(p => ({ ...p, warehouse: e.target.value }))} placeholder="المستودع" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="text" value={stockForm.reference} onChange={e => setStockForm(p => ({ ...p, reference: e.target.value }))} placeholder="المرجع" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              </div>
              <button onClick={async () => { await createStock.mutateAsync(stockForm); setShowForm(false); }} disabled={createStock.isPending} className="bg-sky-600 text-white px-4 py-2 rounded-lg">حفظ</button>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">الصنف</th><th className="text-right p-3">النوع</th><th className="text-right p-3">الكمية</th><th className="text-right p-3">المستودع</th><th className="text-right p-3">التاريخ</th></tr></thead>
              <tbody>{stkLoading ? <tr><td colSpan={5} className="p-4 text-center">جاري التحميل...</td></tr> :
                (stock || []).map(s => (
                  <tr key={s.id} className="border-t border-[var(--border)]"><td className="p-3">{s.item_name}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${s.movement_type === 'in' ? 'bg-green-100 text-green-700' : s.movement_type === 'out' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{s.movement_type === 'in' ? 'وارد' : s.movement_type === 'out' ? 'صادر' : s.movement_type}</span></td>
                    <td className="p-3 font-mono">{s.quantity}</td><td className="p-3">{s.warehouse}</td><td className="p-3 text-xs">{s.created_at ? new Date(s.created_at).toLocaleDateString('ar') : '-'}</td>
                  </tr>
                ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'batches' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> دفعة جديدة</button>
          {showForm && (
            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-5 gap-3">
                <input type="text" value={batchForm.item_name} onChange={e => setBatchForm(p => ({ ...p, item_name: e.target.value }))} placeholder="الصنف" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="text" value={batchForm.batch_number} onChange={e => setBatchForm(p => ({ ...p, batch_number: e.target.value }))} placeholder="رقم الدفعة" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="number" value={batchForm.quantity} onChange={e => setBatchForm(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} placeholder="الكمية" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="date" value={batchForm.expiry_date} onChange={e => setBatchForm(p => ({ ...p, expiry_date: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="text" value={batchForm.supplier} onChange={e => setBatchForm(p => ({ ...p, supplier: e.target.value }))} placeholder="المورّد" className="border border-[var(--border)] rounded-lg px-3 py-2" />
              </div>
              <button onClick={async () => { await createBatch.mutateAsync(batchForm); setShowForm(false); }} disabled={createBatch.isPending} className="bg-sky-600 text-white px-4 py-2 rounded-lg">حفظ</button>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">الصنف</th><th className="text-right p-3">رقم الدفعة</th><th className="text-right p-3">الكمية</th><th className="text-right p-3">تاريخ الانتهاء</th><th className="text-right p-3">المورّد</th></tr></thead>
              <tbody>{bchLoading ? <tr><td colSpan={5} className="p-4 text-center">جاري التحميل...</td></tr> :
                (batches || []).map(b => (
                  <tr key={b.id} className="border-t border-[var(--border)]"><td className="p-3">{b.item_name}</td><td className="p-3 font-mono text-xs">{b.batch_number}</td><td className="p-3">{b.quantity}</td><td className="p-3 text-xs">{b.expiry_date}</td><td className="p-3">{b.supplier}</td></tr>
                ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'expiry' && (
        <div className="space-y-3">
          {(expiryAlerts || []).length === 0 ? <p className="text-center p-8 text-[var(--text-secondary)]">لا توجد تنبيهات انتهاء حالياً</p> :
            (expiryAlerts || []).map((a, i) => (
              <div key={i} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 flex items-center gap-3">
                <Clock className="w-5 h-5 text-red-600" />
                <div><p className="font-medium text-red-700">{a.item_name || a.batch_number}</p><p className="text-sm text-red-600">ينتهي: {a.expiry_date} — الكمية: {a.quantity}</p></div>
              </div>
            ))}
        </div>
      )}

      {tab === 'delivery' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> توصيل جديد</button>
          {showForm && (
            <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <input type="text" value={deliveryForm.destination} onChange={e => setDeliveryForm(p => ({ ...p, destination: e.target.value }))} placeholder="الوجهة" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="text" value={deliveryForm.items_description} onChange={e => setDeliveryForm(p => ({ ...p, items_description: e.target.value }))} placeholder="وصف المواد" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <input type="text" value={deliveryForm.driver_name} onChange={e => setDeliveryForm(p => ({ ...p, driver_name: e.target.value }))} placeholder="اسم السائق" className="border border-[var(--border)] rounded-lg px-3 py-2" />
                <select value={deliveryForm.status} onChange={e => setDeliveryForm(p => ({ ...p, status: e.target.value }))} className="border border-[var(--border)] rounded-lg px-3 py-2">
                  <option value="pending">قيد الانتظار</option><option value="in_transit">في الطريق</option><option value="delivered">تم التوصيل</option>
                </select>
              </div>
              <button onClick={async () => { await createDelivery.mutateAsync(deliveryForm); setShowForm(false); }} disabled={createDelivery.isPending} className="bg-sky-600 text-white px-4 py-2 rounded-lg">حفظ</button>
            </div>
          )}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-secondary)]"><tr><th className="text-right p-3">الوجهة</th><th className="text-right p-3">المواد</th><th className="text-right p-3">السائق</th><th className="text-right p-3">الحالة</th></tr></thead>
              <tbody>{delLoading ? <tr><td colSpan={4} className="p-4 text-center">جاري التحميل...</td></tr> :
                (deliveries || []).map(d => (
                  <tr key={d.id} className="border-t border-[var(--border)]"><td className="p-3">{d.destination}</td><td className="p-3">{d.items_description}</td><td className="p-3">{d.driver_name}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${d.status === 'delivered' ? 'bg-green-100 text-green-700' : d.status === 'in_transit' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status === 'delivered' ? 'تم التوصيل' : d.status === 'in_transit' ? 'في الطريق' : 'قيد الانتظار'}</span></td>
                  </tr>
                ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
