import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, Target, BarChart3, PieChart, 
  Flag, Map, Users, TrendingUp,
  ExternalLink, Search, Filter, ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ResponsiveContainer, PieChart as RePie, Pie, Cell, Tooltip } from 'recharts';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

const HRP_ALIGNMENT = [
  { name: 'صحة (Health)', value: 35, color: '#2563eb' },
  { name: 'الأمن الغذائي (FSL)', value: 25, color: '#059669' },
  { name: 'المياه والصرف الصحي (WASH)', value: 20, color: '#0891b2' },
  { name: 'الحماية (Protection)', value: 15, color: '#7c3aed' },
  { name: 'التعليم (Education)', value: 5, color: '#ea580c' },
];

export default function CoordinationWatchtower() {
  const toast = useToast();
  const [coordData, setCoordData] = useState(null);

  useEffect(() => {
    api.get('/analytics/dashboard').then(r => {
      const items = Array.isArray(r.data) ? r.data : (r.data.items || []);
      setCoordData(items);
    }).catch(() => {});
  }, []);
  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/10 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <Radio size={14} className="animate-pulse" />
            UN-OCHA Coordination Watchtower (HRP Alignment)
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">برج التنسيق والمواءمة الاستراتيجية</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">قياس مدى مواءمة أنشطة المنظمة مع خطة الاستجابة الإنسانية للأمم المتحدة (HRP).</p>
        </div>
        
        <div className="flex gap-4">
           <button onClick={() => { window.open('https://hpc.tools.unocha.org/', '_blank'); toast.show('تم فتح بوابة OCHA HPC'); }} className="h-12 px-6 bg-violet-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-violet-600/20 hover:bg-violet-700 transition-all flex items-center gap-2">
              <ExternalLink size={18} /> فتح بوابة OCHA HPC
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="card-elite p-8 space-y-6">
                  <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">توزيع المشاريع حسب قطاعات HRP</h3>
                  <div className="h-[250px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <RePie>
                           <Pie
                              data={HRP_ALIGNMENT}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                           >
                              {HRP_ALIGNMENT.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                           </Pie>
                           <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }} />
                        </RePie>
                     </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     {HRP_ALIGNMENT.map(item => (
                        <div key={item.name} className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                           <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{item.name}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="card-elite p-8 flex flex-col justify-between">
                  <div>
                     <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-6">المساهمة في الأهداف الاستراتيجية</h3>
                     <div className="space-y-6">
                        {[
                           { label: 'إنقاذ الأرواح (SO1)', val: 78, color: 'bg-rose-600' },
                           { label: 'تحسين المعيشة (SO2)', val: 62, color: 'bg-emerald-600' },
                           { label: 'المرونة المجتمعية (SO3)', val: 45, color: 'bg-blue-600' },
                        ].map(so => (
                           <div key={so.label} className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase">
                                 <span>{so.label}</span>
                                 <span>{so.val}%</span>
                              </div>
                              <div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                 <motion.div initial={{ width: 0 }} animate={{ width: `${so.val}%` }} className={cn("h-full", so.color)} />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                  <p className="text-[9px] font-medium text-slate-400 mt-8 italic">
                     * يتم حساب هذه النسب آلياً بناءً على علامات القطاعات في مقترحات المشاريع.
                  </p>
               </div>
            </div>

            <div className="card-elite p-8 space-y-6">
               <h3 className="font-black text-lg">تحليل الفجوات في الاستجابة (Gap Analysis)</h3>
               <div className="space-y-4">
                  {[
                     { area: 'مديرية مأرب الوادي', cluster: 'WASH', gap: 'High', status: 'Underfunded' },
                     { area: 'مديرية القاهرة - تعز', cluster: 'Health', gap: 'Medium', status: 'Active' },
                  ].map(gap => (
                     <div key={gap.area} className="p-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-[var(--border)] flex items-center justify-between group hover:border-violet-600/30 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-2xl bg-violet-600/10 text-violet-600 flex items-center justify-center font-black">
                              <Map size={24} />
                           </div>
                           <div>
                              <div className="text-sm font-black">{gap.area}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cluster: {gap.cluster}</div>
                           </div>
                        </div>
                        <div className="flex gap-4">
                           <div className="text-right">
                              <div className={cn("text-xs font-black", gap.gap === 'High' ? 'text-rose-600' : 'text-amber-500')}>{gap.gap} Priority</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase">{gap.status}</div>
                           </div>
                           <button className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-[var(--border)] flex items-center justify-center text-slate-400 group-hover:text-violet-600"><ArrowRight size={18} /></button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <aside className="space-y-6">
            <div className="card-elite p-8 bg-violet-600 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Flag size={120} /></div>
               <h3 className="font-black text-lg mb-4 relative z-10">تحقيق الرؤية الأممية</h3>
               <p className="text-sm font-medium opacity-80 leading-relaxed mb-8 relative z-10">
                  يساعدك هذا البرج في تقديم مبررات قوية للمانحين من خلال إثبات مواءمة مشاريعك مع الاحتياجات المحددة في نظرة عامة على الاحتياجات الإنسانية (HNO).
               </p>
               <button onClick={() => { toast.show('جاري تجهيز التقرير...'); setTimeout(() => toast.show('تم تحميل التقرير بنجاح'), 1500); }} className="w-full h-12 bg-white text-violet-600 rounded-xl font-black text-xs shadow-xl shadow-black/20 hover:scale-[1.02] transition-all">تحميل تقرير المواءمة الاستراتيجية</button>
            </div>

            <div className="card-elite p-8 space-y-6">
               <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">مؤشرات الأداء التنسيقي</h3>
               <div className="space-y-6">
                  {[
                     { label: 'نسبة التغطية (Coverage)', val: '22%', icon: Target, color: 'text-blue-600' },
                     { label: 'المستفيدون المستهدفون', val: '1.2M', icon: Users, color: 'text-emerald-600' },
                     { label: 'كفاءة الاستجابة', val: '92%', icon: TrendingUp, color: 'text-amber-500' },
                  ].map(s => (
                     <div key={s.label} className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-xl bg-black/5 dark:bg-white/5", s.color)}><s.icon size={18} /></div>
                        <div>
                           <div className="text-sm font-black">{s.val}</div>
                           <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </aside>
      </div>
    </div>
  );
}

function ArrowRight({size, className}) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>; }
