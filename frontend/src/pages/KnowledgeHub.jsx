import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, Brain, Sparkles, MessageSquare, 
  ArrowRight, Bookmark, Plus,
  TrendingUp, Zap, CheckCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';

const DEFAULT_LESSONS = [
  { id: 1, sector: 'WASH', title: 'تحسين كفاءة المضخات في المناطق الجبلية', text: 'بناءً على 4 مشاريع سابقة، تبين أن استخدام الصمامات الثنائية يقلل الصيانة بنسبة 30%.', tags: ['تقني', 'مياه'], impact: 'High' },
  { id: 2, sector: 'Food', title: 'توقيت التوزيع في شهر رمضان', text: 'لوحظ أن التوزيع في الصباح الباكر يقلل من الازدحام بنسبة 45% ويحسن كرامة المستفيدين.', tags: ['عملياتي', 'لوجستيات'], impact: 'Medium' },
  { id: 3, sector: 'Protection', title: 'خصوصية بيانات الحالات الحساسة', text: 'التشفير المزدوج للأسماء في استمارات الميدان ضروري جداً لضمان أمان المستفيدين.', tags: ['حماية', 'بيانات'], impact: 'Critical' },
  { id: 4, sector: 'Food', title: 'التحقق المزدوج من قوائم المستفيدين', text: 'استخدام تقنية QR code مع الهوية الورقية يقلل الأخطاء في التوزيع بنسبة 60%.', tags: ['تقني', 'أمن بيانات'], impact: 'High' },
  { id: 5, sector: 'Education', title: 'دمج الجلسات الترفيهية مع التعليمية', text: 'أثبتت التجربة أن إضافة 15 دقيقة ترفيهية ترفع نسبة الحضور بنسبة 25% في مدارس الطوارئ.', tags: ['تعليم', 'مجتمع'], impact: 'Medium' },
];

