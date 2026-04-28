import { useState, useEffect } from 'react';
import api from '../services/api';
import { Target, Plus, Layers } from 'lucide-react';

const SECTOR_LABELS = { protection: 'الحماية', fsac: 'الأمن الغذائي وسبل العيش', education: 'التعليم', health: 'الصحة والتغذية', wash: 'المياه والصرف الصحي', mpca: 'المساعدات النقدية' };
const SECTOR_COLORS = { protection: 'bg-purple-50 border-purple-200', fsac: 'bg-orange-50 border-orange-200', education: 'bg-blue-50 border-blue-200', health: 'bg-red-50 border-red-200', wash: 'bg-cyan-50 border-cyan-200', mpca: 'bg-green-50 border-green-200' };

export default function SectorIndicators() {
  const [templates, setTemplates] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [selectedSector, setSelectedSector] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', sector: 'protection', unit: '', description: '', calculation_method: '' });

  useEffect(() => {
    api.get('/sector-indicators/templates').then(r => setTemplates(Object.entries(r.data).map(([k, v]) => ({ sector: k, ...v }))));
    api.get('/sector-indicators/').then(r => setIndicators(r.data));
  }, []);

  const submit = async () => {
    await api.post('/sector-indicators/', null, { params: form });
    setShowModal(false);
    setForm({ name: '', sector: 'protection', unit: '', description: '', calculation_method: '' });
    api.get('/sector-indicators/').then(r => setIndicators(r.data));
  };

  const initSector = async (sector) => {
    await api.post(`/sector-indicators/initialize/${sector}`);
    api.get('/sector-indicators/').then(r => setIndicators(r.data));
  };

  const filtered = selectedSector ? indicators.filter(i => i.sector === selectedSector) : indicators;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Target /> المؤشرات القطاعية</h1>
          <p className="text-sm text-gray-500 mt-1">مؤشرات قياسية للحماية، الأمن الغذائي، التعليم، الصحة، WASH، MPCA</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition">
          <Plus size={18} /> مؤشر جديد
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {templates.map(t => (
          <div key={t.sector} className={`rounded-xl p-4 border ${SECTOR_COLORS[t.sector] || 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">{SECTOR_LABELS[t.sector] || t.sector}</h3>
              <button onClick={() => initSector(t.sector)} className="text-xs bg-white px-3 py-1 rounded-lg border hover:bg-gray-50">تحميل المؤشرات</button>
            </div>
            <div className="space-y-1">
              {t.indicators.slice(0, 5).map((ind, i) => (
                <p key={i} className="text-xs text-gray-600 flex items-center gap-1"><Layers size={10} /> {ind.name}</p>
              ))}
              {t.indicators.length > 5 && <p className="text-xs text-gray-400">+{t.indicators.length - 5} مؤشرات أخرى</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <select value={selectedSector} onChange={e => setSelectedSector(e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="">كل القطاعات</option>
          {Object.entries(SECTOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right">المؤشر</th>
              <th className="px-4 py-3 text-right">القطاع</th>
              <th className="px-4 py-3 text-right">الوحدة</th>
              <th className="px-4 py-3 text-right">الوصف</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ind => (
              <tr key={ind.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{ind.name}</td>
                <td className="px-4 py-3">{SECTOR_LABELS[ind.sector] || ind.sector}</td>
                <td className="px-4 py-3">{ind.unit || '-'}</td>
                <td className="px-4 py-3 text-xs max-w-xs truncate">{ind.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 text-gray-400">لا توجد مؤشرات. اختر قطاع وقم بتحميل المؤشرات القياسية</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">مؤشر قطاعي جديد</h2>
            <div className="space-y-3">
              <input type="text" placeholder="اسم المؤشر" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded-lg p-2" />
              <select value={form.sector} onChange={e => setForm({...form, sector: e.target.value})} className="w-full border rounded-lg p-2">
                {Object.entries(SECTOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="الوحدة" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="border rounded-lg p-2" />
                <input type="text" placeholder="طريقة الحساب" value={form.calculation_method} onChange={e => setForm({...form, calculation_method: e.target.value})} className="border rounded-lg p-2" />
              </div>
              <textarea placeholder="الوصف" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded-lg p-2" rows={2} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={submit} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">حفظ</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
