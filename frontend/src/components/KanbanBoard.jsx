import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Plus, Users, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function KanbanBoard({ columns, items, onMove }) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar h-full min-h-[600px] items-start">
      {columns.map((col) => (
        <div key={col.id} className="w-80 shrink-0 flex flex-col h-full bg-black/5 dark:bg-white/5 rounded-[2.5rem] border border-[var(--border)] overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", col.color || "bg-blue-600")} />
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">{col.title}</h3>
              <span className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5 text-[10px] font-black opacity-40">
                {items.filter(i => i.status === col.id).length}
              </span>
            </div>
            <button className="text-slate-400 hover:text-blue-600"><Plus size={16} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {items.filter(i => i.status === col.id).map((item, idx) => (
                <motion.div
                  key={item.id}
                  layoutId={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4, rotate: 1 }}
                  className="card-elite p-5 cursor-grab active:cursor-grabbing border-none shadow-xl bg-white dark:bg-slate-900"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter", 
                      item.priority === 'high' ? "bg-rose-500/10 text-rose-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {item.sector || 'عامل'}
                    </span>
                    <button className="text-slate-300 hover:text-blue-600"><MoreHorizontal size={14} /></button>
                  </div>
                  
                  <h4 className="text-sm font-black text-[var(--text-primary)] mb-4 line-clamp-2">{item.name || item.title}</h4>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={12} />
                      <span className="text-[10px] font-bold">{item.end_date || 'بدون موعد'}</span>
                    </div>
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      {[1, 2].map(u => (
                        <div key={u} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 flex items-center justify-center text-[8px] font-black text-white">
                          U
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {items.filter(i => i.status === col.id).length === 0 && (
              <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex items-center justify-center text-slate-300">
                <p className="text-[10px] font-black uppercase tracking-widest">اسحب العناصر هنا</p>
              </div>
            )}
          </div>
        </div>
      ))}
      
      <button className="w-80 shrink-0 h-[100px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-400 hover:border-blue-600 hover:text-blue-600 transition-all gap-2">
         <Plus size={20} />
         <span className="text-xs font-black uppercase">إضافة حالة جديدة</span>
      </button>
    </div>
  );
}