export default function KnowledgeHub() {
  const toast = useToast();
  const [activeSector, setActiveSector] = useState('All');
  const [lessons, setLessons] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLesson, setNewLesson] = useState({ sector: 'WASH', title: '', text: '', impact: 'Medium' });

  useEffect(() => {
    // Load from localStorage (seeded or user-added)
    const local = localStorage.getItem('hiaos_data_lessons');
    if (local) {
      setLessons(JSON.parse(local));
    } else {
      setLessons(DEFAULT_LESSONS);
      localStorage.setItem('hiaos_data_lessons', JSON.stringify(DEFAULT_LESSONS));
    }
  }, []);

  const addLesson = () => {
    if (!newLesson.title.trim()) return;
    const updated = [...lessons, { ...newLesson, id: Date.now(), tags: [newLesson.sector] }];
    setLessons(updated);
    localStorage.setItem('hiaos_data_lessons', JSON.stringify(updated));
    setShowAddModal(false);
    setNewLesson({ sector: 'WASH', title: '', text: '', impact: 'Medium' });
  };

  const filtered = lessons.filter(l => activeSector === 'All' || l.sector === activeSector);
  const sectors = ['All', ...new Set(lessons.map(l => l.sector))];

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <Brain size={14} />
            HIAOS Knowledge Engine & Institutional Memory
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">مستودع المعرفة والدروس المستفادة</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">تحويل التجارب الميدانية والتعليقات إلى "رؤى ذكية" لرفع كفاءة المشاريع المستقبلية.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="h-12 px-6 bg-amber-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center gap-2">
          <Plus size={18} /> تسجيل درس جديد
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3 space-y-8">
            <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
               {sectors.map(s => (
                 <button 
                  key={s} 
                  onClick={() => setActiveSector(s)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                    activeSector === s ? "bg-amber-500 text-white shadow-lg" : "bg-white dark:bg-slate-900 border border-[var(--border)] text-slate-400"
                  )}
                 >
                   {s}
                 </button>
               ))}
            </div>

            {filtered.length === 0 ? (
              <div className="card-elite p-12 text-center text-slate-400">
                <Brain size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-bold">لا توجد دروس في هذا القطاع بعد</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {filtered.map((lesson, i) => (
                   <motion.div 
                      key={lesson.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="card-elite p-8 space-y-6 group hover:border-amber-500/30 transition-all"
                   >
                      <div className="flex items-center justify-between">
                         <span className={cn(
                           "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter",
                           lesson.impact === 'Critical' ? 'bg-rose-600 text-white' : lesson.impact === 'High' ? 'bg-orange-500 text-white' : 'bg-amber-500/10 text-amber-500'
                         )}>{lesson.impact} Impact</span>
                         <span className="text-[10px] font-bold text-slate-400 bg-black/5 px-2 py-1 rounded-lg">{lesson.sector}</span>
                      </div>
                      <div>
                         <h3 className="text-lg font-black text-[var(--text-primary)] group-hover:text-amber-500 transition-colors">{lesson.title}</h3>
                         <p className="text-sm font-medium text-slate-400 mt-2 leading-relaxed">{lesson.text}</p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                         <div className="flex gap-2 flex-wrap">
                            {(lesson.tags || []).map(t => <span key={t} className="text-[9px] font-black text-slate-400">#{t}</span>)}
                         </div>
                         <button onClick={() => { toast.show('يتم عرض التفاصيل', 'info'); }} className="text-[10px] font-black text-amber-500 flex items-center gap-1">عرض التفاصيل <ArrowRight size={14} /></button>
                      </div>
                   </motion.div>
                 ))}
              </div>
            )}
         </div>

         <aside className="space-y-6">
            <div className="card-elite p-8 bg-amber-500 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120} /></div>
               <h3 className="font-black text-lg mb-4 relative z-10">الذكاء التراكمي</h3>
               <p className="text-sm font-medium opacity-80 leading-relaxed mb-8 relative z-10">
                  يقوم المحرك الذكي بربط الدروس الموثقة آلياً مع "مصمم المشاريع" لتقديم توصيات أثناء التخطيط.
               </p>
               <button onClick={() => { toast.show('جاري تحليل الاتجاهات...'); setTimeout(() => toast.show('اكتمل التحليل'), 2000); }} className="w-full h-12 bg-white text-amber-500 rounded-xl font-black text-xs">تحليل اتجاهات المعرفة</button>
            </div>

            <div className="card-elite p-6 space-y-6">
               <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">إحصائيات المعرفة</h3>
               <div className="space-y-4">
                  {[
                     { label: 'دروس موثقة', val: lessons.length, icon: CheckCircle2, color: 'text-emerald-600' },
                     { label: 'ذات أثر عالٍ', val: lessons.filter(l => l.impact === 'High' || l.impact === 'Critical').length, icon: TrendingUp, color: 'text-blue-600' },
                     { label: 'قطاعات مُغطاة', val: new Set(lessons.map(l => l.sector)).size, icon: Zap, color: 'text-amber-500' },
                  ].map(s => (
                     <div key={s.label} className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-xl bg-black/5 dark:bg-white/5", s.color)}><s.icon size={18} /></div>
                        <div>
                           <div className="text-sm font-black">{s.val}</div>
                           <div className="text-[9px] font-bold text-slate-400 uppercase">{s.label}</div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </aside>
      </div>

      {/* Add Lesson Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-8 w-full max-w-lg space-y-4 shadow-2xl">
              <h2 className="text-lg font-black">تسجيل درس مستفاد جديد</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">القطاع</label>
                  <select value={newLesson.sector} onChange={e => setNewLesson({...newLesson, sector: e.target.value})}
                    className="w-full h-11 border border-[var(--border)] rounded-xl px-3 bg-transparent font-bold text-sm">
                    {['WASH', 'Food', 'Protection', 'Education', 'Health', 'Shelter'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">مستوى التأثير</label>
                  <select value={newLesson.impact} onChange={e => setNewLesson({...newLesson, impact: e.target.value})}
                    className="w-full h-11 border border-[var(--border)] rounded-xl px-3 bg-transparent font-bold text-sm">
                    {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">العنوان *</label>
                <input value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})}
                  className="w-full h-11 border border-[var(--border)] rounded-xl px-3 bg-transparent font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="عنوان الدرس المستفاد" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">الوصف</label>
                <textarea value={newLesson.text} onChange={e => setNewLesson({...newLesson, text: e.target.value})}
                  className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-transparent font-medium text-sm outline-none focus:ring-2 focus:ring-amber-500" rows={3}
                  placeholder="ما الذي تعلمناه وكيف يمكن تطبيقه مستقبلاً؟" />
              </div>
              <div className="flex gap-3">
                <button onClick={addLesson} className="flex-1 h-12 bg-amber-500 text-white rounded-xl font-black text-sm hover:bg-amber-600 transition">حفظ الدرس</button>
                <button onClick={() => setShowAddModal(false)} className="flex-1 h-12 border border-[var(--border)] rounded-xl font-black text-sm hover:bg-black/5 transition">إلغاء</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
