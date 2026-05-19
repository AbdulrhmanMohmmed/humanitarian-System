import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, AlertCircle, Map, Zap, Users, 
  Search, Filter, CheckCircle2, XCircle, RotateCcw,
  BarChart3, Clock, MapPin
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';

const ISSUES = [
  { id: 1, type: 'Outlier', field: 'household_size', value: '45', status: 'Pending', severity: 'High', inspector: 'AI Engine' },
  { id: 2, type: 'Velocity', field: 'survey_duration', value: '45s', status: 'Flagged', severity: 'Medium', inspector: 'System Radar' },
  { id: 3, type: 'GPS', field: 'location_variance', value: '1.2km', status: 'Pending', severity: 'Critical', inspector: 'Geo-Fence' },
];

export default function DataQualityHub() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <ShieldCheck size={14} />
            Autonomous Data Quality Engine (DQE)
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">محرك جودة البيانات</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">رصد التلاعب، القيم الشاذة، والذكاء المكاني لضمان دقة التقارير.</p>
        </div>
        
        <div className="flex gap-4">
           <button onClick={() => { toast.show('جاري إعادة الفحص الشامل...'); setTimeout(() => toast.show('اكتمل الفحص — جودة البيانات 94%'), 2000); }} className="h-12 px-6 bg-black/5 dark:bg-white/5 rounded-2xl font-black text-xs hover:bg-black/10 transition-all flex items-center gap-2">
              <RotateCcw size={18} /> إعادة فحص شامل
           </button>
           <button onClick={() => { toast.show('تم اعتماد البيانات النظيفة بنجاح'); }} className="h-12 px-6 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
              <CheckCircle2 size={18} /> اعتماد البيانات النظيفة
           </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'إجمالي السجلات', val: '12,450', icon: BarChart3, color: 'blue' },
           { label: 'سجلات مشبوهة', val: '142', icon: AlertCircle, color: 'rose' },
           { label: 'دقة الـ GPS', val: '98.2%', icon: MapPin, color: 'emerald' },
           { label: 'سرعة الإنجاز', val: '8.4m', icon: Clock, color: 'amber' },
         ].map((s, idx) => (
           <motion.div 
             key={idx}
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: idx * 0.1 }}
             className="card-elite p-6"
           >
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                <div className={cn("p-2 rounded-xl", 
                  s.color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                  s.color === 'rose' ? 'bg-rose-500/10 text-rose-600' :
                  s.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                )}>
                  <s.icon size={18} />
                </div>
              </div>
              <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">{s.val}</p>
           </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <div className="card-elite overflow-hidden shadow-2xl">
               <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="font-black text-sm flex items-center gap-3 italic">
                    <Search size={18} className="text-blue-600" /> سجل التنبيهات الذكية (Issue Log)
                  </h3>
                  <div className="flex gap-2">
                     {['all', 'pending', 'critical'].map(tab => (
                       <button 
                         key={tab} 
                         onClick={() => setActiveTab(tab)}
                         className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", activeTab === tab ? "bg-blue-600 text-white shadow-lg" : "bg-black/5 dark:bg-white/5 text-slate-500")}
                       >
                         {tab}
                       </button>
                     ))}
                  </div>
               </div>
               
               <table className="w-full text-sm">
                  <thead>
                     <tr className="bg-black/5 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <th className="px-6 py-5 text-right">نوع الخطأ</th>
                        <th className="px-6 py-5 text-right">الحقل / القيمة</th>
                        <th className="px-6 py-5 text-right">المستوى</th>
                        <th className="px-6 py-5 text-right">المحرك الفاحص</th>
                        <th className="px-6 py-5 text-right">الإجراء</th>
                     </tr>
                  </thead>
                  <tbody>
                     {ISSUES.map((issue) => (
                        <tr key={issue.id} className="border-t border-[var(--border)] hover:bg-black/5 transition-all group">
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                 <div className={cn("w-2 h-2 rounded-full", issue.severity === 'Critical' ? 'bg-rose-600' : 'bg-amber-500')} />
                                 <span className="font-black text-[var(--text-primary)]">{issue.type}</span>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <span className="font-bold opacity-60">{issue.field}:</span>
                              <span className="font-black text-rose-600 ml-2">{issue.value}</span>
                           </td>
                           <td className="px-6 py-5">
                              <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase", issue.severity === 'Critical' ? 'bg-rose-600/10 text-rose-600' : 'bg-amber-500/10 text-amber-500')}>
                                 {issue.severity}
                              </span>
                           </td>
                           <td className="px-6 py-5 text-[10px] font-black opacity-40 uppercase italic">{issue.inspector}</td>
                           <td className="px-6 py-5">
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-2 bg-emerald-600/10 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><CheckCircle2 size={14} /></button>
                                 <button className="p-2 bg-rose-600/10 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all"><XCircle size={14} /></button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         <aside className="space-y-6">
            <div className="card-elite p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={120} /></div>
               <h3 className="font-black text-xl mb-4 relative z-10">الذكاء الاصطناعي (AI Data Audit)</h3>
               <p className="text-sm font-medium opacity-70 mb-8 leading-relaxed relative z-10">
                  يقوم المحرك حالياً بتحليل الأنماط الخفية في بيانات التوزيع لاكتشاف أي محاولات احتيال منظمة.
               </p>
               <div className="space-y-4 relative z-10">
                  <div className="bg-white/10 p-4 rounded-2xl">
                     <p className="text-[10px] font-black uppercase opacity-60 mb-2">آخر استنتاج (Last Insight)</p>
                     <p className="text-xs font-black">"تم اكتشاف نمط غير طبيعي في سرعة إدخال البيانات بمديرية (أ) بين الساعة 2-4 صباحاً."</p>
                  </div>
                  <button onClick={() => { toast.show('جاري تحليل العمق...'); setTimeout(() => toast.show('اكتمل التحليل — لا توجد مشاكل'), 2500); }} className="w-full h-12 bg-blue-600 rounded-xl font-black text-xs shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all">بدء تحليل العمق</button>
               </div>
            </div>

            <div className="card-elite p-6">
               <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6">فلاتر الفحص</h3>
               <div className="space-y-4">
                  {['فحص التكرار (Deduplication)', 'فحص القيم الشاذة', 'التحقق المكاني (Geo-fence)', 'فحص التناقض المنطقي'].map(f => (
                     <label key={f} className="flex items-center gap-3 cursor-pointer group">
                        <div className="w-5 h-5 rounded-md border-2 border-slate-200 group-hover:border-blue-600 transition-all flex items-center justify-center">
                           <CheckCircle2 size={12} className="text-blue-600 scale-0 group-hover:scale-100 transition-all" />
                        </div>
                        <span className="text-xs font-black text-slate-600">{f}</span>
                     </label>
                  ))}
               </div>
            </div>
         </aside>
      </div>
    </div>
  );
}
