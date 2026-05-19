import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map as MapIcon, Layers, MapPin, 
  ShieldAlert, CheckCircle, TrendingUp,
  Filter, ZoomIn, ZoomOut, Maximize2, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

const GOVERNORATES = [
  { id: 'YE-AD', name: 'عدن', risk: 34, achievement: 88, status: 'Stable' },
  { id: 'YE-TA', name: 'تعز', risk: 72, achievement: 45, status: 'Critical' },
  { id: 'YE-SA', name: 'صنعاء', risk: 15, achievement: 92, status: 'Optimal' },
  { id: 'YE-MA', name: 'مأرب', risk: 85, achievement: 20, status: 'Critical' },
  { id: 'YE-HJ', name: 'حجة', risk: 50, achievement: 68, status: 'Warning' },
];

export default function SpatialInsights() {
  const toast = useToast();
  const [selected, setSelected] = useState(GOVERNORATES[1]);
  const [loading, setLoading] = useState(true);
  const [layer, setLayer] = useState('Risk');

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <MapIcon size={14} />
            Advanced Spatial Intelligence Dashboard (GIS)
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">الرادار المكاني للإنجاز والمخاطر</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">تحليل جغرافي متكامل يربط الإنجاز الميداني بمؤشرات الخطر والوصول الإنساني.</p>
        </div>
        
        <div className="flex gap-4">
           <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-[var(--border)]">
              {['Risk', 'Achievement', 'Access'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setLayer(t)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    layer === t ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20" : "hover:bg-black/5 text-slate-400"
                  )}
                >
                  {t}
                </button>
              ))}
           </div>
           <button className="h-12 w-12 bg-white dark:bg-slate-900 rounded-xl border border-[var(--border)] flex items-center justify-center text-slate-400 shadow-sm"><RefreshCw size={18} /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[700px]">
         <div className="lg:col-span-3 card-elite p-0 overflow-hidden relative bg-slate-100 dark:bg-slate-950">
            {/* Mock Map UI */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                <MapIcon size={300} strokeWidth={0.5} className="text-rose-600" />
            </div>

            {/* Floating Map Controls */}
            <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
               {[ZoomIn, ZoomOut, Maximize2, Layers].map((Icon, i) => (
                 <button key={i} className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex items-center justify-center text-slate-600 hover:text-rose-600 transition-colors border border-[var(--border)]">
                    <Icon size={18} />
                 </button>
               ))}
            </div>

            {/* Interactive Pins */}
            <div className="absolute inset-0">
               {GOVERNORATES.map((g, i) => (
                 <motion.button
                    key={g.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelected(g)}
                    className={cn(
                      "absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white transition-transform hover:scale-125 z-20",
                      g.risk > 70 ? 'bg-rose-600' : g.risk > 40 ? 'bg-amber-500' : 'bg-emerald-600'
                    )}
                    style={{ 
                      top: `${30 + i * 15}%`, 
                      left: `${20 + i * 15}%` 
                    }}
                 >
                    <MapPin size={14} />
                    <div className="absolute top-full mt-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg shadow-2xl border border-[var(--border)] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                       <span className="text-[10px] font-black text-[var(--text-primary)] whitespace-nowrap">{g.name}</span>
                    </div>
                 </motion.button>
               ))}
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-6 left-6 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-[var(--border)] shadow-2xl z-10">
               <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">دليل الخريطة: {layer}</h4>
               <div className="space-y-2">
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-rose-600" />
                     <span className="text-[10px] font-bold">خطر مرتفع / إنجاز منخفض</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-amber-500" />
                     <span className="text-[10px] font-bold">متابعة دقيقة</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-emerald-600" />
                     <span className="text-[10px] font-bold">وضع مستقر</span>
                  </div>
               </div>
            </div>
         </div>

         <aside className="space-y-6">
            <AnimatePresence mode="wait">
               {selected && (
                 <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="card-elite p-8 space-y-8"
                 >
                    <div className="flex items-center justify-between">
                       <h3 className="text-2xl font-black">{selected.name}</h3>
                       <span className={cn(
                         "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                         selected.status === 'Critical' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                       )}>{selected.status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                          <h4 className="text-[9px] font-black text-slate-400 uppercase mb-1">مؤشر الخطر</h4>
                          <div className="text-2xl font-black text-rose-600">{selected.risk}%</div>
                       </div>
                       <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                          <h4 className="text-[9px] font-black text-slate-400 uppercase mb-1">نسبة الإنجاز</h4>
                          <div className="text-2xl font-black text-emerald-600">{selected.achievement}%</div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[var(--border)] pb-2">التوصيات المكانية</h4>
                       <div className="flex gap-4">
                          <div className="p-3 rounded-xl bg-blue-600/10 text-blue-600 shrink-0"><ShieldAlert size={20} /></div>
                          <p className="text-xs font-medium leading-relaxed opacity-70">
                             يتطلب الموقع ({selected.name}) تدخلاً فورياً في قطاع المياه بسبب تعطل المضخات وتأخر توريد قطع الغيار.
                          </p>
                       </div>
                       <button onClick={() => { toast.show('جاري تحليل المنطقة المحددة...'); setTimeout(() => toast.show('اكتمل التحليل المكاني'), 2000); }} className="w-full h-12 bg-rose-600 text-white rounded-xl font-black text-xs shadow-xl shadow-rose-600/20 hover:scale-105 transition-all">تحليل معمق للمنطقة</button>
                    </div>

                    <div className="pt-6 border-t border-[var(--border)] space-y-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مشاريع في المنطقة</h4>
                       {[1, 2].map(i => (
                         <div key={i} className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-transparent hover:border-blue-600/20 transition-all cursor-pointer">
                            <span className="text-[10px] font-black">مشروع {i === 1 ? 'الأمن الغذائي' : 'الصحة'}</span>
                            <CheckCircle size={14} className="text-emerald-600" />
                         </div>
                       ))}
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
            
            <div className="card-elite p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={120} /></div>
               <h3 className="font-black text-lg mb-4 relative z-10">تحليل الاتجاه المكاني</h3>
               <p className="text-sm font-medium opacity-80 leading-relaxed mb-8 relative z-10">
                  تظهر البيانات تحسناً في الوصول الإنساني للمناطق الجنوبية، بينما تظل المناطق الوسطى تحت ضغط مخاطر عالية.
               </p>
               <button onClick={() => { toast.show('جاري تجهيز تقرير الفجوات...'); setTimeout(() => toast.show('تم تجهيز التقرير'), 1500); }} className="w-full h-12 bg-blue-600 text-white rounded-xl font-black text-xs">عرض تقرير الفجوات الجغرافي</button>
            </div>
         </aside>
      </div>
    </div>
  );
}
