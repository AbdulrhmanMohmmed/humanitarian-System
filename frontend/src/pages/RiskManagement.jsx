import { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, Plus, X, AlertTriangle } from 'lucide-react';

const LIKELIHOOD = ['very_low', 'low', 'medium', 'high', 'very_high'];
const IMPACT = ['negligible', 'minor', 'moderate', 'major', 'severe'];
const L_LABELS = { very_low: 'منخفض جداً', low: 'منخفض', medium: 'متوسط', high: 'عالي', very_high: 'عالي جداً' };
const I_LABELS = { negligible: 'مهمل', minor: 'طفيف', moderate: 'معتدل', major: 'كبير', severe: 'حاد' };
const S_LABELS = { identified: 'محدد', mitigating: 'قيد التخفيف', monitoring: 'مراقبة', resolved: 'تم الحل', accepted: 'مقبول' };

export default function RiskManagement() {
  const [risks, setRisks] = useState([]);
  const [matrix, setMatrix] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', likelihood: 'medium', impact: 'moderate', mitigation_plan: '', contingency_plan: '' });

  const load = () => {
    api.get('/risks/').then(r => setRisks(r.data));
    api.get('/risks/matrix').then(r => setMatrix(r.data));
  };
  useEffect(load, []);

  const submit = async () => {
    await api.post('/risks/', form);
    setShowModal(false);
    setForm({ title: '', description: '', category: '', likelihood: 'medium', impact: 'moderate', mitigation_plan: '', contingency_plan: '' });
    load();
  };

  const scoreColor = (s) => s >= 12 ? 'bg-red-100 text-red-700' : s >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المخاطر</h1>
          <p className="text-sm text-gray-500 mt-1">سجل المخاطر ومصفوفة التقييم وخطط التخفيف</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition">
          <Plus size={18} /> إضافة مخاطرة
        </button>
      </div>

      {matrix && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 rounded-xl p-5 border border-red-100">
            <p className="text-sm text-red-600">مخاطر عالية</p>
            <p className="text-3xl font-bold text-red-700">{matrix.high_risks}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-100">
            <p className="text-sm text-yellow-600">مخاطر متوسطة</p>
            <p className="text-3xl font-bold text-yellow-700">{matrix.medium_risks}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-5 border border-green-100">
            <p className="text-sm text-green-600">مخاطر منخفضة</p>
            <p className="text-3xl font-bold text-green-700">{matrix.low_risks}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {risks.map(r => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-800">{r.title}</h3>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${scoreColor(r.risk_score)}`}>درجة: {r.risk_score}</span>
                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">{S_LABELS[r.status] || r.status}</span>
              </div>
            </div>
            {r.description && <p className="text-sm text-gray-600 mb-3">{r.description}</p>}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">الاحتمالية:</span> <span className="font-medium">{L_LABELS[r.likelihood]}</span></div>
              <div><span className="text-gray-500">الأثر:</span> <span className="font-medium">{I_LABELS[r.impact]}</span></div>
            </div>
            {r.mitigation_plan && <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm text-blue-700"><strong>خطة التخفيف:</strong> {r.mitigation_plan}</div>}
            {r.contingency_plan && <div className="mt-2 bg-orange-50 rounded-lg p-3 text-sm text-orange-700"><strong>خطة الطوارئ:</strong> {r.contingency_plan}</div>}
          </div>
        ))}
        {risks.length === 0 && <div className="text-center py-12 text-gray-400">لا توجد مخاطر مسجلة</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">إضافة مخاطرة</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="عنوان المخاطرة *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
              <textarea placeholder="الوصف" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" rows={2} />
              <input placeholder="الفئة (مالية، تشغيلية، أمنية...)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-red-500" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">الاحتمالية</label>
                  <select value={form.likelihood} onChange={e => setForm({ ...form, likelihood: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200">
                    {LIKELIHOOD.map(l => <option key={l} value={l}>{L_LABELS[l]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">الأثر</label>
                  <select value={form.impact} onChange={e => setForm({ ...form, impact: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200">
                    {IMPACT.map(i => <option key={i} value={i}>{I_LABELS[i]}</option>)}
                  </select>
                </div>
              </div>
              <textarea placeholder="خطة التخفيف" value={form.mitigation_plan} onChange={e => setForm({ ...form, mitigation_plan: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" rows={2} />
              <textarea placeholder="خطة الطوارئ" value={form.contingency_plan} onChange={e => setForm({ ...form, contingency_plan: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" rows={2} />
              <button onClick={submit} disabled={!form.title} className="w-full py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:opacity-50">حفظ المخاطرة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
