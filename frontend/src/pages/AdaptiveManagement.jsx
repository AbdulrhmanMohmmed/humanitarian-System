import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, ArrowRightLeft, AlertTriangle, CheckCircle2, 
  Settings, TrendingUp, HelpCircle, MessageSquare,
  Activity, Play, Pause, RotateCcw, ShieldCheck, Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';

const DECISIONS_DEFAULT = [
  { id: 1, type: 'Pivot', title: 'تحويل النشاط (ب) من تدريب حضوري إلى تعليم عن بعد', reason: 'مخاطر أمنية متزايدة في الموقع', status: 'Implemented', impact: 'Positive' },
  { id: 2, type: 'Persevere', title: 'الاستمرار في خطة التوزيع الحالية مع زيادة اللجان', reason: 'كفاءة عالية في الوصول للمستهدفين', status: 'Pending Approval', impact: 'Neutral' },
];

export default function AdaptiveManagement() {
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [decisions, setDecisions] = useState(DECISIONS_DEFAULT);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDecision, setNewDecision] = useState({ type: 'Pivot', title: '', reason: '', status: 'Pending Approval', impact: 'Neutral' });

  useEffect(() => {
    api.get('/analytics/risk-overview').then(r => {
      setRiskAlerts(r.data.alerts ?? []);
    }).catch(console.error);
  }, []);

  const addDecision = () => {
    if (!newDecision.title.trim()) return;
    setDecisions(prev => [...prev, { ...newDecision, id: prev.length + 1 }]);
    setNewDecision({ type: 'Pivot', title: '', reason: '', status: 'Pending Approval', impact: 'Neutral' });
    setShowAddForm(false);
  };

  const liveAlert = riskAlerts[0];

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <ArrowRightLeft size={14} />
            Real-time Adaptive Management Center
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">مركز الإدارة التكيفية</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">اتخاذ قرارات "تعديل المسار" بناءً على البيانات الفورية لضمان نجاح المشروع في الظروف المتغيرة.</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="h-12 px-6 bg-amber-500 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all">
          <Plus size={18} /> تسجيل قرار تكيفي
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-8">
            {/* Live AI Alert from backend */}
            {liveAlert && (
              <div className="card-elite p-8 border-l-4 border-l-amber-500 bg-amber-500/[0.02]">
                 <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xl shadow-amber-500/20">
                       <AlertTriangle size={32} />
                    </div>
                    <div className="space-y-4">
                       <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase bg-amber-500 text-white px-2 py-0.5 rounded">LIVE ALERT</span>
                            <span className="text-[10px] font-black opacity-40 uppercase">{liveAlert.type}</span>
                          </div>
                          <h3 className="text-xl font-black text-[var(--text-primary)]">{liveAlert.msg}</h3>
                          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">احتمالية الخطر: {liveAlert.score}% — هل تود تعديل مسار النشاط؟</p>
                       </div>
                       <div className="flex gap-4">
                          <button onClick={() => setShowAddForm(true)} className="px-6 h-10 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20">تعديل المسار (Pivot)</button>
                          <button className="px-6 h-10 bg-black/5 rounded-xl font-black text-[10px] uppercase tracking-widest">تحليل أعمق</button>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* Add Decision Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card-elite p-8 border-t-4 border-t-amber-500">
                  <h3 className="font-black text-sm mb-6">تسجيل قرار تكيفي جديد</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-[10px] font-black uppercase opacity-60 block mb-2">نوع القرار</label>
                      <select value={newDecision.type} onChange={e => setNewDecision({...newDecision, type: e.target.value})} className="w-full h-10 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-3 font-black text-sm outline-none">
                        <option value="Pivot">Pivot (تعديل المسار)</option>
                        <option value="Persevere">Persevere (الاستمرار)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase opacity-60 block mb-2">الأثر المتوقع</label>
                      <select value={newDecision.impact} onChange={e => setNewDecision({...newDecision, impact: e.target.value})} className="w-full h-10 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-3 font-black text-sm outline-none">
                        <option value="Positive">Positive</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Risk">Risk</option>
                      </select>
                    </div>
                  </div>
                  <input value={newDecision.title} onChange={e => setNewDecision({...newDecision, title: e.target.value})} placeholder="عنوان القرار..." className="w-full h-10 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 font-bold text-sm outline-none mb-3" />
                  <input value={newDecision.reason} onChange={e => setNewDecision({...newDecision, reason: e.target.value})} placeholder="سبب القرار..." className="w-full h-10 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 font-bold text-sm outline-none mb-4" />
                  <div className="flex gap-3">
                    <button onClick={addDecision} className="flex-1 h-10 bg-amber-500 text-white rounded-xl font-black text-xs uppercase">حفظ القرار</button>
                    <button onClick={() => setShowAddForm(false)} className="flex-1 h-10 bg-black/5 rounded-xl font-black text-xs uppercase">إلغاء</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="card-elite overflow-hidden">
               <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="font-black text-sm flex items-center gap-3 italic">
                    <Activity size={18} className="text-amber-500" /> سجل الإدارة التكيفية (Pivot/Persevere Log)
                  </h3>
                  <span className="text-[10px] font-black text-slate-400">{decisions.length} قرار مسجل</span>
               </div>
               <div className="space-y-px">
                  {decisions.map(d => (
                     <div key={d.id} className="p-6 hover:bg-black/5 transition-all border-b border-[var(--border)] last:border-none">
                        <div className="flex items-start justify-between">
                           <div className="flex gap-4">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", d.type === 'Pivot' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-600/10 text-emerald-600')}>
                                 {d.type === 'Pivot' ? <RotateCcw size={18} /> : <Play size={18} />}
                              </div>
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase", d.type === 'Pivot' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white')}>{d.type}</span>
                                    <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">{d.status}</span>
                                 </div>
                                 <h4 className="text-sm font-black text-[var(--text-primary)] mb-2">{d.title}</h4>
                                 <p className="text-xs font-medium text-slate-400">السبب: {d.reason}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className={cn("text-[10px] font-black uppercase flex items-center gap-1", d.impact === 'Positive' ? 'text-emerald-600' : 'text-slate-400')}>
                                 الأثر المتوقع <TrendingUp size={12} />
                              </div>
                              <span className="text-xs font-black">{d.impact}</span>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <aside className="space-y-6">
            <div className="card-elite p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck size={120} /></div>
               <h3 className="font-black text-lg mb-4 relative z-10">حوكمة القرارات</h3>
               <p className="text-sm font-medium opacity-80 leading-relaxed mb-8 relative z-10">
                  يتم توثيق كل قرار تكيفي لربطه لاحقاً بـ "الدروس المستفادة"، مما يسهل على المانحين فهم مبررات التغيير أثناء التدقيق.
               </p>
               <button className="w-full h-12 bg-amber-500 text-white rounded-xl font-black text-xs shadow-xl shadow-amber-500/20">تفعيل سير عمل الحوكمة</button>
            </div>

            <div className="card-elite p-6 space-y-6">
               <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">مؤشرات المرونة (Flexibility)</h3>
               <div className="space-y-4">
                  {[
                     { label: 'سرعة الاستجابة للتنبيهات', score: 92 },
                     { label: 'دقة المبررات', score: 88 },
                     { label: 'موافقة المانحين على التعديل', score: 75 },
                  ].map(r => (
                     <div key={r.label} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black">
                           <span className="opacity-60 uppercase">{r.label}</span>
                           <span className="text-amber-500">{r.score}%</span>
                        </div>
                        <div className="h-1 bg-black/5 rounded-full overflow-hidden">
                           <div className="h-full bg-amber-500" style={{ width: `${r.score}%` }} />
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
