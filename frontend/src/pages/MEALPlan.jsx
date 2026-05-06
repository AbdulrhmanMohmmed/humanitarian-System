import { useState, useEffect } from 'react';
import api from '../services/api';
import { ClipboardCheck, Plus, X, Eye, Pencil, Trash2, CheckCircle2 } from 'lucide-react';

const STATUS_LABELS = { draft: 'مسودة', active: 'نشطة', completed: 'مكتملة' };
const STATUS_COLORS = { draft: 'bg-gray-100 text-gray-600', active: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700' };

export default function MEALPlan() {
  const [plans, setPlans] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewPlan, setViewPlan] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState({
    project_id: '', title: '', monitoring_approach: '', evaluation_plan: '',
    accountability_mechanisms: '', learning_strategy: '', data_collection_methods: '',
    reporting_schedule: '', resources_needed: '', indicators_summary: '', start_date: '', end_date: '',
  });

  const load = () => {
    api.get('/meal-plan/').then(r => setPlans(r.data));
    api.get('/projects/').then(r => setProjects(r.data));
  };
  useEffect(load, []);

  const submit = async () => {
    const payload = { ...form, project_id: parseInt(form.project_id) };
    if (editingPlan) {
      await api.put(`/meal-plan/${editingPlan.id}`, payload);
    } else {
      await api.post('/meal-plan/', payload);
    }
    setShowModal(false);
    setEditingPlan(null);
    setForm({ project_id: '', title: '', monitoring_approach: '', evaluation_plan: '', accountability_mechanisms: '', learning_strategy: '', data_collection_methods: '', reporting_schedule: '', resources_needed: '', indicators_summary: '', start_date: '', end_date: '' });
    load();
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      project_id: String(plan.project_id || ''),
      title: plan.title || '',
      monitoring_approach: plan.monitoring_approach || '',
      evaluation_plan: plan.evaluation_plan || '',
      accountability_mechanisms: plan.accountability_mechanisms || '',
      learning_strategy: plan.learning_strategy || '',
      data_collection_methods: plan.data_collection_methods || '',
      reporting_schedule: plan.reporting_schedule || '',
      resources_needed: plan.resources_needed || '',
      indicators_summary: plan.indicators_summary || '',
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
    });
    setShowModal(true);
  };

  const updateStatus = async (plan, status) => {
    await api.put(`/meal-plan/${plan.id}/status`, null, { params: { status } });
    load();
  };

  const deletePlan = async (plan) => {
    if (!confirm(`سيتم حذف خطة MEAL: ${plan.title}. هل أنت متأكد؟`)) return;
    await api.delete(`/meal-plan/${plan.id}`);
    load();
  };

  const sections = [
    { key: 'monitoring_approach', label: 'نهج المتابعة', icon: '📊' },
    { key: 'evaluation_plan', label: 'خطة التقييم', icon: '📋' },
    { key: 'accountability_mechanisms', label: 'آليات المساءلة', icon: '🤝' },
    { key: 'learning_strategy', label: 'استراتيجية التعلم', icon: '💡' },
    { key: 'data_collection_methods', label: 'طرق جمع البيانات', icon: '📝' },
    { key: 'reporting_schedule', label: 'جدول التقارير', icon: '📅' },
    { key: 'resources_needed', label: 'الموارد المطلوبة', icon: '💰' },
    { key: 'indicators_summary', label: 'ملخص المؤشرات', icon: '🎯' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">خطة المتابعة والتقييم والمساءلة والتعلم</h1>
          <p className="text-sm text-gray-500 mt-1">إعداد وإدارة خطط MEAL للمشاريع</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
          <Plus size={18} /> إنشاء خطة
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">{plan.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[plan.status] || ''}`}>{STATUS_LABELS[plan.status]}</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">المشروع: {projects.find(p => p.id === plan.project_id)?.name || plan.project_id}</p>
            {plan.start_date && <p className="text-xs text-gray-400 mb-3">{plan.start_date} - {plan.end_date || '...'}</p>}
            <div className="flex gap-2">
              <button onClick={() => setViewPlan(plan)} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800">
                <Eye size={16} /> عرض التفاصيل
              </button>
              <button onClick={() => openEdit(plan)} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
                <Pencil size={16} /> تعديل
              </button>
              {plan.status !== 'active' && <button onClick={() => updateStatus(plan, 'active')} className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800"><CheckCircle2 size={16} /> تفعيل</button>}
              <button onClick={() => deletePlan(plan)} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800">
                <Trash2 size={16} /> حذف
              </button>
            </div>
          </div>
        ))}
        {plans.length === 0 && <div className="col-span-2 text-center py-12 text-gray-400">لا توجد خطط MEAL بعد</div>}
      </div>

      {viewPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setViewPlan(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{viewPlan.title}</h3>
              <button onClick={() => setViewPlan(null)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {sections.map(s => viewPlan[s.key] && (
                <div key={s.key} className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-bold text-gray-700 mb-2">{s.icon} {s.label}</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{viewPlan[s.key]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingPlan ? 'تعديل خطة MEAL' : 'إنشاء خطة MEAL'}</h3>
              <button onClick={() => { setShowModal(false); setEditingPlan(null); }}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="عنوان الخطة *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" />
              <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200">
                <option value="">اختر المشروع *</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" placeholder="تاريخ البداية" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                <input type="date" placeholder="تاريخ النهاية" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
              </div>
              {sections.map(s => (
                <div key={s.key}>
                  <label className="text-sm text-gray-600 mb-1 block">{s.icon} {s.label}</label>
                  <textarea value={form[s.key]} onChange={e => setForm({ ...form, [s.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none" rows={2} />
                </div>
              ))}
              <button onClick={submit} disabled={!form.title || !form.project_id} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50">حفظ الخطة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
