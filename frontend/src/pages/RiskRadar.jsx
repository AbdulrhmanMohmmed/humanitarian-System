import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, TrendingUp, AlertTriangle, 
  CheckCircle2, Clock, Map, Zap, 
  BarChart3, ArrowUpRight, Bell, ShieldCheck, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

const RISK_ALERTS = [
  { id: 1, type: 'Performance', level: 'Critical', msg: 'تأخر ملموس في مخرجات الأمن الغذائي (مديرية مأرب).', score: 85, trend: 'up' },
  { id: 2, type: 'Quality', level: 'High', msg: 'ارتفاع نسبة القيم الشاذة في استمارات الـ PDM.', score: 62, trend: 'stable' },
  { id: 3, type: 'Accountability', level: 'Medium', msg: 'تجاوز زمن الاستجابة (SLA) لـ 5 شكاوى حماية.', score: 45, trend: 'down' },
];

const RADAR_DATA = [
  { subject: 'الإنجاز', A: 120, fullMark: 150 },
  { subject: 'الجودة', A: 98, fullMark: 150 },
  { subject: 'المساءلة', A: 86, fullMark: 150 },
  { subject: 'الالتزام', A: 99, fullMark: 150 },
  { subject: 'الأمن', A: 85, fullMark: 150 },
];

export default function RiskRadar() {
  const toast = useToast();
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Monthly');

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/analytics/risk-overview');
      setRiskData(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const alerts = riskData?.alerts ?? RISK_ALERTS;
  const globalIndex = riskData?.global_risk_index ?? 72;
  const riskLevel = riskData?.risk_level ?? 'high';
  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <ShieldAlert size={14} />
            Risk Early Warning System (REWS)
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">رادار المخاطر المبكر</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">محرك تنبؤي يدمج البيانات المتعددة لاكتشاف الانهيارات المحتملة في المشاريع.</p>
        </div>
        
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-[var(--border)]">
           {['Weekly', 'Monthly', 'Quarterly'].map(t => (
             <button key={t} onClick={() => setPeriod(t)} className={cn("px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", t === period ? "bg-rose-600 text-white" : "hover:bg-black/5")}>{t}</button>
           ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="card-elite p-8 bg-white dark:bg-slate-900 border-none shadow-2xl relative overflow-hidden">
                  <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-6">مؤشر الخطر العام (Global Index)</h3>
                  <div className="flex items-end gap-4">
                     <span className="text-7xl font-black text-rose-600 tracking-tighter">{globalIndex}</span>
                     <div className="mb-2">
                        <div className="flex items-center text-rose-600 font-black text-xs gap-1">
                           <TrendingUp size={14} /> +15%
                        </div>
                        <span className="text-[10px] font-bold opacity-40 uppercase">مستوى: {riskLevel === 'critical' ? 'حرج' : riskLevel === 'high' ? 'عالي' : riskLevel === 'medium' ? 'متوسط' : 'منخفض'}</span>
                     </div>
                  </div>
                  <div className="mt-8 space-y-2">
                     <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span>مستوى التهديد</span>
                        <span className="text-rose-600">High Alert</span>
                     </div>
                     <div className="h-3 bg-black/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} className="h-full bg-rose-600 rounded-full" />
                     </div>
                  </div>
               </div>

               <div className="card-elite p-8 flex items-center justify-center">
                  <div className="w-full h-[250px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={RADAR_DATA}>
                           <PolarGrid stroke="var(--border-color)" />
                           <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 900, fill: 'var(--text-secondary)' }} />
                           <Radar name="Risk" dataKey="A" stroke="#e11d48" fill="#e11d48" fillOpacity={0.4} />
                        </RadarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>

            <div className="card-elite overflow-hidden">
               <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="font-black text-sm flex items-center gap-3 italic">
                    <Bell size={18} className="text-rose-600" /> مصفوفة التنبيهات الحرجة
                  </h3>
               </div>
               <div className="space-y-px">
                  {alerts.map((alert) => (
                     <div key={alert.id} className="p-6 hover:bg-black/5 transition-all border-b border-[var(--border)] last:border-none group">
                        <div className="flex items-start justify-between">
                           <div className="flex gap-4">
                              <div className={cn("p-3 rounded-2xl shrink-0", alert.level === 'Critical' ? 'bg-rose-600/10 text-rose-600' : 'bg-amber-500/10 text-amber-500')}>
                                 <AlertTriangle size={20} />
                              </div>
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{alert.type}</span>
                                    <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase", alert.level === 'Critical' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white')}>
                                       {alert.level}
                                    </span>
                                 </div>
                                 <p className="text-sm font-black text-[var(--text-primary)]">{alert.msg}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-2xl font-black">{alert.score}%</div>
                              <div className="text-[8px] font-black uppercase opacity-40">Risk Probability</div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <aside className="space-y-6">
            <div className="card-elite p-8 bg-rose-600 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck size={120} /></div>
               <h3 className="font-black text-xl mb-4 relative z-10">إجراءات وقائية فورية</h3>
               <p className="text-sm font-medium opacity-80 leading-relaxed mb-8 relative z-10">
                  يقترح النظام البدء بإجراء DQA مكثف في مديرية مأرب فوراً وتجميد الاعتمادات المالية للنشاط (ب) حتى التحقق.
               </p>
               <button onClick={() => { toast.show('تم تفعيل خطة الاستجابة للمخاطر بنجاح'); }} className="w-full h-12 bg-white text-rose-600 rounded-xl font-black text-xs shadow-xl shadow-black/20 hover:scale-105 transition-all">تفعيل خطة الاستجابة للمخاطر</button>
            </div>

            <div className="card-elite p-6 space-y-6">
               <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">عوامل التقييم المدمجة</h3>
               <div className="space-y-4">
                  {[
                     { label: 'تكرار الشكاوى الحساسة', weight: '40%' },
                     { label: 'انحراف جودة البيانات', weight: '25%' },
                     { label: 'الفجوة الزمنية للإنجاز', weight: '20%' },
                     { label: 'مخاطر حماية البيانات', weight: '15%' },
                  ].map(f => (
                     <div key={f.label} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black">
                           <span className="opacity-60 uppercase">{f.label}</span>
                           <span className="text-blue-600">{f.weight}</span>
                        </div>
                        <div className="h-1 bg-black/5 rounded-full">
                           <div className="h-full bg-blue-600 rounded-full" style={{ width: f.weight }} />
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
