import { useState, useEffect } from 'react';
import api from '../services/api';
import { FileSearch, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

const SECTORS = ['WASH', 'FSL', 'Protection', 'Health', 'Education', 'Shelter'];
const SECTOR_NAMES = { WASH: 'المياه والصرف الصحي', FSL: 'الأمن الغذائي', Protection: 'الحماية', Health: 'الصحة', Education: 'التعليم', Shelter: 'المأوى' };
const SECTOR_COLORS = { WASH: 'bg-blue-100 text-blue-700', FSL: 'bg-green-100 text-green-700', Protection: 'bg-red-100 text-red-700', Health: 'bg-pink-100 text-pink-700', Education: 'bg-purple-100 text-purple-700', Shelter: 'bg-orange-100 text-orange-700' };

export default function NeedsAssessmentPage() {
  const [assessments, setAssessments] = useState([]);
  const [templates, setTemplates] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedSector, setSelectedSector] = useState('');
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const [form, setForm] = useState({ title: '', sector: '', governorate: '', district: '', assessment_date: '', methodology: '', findings: '', priorities: '', recommendations: '', sample_size: '', households_surveyed: '' });

  const load = () => {
    api.get('/needs-assessment/').then(r => setAssessments(r.data));
    api.get('/needs-assessment/templates').then(r => setTemplates(r.data));
  };
  useEffect(load, []);

  const submit = async () => {
    const payload = { ...form, sample_size: form.sample_size ? parseInt(form.sample_size) : null, households_surveyed: form.households_surveyed ? parseInt(form.households_surveyed) : null };
    await api.post('/needs-assessment/', payload);
    setShowModal(false);
    setForm({ title: '', sector: '', governorate: '', district: '', assessment_date: '', methodology: '', findings: '', priorities: '', recommendations: '', sample_size: '', households_surveyed: '' });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">تقييم الاحتياجات</h1>
          <p className="text-sm text-gray-500 mt-1">قوالب تقييم جاهزة حسب القطاع مع التوثيق</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">
          <Plus size={18} /> تقييم جديد
        </button>
      </div>

      {/* Sector Templates */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-3">قوالب القطاعات</h2>
        <div className="grid grid-cols-3 gap-3">
          {SECTORS.map(s => (
            <div key={s} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => setExpandedTemplate(expandedTemplate === s ? null : s)} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${SECTOR_COLORS[s]}`}>{s}</span>
                  <span className="font-medium text-gray-800">{SECTOR_NAMES[s]}</span>
                </div>
                {expandedTemplate === s ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expandedTemplate === s && templates[s] && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="mt-3 mb-2">
                    <p className="text-xs font-bold text-gray-500 mb-1">المؤشرات:</p>
                    <div className="flex flex-wrap gap-1">
                      {templates[s].indicators.map((ind, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ind}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1">أسئلة نموذجية:</p>
                    <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                      {templates[s].questions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                  <button onClick={() => { setForm({ ...form, sector: s, title: `تقييم احتياجات - ${SECTOR_NAMES[s]}` }); setShowModal(true); }} className="mt-3 w-full py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition">
                    استخدام هذا القالب
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Assessments List */}
      <h2 className="text-lg font-bold text-gray-700 mb-3">التقييمات المسجلة</h2>
      <div className="space-y-3">
        {assessments.map(a => (
          <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${SECTOR_COLORS[a.sector] || 'bg-gray-100'}`}>{a.sector}</span>
                <h3 className="font-bold text-gray-800">{a.title}</h3>
              </div>
              {a.assessment_date && <span className="text-xs text-gray-400">{a.assessment_date}</span>}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
              {a.governorate && <div><span className="text-gray-500">المحافظة:</span> {a.governorate}</div>}
              {a.sample_size && <div><span className="text-gray-500">حجم العينة:</span> {a.sample_size}</div>}
              {a.households_surveyed && <div><span className="text-gray-500">الأسر المسحوبة:</span> {a.households_surveyed}</div>}
            </div>
            {a.findings && <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm"><strong>النتائج:</strong> {a.findings}</div>}
            {a.priorities && <div className="mt-2 bg-yellow-50 rounded-lg p-3 text-sm"><strong>الأولويات:</strong> {a.priorities}</div>}
          </div>
        ))}
        {assessments.length === 0 && <div className="text-center py-12 text-gray-400">لا توجد تقييمات</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">تقييم احتياجات جديد</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="عنوان التقييم *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-purple-500" />
              <select value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200">
                <option value="">القطاع *</option>
                {SECTORS.map(s => <option key={s} value={s}>{SECTOR_NAMES[s]} ({s})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="المحافظة" value={form.governorate} onChange={e => setForm({ ...form, governorate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" />
                <input placeholder="المديرية" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" />
              </div>
              <input type="date" value={form.assessment_date} onChange={e => setForm({ ...form, assessment_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
              <textarea placeholder="المنهجية" value={form.methodology} onChange={e => setForm({ ...form, methodology: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" rows={2} />
              <textarea placeholder="النتائج" value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" rows={2} />
              <textarea placeholder="الأولويات" value={form.priorities} onChange={e => setForm({ ...form, priorities: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" rows={2} />
              <textarea placeholder="التوصيات" value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="حجم العينة" value={form.sample_size} onChange={e => setForm({ ...form, sample_size: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" />
                <input type="number" placeholder="الأسر المسحوبة" value={form.households_surveyed} onChange={e => setForm({ ...form, households_surveyed: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" />
              </div>
              <button onClick={submit} disabled={!form.title || !form.sector} className="w-full py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:opacity-50">حفظ التقييم</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
