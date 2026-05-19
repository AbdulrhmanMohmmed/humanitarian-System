import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Lock, Fingerprint, EyeOff, 
  Trash2, Database, History, UserCheck,
  AlertTriangle, Key, BellRing, FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';

export default function SecurityPrivacySettings() {
  const toast = useToast();
  const [maskPII, setMaskPII] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest mb-3">
            <ShieldCheck size={14} />
            Data Protection by Design (GDPR/EU Standard)
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">الأمان والخصوصية النخبوية</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">إدارة تشفير البيانات، حماية الهوية الرقمية، والالتزام بمعايير GDPR.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-8">
            {/* PII Masking */}
            <div className="card-elite p-8 flex items-center justify-between">
               <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                     <EyeOff size={28} />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-[var(--text-primary)]">إخفاء البيانات التعريفية (PII Masking)</h3>
                     <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">تشفير تلقائي لأسماء المستفيدين، أرقام الهواتف، والعناوين في التقارير العامة.</p>
                  </div>
               </div>
               <button 
                  onClick={() => setMaskPII(!maskPII)}
                  className={cn("w-16 h-8 rounded-full relative transition-all duration-300", maskPII ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800")}
               >
                  <motion.div 
                    animate={{ x: maskPII ? 32 : 4 }}
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg" 
                  />
               </button>
            </div>

            {/* MFA */}
            <div className="card-elite p-8 flex items-center justify-between">
               <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
                     <Fingerprint size={28} />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-[var(--text-primary)]">المصادقة الثنائية (MFA)</h3>
                     <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">إضافة طبقة حماية إضافية عبر تطبيق المصادقة أو الرسائل النصية.</p>
                  </div>
               </div>
               <button 
                  onClick={() => setMfaEnabled(!mfaEnabled)}
                  className={cn("w-16 h-8 rounded-full relative transition-all duration-300", mfaEnabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800")}
               >
                  <motion.div 
                    animate={{ x: mfaEnabled ? 32 : 4 }}
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg" 
                  />
               </button>
            </div>

            {/* Audit Logs Preview */}
            <div className="card-elite overflow-hidden">
               <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="font-black text-sm flex items-center gap-3 italic">
                    <History size={18} className="text-blue-600" /> سجل العمليات الأمنية (Audit Trail)
                  </h3>
                  <button onClick={() => { toast.show('يتم عرض جميع السجلات', 'info'); }} className="text-[10px] font-black uppercase text-blue-600">عرض الكل</button>
               </div>
               <div className="space-y-px">
                  {[
                     { action: 'تغيير صلاحيات مستخدم', user: 'أحمد علي', time: 'منذ 10 دقائق', type: 'Critical' },
                     { action: 'محاولة دخول فاشلة', user: 'Unknown IP', time: 'منذ ساعة', type: 'Warning' },
                     { action: 'تصدير بيانات PII', user: 'مدير النظام', time: 'منذ ساعتين', type: 'Critical' },
                  ].map((log, idx) => (
                     <div key={idx} className="p-5 flex items-center justify-between hover:bg-black/5 transition-all border-b border-[var(--border)] last:border-none">
                        <div className="flex items-center gap-4">
                           <div className={cn("w-2 h-2 rounded-full", log.type === 'Critical' ? 'bg-rose-600' : 'bg-amber-500')} />
                           <div>
                              <p className="text-xs font-black text-[var(--text-primary)]">{log.action}</p>
                              <p className="text-[10px] font-bold opacity-40">{log.user}</p>
                           </div>
                        </div>
                        <span className="text-[10px] font-black opacity-40 italic">{log.time}</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <aside className="space-y-6">
            <div className="card-elite p-8 bg-rose-600 text-white border-none shadow-2xl">
               <div className="flex items-center gap-3 mb-6">
                  <Trash2 size={24} />
                  <h3 className="font-black text-lg">حق النسيان (GDPR)</h3>
               </div>
               <p className="text-sm font-medium opacity-80 leading-relaxed mb-8">
                  يمكن للمستفيدين طلب حذف بياناتهم التعريفية بالكامل من النظام. هذا الإجراء نهائي ولا يمكن التراجع عنه.
               </p>
               <button onClick={() => { toast.show('لا توجد طلبات حذف معلقة حالياً', 'info'); }} className="w-full h-12 bg-white text-rose-600 rounded-xl font-black text-xs shadow-xl shadow-black/20 hover:scale-105 transition-all">إدارة طلبات الحذف</button>
            </div>

            <div className="card-elite p-6 space-y-6">
               <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">اتفاقيات مشاركة البيانات</h3>
               <div className="space-y-3">
                  {['Donor Sharing Agreement', 'UN-Cluster Data Link', 'Government Access Protocol'].map(doc => (
                     <div key={doc} className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-transparent hover:border-blue-600/30 transition-all cursor-pointer">
                        <span className="text-xs font-black">{doc}</span>
                        <FileText size={16} className="text-blue-600" />
                     </div>
                  ))}
               </div>
               <button onClick={() => { toast.show('سيتم فتح نافذة رفع الملفات', 'info'); }} className="w-full py-4 text-[10px] font-black uppercase text-blue-600 border-2 border-dashed border-blue-600/20 rounded-2xl hover:bg-blue-600/5 transition-all">رفع اتفاقية جديدة</button>
            </div>
         </aside>
      </div>
    </div>
  );
}
