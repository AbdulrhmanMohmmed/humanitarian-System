import { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, 
  ArrowUpRight, ArrowDownRight, Activity,
  Filter, Download, Calendar, PieChart,
  AlertCircle, CheckCircle2, MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';

const BVADashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch for project 1 as default for demo
    const fetchData = async () => {
      try {
        const { data } = await api.get('/api/finance/engine/bva/1');
        setData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-12 text-center font-black animate-pulse">جاري تحميل البيانات المالية...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
             <div className="p-2 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-100">
               <Activity size={28} />
             </div>
             تحليل الميزانية مقابل المنصرف (BVA)
          </h1>
          <p className="text-slate-500 font-bold mt-1">تتبع الصرف اللحظي، معدل الاحتراق (Burn Rate)، وفروقات العملة</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-12 px-6 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <Filter size={18} />
            تصفية المانحين
          </button>
          <button className="h-12 px-6 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
            <Download size={18} />
            تقرير مالي مفصل
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { label: 'إجمالي الميزانية', value: `$${data?.total_budget.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
           { label: 'إجمالي المنصرف', value: `$${data?.total_spent.toLocaleString()}`, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
           { label: 'المتبقي', value: `$${data?.remaining.toLocaleString()}`, icon: PieChart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
           { label: 'معدل الاحتراق', value: `${data?.burn_rate.toFixed(1)}%`, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
         ].map((stat, i) => (
           <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', stat.bg)}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <p className="text-xs font-bold text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
           </motion.div>
         ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         <div className="xl:col-span-2 space-y-6">
            <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden">
               <h3 className="text-xl font-black text-slate-900 mb-8">التوزيع القطاعي للصرف</h3>
               <div className="space-y-6">
                  {data?.allocations.map((alloc, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between items-center px-1">
                          <span className="text-sm font-black text-slate-700">{alloc.sector}</span>
                          <span className="text-xs font-bold text-slate-400">Target: ${alloc.allocated_amount.toLocaleString()}</span>
                       </div>
                       <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(Math.random() * 80) + 10}%` }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-8 rounded-[3rem] bg-slate-900 text-white shadow-2xl">
               <h3 className="text-xl font-black mb-8">توقعات الصرف الشهرية</h3>
               <div className="h-48 flex items-end gap-3 px-2">
                  {[20, 35, 45, 30, 55, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      className="flex-1 bg-white/10 hover:bg-emerald-500 transition-colors rounded-t-lg relative group"
                    >
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white text-slate-900 px-2 py-1 rounded text-[10px] font-black shadow-lg">
                         ${(h*100).toLocaleString()}
                       </div>
                    </motion.div>
                  ))}
               </div>
               <div className="flex justify-between mt-4 text-[10px] font-black text-slate-500 uppercase px-2">
                  <span>Jan</span>
                  <span>Dec</span>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
               <h3 className="text-lg font-black text-slate-900 mb-6">فروقات العملة (Yemen Context)</h3>
               <div className="space-y-4">
                  {[
                    { label: 'YER (Sana\'a)', rate: 530, status: 'Stable', color: 'text-emerald-500' },
                    { label: 'YER (Aden)', rate: 1680, status: 'Volatile', color: 'text-rose-500' },
                    { label: 'SAR / USD', rate: 3.75, status: 'Fixed', color: 'text-blue-500' }
                  ].map((rate, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                       <div>
                          <p className="text-xs font-black text-slate-700">{rate.label}</p>
                          <p className={cn('text-[10px] font-bold mt-0.5', rate.color)}>{rate.status}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-lg font-black text-slate-900">{rate.rate}</p>
                          <p className="text-[10px] font-bold text-slate-400">Last updated: 2h ago</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10"><DollarSign size={80} /></div>
               <div className="relative z-10">
                 <h4 className="font-black text-xl mb-2">تنبيه الميزانية</h4>
                 <p className="text-xs font-bold text-indigo-100 opacity-80 leading-relaxed">وصل الصرف في قطاع المياه إلى 85% من الميزانية المخصصة لهذا الربع. يرجى مراجعة الخطة.</p>
                 <button className="mt-6 w-full py-3 rounded-xl bg-white text-indigo-600 font-black text-sm hover:bg-indigo-50 transition-all">مراجعة التخصيصات</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default BVADashboard;
