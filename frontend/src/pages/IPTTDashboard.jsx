import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
  BarChart3, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../contexts/ToastContext';

export default function IPTTDashboard() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [form, setForm] = useState({ indicator_id: '', project_id: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1, target_value: 0, actual_value: 0, deviation_explanation: '', corrective_action: '' });

  const loadInitialData = async () => {
    setIsRefreshing(true);
    try {
      const [pRes, aRes] = await Promise.all([
        api.get('/projects/'),
        api.get('/iptt/alerts')
      ]);
      setProjects(pRes.data);
      setAlerts(aRes.data.alerts || []);
      if (pRes.data.length > 0 && !selectedProject) {
        setSelectedProject(String(pRes.data[0].id));
      }
    } catch (e) {
      const localP = localStorage.getItem('hiaos_v2_projects');
      const localA = localStorage.getItem('hiaos_v2_iptt_alerts');
      if (localP) setProjects(JSON.parse(localP));
      if (localA) setAlerts(JSON.parse(localA).alerts || []);
      
      // Demo Projects
      if (!localP || JSON.parse(localP).length === 0) {
        setProjects([{ id: 1, name: 'مشروع الأمن الغذائي المتكامل' }, { id: 2, name: 'دعم القطاع الصحي الطارئ' }]);
        setSelectedProject('1');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      const fetchSummary = async () => {
        try {
          const r = await api.get(`/iptt/summary/${selectedProject}`);
          setSummary(r.data);
          localStorage.setItem(`hiaos_v2_iptt_summary_${selectedProject}`, JSON.stringify(r.data));
        } catch (e) {
          const localS = localStorage.getItem(`hiaos_v2_iptt_summary_${selectedProject}`);
          if (localS) setSummary(JSON.parse(localS));
          else {
            // Demo Summary Data
            setSummary({
              summary: { green: 12, yellow: 4, red: 2 },
              indicators: [
                { id: 1, name: 'عدد المستفيدين من السلال الغذائية', target: 5000, actual: 4800, achievement_rate: 96, status: 'green', unit: 'فرد' },
                { id: 2, name: 'نسبة الأسر التي تمتلك مخزون غذائي كافٍ', target: 80, actual: 45, achievement_rate: 56.25, status: 'red', unit: '%' },
                { id: 3, name: 'عدد الدورات التدريبية المنفذة', target: 10, actual: 7, achievement_rate: 70, status: 'yellow', unit: 'دورة' },
              ]
            });
          }
        }
      };
      fetchSummary();
    }
  }, [selectedProject]);

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 backdrop-blur-md border border-blue-600/10">
            <Activity size={14} className="animate-pulse" />
            Performance Tracking Dashboard (IPTT)
          </div>
          <h1 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">تتبع أداء المؤشرات</h1>
          <p className="max-w-3xl text-lg font-semibold text-[var(--text-secondary)] opacity-80 leading-relaxed">
            مراقبة الانحرافات، وتحليل معدلات الإنجاز مقابل المستهدفات الشهرية والتراكمية.
          </p>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setShowModal(true)} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-xs font-black text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 transition-all">
             <Plus size={18} /> إدخال بيانات التتبع
           </button>
        </div>
      </header>

      {/* Project Selector & Global Filter */}
      <div className="flex flex-wrap gap-4 items-center bg-black/5 dark:bg-white/5 p-4 rounded-3xl border border-[var(--border)]">
         <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-[var(--border)] min-w-[300px]">
            <Target size={18} className="text-blue-600" />
            <select 
              value={selectedProject} 
              onChange={e => setSelectedProject(e.target.value)} 
              className="bg-transparent border-none outline-none text-sm font-black w-full"
            >
              <option value="">اختر المشروع الاستراتيجي...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
         </div>
         <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-[var(--border)]">
            <button onClick={() => { toast.show('تم التبديل إلى العرض الشهري', 'info'); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">Monthly</button>
            <button onClick={() => { toast.show('تم التبديل إلى العرض التراكمي', 'info'); }} className="px-4 py-2 text-slate-400 hover:text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Cumulative</button>
         </div>
         <button className="h-12 w-12 flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-[var(--border)] text-slate-400 hover:text-blue-600 transition-all"><Download size={18} /></button>
      </div>

      <AnimatePresence mode="wait">
        {selectedProject ? (
          <motion.div 
            key={selectedProject}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { label: 'مؤشرات في المسار الصحيح', value: summary?.summary.green || 0, icon: CheckCircle2, color: 'emerald', bg: 'bg-emerald-500/10' },
                 { label: 'مؤشرات تحت المراقبة', value: summary?.summary.yellow || 0, icon: Zap, color: 'amber', bg: 'bg-amber-500/10' },
                 { label: 'مؤشرات متأخرة (Critical)', value: summary?.summary.red || 0, icon: AlertTriangle, color: 'rose', bg: 'bg-rose-500/10' },
               ].map((s, i) => (
                 <div key={i} className="card-elite p-8 flex items-center gap-6 group overflow-hidden relative">
                    <div className={cn("absolute top-0 right-0 w-2 h-full", 
                      s.color === 'emerald' ? "bg-emerald-500" : s.color === 'amber' ? "bg-amber-500" : "bg-rose-500"
                    )} />
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", s.bg, 
                      s.color === 'emerald' ? "text-emerald-600" : s.color === 'amber' ? "text-amber-600" : "text-rose-600"
                    )}>
                      <s.icon size={32} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{s.label}</p>
                      <p className="text-4xl font-black">{s.value}</p>
                    </div>
                 </div>
               ))}
            </div>

            {/* Main IPTT Table */}
            <div className="card-elite p-0 overflow-hidden">
               <div className="p-8 border-b border-black/5 flex items-center justify-between bg-black/[0.01]">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">تفاصيل أداء المؤشرات الاستراتيجية</h3>
                  <div className="flex gap-4">
                     <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-[var(--border)] rounded-xl text-[10px] font-black text-slate-400">
                        <Filter size={14} /> تصفية حسب القطاع
                     </div>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                     <thead>
                        <tr className="bg-black/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                           <th className="p-6">المؤشر</th>
                           <th className="p-6">المستهدف</th>
                           <th className="p-6">المنجز</th>
                           <th className="p-6">نسبة الإنجاز</th>
                           <th className="p-6">الحالة</th>
                           <th className="p-6">الاتجاه</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-black/5">
                        {summary?.indicators.map((ind, i) => (
                           <tr key={i} className="hover:bg-black/[0.02] transition-colors group">
                              <td className="p-6">
                                 <p className="text-sm font-black group-hover:text-blue-600 transition-colors">{ind.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">الوحدة: {ind.unit}</p>
                              </td>
                              <td className="p-6 text-sm font-black text-slate-400">{ind.target.toLocaleString()}</td>
                              <td className="p-6 text-sm font-black">{ind.actual.toLocaleString()}</td>
                              <td className="p-6">
                                 <div className="flex items-center gap-4">
                                    <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden max-w-[100px]">
                                       <motion.div 
                                         initial={{ width: 0 }}
                                         animate={{ width: `${Math.min(ind.achievement_rate, 100)}%` }}
                                         className={cn("h-full rounded-full", 
                                           ind.status === 'green' ? "bg-emerald-500" : ind.status === 'yellow' ? "bg-amber-500" : "bg-rose-500"
                                         )}
                                       />
                                    </div>
                                    <span className="text-xs font-black">{ind.achievement_rate}%</span>
                                 </div>
                              </td>
                              <td className="p-6">
                                 <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase", 
                                   ind.status === 'green' ? "bg-emerald-500/10 text-emerald-600" : 
                                   ind.status === 'yellow' ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600"
                                 )}>
                                   {ind.status === 'green' ? 'ممتاز' : ind.status === 'yellow' ? 'متأخر' : 'حرج'}
                                 </span>
                              </td>
                              <td className="p-6 text-slate-300">
                                 {ind.achievement_rate > 90 ? <ArrowUpRight className="text-emerald-500" /> : <ArrowDownRight className="text-rose-500" />}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        ) : (
          <div className="card-elite p-20 flex flex-col items-center justify-center text-center opacity-40">
             <div className="w-20 h-20 bg-blue-600/10 text-blue-600 rounded-full flex items-center justify-center mb-8">
                <BarChart3 size={40} />
             </div>
             <h3 className="text-xl font-black uppercase tracking-widest">اختر مشروعاً لعرض بيانات تتبع الأداء</h3>
          </div>
        )}
      </AnimatePresence>

      {/* Alerts Section (V2 style) */}
      {alerts.length > 0 && (
        <section className="space-y-4">
           <h3 className="text-sm font-black uppercase tracking-widest text-rose-500 flex items-center gap-3">
              <AlertTriangle size={18} /> تنبيهات الأداء الحرجة
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.slice(0, 4).map((a, i) => (
                <div key={i} className="card-elite p-6 border-rose-500/10 bg-rose-500/5 flex justify-between items-center group">
                   <div>
                      <p className="text-sm font-black group-hover:text-rose-600 transition-colors">{a.indicator_name}</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">الانحراف: {100 - a.achievement_rate}% | الفترة: {a.period}</p>
                   </div>
                   <div className="text-rose-600 font-black text-xl">{a.achievement_rate}%</div>
                </div>
              ))}
           </div>
        </section>
      )}
    </div>
  );
}
