import { useState, useEffect } from 'react';
import { 
  Globe, BarChart3, TrendingUp, Users, 
  MapPin, ShieldCheck, Download, Share2,
  Layers, ExternalLink, Info, Filter,
  FileSpreadsheet, ArrowUpRight, ArrowDownRight,
  PieChart, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';

const StrategicDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await api.get('/api/strategic/global-metrics');
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch strategic metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const kpis = [
    { label: 'إجمالي الوصول', value: metrics?.reach.toLocaleString() || '125,400', unit: 'مستفيد', icon: Users, color: 'text-blue-600', trend: '+12%' },
    { label: 'فجوة التمويل', value: metrics?.funding_gap.toLocaleString() || '450,000', unit: '$', icon: BarChart3, color: 'text-orange-600', trend: '-5%' },
    { label: 'الامتثال (IATI)', value: metrics?.iati_compliance_score || '92', unit: '%', icon: ShieldCheck, color: 'text-emerald-600', trend: '+2%' },
    { label: 'المشاريع النشطة', value: metrics?.active_projects || '14', unit: 'مشروع', icon: Globe, color: 'text-indigo-600', trend: 'Stable' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
               <Globe size={28} />
             </div>
             لوحة القيادة الاستراتيجية
          </h1>
          <p className="text-slate-500 font-bold mt-1">المؤشرات العالمية، الشفافية (IATI)، وتقارير الـ 3W للمانحين</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-12 px-6 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <FileSpreadsheet size={20} />
            تصدير OCHA 3W
          </button>
          <button className="h-12 px-6 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
            <Share2 size={20} />
            مشاركة التقرير العام
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <kpi.icon size={80} />
            </div>
            <div className="relative z-10">
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{kpi.label}</p>
               <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-slate-900">{kpi.value}</h3>
                  <span className="text-sm font-bold text-slate-500">{kpi.unit}</span>
               </div>
               <div className="mt-6 flex items-center gap-2">
                  <span className={cn('flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg', 
                    kpi.trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 
                    kpi.trend.includes('-') ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                  )}>
                    {kpi.trend.includes('+') ? <ArrowUpRight size={12} /> : kpi.trend.includes('-') ? <ArrowDownRight size={12} /> : <Activity size={12} />}
                    {kpi.trend}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">منذ الشهر الماضي</span>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Sector Distribution */}
         <div className="lg:col-span-1 p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <PieChart className="text-indigo-600" size={20} />
                  توزيع التمويل حسب القطاع
               </h3>
               <button className="text-slate-400 hover:text-slate-600"><Info size={18} /></button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-6">
               {[
                 { sector: 'الأمن الغذائي', percentage: 40, color: 'bg-orange-500' },
                 { sector: 'المياه والإصحاح البيئي', percentage: 35, color: 'bg-blue-500' },
                 { sector: 'الصحة والتغذية', percentage: 15, color: 'bg-emerald-500' },
                 { sector: 'الحماية والتعليم', percentage: 10, color: 'bg-indigo-500' }
               ].map((item, i) => (
                 <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                       <span className="text-slate-600">{item.sector}</span>
                       <span className="text-slate-900">{item.percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        className={cn('h-full rounded-full', item.color)} 
                       />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Reach Trends (Visual Placeholder) */}
         <div className="lg:col-span-2 p-8 rounded-[3rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
               <svg viewBox="0 0 800 300" className="w-full h-full">
                  <path d="M0 250 Q 200 150 400 200 T 800 100" stroke="white" fill="transparent" strokeWidth="4" />
                  <path d="M0 280 Q 200 200 400 250 T 800 150" stroke="rgba(255,255,255,0.3)" fill="transparent" strokeWidth="2" />
               </svg>
            </div>
            
            <div className="relative z-10 h-full flex flex-col">
               <div className="flex items-center justify-between mb-12">
                  <div>
                    <h3 className="text-2xl font-black mb-1">تحليل الوصول الميداني</h3>
                    <p className="text-xs font-bold text-slate-400">توقعات الوصول للأشهر الستة القادمة</p>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                     <button className="px-3 py-1 rounded-lg bg-indigo-600 text-[10px] font-black">Monthly</button>
                     <button className="px-3 py-1 rounded-lg text-[10px] font-black hover:bg-white/10">Quarterly</button>
                  </div>
               </div>

               <div className="mt-auto grid grid-cols-6 gap-4 items-end h-48">
                  {[30, 45, 60, 55, 80, 95].map((h, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      className="w-full bg-gradient-to-t from-indigo-600 to-blue-400 rounded-t-xl group/bar relative"
                    >
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-white text-slate-900 px-2 py-1 rounded-lg text-[10px] font-black shadow-xl">
                         {h}k
                       </div>
                    </motion.div>
                  ))}
               </div>
               <div className="flex justify-between mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
               </div>
            </div>
         </div>
      </div>

      {/* Standards & Transparency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-2xl">
               92%
            </div>
            <div>
               <h4 className="text-lg font-black text-slate-900">معدل الامتثال لـ IATI</h4>
               <p className="text-sm font-bold text-slate-400 mt-1 leading-relaxed">
                  البيانات المالية والبرامجية منسقة تماماً مع المعايير الدولية للشفافية. جاهز للتزامن التلقائي.
               </p>
               <button className="mt-4 text-xs font-black text-indigo-600 flex items-center gap-1 hover:underline">
                  إعدادات المزامنة <ExternalLink size={14} />
               </button>
            </div>
         </div>

         <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center text-blue-600">
               <Layers size={32} />
            </div>
            <div>
               <h4 className="text-lg font-black text-slate-900">تقارير OCHA 3W</h4>
               <p className="text-sm font-bold text-slate-400 mt-1 leading-relaxed">
                  توليد تقارير "Who, What, Where" بضغطة زر لمشاركتها مع الكتل القطاعية (Clusters).
               </p>
               <button className="mt-4 text-xs font-black text-blue-600 flex items-center gap-1 hover:underline">
                  تحميل آخر نسخة <Download size={14} />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StrategicDashboard;
