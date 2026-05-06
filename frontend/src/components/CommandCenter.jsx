import { motion, AnimatePresence } from 'framer-motion';
import { X, Command, Keyboard, HelpCircle, BookOpen, MessageCircle, PlayCircle, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export function ShortcutsOverlay({ isOpen, onClose }) {
  const groups = [
    {
      title: 'التنقل السريع',
      shortcuts: [
        { keys: ['G', 'P'], label: 'الذهاب للمشاريع' },
        { keys: ['G', 'B'], label: 'الذهاب للمستفيدين' },
        { keys: ['G', 'M'], label: 'لوحة MEAL Hub' },
        { keys: ['G', 'D'], label: 'الرئيسية' },
      ]
    },
    {
      title: 'الإجراءات',
      shortcuts: [
        { keys: ['Ctrl', 'K'], label: 'البحث العالمي' },
        { keys: ['Ctrl', 'Shift', 'N'], label: 'إضافة سريعة' },
        { keys: ['Ctrl', 'S'], label: 'حفظ التعديلات' },
        { keys: ['?'], label: 'إظهار هذه القائمة' },
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden relative z-10 border border-white/10 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg"><Keyboard size={24} /></div>
            <h2 className="text-2xl font-black tracking-tight">اختصارات النظام الذكية</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {groups.map((group, idx) => (
            <div key={idx} className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{group.title}</h3>
              <div className="space-y-4">
                {group.shortcuts.map((s, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between group">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{s.label}</span>
                    <div className="flex gap-1.5">
                      {s.keys.map(k => (
                        <kbd key={k} className="px-2 py-1 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-lg text-[10px] font-black shadow-sm group-hover:border-blue-600/30 transition-all">{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function HelpCenter({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <motion.aside initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="fixed top-0 bottom-0 left-0 w-[400px] z-[160] bg-white dark:bg-slate-900 shadow-2xl border-r border-[var(--border)] flex flex-col">
      <div className="p-8 border-b border-[var(--border)] bg-blue-600 text-white flex items-center justify-between">
         <div className="flex items-center gap-3">
            <HelpCircle size={24} />
            <h3 className="text-xl font-black">مركز المساعدة</h3>
         </div>
         <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
         <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input placeholder="كيف يمكننا مساعدتك اليوم؟" className="w-full h-12 bg-black/5 dark:bg-white/5 rounded-2xl pr-12 pl-4 text-xs font-bold outline-none" />
         </div>

         <div className="grid grid-cols-2 gap-4">
            {[
              { icon: BookOpen, label: 'الأدلة التعليمية', color: 'bg-blue-500' },
              { icon: PlayCircle, label: 'شروحات فيديو', color: 'bg-rose-500' },
              { icon: MessageCircle, label: 'تواصل مع الدعم', color: 'bg-emerald-500' },
              { icon: HelpCircle, label: 'الأسئلة الشائعة', color: 'bg-amber-500' },
            ].map((item, idx) => (
              <button key={idx} className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-blue-600 group transition-all text-center">
                 <item.icon size={20} className={cn("mx-auto mb-2 text-white p-1.5 rounded-lg w-8 h-8", item.color)} />
                 <p className="text-[10px] font-black group-hover:text-white uppercase">{item.label}</p>
              </button>
            ))}
         </div>

         <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مواضيع مقترحة</h4>
            {[
              'كيفية إنشاء خطة MEAL جديدة؟',
              'إصدار تقارير IPTT التراكمية',
              'إدارة صلاحيات الوصول الميداني',
              'تكامل البيانات مع KoBoToolbox'
            ].map((t, idx) => (
              <button key={idx} className="w-full text-right p-4 rounded-2xl border border-[var(--border)] hover:border-blue-600 transition-all text-xs font-bold opacity-70 hover:opacity-100">
                {t}
              </button>
            ))}
         </div>
      </div>
      
      <div className="p-8 border-t border-[var(--border)] bg-black/5">
         <p className="text-[10px] font-black text-center text-slate-400 uppercase">الإصدار v16.0.4 Premium</p>
      </div>
    </motion.aside>
  );
}
