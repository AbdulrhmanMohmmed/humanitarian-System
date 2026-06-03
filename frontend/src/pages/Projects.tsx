import { useState, useEffect, type FormEvent } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import EntityTimeline from '../components/EntityTimeline';
import { Plus, FolderKanban, DollarSign, Target, Briefcase, LayoutGrid, Activity as ActivityIcon, ArrowLeft, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import CustomFieldsForm from '../components/CustomFieldsForm';
import CustomizeModuleButton from '../components/CustomizeModuleButton';
import { renderCustomFieldValue, useCustomization } from '../hooks/useCustomization';
import CollaborationThread from '../components/CollaborationThread';
import { useToast } from '../contexts/ToastContext';

interface ProjectForm {
  code: string;
  name: string;
  sector: string;
  description: string;
  budget: number;
  target_beneficiaries: number;
  governorate: string;
  donor: string;
  start_date: string;
  end_date: string;
  custom_values: Record<string, unknown>;
}

interface Project extends ProjectForm {
  id: number | string;
  status?: string;
  spent?: number;
  progress?: number;
  health?: string;
}

interface ProjectStats {
  total: number;
  active: number;
  total_budget: number;
  total_spent: number;
}

interface ActivityItem {
  id: number | string;
  name?: string;
  status?: string;
  progress?: number;
  project_id?: number | string;
}

export default function Projects() {
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'list' | 'details'>('list');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [form, setForm] = useState<ProjectForm>({ code: '', name: '', sector: '', description: '', budget: 0, target_beneficiaries: 0, governorate: '', donor: '', start_date: '', end_date: '', custom_values: {} });
  const { fields: customFields, listsBySlug } = useCustomization('project');
  const sectorOptions = listsBySlug.sectors?.length ? listsBySlug.sectors : ["الصحة","التعليم","الأمن الغذائي","المياه والصرف الصحي","الحماية","المأوى"].map((value) => ({ value, label: value, label_ar: value }));

  const load = () => {
    api.get('/projects/').then(r => setData(r.data)).catch(() => {
      const local = localStorage.getItem('hiaos_data_projects');
      if (local) setData(JSON.parse(local));
    });
    
    // Load Activities for details/health calculation
    const localActs = localStorage.getItem('hiaos_data_activities');
    if (localActs) setActivities(JSON.parse(localActs));

    api.get('/projects/stats').then(r => setStats(r.data)).catch(() => {
      // Fallback stats
      setStats({
        total: 12,
        active: 8,
        total_budget: 2400000,
        total_spent: 850000
      });
    });
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/projects/', { ...form, budget: parseFloat(form.budget), target_beneficiaries: parseInt(form.target_beneficiaries) });
    setShowModal(false);
    setForm({ code: '', name: '', sector: '', description: '', budget: 0, target_beneficiaries: 0, governorate: '', donor: '', start_date: '', end_date: '', custom_values: {} });
    load();
  };

  const getProjectHealth = (p) => {
    if (!p) return { score: 0, color: 'slate' };
    const budgetUsed = (p.spent / p.budget) * 100;
    // Mock progress calculation based on activities if available
    const projectActs = activities.filter(a => a.project_id === p.id);
    const avgProgress = projectActs.length > 0 
      ? projectActs.reduce((acc, a) => acc + a.progress, 0) / projectActs.length 
      : 0;

    const health = 100 - Math.abs(avgProgress - budgetUsed);
    if (health > 85) return { score: health.toFixed(0), color: 'emerald', label: 'Healthy' };
    if (health > 60) return { score: health.toFixed(0), color: 'amber', label: 'Watch' };
    return { score: health.toFixed(0), color: 'rose', label: 'Critical' };
  };

  const openDetails = (project) => {
    setSelectedProject(project);
    setActiveTab('details');
  };

  const columns = [
    { key: 'code', label: 'الرمز', render: (v) => <span className="font-mono text-[10px] font-black opacity-40">{v}</span> },
    { key: 'name', label: 'اسم المشروع', render: (v, row) => (
      <div className="flex flex-col">
         <button onClick={() => openDetails(row)} className="text-[var(--text-primary)] hover:text-blue-600 font-black text-right transition-colors">{v}</button>
         <span className="text-[9px] font-bold text-slate-400 mt-0.5">{row.donor}</span>
      </div>
    )},
    { key: 'sector', label: 'القطاع', render: (v) => <span className="text-[10px] font-black uppercase tracking-widest bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg">{v}</span> },
    { key: 'health', label: 'الحالة الصحية', render: (_, row) => {
      const h = getProjectHealth(row);
      return (
        <div className="flex items-center gap-2">
           <div className={cn("w-2 h-2 rounded-full", h.color === 'emerald' ? 'bg-emerald-500' : h.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500')} />
           <span className={cn("text-[10px] font-black uppercase", h.color === 'emerald' ? 'text-emerald-600' : h.color === 'amber' ? 'text-amber-600' : 'text-rose-600')}>{h.label}</span>
        </div>
      );
    }},
    { key: 'status', label: 'المرحلة', render: (v) => <StatusBadge status={v} /> },
    { key: 'budget', label: 'التمويل', render: (v) => <span className="font-black text-xs text-emerald-600">${v?.toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
            <Briefcase size={14} />
            Strategic Portfolio Management
          </div>
          <div className="flex items-center gap-4">
             {activeTab === 'details' && (
               <button onClick={() => setActiveTab('list')} className="w-10 h-10 rounded-xl bg-black/5 hover:bg-black/10 transition-all flex items-center justify-center">
                  <ArrowLeft size={18} />
               </button>
             )}
             <h1 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">
                {activeTab === 'list' ? 'إدارة المشاريع' : selectedProject?.name}
             </h1>
          </div>
        </div>
        
        {activeTab === 'list' && (
          <div className="flex flex-wrap gap-4">
            <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-[var(--border)]">
               <button onClick={() => { toast.show('تم التبديل إلى عرض القائمة', 'info'); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">List View</button>
               <button onClick={() => navigate('/kanban')} className="px-4 py-2 text-slate-400 hover:text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Kanban</button>
            </div>
            <CustomizeModuleButton entity="project" className="h-12 rounded-2xl border-[var(--border)]" />
            <button 
              onClick={() => setShowModal(true)} 
              className="h-12 px-8 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-2xl shadow-blue-600/30 hover:scale-105 transition-all flex items-center gap-3"
            >
              <Plus size={20} /> إضافة مشروع جديد
            </button>
          </div>
        )}
      </header>

      {/* Modern Tabs */}
      <div className="flex gap-10 border-b border-[var(--border)]">
         {[
           { id: 'list', label: 'قائمة المشاريع', icon: FolderKanban },
           { id: 'details', label: 'تفاصيل التنفيذ', icon: ActivityIcon, hide: !selectedProject }
         ].map(t => !t.hide && (
           <button 
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "pb-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-3",
              activeTab === t.id ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            )}
           >
              <t.icon size={16} />
              {t.label}
              {activeTab === t.id && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
           </button>
         ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-10"
          >
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="إجمالي المشاريع" value={stats.total} icon={FolderKanban} color="blue" sub="جميع القطاعات" />
                <StatCard title="المشاريع النشطة" value={stats.active} icon={Target} color="green" sub="قيد التنفيذ حالياً" />
                <StatCard title="الميزانية الكلية" value={`$${(stats.total_budget / 1000000).toFixed(1)}M`} icon={DollarSign} color="orange" sub="قيمة العقود" />
                <StatCard title="إجمالي الإنفاق" value={`$${(stats.total_spent / 1000000).toFixed(1)}M`} icon={ActivityIcon} color="indigo" sub="المسحوب الفعلي" />
              </div>
            )}

            <div className="card-elite p-0 border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900/50">
               <DataTable 
                 title="Project Portfolio"
                 columns={columns} 
                 data={data} 
                 onDelete={async (id) => { if(confirm('حذف؟')){ await api.delete(`/projects/${id}`); load(); } }} 
                 onBulkDelete={async (ids) => { if(confirm('حذف الكل؟')){ await Promise.all(ids.map(id => api.delete(`/projects/${id}`))); load(); } }}
               />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            <div className="lg:col-span-2 space-y-10">
               {/* Progress & Health Bar */}
               <div className="card-elite p-8 space-y-6">
                  <div className="flex justify-between items-end">
                     <div>
                        <h3 className="font-black text-2xl tracking-tight">معدل الإنجاز مقابل الميزانية</h3>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Financial vs Operational Alignment</p>
                     </div>
                     <div className="text-right">
                        <span className="text-4xl font-black text-blue-600">{((selectedProject?.spent / selectedProject?.budget) * 100).toFixed(1)}%</span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spent</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="h-4 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden p-1 border border-black/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(selectedProject?.spent / selectedProject?.budget) * 100}%` }}
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        />
                     </div>
                     <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                        <span>الإنفاق المالي</span>
                        <span>إنجاز الأنشطة (75%)</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <EntityTimeline entityType="project" entityId={selectedProject?.id} />
                  <CollaborationThread entityId={selectedProject?.id} entityType="Project" />
               </div>
            </div>
            
            <div className="space-y-8">
               <div className="card-elite p-8 space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><Briefcase size={120} /></div>
                  <h3 className="font-black text-sm uppercase tracking-[0.2em] text-slate-400 border-b border-black/5 pb-4">معلومات المشروع</h3>
                  <div className="space-y-6 relative z-10">
                     {[
                        { label: 'القطاع الاستراتيجي', value: selectedProject?.sector, icon: LayoutGrid },
                        { label: 'المانح الرئيسي', value: selectedProject?.donor, icon: Target },
                        { label: 'الميزانية الإجمالية', value: `$${selectedProject?.budget?.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600' },
                        { label: 'تاريخ الإطلاق', value: selectedProject?.start_date, icon: FolderKanban },
                        { label: 'المستفيدين المستهدفين', value: selectedProject?.target_beneficiaries?.toLocaleString(), icon: Users },
                     ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between group/item">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center text-slate-400 group-hover/item:text-blue-600 transition-colors">
                                 <item.icon size={14} />
                              </div>
                              <span className="text-xs font-bold opacity-60">{item.label}</span>
                           </div>
                           <span className={cn("text-xs font-black", item.color)}>{item.value}</span>
                        </div>
                     ))}
                  </div>
                  <div className="pt-6 border-t border-black/5">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">وصف التدخل</h4>
                     <p className="text-xs font-medium leading-relaxed opacity-70">
                        {selectedProject?.description || 'لا يوجد وصف متاح لهذا المشروع حالياً.'}
                     </p>
                  </div>
               </div>

               <div className="card-elite p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <h3 className="font-black text-lg mb-4 relative z-10">المخاطر والإنذار المبكر</h3>
                  <p className="text-sm font-medium opacity-80 leading-relaxed mb-8 relative z-10">
                     هذا المشروع سجل ثباتاً في معدلات الصرف ولكن لوحظ تأخر في توريد المدخلات الميدانية.
                  </p>
                  <button onClick={() => { window.location.href='/risk'; toast.show('جاري فتح سجل المخاطر...'); }} className="w-full h-14 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs transition-all relative z-10 border border-white/10 backdrop-blur-md">
                     فتح سجل المخاطر
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="إضافة مشروع استراتيجي جديد">
        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">كود المشروع</label>
                 <input required className="w-full h-12 bg-black/5 rounded-xl px-4 text-sm font-black outline-none focus:ring-2 ring-blue-600/20 transition-all" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم المشروع</label>
                 <input required className="w-full h-12 bg-black/5 rounded-xl px-4 text-sm font-black outline-none focus:ring-2 ring-blue-600/20 transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">القطاع</label>
                 <select className="w-full h-12 bg-black/5 rounded-xl px-4 text-sm font-black outline-none appearance-none" value={form.sector} onChange={e => setForm({...form, sector: e.target.value})}>
                    <option value="">اختر القطاع</option>
                    {sectorOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label_ar || opt.label}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المانح</label>
                 <input className="w-full h-12 bg-black/5 rounded-xl px-4 text-sm font-black outline-none" value={form.donor} onChange={e => setForm({...form, donor: e.target.value})} />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الميزانية ($)</label>
                 <input type="number" className="w-full h-12 bg-black/5 rounded-xl px-4 text-sm font-black outline-none" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المستهدفين</label>
                 <input type="number" className="w-full h-12 bg-black/5 rounded-xl px-4 text-sm font-black outline-none" value={form.target_beneficiaries} onChange={e => setForm({...form, target_beneficiaries: e.target.value})} />
              </div>
           </div>

           <CustomFieldsForm entity="project" values={form.custom_values} onChange={cv => setForm({...form, custom_values: cv})} />

           <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest">إلغاء</button>
              <button type="submit" className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20">حفظ المشروع</button>
           </div>
        </form>
      </Modal>
    </div>
  );
}
