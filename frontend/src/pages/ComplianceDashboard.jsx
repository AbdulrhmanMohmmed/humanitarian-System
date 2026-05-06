import { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, Plus, CheckCircle, AlertTriangle, XCircle, FileCheck } from 'lucide-react';

const AREA_LABELS = { chs: 'CHS', aap: 'AAP', psea: 'PSEA', do_no_harm: 'عدم الإضرار', data_protection: 'حماية البيانات', safeguarding: 'الحماية', donor_compliance: 'امتثال المانحين' };
const STATUS_COLORS = { compliant: 'bg-green-100 text-green-700', partially_compliant: 'bg-yellow-100 text-yellow-700', non_compliant: 'bg-red-100 text-red-700', not_assessed: 'bg-gray-100 text-gray-500' };
const STATUS_LABELS = { compliant: 'ملتزم', partially_compliant: 'التزام جزئي', non_compliant: 'غير ملتزم', not_assessed: 'لم يُقيّم' };

export default function ComplianceDashboard() {
  const [standards, setStandards] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ project_id: '', area: 'chs', standard_code: '', score: 0, status: 'not_assessed', evidence: '', gaps: '' });

  useEffect(() => {
    api.get('/compliance/standards').then(r => setStandards(Object.entries(r.data).map(([k, v]) => ({ area: k, standards: v.requirements || [], name: v.name }))));
    api.get('/projects/').then(r => setProjects(r.data));
    api.get('/compliance/').then(r => setAssessments(r.data));
  }, []);

  useEffect(() => {
    if (selectedProject) api.get(`/compliance/dashboard/${selectedProject}`).then(r => setDashboard(r.data));
  }, [selectedProject]);

  const submit = async () => {
    await api.post('/compliance/assess', null, { params: form });
    setShowModal(false);
    api.get('/compliance/').then(r => setAssessments(r.data));
    if (selectedProject) api.get(`/compliance/dashboard/${selectedProject}`).then(r => setDashboard(r.data));
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Shield className="text-emerald-600" size={32} />
            متتبع الامتثال التلقائي (CHS Auto-Tracker)
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">نظام آلي لتتبع معايير الجودة (CHS, AAP, PSEA) وتجهيز أدلة التدقيق (Audit Readiness).</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition shadow-lg font-bold text-sm">
            <FileCheck size={18} /> توليد تقرير الجاهزية للتدقيق
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 font-bold text-sm">
            <Plus size={18} /> تقييم جديد
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 mb-6 border border-slate-200/60 flex items-center gap-3">
        <span className="text-sm font-bold text-slate-700">تصفية حسب المشروع:</span>
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="border-none bg-slate-100 rounded-lg px-4 py-2 w-64 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">جميع المشاريع</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {Object.entries(dashboard.areas || {}).map(([area, data]) => (
            <div key={area} className={`glass-card rounded-2xl p-6 relative overflow-hidden group border-t-4 ${data.overall_status === 'compliant' ? 'border-t-emerald-500' : data.overall_status === 'non_compliant' ? 'border-t-rose-500' : 'border-t-amber-500'}`}>
              <h3 className="font-bold text-slate-700 mb-2">{AREA_LABELS[area] || area}</h3>
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-black ${data.overall_status === 'compliant' ? 'text-emerald-600' : data.overall_status === 'non_compliant' ? 'text-rose-600' : 'text-amber-600'}`}>
                  {data.avg_score?.toFixed(0) || 0}%
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[data.overall_status] || ''}`}>{STATUS_LABELS[data.overall_status] || data.overall_status}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                التغطية: {data.assessed} من {data.total} معيار مقيم
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-6">
        {standards.map(area => (
          <div key={area.area} className="bg-white rounded-xl border p-4">
            <h3 className="font-bold mb-3">{AREA_LABELS[area.area] || area.area} <span className="text-xs text-gray-400">({area.standards.length} معايير)</span></h3>
            <div className="space-y-2">
              {area.standards.map(s => (
                <div key={s.code} className="flex items-start gap-2 text-sm p-2 rounded hover:bg-gray-50">
                  <CheckCircle size={14} className="mt-1 text-gray-300" />
                  <div>
                    <span className="font-mono text-xs text-gray-400">{s.code}</span>
                    <p>{s.requirement || s.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <h3 className="px-4 py-3 font-bold bg-gray-50">التقييمات الأخيرة</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-right">المجال</th>
              <th className="px-4 py-2 text-right">المعيار</th>
              <th className="px-4 py-2 text-right">النتيجة</th>
              <th className="px-4 py-2 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {assessments.slice(0, 20).map(a => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-2">{AREA_LABELS[a.area] || a.area}</td>
                <td className="px-4 py-2 font-mono text-xs">{a.standard_code}</td>
                <td className="px-4 py-2 font-bold">{a.score}%</td>
                <td className="px-4 py-2"><span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {assessments.length === 0 && <p className="text-center py-6 text-gray-400">لا توجد تقييمات بعد</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">تقييم امتثال جديد</h2>
            <div className="space-y-3">
              <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="w-full border rounded-lg p-2">
                <option value="">اختر المشروع</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="w-full border rounded-lg p-2">
                {Object.entries(AREA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="text" placeholder="كود المعيار (مثل CHS-1)" value={form.standard_code} onChange={e => setForm({...form, standard_code: e.target.value})} className="w-full border rounded-lg p-2" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="النتيجة (0-100)" value={form.score} onChange={e => setForm({...form, score: e.target.value})} min={0} max={100} className="border rounded-lg p-2" />
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="border rounded-lg p-2">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <textarea placeholder="الأدلة" value={form.evidence} onChange={e => setForm({...form, evidence: e.target.value})} className="w-full border rounded-lg p-2" rows={2} />
              <textarea placeholder="الفجوات" value={form.gaps} onChange={e => setForm({...form, gaps: e.target.value})} className="w-full border rounded-lg p-2" rows={2} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={submit} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
