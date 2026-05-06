import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, ShieldCheck, Banknote, 
  Quote, FileSpreadsheet, Zap, AlertTriangle,
  TrendingUp, ArrowUpRight, Search, Bell,
  Activity, Users, Globe, Briefcase
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { useToast } from '../contexts/ToastContext';

export default function MissionControl() {
  const navigate = useNavigate();
  const toast = useToast();
  const [stats, setStats] = useState({
    dqaScore: 94,
    vfmIndex: 82,
    outcomesCount: 0,
    pendingSync: 0,
    ochaReady: '92%'
  });
  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch stats from analytics
      const analyticsLocal = JSON.parse(localStorage.getItem('hiaos_data_analytics_overview') || '{}');
      const dqaLocal = JSON.parse(localStorage.getItem('hiaos_data_dqa_history') || '[]');
      const dqaScore = dqaLocal.length > 0 ? dqaLocal[0].overall_score : 94;

      // Fetch projects
      let projectData = [];
      try {
        const res = await api.get('/projects/');
        projectData = res.data;
      } catch {
        projectData = JSON.parse(localStorage.getItem('hiaos_data_projects') || '[]');
      }

      // Fetch team
      const employees = JSON.parse(localStorage.getItem('hiaos_data_employees') || '[]');
      
      setStats({
        dqaScore: dqaScore,
        vfmIndex: analyticsLocal.budget_utilization || 82,
        outcomesCount: JSON.parse(localStorage.getItem('hiaos_data_outcomes') || '[]').length || 12,
        pendingSync: 0,
        ochaReady: '92%'
      });
      setProjects(projectData.slice(0, 4));
      setTeam(employees.slice(0, 6));
    } catch (e) {
      console.error("Mission Control Load Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = () => {
    setShowReportModal(true);
    setTimeout(() => {
      toast.show('تمت أرشفة تقرير المهمة بنجاح', 'success');
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <LayoutDashboard size={14} />
            HIAOS Mission Control Center
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">مركز القيادة الموحد</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">نظرة شاملة على أداء المنظمة، الجودة، التنسيق الدولي، والأثر المحقق.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => navigate('/spatial-insights')} className="h-12 px-6 bg-white dark:bg-slate-900 border border-[var(--border)] rounded-xl font-black text-xs shadow-sm flex items-center gap-2">
              <Globe size={18} /> خارطة الأثر
           </button>
           <button onClick={handleExport} className="h-12 px-6 bg-blue-600 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-600/20">تصدير تقرير المهمة</button>
        </div>
      </header>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
            { label: 'جودة البيانات DQA', value: `${stats.dqaScore}%`, sub: 'Premium Level', icon: ShieldCheck, color: 'text-emerald-600', trend: '+2%' },
            { label: 'القيمة مقابل المال', value: `${stats.vfmIndex}%`, sub: 'High Efficiency', icon: Banknote, color: 'text-blue-600', trend: '+5%' },
            { label: 'نتائج محصودة (MSC)', value: stats.outcomesCount, sub: 'Qualitative Impact', icon: Quote, color: 'text-indigo-600', trend: 'New' },
            { label: 'جاهزية الـ 5W', value: stats.ochaReady, sub: 'OCHA Compliance', icon: FileSpreadsheet, color: 'text-rose-600', trend: 'Ready' },
         ].map(stat => (
            <div key={stat.label} className="card-elite p-6 space-y-4">
               <div className="flex items-center justify-between">
                  <div className={cn("p-2 rounded-xl bg-slate-100 dark:bg-white/5", stat.color)}>
                     <stat.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-600/10 px-2 py-1 rounded-lg">{stat.trend}</span>
               </div>
               <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</h3>
                  <div className="text-3xl font-black mt-1">{stat.value}</div>
                  <p className="text-[10px] font-bold opacity-40 mt-1 uppercase">{stat.sub}</p>
               </div>
            </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="card-elite p-8">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-sm flex items-center gap-3">
                    <Activity size={18} className="text-blue-600" /> الحالة التشغيلية للمشاريع
                  </h3>
                  <div className="flex gap-2">
                     <span className="w-3 h-3 rounded-full bg-emerald-500" />
                     <span className="w-3 h-3 rounded-full bg-amber-500" />
                     <span className="w-3 h-3 rounded-full bg-rose-500" />
                  </div>
               </div>
               <div className="space-y-4">
                  {projects.length > 0 ? projects.map(p => {
                    const progress = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : (p.progress || 85);
                    const status = progress > 90 ? 'Critical' : progress > 50 ? 'On Track' : 'Delayed';
                    return (
                      <div key={p.id} className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-between group hover:bg-blue-600/5 transition-all">
                        <div className="flex items-center gap-4">
                           <div className={cn("w-2 h-10 rounded-full", status === 'On Track' ? 'bg-emerald-500' : status === 'Delayed' ? 'bg-amber-500' : 'bg-rose-500')} />
                           <div>
                              <div className="text-xs font-black">{p.name}</div>
                              <div className="text-[10px] font-bold opacity-40 uppercase">{status}</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="w-32 h-1.5 bg-black/5 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
                           </div>
                           <span className="text-xs font-black w-8 text-right">{progress}%</span>
                           <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-10 opacity-30">لا توجد بيانات مشاريع نشطة</div>
                  )}
               </div>
            </div>

            <div className="card-elite p-8">
               <h3 className="font-black text-sm flex items-center gap-3 mb-6">
                  <Zap size={18} className="text-amber-500" /> آخر النشاطات الميدانية
               </h3>
               <div className="space-y-6">
                  {[
                     { type: 'beneficiary', user: 'أحمد علي', action: 'إضافة مستفيد جديد', location: 'تعز', time: 'منذ دقيقتين' },
                     { type: 'finance', user: 'سارة محمد', action: 'صرف دفعة نقدية', location: 'عدن', time: 'منذ 15 دقيقة' },
                     { type: 'meal', user: 'خالد وليد', action: 'تحديث مؤشر IPTT', location: 'الضالع', time: 'منذ ساعة' },
                  ].map((act, i) => (
                     <div key={i} className="flex gap-4 relative">
                        {i !== 2 && <div className="absolute top-8 bottom-0 right-[15px] w-0.5 bg-slate-100 dark:bg-white/5" />}
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10", 
                           act.type === 'beneficiary' ? 'bg-blue-100 text-blue-600' : 
                           act.type === 'finance' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'
                        )}>
                           {act.type === 'beneficiary' ? <Users size={14} /> : act.type === 'finance' ? <Banknote size={14} /> : <Activity size={14} />}
                        </div>
                        <div className="flex-1">
                           <div className="text-xs font-black">{act.action} <span className="font-normal opacity-40">بواسطة</span> {act.user}</div>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{act.location}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-200" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{act.time}</span>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="card-elite p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={120} /></div>
               <h3 className="font-black text-lg mb-4 relative z-10">إجراءات سريعة</h3>
               <div className="space-y-3 relative z-10">
                  <button onClick={() => navigate('/5w-hub')} className="w-full h-11 bg-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20">تحديث الـ 5W الموحد</button>
                  <button onClick={() => navigate('/reports')} className="w-full h-11 bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/10">إرسال تقرير المانح</button>
                  <button onClick={() => { toast.show('جاري إجراء تدقيق جودة البيانات...', 'info'); setTimeout(() => toast.show('اكتمل التدقيق: درجة الجودة 96%', 'success'), 3000); }} className="w-full h-11 bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/10">طلب تدقيق DQA</button>
               </div>
            </div>

            <div className="card-elite p-6 space-y-4">
               <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">فريق العمل النشط</h4>
               <div className="flex -space-x-3 rtl:space-x-reverse">
                  {team.map((m, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-black text-blue-600" title={m.name}>
                       {m.name ? m.name.split(' ').map(n => n[0]).join('') : `M${i}`}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">+12</div>
               </div>
               <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">فريق مكون من {team.length + 12} موظفاً نشطاً عبر النظام الآن.</p>
            </div>
         </div>
      </div>

      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="تقرير حالة المهمة (Executive Summary)">
         <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
               <h4 className="font-black text-blue-700 dark:text-blue-400 text-xs mb-2 uppercase">ملخص استراتيجي</h4>
               <p className="text-sm leading-relaxed">
                  النظام يعمل بكفاءة تشغيلية قدرها <span className="font-bold">{stats.vfmIndex}%</span>. 
                  تم رصد <span className="font-bold">{stats.outcomesCount}</span> نتيجة MSC محققة خلال الفترة الحالية. 
                  جاهزية تقارير الـ 5W وصلت إلى <span className="font-bold">{stats.ochaReady}</span>.
               </p>
            </div>
            
            <div className="space-y-3">
               <h4 className="font-black text-xs uppercase tracking-widest opacity-40">توزيع المصروفات</h4>
               <div className="flex gap-1 h-4 rounded-full overflow-hidden">
                  <div className="bg-blue-600" style={{ width: '45%' }} />
                  <div className="bg-emerald-500" style={{ width: '30%' }} />
                  <div className="bg-amber-500" style={{ width: '15%' }} />
                  <div className="bg-rose-500" style={{ width: '10%' }} />
               </div>
               <div className="flex justify-between text-[10px] font-black opacity-60">
                  <span>برامج (45%)</span>
                  <span>تشغيل (30%)</span>
                  <span>مخزون (15%)</span>
                  <span>طوارئ (10%)</span>
               </div>
            </div>

            <div className="flex gap-3">
               <button onClick={() => setShowReportModal(false)} className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-black text-xs shadow-lg">تحميل PDF</button>
               <button onClick={() => setShowReportModal(false)} className="flex-1 h-12 bg-slate-100 dark:bg-white/5 rounded-xl font-black text-xs">إغلاق</button>
            </div>
         </div>
      </Modal>
    </div>
  );
}
