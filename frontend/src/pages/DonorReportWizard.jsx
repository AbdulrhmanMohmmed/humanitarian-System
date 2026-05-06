import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSpreadsheet, Download, ChevronRight, 
  CheckCircle2, Info, Sparkles, Wand2, 
  Printer, Share2, LayoutGrid, FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';

const DONORS = [
  { id: 'ocha', name: 'OCHA / YHF', template: 'YHF GMS Standard Narrative', color: 'bg-blue-600' },
  { id: 'usaid', name: 'USAID / BHA', template: 'BHA Quarterly Performance Report', color: 'bg-rose-600' },
  { id: 'wfp', name: 'WFP', template: 'WFP COMET Standard Data Export', color: 'bg-sky-500' },
  { id: 'echo', name: 'ECHO', template: 'ECHO Single Form Format', color: 'bg-blue-800' },
];

export default function DonorReportWizard() {
  const [step, setStep] = useState(1);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const startGeneration = async () => {
    setIsGenerating(true);
    try {
      const response = await api.get(`/reports/generate-donor/${selectedDonor.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedDonor.id}_Narrative_Report.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setStep(3);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تصدير التقرير');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <FileSpreadsheet size={14} />
            Donor-Specific Report Wizard
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">منشئ تقارير المانحين</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">اختر المانح ليقوم النظام بتجهيز التقرير بالقالب الرسمي المطلوب بدقة 100%.</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-12 py-10">
         {/* Stepper */}
         <div className="flex justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-black/5 -translate-y-1/2 -z-10" />
            {[1, 2, 3].map(s => (
               <div key={s} className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all border-4",
                  step >= s ? "bg-blue-600 text-white border-blue-600/20" : "bg-white dark:bg-slate-900 text-slate-300 border-transparent shadow-sm"
               )}>
                  {step > s ? <CheckCircle2 size={24} /> : s}
               </div>
            ))}
         </div>

         <AnimatePresence mode="wait">
            {step === 1 && (
               <motion.div 
                 key="step1"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-8"
               >
                  <div className="text-center">
                     <h2 className="text-2xl font-black mb-2">اختر المانح المستهدف</h2>
                     <p className="text-sm font-medium text-slate-400">سيقوم النظام بتحميل القوالب والسياسات الخاصة بهذا المانح تلقائياً.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {DONORS.map(donor => (
                        <button
                           key={donor.id}
                           onClick={() => setSelectedDonor(donor)}
                           className={cn(
                             "p-8 rounded-[2rem] text-right transition-all border-2 relative overflow-hidden group",
                             selectedDonor?.id === donor.id ? "bg-white dark:bg-slate-900 border-blue-600 shadow-2xl scale-105" : "bg-white dark:bg-slate-900 border-transparent shadow-sm hover:border-blue-600/30"
                           )}
                        >
                           <div className={cn("w-12 h-12 rounded-2xl mb-6 flex items-center justify-center text-white font-black", donor.color)}>
                              {donor.name[0]}
                           </div>
                           <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">{donor.name}</h3>
                           <p className="text-xs font-medium text-slate-400">{donor.template}</p>
                           {selectedDonor?.id === donor.id && (
                              <div className="absolute top-6 left-6 text-blue-600"><CheckCircle2 size={24} /></div>
                           )}
                        </button>
                     ))}
                  </div>
                  <div className="flex justify-end">
                     <button 
                       disabled={!selectedDonor}
                       onClick={() => setStep(2)}
                       className="h-14 px-10 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                     >
                        المتابعة للخطوة التالية
                     </button>
                  </div>
               </motion.div>
            )}

            {step === 2 && (
               <motion.div 
                 key="step2"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="card-elite p-12 text-center space-y-8"
               >
                  <div className="w-20 h-20 rounded-3xl bg-blue-600/10 text-blue-600 flex items-center justify-center mx-auto">
                     <Sparkles size={40} className="animate-pulse" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black mb-2">تأكيد البيانات والمصادر</h3>
                     <p className="text-sm font-medium text-slate-400">سيتم سحب البيانات من مؤشرات الـ IPTT وسجلات الشكاوى وقاعدة بيانات المستفيدين للمانح {selectedDonor?.name}.</p>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setStep(1)} className="h-14 flex-1 bg-black/5 rounded-2xl font-black text-sm hover:bg-black/10 transition-all">الرجوع</button>
                     <button 
                       onClick={startGeneration} 
                       disabled={isGenerating}
                       className="h-14 flex-[2] bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 hover:scale-105 transition-all disabled:opacity-50"
                     >
                        {isGenerating ? <Loader2 size={24} className="animate-spin mx-auto" /> : "بدء توليد التقرير السردي والفني"}
                     </button>
                  </div>
               </motion.div>
            )}

            {step === 3 && (
               <motion.div 
                 key="step3"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="space-y-8"
               >
                  <div className="card-elite p-12 bg-emerald-600 text-white border-none shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-12 opacity-10"><CheckCircle2 size={150} /></div>
                     <div className="relative z-10 text-center space-y-6">
                        <h2 className="text-4xl font-black">جاهز للتحميل! 💎</h2>
                        <p className="text-lg font-medium opacity-80 max-w-md mx-auto">تم توليد التقرير الخاص بـ {selectedDonor?.name} بنجاح وبدقة مطابقة بنسبة 100%.</p>
                        <div className="flex justify-center gap-4 pt-6">
                           <button onClick={startGeneration} className="h-14 px-8 bg-white text-emerald-600 rounded-2xl font-black text-sm shadow-xl shadow-black/20 hover:scale-105 transition-all flex items-center gap-2">
                              <Download size={20} /> تحميل ملف Word مرة أخرى
                           </button>
                        </div>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                     <button onClick={() => setStep(1)} className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-[var(--border)] hover:border-blue-600 transition-all flex flex-col items-center gap-3">
                        <Wand2 size={24} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase">توليد تقرير لمانح آخر</span>
                     </button>
                     <button className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-[var(--border)] hover:border-blue-600 transition-all flex flex-col items-center gap-3">
                        <Share2 size={24} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase">إرسال للمراجعة الداخلية</span>
                     </button>
                     <button onClick={() => window.print()} className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-[var(--border)] hover:border-blue-600 transition-all flex flex-col items-center gap-3">
                        <Printer size={24} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase">معاينة للطباعة</span>
                     </button>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}

function Loader2({ size, className }) {
   return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className={className}><LayoutGrid size={size} /></motion.div>;
}
