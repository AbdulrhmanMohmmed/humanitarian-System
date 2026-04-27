import { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, Plus, X, CheckCircle } from 'lucide-react';

const CHS_LABELS = {
  chs1: 'الاستجابة المناسبة وذات الصلة',
  chs2: 'الفعالية وحسن التوقيت',
  chs3: 'تعزيز القدرات المحلية',
  chs4: 'التواصل والمشاركة والشفافية',
  chs5: 'معالجة الشكاوى والملاحظات',
  chs6: 'التنسيق والتكامل',
  chs7: 'التعلم والتحسين المستمر',
  chs8: 'الموظفون الأكفاء والمُدارون بشكل جيد',
  chs9: 'إدارة الموارد بمسؤولية',
};

const INCIDENT_TYPES = ['تحرش', 'استغلال', 'إساءة', 'إهمال', 'تمييز', 'أخرى'];
const STATUS_LABELS = { reported: 'تم الإبلاغ', investigating: 'قيد التحقيق', resolved: 'تم الحل', closed: 'مغلق' };
const STATUS_COLORS = { reported: 'bg-red-100 text-red-700', investigating: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-600' };

export default function Safeguarding() {
  const [tab, setTab] = useState('safeguarding');
  const [reports, setReports] = useState([]);
  const [chsSummary, setChsSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCHSModal, setShowCHSModal] = useState(false);
  const [form, setForm] = useState({ incident_type: '', description: '', incident_date: '', location: '' });
  const [chsForm, setChsForm] = useState({ commitment: 'chs1', score: 0, evidence: '', gaps: '', action_plan: '' });

  const load = () => {
    api.get('/safeguarding/reports').then(r => setReports(r.data));
    api.get('/safeguarding/chs/summary').then(r => setChsSummary(r.data));
  };
  useEffect(load, []);

  const submitReport = async () => {
    await api.post('/safeguarding/reports', form);
    setShowModal(false);
    setForm({ incident_type: '', description: '', incident_date: '', location: '' });
    load();
  };

  const submitCHS = async () => {
    await api.post('/safeguarding/chs', chsForm);
    setShowCHSModal(false);
    setChsForm({ commitment: 'chs1', score: 0, evidence: '', gaps: '', action_plan: '' });
    load();
  };

  const scoreColor = s => s >= 4 ? 'text-green-600' : s >= 3 ? 'text-yellow-600' : 'text-red-600';
  const scoreBg = s => s >= 4 ? 'bg-green-500' : s >= 3 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الحماية والامتثال</h1>
          <p className="text-sm text-gray-500 mt-1">الإبلاغ عن الحماية وتقييم الامتثال لـ CHS</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('safeguarding')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'safeguarding' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          بلاغات الحماية
        </button>
        <button onClick={() => setTab('chs')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'chs' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          الامتثال لـ CHS
        </button>
      </div>

      {tab === 'safeguarding' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition">
              <Plus size={18} /> إبلاغ جديد
            </button>
          </div>
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{r.reference_number}</span>
                    <span className="font-bold text-gray-800">{r.incident_type}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-gray-100'}`}>{STATUS_LABELS[r.status] || r.status}</span>
                </div>
                <p className="text-sm text-gray-600">{r.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  {r.incident_date && <span>التاريخ: {r.incident_date}</span>}
                  {r.location && <span>الموقع: {r.location}</span>}
                </div>
              </div>
            ))}
            {reports.length === 0 && <div className="text-center py-12 text-gray-400">لا توجد بلاغات</div>}
          </div>
        </>
      )}

      {tab === 'chs' && chsSummary && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-sm text-indigo-600">متوسط الالتزام</p>
              <p className="text-3xl font-bold text-indigo-700">{chsSummary.average_score}/5</p>
            </div>
            <button onClick={() => setShowCHSModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
              <Plus size={18} /> تقييم جديد
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(CHS_LABELS).map(([key, label]) => {
              const c = chsSummary.commitments?.find(c => c.commitment === key);
              return (
                <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{key.toUpperCase()}</span>
                      <h4 className="font-medium text-gray-800">{label}</h4>
                    </div>
                    {c ? (
                      <span className={`text-lg font-bold ${scoreColor(c.score)}`}>{c.score}/5</span>
                    ) : (
                      <span className="text-sm text-gray-400">لم يُقيّم</span>
                    )}
                  </div>
                  {c && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${scoreBg(c.score)}`} style={{ width: `${c.score * 20}%` }}></div>
                    </div>
                  )}
                  {c?.gaps && <p className="text-xs text-red-500 mt-2">الفجوات: {c.gaps}</p>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">إبلاغ عن حادثة</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <select value={form.incident_type} onChange={e => setForm({ ...form, incident_type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200">
                <option value="">نوع الحادثة *</option>
                {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea placeholder="وصف الحادثة *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" rows={3} />
              <input type="date" value={form.incident_date} onChange={e => setForm({ ...form, incident_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
              <input placeholder="الموقع" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" />
              <div className="bg-red-50 rounded-lg p-3 text-sm text-red-600">هذا البلاغ سري ولن يظهر إلا للمسؤولين المعتمدين</div>
              <button onClick={submitReport} disabled={!form.incident_type || !form.description} className="w-full py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:opacity-50">إرسال البلاغ</button>
            </div>
          </div>
        </div>
      )}

      {showCHSModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCHSModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">تقييم CHS</h3>
              <button onClick={() => setShowCHSModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <select value={chsForm.commitment} onChange={e => setChsForm({ ...chsForm, commitment: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200">
                {Object.entries(CHS_LABELS).map(([k, v]) => <option key={k} value={k}>{k.toUpperCase()} - {v}</option>)}
              </select>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">التقييم (0-5)</label>
                <input type="range" min="0" max="5" value={chsForm.score} onChange={e => setChsForm({ ...chsForm, score: parseInt(e.target.value) })} className="w-full" />
                <p className="text-center font-bold text-lg">{chsForm.score}/5</p>
              </div>
              <textarea placeholder="الأدلة" value={chsForm.evidence} onChange={e => setChsForm({ ...chsForm, evidence: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" rows={2} />
              <textarea placeholder="الفجوات" value={chsForm.gaps} onChange={e => setChsForm({ ...chsForm, gaps: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" rows={2} />
              <textarea placeholder="خطة العمل" value={chsForm.action_plan} onChange={e => setChsForm({ ...chsForm, action_plan: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" rows={2} />
              <button onClick={submitCHS} className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">حفظ التقييم</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
