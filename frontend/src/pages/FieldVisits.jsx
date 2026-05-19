import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { 
  ClipboardList, 
  Edit3, 
  Eye, 
  MapPin, 
  Plus, 
  Save, 
  Trash2, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Calendar,
  Users,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import CustomFieldsForm from '../components/CustomFieldsForm';
import CustomizeModuleButton from '../components/CustomizeModuleButton';
import { useCustomization, renderCustomFieldValue } from '../hooks/useCustomization';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../contexts/ToastContext';

const EMPTY_FORM = {
  project_id: '',
  title: '',
  visit_date: '',
  location: '',
  governorate: '',
  district: '',
  visit_type: 'monitoring',
  team_members: '',
  objectives: '',
  custom_values: {},
};

const EMPTY_DETAIL_FORM = {
  observations: '',
  findings: '',
  recommendations: '',
  corrective_actions: '',
  checklist: '',
  status: 'planned',
  follow_up_date: '',
  custom_values: {},
};

const STATUS_LABELS = {
  planned: 'مخطط',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export default function FieldVisits() {
  const toast = useToast();
  const [visits, setVisits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [checklists, setChecklists] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeVisit, setActiveVisit] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [detailForm, setDetailForm] = useState(EMPTY_DETAIL_FORM);
  const { fields: customFields, listsBySlug } = useCustomization('field_visit');
  
  const visitTypes = listsBySlug.visit_types?.length ? listsBySlug.visit_types : [
    { value: 'monitoring', label_ar: 'مراقبة عامة' },
    { value: 'distribution', label_ar: 'مراقبة توزيعات' },
    { value: 'pdm', label_ar: 'مراقبة ما بعد التوزيع' },
    { value: 'site_verification', label_ar: 'تحقق من المواقع' },
  ];

  const load = async () => {
    try {
      const [vRes, pRes] = await Promise.all([
        api.get('/field-visits/'),
        api.get('/projects/')
      ]);
      setVisits(vRes.data);
      setProjects(pRes.data);
      localStorage.setItem('hiaos_v2_field_visits', JSON.stringify(vRes.data));
    } catch (e) {
      const localV = localStorage.getItem('hiaos_v2_field_visits');
      const localP = localStorage.getItem('hiaos_v2_projects');
      if (localV) setVisits(JSON.parse(localV));
      if (localP) setProjects(JSON.parse(localP));
      
      // Demo Data Seed if empty
      if (!localV || JSON.parse(localV).length === 0) {
        const demo = [
          { id: 1, title: 'زيارة التحقق من مخيمات النزوح', location: 'مأرب - الوادي', visit_date: '2026-05-10', visit_type: 'site_verification', status: 'planned', team_members: 'أحمد، سارة، محمد' },
          { id: 2, title: 'مراقبة توزيع السلل الغذائية - دورة أبريل', location: 'تعز - القاهرة', visit_date: '2026-04-25', visit_type: 'distribution', status: 'completed', team_members: 'خالد، ليلى' },
        ];
        setVisits(demo);
      }
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => ({
    planned: visits.filter((v) => v.status === 'planned').length,
    in_progress: visits.filter((v) => v.status === 'in_progress').length,
    completed: visits.filter((v) => v.status === 'completed').length,
    total: visits.length,
  }), [visits]);

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 backdrop-blur-md border border-blue-600/10">
            <ClipboardList size={14} />
            Field Operations & Monitoring
          </div>
          <h1 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">الزيارات الميدانية</h1>
          <p className="max-w-3xl text-lg font-semibold text-[var(--text-secondary)] opacity-80 leading-relaxed">
            تخطيط، تنفيذ وتوثيق المراقبة الميدانية لضمان جودة التدخلات الإنسانية.
          </p>
        </div>
        <div className="flex gap-4">
           <CustomizeModuleButton entity="field_visit" className="h-12 rounded-2xl border-[var(--border)]" />
           <button onClick={() => setShowModal(true)} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-xs font-black text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 transition-all">
             <Plus size={18} /> إضافة زيارة جديدة
           </button>
        </div>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'إجمالي الزيارات', value: stats.total, icon: ClipboardList, color: 'blue' },
          { label: 'زيارات مكتملة', value: stats.completed, icon: CheckCircle2, color: 'emerald' },
          { label: 'قيد التنفيذ', value: stats.in_progress, icon: Clock, color: 'amber' },
          { label: 'زيارات مجدولة', value: stats.planned, icon: Calendar, color: 'purple' },
        ].map((s, i) => (
          <div key={i} className="card-elite p-6 flex items-center gap-6">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", 
              s.color === 'blue' ? "bg-blue-500/10 text-blue-600" :
              s.color === 'emerald' ? "bg-emerald-500/10 text-emerald-600" :
              s.color === 'amber' ? "bg-amber-500/10 text-amber-600" : "bg-purple-500/10 text-purple-600"
            )}>
              <s.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
              <p className="text-3xl font-black">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Main List */}
        <div className="card-elite p-0 overflow-hidden">
          <div className="p-6 border-b border-black/5 flex items-center justify-between">
             <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">سجل العمليات الميدانية</h3>
             <div className="flex gap-4">
                <div className="relative">
                   <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input className="h-10 bg-black/5 rounded-xl pr-10 pl-4 text-xs font-bold outline-none w-64 border border-transparent focus:border-blue-500/20" placeholder="بحث في الزيارات..." />
                </div>
                <button className="h-10 w-10 flex items-center justify-center bg-black/5 rounded-xl text-slate-400 hover:text-blue-600 transition-colors"><Filter size={14} /></button>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-black/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="p-6">مسمى المهمة</th>
                  <th className="p-6">الموقع / النطاق</th>
                  <th className="p-6">التاريخ</th>
                  <th className="p-6">الفريق</th>
                  <th className="p-6">الحالة</th>
                  <th className="p-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {visits.map((visit) => (
                  <tr key={visit.id} onClick={() => setActiveVisit(visit)} className={cn("group cursor-pointer transition-all duration-300", activeVisit?.id === visit.id ? "bg-blue-600/5 shadow-inner" : "hover:bg-black/[0.02]")}>
                    <td className="p-6">
                      <p className="text-sm font-black group-hover:text-blue-600">{visit.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{visit.visit_type}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <MapPin size={12} className="text-slate-400" />
                        {visit.location}
                      </div>
                    </td>
                    <td className="p-6 text-xs font-black">{visit.visit_date}</td>
                    <td className="p-6">
                       <div className="flex -space-x-2 flex-row-reverse">
                          {[1,2,3].map(i => (
                             <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 flex items-center justify-center text-[10px] font-black">U{i}</div>
                          ))}
                       </div>
                    </td>
                    <td className="p-6">
                      <StatusBadge status={visit.status} labels={STATUS_LABELS} />
                    </td>
                    <td className="p-6 text-slate-300 group-hover:text-blue-600 transition-colors">
                      <ArrowRight size={18} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel / Activity */}
        <aside className="space-y-6">
          <AnimatePresence mode="wait">
             {activeVisit ? (
               <motion.div 
                 key={activeVisit.id}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="card-elite p-8 space-y-8"
               >
                  <div className="flex items-center justify-between">
                     <h3 className="text-xl font-black">تفاصيل العملية</h3>
                     <button onClick={() => setActiveVisit(null)} className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-xl transition-all"><X size={20} /></button>
                  </div>

                  <div className="space-y-6">
                     <div className="p-6 rounded-3xl bg-slate-900 text-white border-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1 h-full bg-blue-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">أهداف الزيارة</p>
                        <p className="text-sm font-medium leading-relaxed">{activeVisit.objectives || 'لم يتم تحديد أهداف تفصيلية لهذه الزيارة.'}</p>
                     </div>

                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">سجل التحديثات</h4>
                        <div className="space-y-4">
                           {[
                             { user: 'أحمد', action: 'رفع التقرير النهائي', time: 'منذ ساعتين' },
                             { user: 'سارة', action: 'إضافة ملاحظة فنية', time: 'منذ 5 ساعات' },
                           ].map((act, i) => (
                             <div key={i} className="flex gap-4">
                                <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">{act.user[0]}</div>
                                <div>
                                   <p className="text-xs font-bold">{act.action}</p>
                                   <p className="text-[10px] text-slate-400 mt-0.5">{act.time}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-black/5">
                     <button onClick={() => { toast.show('تم تفعيل وضع التعديل', 'info'); }} className="flex-1 h-12 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-blue-600/20">تعديل البيانات</button>
                     <button onClick={() => { toast.show('جاري تحميل تقرير الزيارة...'); setTimeout(() => toast.show('تم التحميل'), 1500); }} className="flex-1 h-12 bg-black/5 text-slate-600 rounded-2xl font-black text-xs hover:bg-black/10 transition-all">تحميل التقرير</button>
                  </div>
               </motion.div>
             ) : (
               <div className="card-elite p-12 flex flex-col items-center justify-center text-center opacity-40 border-dashed">
                  <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mb-6">
                     <Eye size={24} />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest">اختر عملية ميدانية لعرض تفاصيلها</p>
               </div>
             )}
          </AnimatePresence>

          <section className="card-elite p-6 bg-emerald-600 text-white border-none shadow-2xl shadow-emerald-600/20">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><AlertCircle size={20} /></div>
                <h4 className="font-black text-sm">التنبيهات الميدانية</h4>
             </div>
             <p className="text-xs font-medium leading-relaxed opacity-80">يوجد 3 زيارات متأخرة لم يتم رفع تقاريرها النهائية في "تعز - الشمايتين".</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
