import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function StatCard({ title, value, icon: Icon, color = 'blue', sub }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-600 ring-blue-500/20 shadow-blue-500/10',
    green: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 shadow-emerald-500/10',
    purple: 'bg-violet-500/10 text-violet-600 ring-violet-500/20 shadow-violet-500/10',
    orange: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 shadow-amber-500/10',
    red: 'bg-rose-500/10 text-rose-600 ring-rose-500/20 shadow-rose-500/10',
    teal: 'bg-teal-500/10 text-teal-600 ring-teal-500/20 shadow-teal-500/10',
    indigo: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20 shadow-indigo-500/10',
    cyan: 'bg-cyan-500/10 text-cyan-600 ring-cyan-500/20 shadow-cyan-500/10',
    amber: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 shadow-amber-500/10',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="card-elite p-6 relative overflow-hidden group border-none shadow-xl bg-white dark:bg-slate-900/50 backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-black text-[var(--text-secondary)] mb-2 uppercase tracking-[0.2em] opacity-60">
            {title}
          </p>
          <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {sub && (
            <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5 border border-transparent group-hover:border-[var(--border)] transition-all">
              <span className="text-[10px] font-black text-[var(--text-secondary)]">{sub}</span>
            </div>
          )}
        </div>
        <div className={cn("shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ring-1 shadow-2xl transition-all duration-500 group-hover:rotate-12", colors[color] || colors.blue)}>
          <Icon size={26} strokeWidth={2.5} />
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-transparent to-black/5 dark:to-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </motion.div>
  );
}
