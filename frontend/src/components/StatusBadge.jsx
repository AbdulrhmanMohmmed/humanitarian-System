import { useLanguage } from '../contexts/LanguageContext';

const statusMap = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  completed: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400',
  suspended: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  disbursed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  received: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  failed: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  in_progress: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
  graduated: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  on_leave: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  terminated: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  resigned: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
  male: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  female: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400',
  income: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  expense: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  transfer: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  output: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  outcome: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400',
  impact: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
};

export default function StatusBadge({ status }) {
  const { t } = useLanguage();
  const color = statusMap[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border border-black/5 dark:border-white/5 ${color}`}>
      {statusMap[status] ? t(status) : status}
    </span>
  );
}
