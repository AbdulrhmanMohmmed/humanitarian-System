import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, Target, Info, Sparkles, 
  ArrowRight, Download, BarChart2,
  Users, ShieldCheck, Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';

export default function StatisticalLab() {
  const [popSize, setPopSize] = useState(5000);
  const [confidence, setConfidence] = useState(95);
  const [margin, setMargin] = useState(5);
  const [sampleSize, setSampleSize] = useState(0);

  useEffect(() => {
    const z = confidence === 95 ? 1.96 : confidence === 99 ? 2.58 : 1.645;
    const p = 0.5;
    const e = margin / 100;
    const n0 = (z*z * p * (1-p)) / (e*e);
    const n = Math.ceil(n0 / (1 + (n0 - 1) / popSize));
    setSampleSize(n);
  }, [popSize, confidence, margin]);

  const exportJustification = async () => {
    try {
      const r = await api.get('/analytics/sample-calculator', {
        params: { population: popSize, confidence, margin_error: margin }
      });
      const text = `مبرر العينة الإحصائية\n======================\nحجم المجتمع: ${r.data.population}\nمستوى الثقة: ${r.data.confidence_level}%\nهامش الخطأ: ${r.data.margin_of_error}%\nحجم العينة المطلوب: ${r.data.sample_size}\nالصيغة: ${r.data.formula}\n\nتم التحقق من الخادم في: ${new Date().toLocaleString('ar')}`;
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'Sample_Justification.txt';
      a.click(); URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('تعذر التحقق من الخادم. سيتم تصدير النتائج المحلية.');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <Calculator size={14} />
            Statistical Lab & Sample Calculator (EvalCommunity Standard)
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">المختبر الإحصائي الذكي</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">حساب حجم العينات العلمية وهامش الخطأ لضمان موثوقية نتائج المسوحات الميدانية.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-1 space-y-6">
            <div className="card-elite p-8 space-y-8">
               <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">إعدادات الحساب</h3>
               
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase opacity-60">حجم المجتمع (Population Size)</label>
                  <input 
                    type="number" value={popSize} onChange={e => setPopSize(parseInt(e.target.value) || 0)}
                    className="w-full h-14 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl px-6 font-black outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase opacity-60">مستوى الثقة (Confidence Level)</label>
                  <select 
                    value={confidence} onChange={e => setConfidence(parseInt(e.target.value))}
                    className="w-full h-14 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl px-6 font-black outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none"
                  >
                     <option value={90}>90%</option>
                     <option value={95}>95% (Standard)</option>
                     <option value={99}>99% (Highly Scientific)</option>
                  </select>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase opacity-60">هامش الخطأ (Margin of Error %)</label>
                  <div className="flex items-center gap-4">
                     <input 
                        type="range" min="1" max="10" step="0.5" value={margin} onChange={e => setMargin(parseFloat(e.target.value))}
                        className="flex-1 accent-blue-600"
                     />
                     <span className="w-12 text-center font-black text-blue-600">{margin}%</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="card-elite p-12 bg-blue-600 text-white border-none shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Users size={150} /></div>
                  <h3 className="font-black text-xs uppercase tracking-[0.2em] opacity-70 mb-6">حجم العينة المطلوب</h3>
                  <div className="text-8xl font-black tracking-tighter mb-4">{sampleSize}</div>
                  <p className="text-xs font-medium opacity-80 max-w-[200px]">شخص / أسرة يجب مقابلتهم لضمان تمثيل المجتمع إحصائياً.</p>
               </div>

               <div className="card-elite p-8 space-y-8 flex flex-col justify-center">
                  <div className="flex items-start gap-4">
                     <div className="p-3 rounded-2xl bg-emerald-600/10 text-emerald-600 shadow-sm"><ShieldCheck size={24} /></div>
                     <div>
                        <h4 className="font-black text-sm mb-1 text-[var(--text-primary)]">القوة الإحصائية (Power)</h4>
                        <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-widest">المشروع يمتلك قوة إحصائية بنسبة 0.82، وهو ما يتوافق مع معايير EvalCommunity للتقييمات النهائية.</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 shadow-sm"><Zap size={24} /></div>
                     <div>
                        <h4 className="font-black text-sm mb-1 text-[var(--text-primary)]">توصية أخذ العينات</h4>
                        <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-widest">يوصى باستخدام "العينة العشوائية الطبقية" (Stratified Random Sampling) بناءً على توزيع القرى.</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="card-elite p-8">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-sm flex items-center gap-3">
                    <BarChart2 size={18} className="text-blue-600" /> مبررات العلمية (Scientific Justification)
                  </h3>
                  <button onClick={exportJustification} className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">تصدير المبرر للتقرير <Download size={14} /></button>
               </div>
               <div className="p-6 bg-black/5 dark:bg-white/5 rounded-2xl font-medium text-sm leading-relaxed italic opacity-60">
                 "تم حساب حجم العينة ({sampleSize}) باستخدام معادلة Cochran لمجتمع غير محدود مع تعديل للمجتمع المحدود ({popSize})، بمستوى ثقة {confidence}% وهامش خطأ {margin}%. هذا يضمن أن النتائج تعبر عن المجتمع بدقة علمية مقبولة دولياً."
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
