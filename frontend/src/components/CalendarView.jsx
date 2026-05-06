import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function CalendarView({ events = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfMonth }, (_, i) => null);

  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  return (
    <div className="card-elite overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
      <header className="p-8 border-b border-[var(--border)] flex items-center justify-between bg-black/5 dark:bg-white/5">
        <div className="flex items-center gap-6">
          <h3 className="text-2xl font-black tracking-tight">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-inner">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-black/5 rounded-lg transition-all"><ChevronLeft size={18} /></button>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-black/5 rounded-lg transition-all"><ChevronRight size={18} /></button>
          </div>
        </div>
        <button className="h-11 px-6 bg-blue-600 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2">
          <Plus size={16} /> إضافة حدث
        </button>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
          {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map(day => (
            <div key={day} className="bg-slate-50 dark:bg-slate-900 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
          
          {[...padding, ...days].map((day, idx) => (
            <div key={idx} className={cn(
              "bg-white dark:bg-slate-900 min-h-[140px] p-3 transition-all hover:bg-blue-600/5 group relative",
              !day && "bg-slate-50/50 dark:bg-slate-950/50"
            )}>
              {day && (
                <>
                  <span className={cn(
                    "text-sm font-black transition-colors",
                    day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? "text-blue-600" : "text-slate-400"
                  )}>
                    {day}
                  </span>
                  
                  <div className="mt-2 space-y-1">
                    {events.filter(e => new Date(e.date).getDate() === day && new Date(e.date).getMonth() === currentDate.getMonth()).map((event, eIdx) => (
                      <motion.div 
                        key={eIdx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "p-2 rounded-lg text-[9px] font-bold border-l-2 shadow-sm transition-all hover:scale-105 cursor-pointer",
                          event.type === 'activity' ? "bg-blue-500/10 text-blue-600 border-l-blue-600" : "bg-emerald-500/10 text-emerald-600 border-l-emerald-600"
                        )}
                      >
                        <p className="truncate">{event.title}</p>
                        <div className="flex items-center gap-1 mt-1 opacity-50">
                           <Clock size={8} /> <span>{event.time || '09:00'}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
