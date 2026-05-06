import { useState, useEffect } from 'react';
import { 
  Briefcase, Wallet, Users, BarChart3,
  TrendingUp, Calendar, Globe, Plus,
  Search, ArrowUpRight, DollarSign, PieChart,
  Target, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';

const GrantsPage = () => {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrants = async () => {
      try {
        const { data } = await api.get('/api/grants/');
        setGrants(data);
      } catch (err) {
        console.error('Failed to fetch grants', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrants();
  }, []);

  const stats = [
    { label: 'إجمالي التمويل', value: '$2.4M', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'المنح النشطة', value: grants.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'المانحين', value: 8, icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'نسبة الصرف', value: '64%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
              <Wallet size={24} />
            </div>
            إدارة المنح والتمويل
          </h1>
          <p className="text-slate-500 font-bold mt-1">تتبع التمويلات الدولية، توازن الميزانية مقابل الصرف (BvA)</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-12 px-6 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2">
            <Plus size={20} />
            إضافة منحة جديدة
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm"
          >
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', stat.bg)}>
              <stat.icon className={cn('w-6 h-6', stat.color)} />
            </div>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className="text-sm font-bold text-slate-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main BvA Tracking List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="text-indigo-600" />
              تتبع المنح (BvA)
            </h3>
            <div className="flex items-center gap-2">
               <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><Search size={20} /></button>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-3xl" />)}
              </div>
            ) : grants.map((grant) => (
              <motion.div
                key={grant.id}
                whileHover={{ y: -4 }}
                className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl">
                      {grant.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{grant.name}</h4>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-2 mt-1">
                        <Users size={14} />
                        المانح ID: {grant.donor_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-black text-slate-900">${grant.amount.toLocaleString()}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">إجمالي الميزانية</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-slate-500">تحليل الصرف الفعلي</span>
                    <span className="text-indigo-600">{Math.round((grant.spent / grant.amount) * 100)}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(grant.spent / grant.amount) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" 
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>المنفق: ${grant.spent.toLocaleString()}</span>
                    <span>المتبقي: ${(grant.amount - grant.spent).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                      <Calendar size={14} />
                      {grant.start_date} - {grant.end_date}
                    </div>
                  </div>
                  <button className="flex items-center gap-1 text-xs font-black text-indigo-600 hover:gap-2 transition-all">
                    عرض التقرير المالي <ArrowUpRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar: Donor Analysis & Portfolio */}
        <div className="space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-indigo-900 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
               <PieChart size={120} />
            </div>
            <h4 className="text-lg font-black relative z-10">توزيع المحفظة</h4>
            <p className="text-indigo-300 text-sm font-bold mt-1 relative z-10">حسب القطاعات التمويلية</p>
            
            <div className="mt-8 space-y-4 relative z-10">
              {[
                { label: 'الأمن الغذائي', color: 'bg-emerald-400', pct: 45 },
                { label: 'الصحة والمياه', color: 'bg-blue-400', pct: 30 },
                { label: 'الحماية', color: 'bg-orange-400', pct: 25 }
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{item.label}</span>
                    <span>{item.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full">
                    <div className={cn('h-full rounded-full', item.color)} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2">
              <Target className="text-orange-600" />
              أهداف التمويل Q2
            </h4>
            <div className="space-y-6">
              {[
                { label: 'تحصيل منح جديدة', current: 1.2, target: 2.0, unit: 'M' },
                { label: 'إغلاق تقارير المانحين', current: 8, target: 12, unit: '' }
              ].map((goal) => (
                <div key={goal.label} className="space-y-3">
                  <p className="text-sm font-black text-slate-900">{goal.label}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(goal.current / goal.target) * 100}%` }} />
                    </div>
                    <span className="text-xs font-black text-slate-500">{goal.current}/{goal.target}{goal.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="text-emerald-600" />
              <h5 className="font-black text-emerald-900 text-sm">الامتثال المالي</h5>
            </div>
            <p className="text-xs font-bold text-emerald-700 leading-relaxed">
              تم تدقيق جميع المنح المفتوحة وتتوافق مع معايير الشفافية الدولية IATI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrantsPage;
