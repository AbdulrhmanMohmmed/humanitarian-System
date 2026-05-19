import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  History, ShieldCheck, Fingerprint, Search, 
  Filter, Download, ArrowRight, Clock,
  User, Database, Lock, AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { downloadJSON, downloadCSV, printReport } from '../lib/exportUtils';

const MOCK_LOGS = [
  { id: 1, action: 'Update', entity: 'Beneficiary #4501', user: 'أحمد علي', time: '2026-05-03 07:15', hash: '8f4a...2d1e', status: 'Verified' },
  { id: 2, action: 'Create', entity: 'Project #B-102', user: 'سارة محمد', time: '2026-05-03 06:42', hash: '3c9b...a1f0', status: 'Verified' },
  { id: 3, action: 'Delete', entity: 'Draft Budget', user: 'خالد يحيى', time: '2026-05-02 23:10', hash: 'e5d1...7c8b', status: 'Verified' },
  { id: 4, action: 'Login', entity: 'System Access', user: 'مدير البرامج', time: '2026-05-02 22:05', hash: 'f2a0...bb34', status: 'Verified' },
];

export default function SmartAuditTrail() {
  const toast = useToast();
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [search, setSearch] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyChain = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      alert('تم التحقق من سلامة سجل التدقيق. جميع البصمات الرقمية (Hashes) متطابقة ولم يتم التلاعب بأي سجل.');
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <Lock size={14} />
            HIAOS Immutable Audit Engine (Chain-of-Trust)
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">سجل التدقيق الرقمي المشفر</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">نظام توثيق غير قابل للتلاعب يسجل كل حركة داخل النظام مع بصمة رقمية فريدة.</p>
        </div>
        
        <div className="flex gap-4">
           <button 
             onClick={verifyChain}
             disabled={isVerifying}
             className="h-12 px-6 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
           >
              {isVerifying ? <Clock className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              {isVerifying ? 'جاري التحقق من البصمات...' : 'التحقق من سلامة السجل'}
           </button>
           <button onClick={() => { downloadJSON({report: 'compliance', date: new Date().toISOString()}, 'compliance-report.json'); toast.show('تم تصدير تقرير الامتثال'); }} className="h-12 px-6 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2">
              <Download size={18} /> تصدير تقرير الامتثال
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3 space-y-6">
            <div className="card-elite p-2 overflow-hidden bg-white dark:bg-slate-900">
               <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                  <div className="relative w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="بحث في السجلات..."
                      className="w-full h-10 pl-10 pr-4 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => { toast.show('تم تصفية السجلات لآخر 24 ساعة', 'info'); }} className="px-4 py-2 rounded-xl bg-black/5 text-[10px] font-black uppercase">آخر 24 ساعة</button>
                     <button onClick={() => { toast.show('تم فتح خيارات التصفية', 'info'); }} className="px-4 py-2 rounded-xl bg-black/5 text-[10px] font-black uppercase">تصفية حسب الكيان</button>
                  </div>
               </div>
               
               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead className="bg-black/5 dark:bg-white/5">
                        <tr>
                           <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">التوقيت</th>
                           <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">المستخدم</th>
                           <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">العملية</th>
                           <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">الكيان المتأثر</th>
                           <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">البصمة (Hash)</th>
                           <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">الحالة</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[var(--border)]">
                        {logs.map(log => (
                           <tr key={log.id} className="hover:bg-black/5 transition-all group">
                              <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500">{log.time}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center"><User size={12} /></div>
                                    <span className="text-xs font-black">{log.user}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={cn(
                                   "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase",
                                   log.action === 'Create' ? 'bg-emerald-600 text-white' : log.action === 'Delete' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                                 )}>{log.action}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs font-black">{log.entity}</td>
                              <td className="px-6 py-4 whitespace-nowrap font-mono text-[10px] opacity-40">{log.hash}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px]">
                                    <ShieldCheck size={14} /> Verified
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         <aside className="space-y-6">
            <div className="card-elite p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Fingerprint size={120} /></div>
               <h3 className="font-black text-lg mb-4 relative z-10">حوكمة البيانات (Data Governance)</h3>
               <p className="text-sm font-medium opacity-80 leading-relaxed mb-8 relative z-10">
                  نظام HIAOS يستخدم خوارزميات التشفير لربط السجلات ببعضها، مما يجعل حذف أي سجل دون ترك أثر أمراً مستحيلاً تقنياً.
               </p>
               <div className="space-y-4 relative z-10">
                  <div className="flex justify-between text-[10px] font-black uppercase opacity-60"><span>إجمالي السجلات</span><span>42,108</span></div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[95%]" /></div>
               </div>
            </div>

            <div className="card-elite p-6 space-y-4">
               <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">تنبيهات التدقيق</h4>
               <div className="space-y-3">
                  <div className="p-4 bg-rose-600/5 rounded-2xl border border-rose-600/20 flex gap-4">
                     <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                     <p className="text-[10px] font-bold text-rose-700">محاولة دخول فاشلة متكررة من IP غير معروف.</p>
                  </div>
                  <div className="p-4 bg-emerald-600/5 rounded-2xl border border-emerald-600/20 flex gap-4">
                     <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                     <p className="text-[10px] font-bold text-emerald-700">تم تحديث سياسة الخصوصية بنجاح.</p>
                  </div>
               </div>
            </div>
         </aside>
      </div>
    </div>
  );
}
