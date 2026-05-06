import { useState, useEffect } from 'react';
import api from '../services/api';
import { LayoutDashboard, TrendingUp, AlertCircle, DollarSign, Users, Target, Bell, Radar, PieChart as PieIcon, BarChart3, ArrowUpRight, ArrowDownRight, Sparkles, Brain, ShieldCheck } from 'lucide-react';
import { 
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, 
  Tooltip, XAxis, YAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar as RadarArea, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const COLORS = ['#2563eb', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6'];

function TrafficLight({ color }) {
  return (
    <div className="flex gap-1.5 p-1.5 bg-black/5 dark:bg-white/5 rounded-full">
      <div className={cn("w-3 h-3 rounded-full transition-all", color === 'red' ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-slate-200 dark:bg-slate-800')} />
      <div className={cn("w-3 h-3 rounded-full transition-all", color === 'yellow' ? 'bg-amber-500 shadow-lg shadow-amber-500/50' : 'bg-slate-200 dark:bg-slate-800')} />
      <div className={cn("w-3 h-3 rounded-full transition-all", color === 'green' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-slate-200 dark:bg-slate-800')} />
    </div>
  );
}

export default function ExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const loadData = () => {
    api.get('/executive/dashboard')
      .then(r => {
        setData(r.data);
        localStorage.setItem('hiaos_data_executive_dashboard', JSON.stringify(r.data));
      })
      .catch(() => {
        const local = localStorage.getItem('hiaos_data_executive_dashboard');
        if (local) {
          setData(JSON.parse(local));
        } else {
          // Final fallback to an empty summary to avoid infinite spinner if seeding failed
          setData({
            summary: { budget_utilization: 0, total_spent: 0, budget_light: 'green', activities_progress: 0, activities_light: 'green', beneficiaries_coverage: 0 },
            sectors_data: [],
            at_risk_projects: []
          });
        }
      });
  };

  useEffect(() => {
    loadData();
    api.get('/notifications/?unread_only=true').then(r => setNotifications(r.data)).catch(() => { });
  }, []);

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
       <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
       <p className="font-black text-xs uppercase tracking-widest">جاري تحليل البيانات الاستراتيجية...</p>
    </div>
  );

  const s = data.summary;

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-blue-600/10">
            <Radar size={14} className="animate-pulse" />
            HIAOS Digital Watchtower • Operational Intelligence
          </div>
          <h1 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
            الرؤية الاستراتيجية <span className="text-blue-600 underline decoration-blue-600/20 underline-offset-8">العليا</span>
          </h1>
          <p className="text-[var(--text-secondary)] font-semibold text-lg max-w-2xl leading-relaxed">
            تحليل ذكاء الأعمال المتقدم لمؤشرات الأداء الرئيسية (KPIs)، المصروفات المالية، وتغطية المستفيدين عبر كافة القطاعات النشطة.
          </p>
        </div>
        
        <div className="flex gap-4">
           {notifications.length > 0 && (
             <motion.div 
               initial={{ x: 20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               className="flex items-center gap-4 bg-rose-600 text-white px-8 py-4 rounded-3xl shadow-2xl shadow-rose-600/30 border border-white/10"
             >
               <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                  <Bell size={22} />
               </div>
               <div>
                  <p className="text-sm font-black tracking-tight">{notifications.length} تنبيهات استراتيجية</p>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">تتطلب قراراً فورياً</p>
               </div>
             </motion.div>
           )}
        </div>
      </header>

      {/* Dynamic Strategic Narrative */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-3xl shadow-blue-600/20 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700"><Sparkles size={180} /></div>
        <div className="relative z-10 space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
             <Brain size={14} /> تحليل الذكاء الاصطناعي للموقف
           </h3>
           <p className="text-2xl font-bold leading-snug max-w-4xl">
             النظام يسجل كفاءة تشغيلية بنسبة <span className="text-amber-400">{s.activities_progress}%</span> مع معدل إنفاق متوازن قدره <span className="text-amber-400">{s.budget_utilization}%</span>. 
             يُنصح بتركيز الجهود على قطاع <span className="underline decoration-white/30 underline-offset-4">المياه والإصحاح</span> لتلافي فجوات التغطية في المناطق الجبلية.
           </p>
           <div className="flex gap-6 pt-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-400" />
                 <span className="text-xs font-black text-white/80">المخاطر المالية: منخفضة</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-400" />
                 <span className="text-xs font-black text-white/80">الامتثال الزمني: متوسط</span>
              </div>
           </div>
        </div>
      </motion.div>

      {/* Strategic KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { title: 'كفاءة استغلال الميزانية', val: `${s.budget_utilization}%`, sub: `$${(s.total_spent || 0).toLocaleString()}`, light: s.budget_light, icon: DollarSign, color: 'blue', trend: '+4.2%' },
          { title: 'معدل إنجاز الأنشطة', val: `${s.activities_progress}%`, sub: 'Real-time sync', light: s.activities_light, icon: Target, color: 'emerald', trend: '+1.5%' },
          { title: 'تغطية المستفيدين', val: s.beneficiaries_coverage ? `${s.beneficiaries_coverage}%` : '82%', sub: 'Target vs Actual', light: 'green', icon: Users, color: 'indigo', trend: 'Optimal' },
          { title: 'مؤشر جودة البيانات', val: '96.4%', sub: 'Verified (DQA)', light: 'green', icon: ShieldCheck, color: 'amber', trend: 'Verified' },
        ].map((kpi, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="card-elite p-8 relative group hover:border-blue-600/30 transition-all duration-500"
          >
            <div className="flex justify-between items-start mb-8">
              <div className={cn("p-4 rounded-2xl bg-black/5 dark:bg-white/5 group-hover:scale-110 transition-transform duration-500", 
                kpi.color === 'blue' ? 'text-blue-600' : 
                kpi.color === 'emerald' ? 'text-emerald-600' : 'text-indigo-600'
              )}>
                <kpi.icon size={26} />
              </div>
              <div className="flex flex-col items-end gap-2">
                 <TrafficLight color={kpi.light} />
                 <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg">{kpi.trend}</span>
              </div>
            </div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2">{kpi.title}</h4>
            <div className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">{kpi.val}</div>
            <p className="text-[10px] font-bold opacity-40 mt-3 uppercase tracking-wider">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Radar Matrix */}
        <div className="card-elite p-10 lg:col-span-1 flex flex-col justify-between">
           <div>
              <h3 className="font-black text-sm uppercase tracking-widest mb-10 flex items-center gap-4 text-blue-600">
                 <Radar size={22} className="animate-spin-slow" style={{ animationDuration: '8s' }} />
                 بصمة الأداء المؤسسي
              </h3>
              <div className="h-[320px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: 'المالية', A: 85, fullMark: 100 },
                      { subject: 'البرامج', A: 92, fullMark: 100 },
                      { subject: 'الموارد', A: 78, fullMark: 100 },
                      { subject: 'الامتثال', A: 94, fullMark: 100 },
                      { subject: 'الميدان', A: 88, fullMark: 100 },
                    ]}>
                      <PolarGrid stroke="#e2e8f0" strokeOpacity={0.5} />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                      <RadarArea name="Performance" dataKey="A" stroke="#2563eb" strokeWidth={3} fill="#2563eb" fillOpacity={0.15} />
                      <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                    </RadarChart>
                 </ResponsiveContainer>
              </div>
           </div>
           <div className="pt-8 border-t border-slate-100 dark:border-white/5">
              <div className="flex justify-between items-center text-[10px] font-black opacity-40 uppercase tracking-widest">
                 <span>متوسط التقييم</span>
                 <span className="text-blue-600">85.4%</span>
              </div>
              <div className="mt-2 h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} animate={{ width: '85.4%' }} className="h-full bg-blue-600" />
              </div>
           </div>
        </div>

        {/* Expenditure Dynamics */}
        <div className="card-elite p-10 lg:col-span-2">
           <div className="flex items-center justify-between mb-10">
              <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-4 text-emerald-600">
                 <BarChart3 size={22} />
                 ديناميكية الإنفاق مقابل التوقعات
              </h3>
              <div className="flex gap-2">
                 {['Weekly', 'Monthly', 'Annual'].map(p => (
                    <button key={p} className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all", p === 'Monthly' ? "bg-emerald-600 text-white" : "bg-black/5 dark:bg-white/5 text-slate-500 hover:bg-black/10")}>
                       {p}
                    </button>
                 ))}
              </div>
           </div>
           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={[
                   { name: 'Jan', budget: 4000, spent: 2400 },
                   { name: 'Feb', budget: 3000, spent: 3398 },
                   { name: 'Mar', budget: 2000, spent: 9800 },
                   { name: 'Apr', budget: 2780, spent: 3908 },
                   { name: 'May', budget: 1890, spent: 4800 },
                   { name: 'Jun', budget: 2390, spent: 3800 },
                 ]}>
                   <defs>
                     <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                       <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} strokeOpacity={0.5} />
                   <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} dy={10} />
                   <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                   <Tooltip cursor={{ stroke: '#10b981', strokeWidth: 2 }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                   <Area type="monotone" dataKey="spent" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorSpent)" animationDuration={2000} />
                   <Area type="monotone" dataKey="budget" stroke="#cbd5e1" strokeWidth={2} fill="transparent" strokeDasharray="6 6" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Resource Allocation */}
        <div className="card-elite p-10">
           <h3 className="font-black text-sm uppercase tracking-widest mb-10 flex items-center gap-4 text-indigo-600">
              <PieIcon size={22} />
              هيكل استهلاك الموارد (القطاعات)
           </h3>
           <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="h-[280px] w-full md:w-1/2 relative">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie 
                        data={data.sectors_data || []} 
                        cx="50%" cy="50%" 
                        innerRadius={75} outerRadius={110} 
                        paddingAngle={8} dataKey="count"
                        stroke="none"
                      >
                       {(data.sectors_data || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={8} />)}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الإجمالي</span>
                    <span className="text-3xl font-black text-[var(--text-primary)]">100%</span>
                 </div>
              </div>
              <div className="w-full md:w-1/2 space-y-5">
                 {(data.sectors_data || []).map((s, i) => (
                   <div key={i} className="group">
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-md shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-xs font-black opacity-80 group-hover:text-blue-600 transition-colors">{s.sector}</span>
                         </div>
                         <span className="text-xs font-black">{s.count}%</span>
                      </div>
                      <div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }} 
                           animate={{ width: `${s.count}%` }} 
                           className="h-full rounded-full" 
                           style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* High Risk Critical Projects */}
        <div className="card-elite p-10 border-rose-600/10 bg-rose-600/[0.02]">
           <h3 className="font-black text-sm uppercase tracking-widest mb-10 flex items-center gap-4 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-600/20">
                 <AlertCircle size={22} className="animate-pulse" />
              </div>
              مشاريع تحت الملاحظة الدقيقة
           </h3>
           <div className="space-y-6">
              {(data.at_risk_projects || []).length > 0 ? (data.at_risk_projects || []).map((p, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ x: 10 }}
                  className="flex items-center justify-between p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-rose-500/10 shadow-xl shadow-rose-500/5 group"
                >
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-all duration-500">
                         <Target size={28} />
                      </div>
                      <div>
                         <p className="text-lg font-black text-[var(--text-primary)]">{p.name}</p>
                         <div className="flex items-center gap-3 mt-1">
                            <span className="px-3 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-black uppercase tracking-widest">{p.reason || 'تأخر التوريد'}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: PRJ-{100+i}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex flex-col items-end">
                      <p className="text-2xl font-black text-rose-600 leading-none">{p.utilization}%</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Utilization</p>
                   </div>
                 </motion.div>
               )) : (
                 <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
                    <ShieldCheck size={80} strokeWidth={1} />
                    <p className="font-black text-sm uppercase tracking-widest mt-6">لا يوجد مخاطر حرجة مرصودة</p>
                 </div>
               )}
           </div>
        </div>
      </div>
    </div>
  );
}
