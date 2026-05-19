import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, MessageSquare, Sparkles, Wand2, 
  CheckCircle2, Share2, History, TrendingUp,
  FileText, Plus, Search, BookOpen, UserCheck, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { apiClient } from '../lib/api-client';
import { useToast } from '../contexts/ToastContext';

export default function OutcomeHarvesting() {
  const toast = useToast();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      const data = await apiClient.getOutcomes();
      // If empty, put default mock for first time
      if (data.length === 0) {
        const mock = [
          { id: 1, title: 'تحول في الممارسات الزراعية لدى نازحي الحديدة', change: 'Behavioral', actor: 'لجنة المزارعين المحلية', impact: 'High', date: '2026-04-12' },
          { id: 2, title: 'نجاح نموذج الادخار النسائي في قرية السلام', change: 'Social', actor: 'مجموعة تمكين المرأة', impact: 'Transformative', date: '2026-04-15' },
        ];
        for (const s of mock) await apiClient.saveOutcome(s);
        setStories(await apiClient.getOutcomes());
      } else {
        setStories(data);
      }
      setLoading(false);
    };
    fetchStories();
  }, []);

  const handleAddStory = async () => {
    const newStory = {
      title: 'قصة نجاح جديدة ميدانية',
      change: 'Behavioral',
      actor: 'فريق الميدان',
      impact: 'High',
      date: new Date().toISOString().split('T')[0]
    };
    await apiClient.saveOutcome(newStory);
    setStories(await apiClient.getOutcomes());
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <Quote size={14} />
            Qualitative Outcome Harvesting & MSC
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">حصاد النتائج والأثر النوعي</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">تجاوز الأرقام لتوثيق قصص التغيير الحقيقية والتحولات السلوكية في المجتمعات.</p>
        </div>
        <button onClick={handleAddStory} className="h-12 px-6 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-2">
           <Plus size={18} /> توثيق نتيجة جديدة
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="card-elite p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120} /></div>
                  <h3 className="font-black text-xs uppercase tracking-widest opacity-70 mb-4">ذكاء المحتوى (AI Analysis)</h3>
                  <p className="text-xl font-black mb-6">يلاحظ النظام زيادة بنسبة 40% في قصص "تمكين المرأة" مقارنة بالربع السابق.</p>
                  <button onClick={() => { toast.show('جاري تجهيز التحليل النوعي...', 'info'); }} className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-black text-[10px] uppercase">عرض التحليل النوعي</button>
               </div>
               
               <div className="card-elite p-8 flex flex-col justify-between">
                  <div>
                     <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">إجمالي النتائج المحصودة</h3>
                     <div className="text-5xl font-black tracking-tighter">{stories.length}</div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-xs">
                     <TrendingUp size={14} /> +12 هذا الشهر
                  </div>
               </div>
            </div>

            <div className="card-elite overflow-hidden">
               <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="font-black text-sm flex items-center gap-3">
                    <BookOpen size={18} className="text-indigo-600" /> سجل قصص التغيير (MSC)
                  </h3>
                  {loading && <RefreshCw size={14} className="animate-spin text-indigo-600" />}
               </div>
               <div className="space-y-px">
                  {stories.map(story => (

                     <div key={story.id} className="p-6 hover:bg-black/5 transition-all border-b border-[var(--border)] last:border-none group">
                        <div className="flex items-start justify-between">
                           <div className="flex gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center shrink-0">
                                 <Quote size={20} />
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-[var(--text-primary)] mb-1 group-hover:text-indigo-600 transition-colors">{story.title}</h4>
                                 <div className="flex items-center gap-4 text-[10px] font-bold opacity-40 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><History size={12} /> {story.date}</span>
                                    <span className="flex items-center gap-1"><UserCheck size={12} /> {story.actor}</span>
                                 </div>
                              </div>
                           </div>
                           <div className={cn(
                              "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                              story.impact === 'Transformative' ? "bg-amber-500 text-white" : "bg-indigo-600 text-white"
                           )}>
                              {story.impact}
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <aside className="space-y-6">
            <div className="card-elite p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Wand2 size={120} /></div>
               <h3 className="font-black text-lg mb-4 relative z-10">تحويل القصص لتقارير</h3>
               <p className="text-sm font-medium opacity-80 leading-relaxed mb-8 relative z-10">
                  يمكن للمحرك دمج قصص MSC تلقائياً في تقارير المانحين Narrative Reports لدعم البيانات الرقمية.
               </p>
               <button onClick={() => { toast.show('جاري دمج النتائج المتشابهة...'); setTimeout(() => toast.show('تم دمج النتائج بنجاح'), 2000); }} className="w-full h-12 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-xl shadow-black/20 hover:scale-105 transition-all">بدء الدمج الذكي</button>
            </div>

            <div className="card-elite p-6 space-y-6">
               <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">منهجية التحليل</h3>
               <div className="space-y-4">
                  {[
                     { label: 'التحقق من المساهمة', progress: 85 },
                     { label: 'المصداقية النوعية', progress: 92 },
                     { label: 'تنوع المصادر', progress: 78 },
                  ].map(m => (
                     <div key={m.label} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                           <span className="opacity-60">{m.label}</span>
                           <span className="text-indigo-600">{m.progress}%</span>
                        </div>
                        <div className="h-1 bg-black/5 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-600" style={{ width: `${m.progress}%` }} />
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
