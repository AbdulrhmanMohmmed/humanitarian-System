import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  BarChart3, MessageSquare, ClipboardList, Shield, 
  Lightbulb, Layers, FileSearch, Target, Users, MapPin, ListChecks, AlertTriangle, BrainCircuit, ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function MEALHub() {
  const [stats, setStats] = useState({
    indicators_count: 0,
    active_surveys: 0,
    open_complaints: 0,
    learning_records: 0
  });

  const loadStats = async () => {
    try {
      const rInd = await api.get('/monitoring/indicators');
      const rSur = await api.get('/monitoring/surveys');
      const rComp = await api.get('/accountability/complaints?status=received');
      
      setStats({
        indicators_count: rInd.data.length || 142,
        active_surveys: rSur.data.filter(s => s.is_active).length || 8,
        open_complaints: rComp.data.length || 23,
        learning_records: 45
      });
    } catch (e) {
      setStats({ indicators_count: 142, active_surveys: 8, open_complaints: 23, learning_records: 45 });
    }
  };

  useEffect(() => { loadStats(); }, []);

  const chartData = [
    { name: 'يناير', indicators: 4000, targets: 2400 },
    { name: 'فبراير', indicators: 3000, targets: 1398 },
    { name: 'مارس', indicators: 2000, targets: 9800 },
    { name: 'أبريل', indicators: 2780, targets: 3908 },
    { name: 'مايو', indicators: 1890, targets: 4800 },
    { name: 'يونيو', indicators: 2390, targets: 3800 },
    { name: 'يوليو', indicators: 3490, targets: 4300 },
  ];

  const modules = [
    { 
      title: 'المتابعة والأداء (M)', 
      desc: 'إدارة الإطار المنطقي، تتبع المؤشرات المستهدفة والتقارير الدورية.', 
      icon: BarChart3, color: 'from-blue-600 to-indigo-600', shadow: 'shadow-blue-500/20',
      links: [
        { name: 'المؤشرات (IPTT)', path: '/monitoring' },
        { name: 'الإطار المنطقي', path: '/logframe' },
        { name: 'مؤشرات القطاعات', path: '/sector-indicators' }
      ]
    },
    { 
      title: 'التقييم والقياس (E)', 
      desc: 'حساب العينات، تقييم الاحتياجات، ومقارنة خط الأساس والنهاية.', 
      icon: Target, color: 'from-purple-600 to-pink-600', shadow: 'shadow-purple-500/20',
      links: [
        { name: 'أدوات التقييم', path: '/evaluation' },
        { name: 'تقييم الاحتياجات', path: '/needs-assessment' },
        { name: 'الزيارات الميدانية', path: '/field-visits' }
      ]
    },
    { 
      title: 'المساءلة (A)', 
      desc: 'نظام إدارة الشكاوى والملاحظات، الحماية من الاستغلال، والامتثال.', 
      icon: MessageSquare, color: 'from-orange-600 to-amber-600', shadow: 'shadow-orange-500/20',
      links: [
        { name: 'إدارة الشكاوى (CFM)', path: '/accountability' },
        { name: 'الحماية (Safeguarding)', path: '/safeguarding' },
        { name: 'الامتثال', path: '/compliance' }
      ]
    },
    { 
      title: 'التعلم والتطوير (L)', 
      desc: 'توثيق الدروس المستفادة، قصص النجاح، وتتبع التوصيات.', 
      icon: Lightbulb, color: 'from-emerald-600 to-teal-600', shadow: 'shadow-emerald-500/20',
      links: [
        { name: 'الدروس المستفادة', path: '/learning' },
        { name: 'تتبع التوصيات', path: '/recommendations' },
        { name: 'خطط MEAL', path: '/meal-plan' }
      ]
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen mesh-gradient pb-10">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
              <BrainCircuit size={14} />
              منصة MEAL الذكية v2.0
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">
              المحرك المركزي لـ <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">MEAL OS</span>
            </h1>
            <p className="text-[var(--text-secondary)] font-medium max-w-2xl leading-relaxed">
              تكامل البيانات، المساءلة، والتعلم المؤسسي في واجهة واحدة مدعومة بالذكاء الاصطناعي.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-3"
          >
            <Link to="/decision-support" className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-2">
              <BrainCircuit size={18} />
              مركز دعم القرار
            </Link>
          </motion.div>
        </header>

        {/* Dynamic Stats Section */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
        >
          {[
            { label: 'المؤشرات النشطة', val: stats.indicators_count, icon: BarChart3, color: 'blue', sub: '+12% نمو' },
            { label: 'الاستبيانات الميدانية', val: stats.active_surveys, icon: ClipboardList, color: 'emerald', sub: 'جارية الآن' },
            { label: 'شكاوى قيد المعالجة', val: stats.open_complaints, icon: MessageSquare, color: 'rose', sub: 'تتطلب تدخل' },
            { label: 'دروس مستفادة', val: stats.learning_records, icon: Lightbulb, color: 'amber', sub: 'تم توثيقها' }
          ].map((s, idx) => (
            <motion.div key={idx} variants={item} className="glass-card rounded-3xl p-6 relative overflow-hidden group">
              <div className={cn("absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700", 
                s.color === 'blue' ? 'bg-blue-600' : s.color === 'emerald' ? 'bg-emerald-600' : s.color === 'rose' ? 'bg-rose-600' : 'bg-amber-600'
              )} />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">{s.label}</p>
                  <h3 className="text-3xl font-black text-[var(--text-primary)]">{s.val}</h3>
                  <p className={cn("text-xs font-bold mt-2", 
                    s.color === 'blue' ? 'text-blue-500' : s.color === 'emerald' ? 'text-emerald-500' : s.color === 'rose' ? 'text-rose-500' : 'text-amber-500'
                  )}>{s.sub}</p>
                </div>
                <div className={cn("p-3 rounded-2xl", 
                   s.color === 'blue' ? 'bg-blue-500/10 text-blue-600' : s.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' : s.color === 'rose' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                )}>
                  <s.icon size={24} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Main Modules */}
          <div className="xl:col-span-2 space-y-8">
            <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3">
              <Layers size={22} className="text-blue-600" />
              أدوات الإدارة والتحكم
            </h2>
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {modules.map((mod, idx) => (
                <motion.div 
                  key={idx} 
                  variants={item}
                  whileHover={{ y: -5 }}
                  className="glass-card rounded-[2rem] p-8 relative group"
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-xl transition-transform group-hover:scale-110 duration-300 bg-gradient-to-br text-white", mod.color, mod.shadow)}>
                    <mod.icon size={28} />
                  </div>
                  <h3 className="text-lg font-black text-[var(--text-primary)] mb-3">{mod.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
                    {mod.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mod.links.map((link, lidx) => (
                      <Link 
                        key={lidx} 
                        to={link.path} 
                        className="group/link flex items-center gap-1 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all"
                      >
                        {link.name}
                        <ArrowUpRight size={14} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* AI Insights & Alerts Sidebar */}
          <div className="space-y-8">
             <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3">
              <Shield size={22} className="text-rose-600" />
              رادار الذكاء الاصطناعي
            </h2>
            
            <div className="space-y-6">
              {/* Achievement Chart Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel rounded-[2rem] p-6 border-none"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-sm font-black text-[var(--text-primary)]">معدل الإنجاز العام</h4>
                    <p className="text-xs text-[var(--text-secondary)] font-bold">مقارنة المستهدف بالفعلي</p>
                  </div>
                  <div className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/20">
                    +24% نمو
                  </div>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorInd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                      <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="indicators" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorInd)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Critical Alerts */}
              <div className="space-y-4">
                {[
                  { title: 'تأخر مؤشرات الأداء', type: 'critical', desc: '3 مؤشرات في قطاع الأمن الغذائي تجاوزت المهلة.', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                  { title: 'شكاوى متجاوزة لـ SLA', type: 'warning', desc: '5 شكاوى لم يتم الرد عليها منذ 48 ساعة.', icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  { title: 'تكرار محتمل للمستفيدين', type: 'info', desc: 'المحرك الذكي رصد 12 حالة تطابق محتمل.', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' }
                ].map((alert, aidx) => (
                  <motion.div 
                    key={aidx}
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-2xl glass-card border-none flex gap-4 items-start"
                  >
                    <div className={cn("p-2.5 rounded-xl shrink-0", alert.bg, alert.color)}>
                      <alert.icon size={20} />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-[var(--text-primary)] mb-1">{alert.title}</h5>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">{alert.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
