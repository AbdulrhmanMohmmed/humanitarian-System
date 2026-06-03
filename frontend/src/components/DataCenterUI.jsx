import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm">
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-xl", color)}><Icon size={20} className="text-white" /></div>
        <div>
          <p className="text-2xl font-black text-[var(--text-primary)]">{value}</p>
          <p className="text-xs font-bold text-[var(--text-secondary)]">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function DCModal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-primary)] rounded-3xl p-8 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
          <h3 className="text-xl font-black text-[var(--text-primary)] mb-6">{title}</h3>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function Input({ label, ...props }) {
  return (
    <label className="block mb-4">
      <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">{label}</span>
      <input {...props} className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-bold outline-none focus:border-blue-500" />
    </label>
  );
}

export function Select({ label, options, ...props }) {
  return (
    <label className="block mb-4">
      <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">{label}</span>
      <select {...props} className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-bold outline-none focus:border-blue-500">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function TextArea({ label, ...props }) {
  return (
    <label className="block mb-4">
      <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">{label}</span>
      <textarea {...props} rows={3} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-bold outline-none focus:border-blue-500 resize-none" />
    </label>
  );
}
