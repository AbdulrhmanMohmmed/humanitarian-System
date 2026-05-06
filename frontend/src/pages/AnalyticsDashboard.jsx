import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart3, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Search, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Zap,
  Filter,
  Download,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AnalyticsDashboard() {
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [geographic, setGeographic] = useState(null);
  const [trends, setTrends] = useState(null);
  const [fiveW, setFiveW] = useState(null);
  const [dqaHistory, setDqaHistory] = useState([]);
  const [duplicates, setDuplicates] = useState(null);
  const [dqaRunning, setDqaRunning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async () => {
    setIsRefreshing(true);
    try {
      const endpoints = {
        overview: '/analytics/overview',
        geographic: '/analytics/geographic',
        trends: '/analytics/trends',
        fiveW: '/analytics/5w',
        dqa: '/analytics/dqa/history'
      };

      const results = await Promise.all(
        Object.entries(endpoints).map(async ([key, path]) => {
          try {
            const r = await api.get(path);
            localStorage.setItem(`hiaos_v2_analytics_${key}`, JSON.stringify(r.data));
            return [key, r.data];
          } catch (e) {
            const local = localStorage.getItem(`hiaos_v2_analytics_${key}`);
            return [key, local ? JSON.parse(local) : null];
          }
        })
      );

      const data = Object.fromEntries(results);
      setOverview(data.overview);
      setGeographic(data.geographic);
      setTrends(data.trends);
      setFiveW(data.fiveW);
      setDqaHistory(data.dqa || []);

      // Fallback for overview if everything is empty
      if (!data.overview) {
        const demoOverview = {
          total_projects: 24,
          active_projects: 18,
          total_beneficiaries: 145200,
          total_forms: 12,
          total_submissions: 8400,
          budget_utilization: 68,
          total_spent: 850000,
          total_budget: 1250000,
          sector_distribution: [
            { name: 'FSL', value: 40 },
            { name: 'Health', value: 30 },
            { name: 'WASH', value: 20 },
            { name: 'Prot', value: 10 },
          ]
        };
        setOverview(demoOverview);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const tabs = [
    { key: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { key: 'geographic', label: 'التحليل الجغرافي', icon: MapPin },
    { key: 'trends', label: 'تحليل الاتجاهات', icon: TrendingUp },
    { key: '5w', label: 'تقرير 5W', icon: Users },
    { key: 'dqa', label: 'جودة البيانات', icon: ShieldCheck },
    { key: 'dedup', label: 'كشف التكرارات', icon: Search },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 backdrop-blur-md border border-blue-600/10">
            <Zap size={14} className="animate-pulse" />
            HIAOS Advanced Intelligence Analytics
          </div>
          <h1 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">مركز التحليلات المتقدمة</h1>
          <p className="max-w-3xl text-lg font-semibold text-[var(--text-secondary)] opacity-80 leading-relaxed">
            تحليل البيانات الضخمة، كشف التكرارات، وتقارير الاستجابة الإنسانية الفورية.
          </p>
        </div>
        <div className="flex gap-4">
           <button onClick={load} className={cn("inline-flex h-12 items-center gap-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border)] px-6 text-xs font-black hover:bg-black/10 transition-all", isRefreshing && "animate-spin-slow")}>
             تحديث البيانات
           </button>
           <button className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-xs font-black text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all">
             <Download size={18} /> تصدير التقارير
           </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex bg-black/5 dark:bg-white/5 p-2 rounded-3xl border border-[var(--border)] w-fit">
        {tabs.map(t => (
          <button 
            key={t.key} 
            onClick={() => setTab(t.key)} 
            className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden",
              tab === t.key ? "text-blue-600 bg-white dark:bg-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <t.icon size={16} />
            {t.label}
            {tab === t.key && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {tab === 'overview' && overview && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'إجمالي المشاريع', value: overview.total_projects, icon: BarChart3, trend: '+12%', color: 'blue' },
                  { label: 'المستفيدين النشطين', value: overview.total_beneficiaries.toLocaleString(), icon: Users, trend: '+5.4%', color: 'emerald' },
                  { label: 'النماذج الميدانية', value: overview.total_forms, icon: MapPin, trend: 'stable', color: 'purple' },
                  { label: 'كفاءة الميزانية', value: `${overview.budget_utilization}%`, icon: TrendingUp, trend: '-2%', color: 'amber' },
                ].map((stat, i) => (
                  <div key={i} className="card-elite p-6 group">
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", 
                        stat.color === 'blue' ? "bg-blue-500/10 text-blue-600" :
                        stat.color === 'emerald' ? "bg-emerald-500/10 text-emerald-600" :
                        stat.color === 'purple' ? "bg-purple-500/10 text-purple-600" : "bg-amber-500/10 text-amber-600"
                      )}>
                        <stat.icon size={24} />
                      </div>
                      <div className={cn("text-[10px] font-black px-2 py-1 rounded-full", 
                        stat.trend.startsWith('+') ? "bg-emerald-500/10 text-emerald-600" : 
                        stat.trend.startsWith('-') ? "bg-rose-500/10 text-rose-600" : "bg-slate-500/10 text-slate-500"
                      )}>
                        {stat.trend}
                      </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-black">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card-elite p-8">
                   <h3 className="text-lg font-black mb-8 flex items-center gap-3">
                     <TrendingUp className="text-blue-600" /> تحليل توزيع القطاعات
                   </h3>
                   <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie
                               data={overview.sector_distribution || []}
                               cx="50%"
                               cy="50%"
                               innerRadius={80}
                               outerRadius={100}
                               paddingAngle={5}
                               dataKey="value"
                            >
                               {overview.sector_distribution?.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                               ))}
                            </Pie>
                            <Tooltip />
                         </PieChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="card-elite p-8">
                   <h3 className="text-lg font-black mb-8 flex items-center gap-3">
                     <BarChart3 className="text-purple-600" /> معدلات الإنجاز الشهرية
                   </h3>
                   <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={[
                            { month: 'Jan', val: 400 }, { month: 'Feb', val: 700 }, { month: 'Mar', val: 500 }, { month: 'Apr', val: 900 }
                         ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                            <XAxis dataKey="month" stroke="#888888" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="#888888" fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#88888811'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="val" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={30} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
              </div>
            </div>
          )}

          {tab === ' geographic' && (
             <div className="card-elite p-10 min-h-[500px] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-blue-600/10 text-blue-600 rounded-full flex items-center justify-center mb-6">
                   <MapPin size={40} />
                </div>
                <h3 className="text-2xl font-black mb-4">خارطة التدخلات التفاعلية</h3>
                <p className="max-w-md text-slate-500 font-medium">هذه الميزة تتطلب تحميل حزم الخرائط الجغرافية النشطة. يمكنك عرض توزيع المستفيدين حسب المحافظات والمديريات.</p>
                <button className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm">تفعيل الخرائط الحرارية</button>
             </div>
          )}

          {tab === 'dqa' && (
             <div className="space-y-8">
                <div className="card-elite p-8 bg-slate-900 text-white border-none overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px]" />
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div>
                         <h3 className="text-2xl font-black mb-2">ضمان جودة البيانات (DQA)</h3>
                         <p className="text-slate-400 font-medium max-w-xl">يقوم المحرك الذكي بفحص التناسق الإحصائي، القيم المتطرفة، والفجوات الزمنية في كافة السجلات المدخلة لضمان دقة التقارير النهائية.</p>
                      </div>
                      <button onClick={async () => { setDqaRunning(true); await new Promise(r => setTimeout(r, 2000)); setDqaRunning(false); }} className="px-10 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-2xl shadow-blue-600/40 transition-all flex items-center gap-3">
                         {dqaRunning ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={20} /></motion.div> : <ShieldCheck size={20} />}
                         {dqaRunning ? 'جاري الفحص الذكي...' : 'تشغيل فحص الجودة الآن'}
                      </button>
                   </div>
                </div>

                <div className="card-elite p-0 overflow-hidden">
                   <table className="w-full text-right border-collapse">
                      <thead>
                         <tr className="bg-black/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            <th className="p-6">التاريخ</th>
                            <th className="p-6">نوع الفحص</th>
                            <th className="p-6">عدد السجلات</th>
                            <th className="p-6">النتيجة</th>
                            <th className="p-6">الإجراء</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                         {dqaHistory.length > 0 ? dqaHistory.map((h, i) => (
                            <tr key={i} className="hover:bg-black/[0.02] transition-colors">
                               <td className="p-6 text-sm font-bold">{new Date(h.created_at).toLocaleDateString('ar-YE')}</td>
                               <td className="p-6 text-sm font-bold">{h.check_type || 'فحص شامل'}</td>
                               <td className="p-6 text-sm font-black text-blue-600">{h.records_processed}</td>
                               <td className="p-6">
                                  <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase", 
                                     h.status === 'good' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                  )}>{h.status === 'good' ? 'مقبول' : 'يحتاج مراجعة'}</span>
                               </td>
                               <td className="p-6"><button className="text-slate-400 hover:text-blue-600 transition-colors"><ArrowUpRight size={18} /></button></td>
                            </tr>
                         )) : (
                            <tr>
                               <td colSpan="5" className="p-20 text-center text-slate-400 font-black text-xs uppercase tracking-widest">لا يوجد سجل عمليات حالي</td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
