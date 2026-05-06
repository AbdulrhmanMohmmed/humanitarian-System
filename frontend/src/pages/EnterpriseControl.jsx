import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Server, Database, Key, 
  Activity, Zap, RefreshCcw, HardDrive, 
  Lock, Settings, Bell, Terminal,
  Cpu, BarChart3, Wifi, Clock
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function EnterpriseControl() {
  const [uptime, setUptime] = useState('99.98%');
  const [dbStatus, setDbStatus] = useState('Optimized');

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest mb-3">
            <Server size={14} />
            HIAOS Enterprise Control & Disaster Recovery
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">مركز التحكم المتقدم (HQ)</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">الإدارة المركزية لصحة النظام، المفاتيح الأمنية، والنسخ الاحتياطي الاستراتيجي.</p>
        </div>
        
        <div className="flex gap-4">
           <button className="h-12 px-6 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black text-xs shadow-xl hover:scale-105 transition-all flex items-center gap-2">
              <RefreshCcw size={18} /> تحديث الحالة الكلية
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                  { label: 'وقت التشغيل (Uptime)', val: uptime, icon: Clock, color: 'text-emerald-600', status: 'Healthy' },
                  { label: 'استجابة الخادم (Latency)', val: '42ms', icon: Activity, color: 'text-blue-600', status: 'Optimal' },
                  { label: 'صحة قاعدة البيانات', val: dbStatus, icon: Database, color: 'text-indigo-600', status: 'Stable' },
               ].map(s => (
                  <div key={s.label} className="card-elite p-8 space-y-6">
                     <div className="flex items-center justify-between">
                        <div className={cn("p-3 rounded-2xl bg-black/5 dark:bg-white/5", s.color)}><s.icon size={24} /></div>
                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-600/10 px-2 py-0.5 rounded-lg">{s.status}</span>
                     </div>
                     <div>
                        <div className="text-3xl font-black">{s.val}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</div>
                     </div>
                  </div>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="card-elite p-8 space-y-8">
                  <h3 className="font-black text-lg flex items-center gap-3"><Lock size={20} className="text-rose-600" /> إدارة المفاتيح والوصول (Security)</h3>
                  <div className="space-y-4">
                     {[
                        { name: 'KoboToolbox API', status: 'Connected', lastUsed: 'منذ 5 دقائق' },
                        { name: 'PowerBI Integration', status: 'Active', lastUsed: 'أمس' },
                        { name: 'IATI Registry Sync', status: 'Pending', lastUsed: 'لم يستخدم' },
                     ].map(key => (
                        <div key={key.name} className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)] group hover:border-rose-600/30 transition-all">
                           <div>
                              <div className="text-xs font-black">{key.name}</div>
                              <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Last: {key.lastUsed}</div>
                           </div>
                           <div className="flex gap-2">
                              <button className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Settings size={16} /></button>
                              <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><RefreshCcw size={16} /></button>
                           </div>
                        </div>
                     ))}
                  </div>
                  <button className="w-full h-12 border-2 border-dashed border-[var(--border)] rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-blue-600 hover:text-blue-600 transition-all">إنشاء مفتاح API جديد</button>
               </div>

               <div className="card-elite p-8 space-y-8">
                  <h3 className="font-black text-lg flex items-center gap-3"><HardDrive size={20} className="text-indigo-600" /> النسخ الاحتياطي (Backups)</h3>
                  <div className="space-y-4">
                     {[
                        { date: '2026-05-03 00:00', type: 'Full Daily', size: '2.4 GB' },
                        { date: '2026-05-02 00:00', type: 'Full Daily', size: '2.3 GB' },
                     ].map(backup => (
                        <div key={backup.date} className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)]">
                           <div className="flex items-center gap-4">
                              <div className="p-2 bg-indigo-600/10 text-indigo-600 rounded-xl"><Database size={16} /></div>
                              <div>
                                 <div className="text-xs font-black">{backup.type}</div>
                                 <div className="text-[9px] font-bold text-slate-400 mt-1">{backup.date}</div>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-[10px] font-black">{backup.size}</div>
                              <button className="text-[9px] font-black text-blue-600 uppercase mt-1">Download</button>
                           </div>
                        </div>
                     ))}
                  </div>
                  <button className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95">تشغيل نسخة احتياطية فورية</button>
               </div>
            </div>
         </div>

         <aside className="space-y-6">
            <div className="card-elite p-8 bg-blue-600 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Cpu size={120} /></div>
               <h3 className="font-black text-lg mb-4 relative z-10">الموارد السحابية</h3>
               <div className="space-y-6 relative z-10">
                  <div className="space-y-2">
                     <div className="flex justify-between text-[10px] font-black uppercase"><span>استهلاك الذاكرة</span><span>42%</span></div>
                     <div className="h-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white w-[42%]" /></div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex justify-between text-[10px] font-black uppercase"><span>استهلاك المعالج</span><span>18%</span></div>
                     <div className="h-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white w-[18%]" /></div>
                  </div>
               </div>
               <p className="text-[10px] font-medium opacity-70 mt-8">خادم الاستضافة: AWS Frankfurt Zone A</p>
            </div>

            <div className="card-elite p-8 space-y-6">
               <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">سجل الأحداث الحرجة</h3>
               <div className="space-y-4">
                  {[
                     { msg: 'System update completed', time: '1h ago', icon: Zap, color: 'text-emerald-500' },
                     { msg: 'API Key rotation recommended', time: '2h ago', icon: Bell, color: 'text-amber-500' },
                     { msg: 'Security audit passed', time: '5h ago', icon: ShieldCheck, color: 'text-blue-500' },
                  ].map((log, i) => (
                     <div key={i} className="flex gap-4">
                        <log.icon size={14} className={cn("mt-1 shrink-0", log.color)} />
                        <div>
                           <div className="text-[10px] font-black text-[var(--text-primary)]">{log.msg}</div>
                           <div className="text-[9px] font-medium text-slate-400">{log.time}</div>
                        </div>
                     </div>
                  ))}
               </div>
               <button className="w-full py-3 bg-black/5 dark:bg-white/5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                  <Terminal size={14} /> فتح الـ Console المتقدم
               </button>
            </div>
         </aside>
      </div>
    </div>
  );
}
