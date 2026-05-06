import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, FileCode, CheckCircle2, AlertCircle, 
  Download, Share2, ShieldCheck, Database,
  ArrowRight, Filter, Settings, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function IATIExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState('Draft');

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setStatus('Published');
      alert('تم توليد ملف IATI XML بنجاح. يمكنك الآن رفعه إلى منصة IATI Registry.');
    }, 2500);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <Globe size={14} />
            International Aid Transparency Initiative (IATI) Hub
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">مركز الشفافية الدولية</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">تصدير بيانات المنظمة وفق المعايير العالمية الموحدة لضمان أقصى درجات النزاهة والوضوح.</p>
        </div>
        
        <div className="flex gap-4">
           <button 
             onClick={handleExport}
             disabled={isExporting}
             className="h-12 px-8 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
           >
              {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <FileCode size={18} />}
              توليد ملف IATI XML المعتمد
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-8">
            <div className="card-elite p-8 space-y-8 bg-white dark:bg-slate-900">
               <div className="flex items-center justify-between">
                  <h3 className="font-black text-lg flex items-center gap-3"><Database size={20} className="text-blue-600" /> مراجعة البيانات قبل النشر</h3>
                  <div className={cn(
                    "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    status === 'Published' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                  )}>{status}</div>
               </div>

               <div className="space-y-4">
                  {[
                     { label: 'بيانات التعريف (Identifiers)', status: 'Ready', count: '100%' },
                     { label: 'الموازنات والإنفاق (Finances)', status: 'Warning', count: '94%' },
                     { label: 'المواقع الجغرافية (Locations)', status: 'Ready', count: '100%' },
                     { label: 'المخرجات والنتائج (Results)', status: 'Draft', count: '85%' },
                  ].map(item => (
                     <div key={item.label} className="p-5 rounded-[2rem] bg-black/5 dark:bg-white/5 border border-[var(--border)] flex items-center justify-between group hover:border-blue-600/30 transition-all">
                        <div className="flex items-center gap-4">
                           <div className={cn("p-2 rounded-xl", item.status === 'Ready' ? 'bg-emerald-600/10 text-emerald-600' : 'bg-amber-500/10 text-amber-500')}>
                              {item.status === 'Ready' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                           </div>
                           <div>
                              <div className="text-xs font-black">{item.label}</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Validation: {item.status}</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                              <div className="text-sm font-black">{item.count}</div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase">الكمال</div>
                           </div>
                           <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Settings size={16} /></button>
                        </div>
                     </div>
                  ))}
               </div>

               <div className="pt-8 border-t border-[var(--border)]">
                  <div className="p-6 bg-blue-600/5 rounded-3xl border border-blue-600/10 flex gap-6 items-start">
                     <ShieldCheck size={32} className="text-blue-600 shrink-0" />
                     <div>
                        <h4 className="text-sm font-black text-blue-900 dark:text-blue-200">شهادة الامتثال الرقمي</h4>
                        <p className="text-xs font-medium text-blue-800/60 dark:text-blue-300/60 leading-relaxed mt-2">
                           نظام HIAOS يقوم آلياً بتطبيق بروتوكولات حماية البيانات (GDPR) عند التصدير، مما يضمن حذف أي معلومات شخصية للمستفيدين قبل النشر العلني.
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="card-elite p-8">
               <h3 className="font-black text-lg mb-6 flex items-center gap-3"><Share2 size={20} className="text-indigo-600" /> النشر إلى المستودعات العالمية</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                     { name: 'IATI Registry', url: 'iatiregistry.org', status: 'Linked' },
                     { name: 'd-portal', url: 'd-portal.org', status: 'Ready' },
                  ].map(platform => (
                     <div key={platform.name} className="p-6 rounded-2xl border border-[var(--border)] flex flex-col gap-4">
                        <div className="flex justify-between">
                           <span className="text-xs font-black">{platform.name}</span>
                           <span className="text-[9px] font-bold text-emerald-600">{platform.status}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{platform.url}</span>
                        <button className="mt-2 w-full h-10 bg-slate-100 dark:bg-white/5 rounded-xl font-black text-[10px] uppercase hover:bg-indigo-600 hover:text-white transition-all">تزامن يدوي</button>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <aside className="space-y-6">
            <div className="card-elite p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><FileCode size={120} /></div>
               <h3 className="font-black text-lg mb-4 relative z-10">لماذا IATI؟</h3>
               <p className="text-sm font-medium opacity-80 leading-relaxed mb-8 relative z-10">
                  تعد معايير IATI لغة التواصل الموحدة في قطاع العمل الإنساني. استخدامك لها يفتح أبواب الشراكات المباشرة مع المانحين مثل USAID و FCDO و EU.
               </p>
               <button className="w-full h-12 bg-blue-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 uppercase tracking-widest">تحميل دليل الشفافية <ArrowRight size={14} /></button>
            </div>

            <div className="card-elite p-8 space-y-6">
               <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">مؤشرات الشفافية</h3>
               <div className="space-y-5">
                  {[
                     { label: 'درجة الشفافية (Score)', val: '98/100', color: 'text-emerald-600' },
                     { label: 'عدد المشاريع المنشورة', val: '24', color: 'text-blue-600' },
                     { label: 'آخر تحديث للبيانات', val: 'منذ يومين', color: 'text-slate-500' },
                  ].map(s => (
                     <div key={s.label}>
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</span>
                           <span className={cn("text-sm font-black", s.color)}>{s.val}</span>
                        </div>
                        <div className="h-1 bg-black/5 dark:bg-white/5 rounded-full" />
                     </div>
                  ))}
               </div>
            </div>
         </aside>
      </div>
    </div>
  );
}
