import { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import { FileText, Search, Filter, Clock, User, Activity as ActivityIcon, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

const ACTION_LABELS = { create: 'إنشاء', update: 'تعديل', delete: 'حذف', login: 'دخول', export: 'تصدير', status_change: 'تغيير حالة' };
const ACTION_COLORS = { 
  create: 'bg-emerald-500/10 text-emerald-600', 
  update: 'bg-blue-500/10 text-blue-600', 
  delete: 'bg-rose-500/10 text-rose-600', 
  login: 'bg-slate-500/10 text-slate-600', 
  export: 'bg-purple-500/10 text-purple-600', 
  status_change: 'bg-amber-500/10 text-amber-600' 
};

export default function AuditTrail() {
  const { t, isRtl } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ action: '', entity_type: '' });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'

  const load = () => {
    const params = {};
    if (filters.action) params.action = filters.action;
    if (filters.entity_type) params.entity_type = filters.entity_type;
    api.get('/audit/', { params }).then(r => setLogs(r.data.logs || []));
    api.get('/audit/summary').then(r => setSummary(r.data));
  };

  useEffect(load, [filters]);

  const columns = [
    { key: 'timestamp', label: 'الوقت', render: (v) => new Date(v).toLocaleString('ar-YE') },
    { key: 'user_name', label: 'المستخدم', render: (v) => <div className="flex items-center gap-2 font-black"><User size={14} className="text-blue-500" /> {v}</div> },
    { key: 'action', label: 'الإجراء', render: (v) => <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter", ACTION_COLORS[v])}>{ACTION_LABELS[v] || v}</span> },
    { key: 'entity_type', label: 'الكيان', render: (v) => <span className="font-bold opacity-70">{v}</span> },
    { key: 'details', label: 'التفاصيل', render: (v) => <span className="text-xs opacity-60 truncate max-w-xs block">{JSON.stringify(v)}</span> },
    { key: 'ip_address', label: 'IP Address' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <ShieldCheck size={14} />
            سجل التدقيق الرقمي (Audit Trail)
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">سجلات النشاط</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">مراقبة كافة التحركات داخل النظام لضمان الشفافية والمساءلة.</p>
        </div>
        
        <div className="flex bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl">
           <button 
            onClick={() => setViewMode('table')} 
            className={cn("px-5 py-2 rounded-xl text-xs font-black transition-all", viewMode === 'table' ? "bg-white dark:bg-slate-800 shadow-lg text-blue-600" : "text-slate-400")}
           >
             جدول البيانات
           </button>
           <button 
            onClick={() => setViewMode('timeline')} 
            className={cn("px-5 py-2 rounded-xl text-xs font-black transition-all", viewMode === 'timeline' ? "bg-white dark:bg-slate-800 shadow-lg text-blue-600" : "text-slate-400")}
           >
             الخط الزمني
           </button>
        </div>
      </header>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-elite p-6">
             <p className="text-[10px] font-black text-slate-500 uppercase mb-2">إجمالي العمليات اليوم</p>
             <p className="text-3xl font-black">{summary.today_count || 0}</p>
          </div>
          <div className="card-elite p-6 border-l-4 border-l-rose-500">
             <p className="text-[10px] font-black text-slate-500 uppercase mb-2">عمليات الحذف</p>
             <p className="text-3xl font-black text-rose-500">{summary.delete_count || 0}</p>
          </div>
          <div className="card-elite p-6">
             <p className="text-[10px] font-black text-slate-500 uppercase mb-2">أكثر كيان تفاعلاً</p>
             <p className="text-xl font-black">{summary.top_entity || '-'}</p>
          </div>
          <div className="card-elite p-6">
             <p className="text-[10px] font-black text-slate-500 uppercase mb-2">المستخدمين النشطين</p>
             <p className="text-3xl font-black text-blue-600">{summary.active_users || 0}</p>
          </div>
        </div>
      )}

      {viewMode === 'table' ? (
        <DataTable columns={columns} data={logs} title="AuditLogs" />
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
           {logs.map((log, idx) => (
             <motion.div 
              key={log.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative flex gap-6 pb-8 group"
             >
                {idx < logs.length - 1 && <div className="absolute top-10 bottom-0 left-5 w-0.5 bg-slate-200 dark:bg-slate-800" />}
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 shadow-lg", ACTION_COLORS[log.action] || "bg-slate-100")}>
                   <ActivityIcon size={18} />
                </div>
                <div className="flex-1 card-elite p-6 group-hover:border-blue-600/30 transition-all">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                         <span className="font-black text-sm">{log.user_name}</span>
                         <span className={cn("px-2 py-0.5 rounded-lg text-[8px] font-black uppercase", ACTION_COLORS[log.action])}>
                            {ACTION_LABELS[log.action]}
                         </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                         <Clock size={12} />
                         <span className="text-[10px] font-bold">{new Date(log.timestamp).toLocaleTimeString('ar-YE')}</span>
                      </div>
                   </div>
                   <p className="text-sm font-bold opacity-80 leading-relaxed">
                      قام المستخدم <span className="text-blue-600">{log.user_name}</span> بـ <span className="font-black underline">{ACTION_LABELS[log.action]}</span> في كيان <span className="text-indigo-600">{log.entity_type}</span>.
                   </p>
                   {log.details && (
                     <div className="mt-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 font-mono text-[10px] opacity-60">
                        {JSON.stringify(log.details, null, 2)}
                     </div>
                   )}
                </div>
             </motion.div>
           ))}
        </div>
      )}
    </div>
  );
}
