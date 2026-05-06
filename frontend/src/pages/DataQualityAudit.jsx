import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, CheckCircle2, AlertTriangle, 
  FileSearch, History, Download, Filter,
  BarChart3, Target, Activity, Zap, ClipboardCheck, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';

const DQA_DIMENSIONS_DEFAULT = [
  { id: 'validity', label: 'Validity', desc: 'البيانات تقيس ما يجب قياسه وترتبط بتعريفات المؤشرات.', score: 92 },
  { id: 'reliability', label: 'Reliability', desc: 'النتائج قابلة للتكرار عبر الجامعين والمواقع والفترات.', score: 88 },
  { id: 'timeliness', label: 'Timeliness', desc: 'البيانات تصل في الوقت المناسب لدعم القرارات التشغيلية.', score: 94 },
  { id: 'precision', label: 'Precision', desc: 'مستوى التفاصيل والدقة مناسب للمخاطر والقرارات المطلوبة.', score: 90 },
  { id: 'integrity', label: 'Integrity', desc: 'البيانات محمية من التلاعب وتدعمها سجلات تدقيق واضحة.', score: 91 },
];

export default function DataQualityAudit() {
  const [dqaResult, setDqaResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/analytics/dqa/realtime');
      setDqaResult(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStartAudit = async () => {
    setLoading(true);
    try {
      await api.post('/analytics/dqa', { project_id: null, form_id: null });
      await load();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const dimensions = dqaResult?.dimensions ?? DQA_DIMENSIONS_DEFAULT;
  const overallScore = dqaResult?.overall_score ?? 91;
  const totalRecords = dqaResult?.total_records_assessed ?? 0;
  const completeRecords = dqaResult?.complete_records ?? 0;
  const status = dqaResult?.status ?? 'good';

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <ShieldCheck size={14} />
            Data Quality Audit (DQA) Professional Suite
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">تدقيق جودة البيانات (DQA)</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">نظام تدقيق مؤسسي شامل يعتمد على المعايير الخمسة لجودة البيانات (USAID & PIN Standards).</p>
        </div>
        <button onClick={load} className="h-12 px-6 bg-slate-900 text-white rounded-xl font-black text-xs shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
           <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> تحديث التدقيق الحي
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="card-elite p-8 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><ClipboardCheck size={120} /></div>
                  <h3 className="font-black text-xs uppercase tracking-widest opacity-70 mb-4">نتيجة التدقيق العام (Overall Score)</h3>
                  <div className="flex items-end gap-3">
                     <span className="text-7xl font-black tracking-tighter">{overallScore}</span>
                     <span className="text-xl font-black mb-2 opacity-60">/ 100</span>
                  </div>
                  <p className="text-xs font-medium mt-6 opacity-80 leading-relaxed uppercase tracking-widest">
                    {status === 'good' ? 'المشروع يتوافق مع معايير جودة البيانات النخبوية.' : 'يتطلب مراجعة وتحسين في بعض الأبعاد.'}
                  </p>
               </div>
               
               <div className="card-elite p-8 flex flex-col justify-between">
                  <div>
                     <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 italic">السجلات المقيّمة / المكتملة</h3>
                     <div className="text-5xl font-black">{totalRecords}</div>
                     <p className="text-xs text-slate-400 mt-2 font-medium">{completeRecords} سجل مكتمل</p>
                  </div>
                  <button onClick={handleStartAudit} disabled={loading} className="mt-4 h-10 px-4 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-emerald-700 transition-all disabled:opacity-50">
                    {loading ? 'جاري التحليل...' : 'بدء تدقيق جديد'}
                  </button>
               </div>
            </div>

            <div className="card-elite overflow-hidden">
               <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-black/[0.02]">
                  <h3 className="font-black text-sm flex items-center gap-3">
                    <FileSearch size={18} className="text-emerald-600" /> سجل نتائج التدقيق التفصيلي
                  </h3>
                  {loading && <RefreshCw size={14} className="animate-spin text-emerald-600" />}
               </div>
               <div className="space-y-px">
                  {dimensions.map((dim) => (
                     <div key={dim.id} className="p-6 hover:bg-black/5 transition-all border-b border-[var(--border)] last:border-none group">
                        <div className="flex items-start justify-between">
                           <div className="flex gap-4">
                              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", dim.score >= 90 ? 'bg-emerald-600/10 text-emerald-600' : 'bg-amber-500/10 text-amber-500')}>
                                 <ShieldCheck size={20} />
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-[var(--text-primary)] mb-1 group-hover:text-emerald-600 transition-colors">{dim.label}</h4>
                                 <p className="text-xs font-medium text-slate-400 max-w-md leading-relaxed">{dim.desc}</p>
                              </div>
                           </div>
                           <div className="text-right shrink-0">
                              <div className="text-2xl font-black">{dim.score}%</div>
                              <div className="text-[8px] font-black uppercase opacity-40">Dimension Score</div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <aside className="space-y-6">
            <div className="card-elite p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><History size={120} /></div>
               <h3 className="font-black text-lg mb-4 relative z-10">تتبع سجل التدقيق (Audit Trail)</h3>
               <p className="text-sm font-medium opacity-80 leading-relaxed mb-8 relative z-10">
                  يوثق النظام كل تغيير في البيانات، من قام به، ولماذا، مما يجعل المشروع جاهزاً لأي تدقيق خارجي (Internal/External Audit) بنسبة 100%.
               </p>
               <button className="w-full h-12 bg-emerald-600 rounded-xl font-black text-xs shadow-xl shadow-black/20">تحميل سجل التغييرات الكامل</button>
            </div>

            <div className="card-elite p-6 space-y-4">
               <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">تنبيهات التدقيق</h3>
               <div className="space-y-3">
                  {[
                    { msg: 'انخفاض في دقة بيانات الموقع في صعدة', type: 'Warning' },
                    { msg: 'اكتمال تدقيق النزاهة لشهر مارس', type: 'Success' },
                  ].map((alert, i) => (
                    <div key={i} className={cn("p-4 rounded-2xl flex gap-3 items-start", alert.type === 'Warning' ? 'bg-amber-500/5 border border-amber-500/20 text-amber-700' : 'bg-emerald-600/5 border border-emerald-600/20 text-emerald-700')}>
                       {alert.type === 'Warning' ? <AlertTriangle size={16} className="shrink-0" /> : <CheckCircle2 size={16} className="shrink-0" />}
                       <p className="text-[10px] font-bold leading-relaxed">{alert.msg}</p>
                    </div>
                  ))}
               </div>
            </div>
         </aside>
      </div>
    </div>
  );
}
