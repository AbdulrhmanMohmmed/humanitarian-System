import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Command, ArrowRight, FileText, Users, FolderKanban, Activity, X, DollarSign, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import api from '../services/api';

const TYPE_PATH = {
  beneficiary: '/beneficiaries',
  project: '/projects',
  grant: '/grants',
  activity: '/activities',
  report: '/reports',
};

export default function GlobalSearch({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const handleSearch = useCallback((q) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.get('/search/', { params: { q, limit: 20 } });
        const items = (r.data?.results || []).map(item => ({
          ...item,
          path: TYPE_PATH[item.type] || '/projects',
        }));
        setResults(items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 border border-white/10"
      >
        <div className="p-6 border-b border-[var(--border)] flex items-center gap-4">
           <Search size={24} className="text-blue-600" />
           <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="ابحث عن مشاريع، مستفيدين، تقارير... (أو اضغط Esc للإغلاق)"
            className="flex-1 bg-transparent border-none outline-none text-xl font-black placeholder:text-slate-400 dark:text-white"
           />
           <div className="flex items-center gap-1 px-2 py-1 bg-black/5 dark:bg-white/5 rounded-lg text-[10px] font-black text-slate-400">
              <Command size={10} /> <span>ESC</span>
           </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
           {loading ? (
             <div className="py-20 text-center text-slate-400">
                <Loader2 size={32} className="mx-auto animate-spin opacity-30 mb-4" />
                <p className="font-black text-sm uppercase tracking-widest">جاري البحث...</p>
             </div>
           ) : results.length > 0 ? (
             <div className="space-y-2">
                {results.map((res) => (
                  <button 
                    key={res.id}
                    onClick={() => { navigate(res.path); onClose(); }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-blue-600 group transition-all text-right"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-slate-400 group-hover:text-white">
                           {res.type === 'project' && <FolderKanban size={18} />}
                           {res.type === 'beneficiary' && <Users size={18} />}
                           {res.type === 'grant' && <DollarSign size={18} />}
                           {res.type === 'activity' && <Activity size={18} />}
                           {res.type === 'report' && <FileText size={18} />}
                        </div>
                        <div>
                           <p className="text-sm font-black group-hover:text-white">{res.title}</p>
                           <p className="text-[10px] font-bold opacity-40 group-hover:opacity-70 group-hover:text-white uppercase">{res.type}</p>
                        </div>
                     </div>
                     <ArrowRight size={18} className="text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                  </button>
                ))}
             </div>
           ) : query.length > 1 ? (
             <div className="py-20 text-center text-slate-400">
                <Search size={48} className="mx-auto opacity-10 mb-4" />
                <p className="font-black text-sm uppercase tracking-widest">لا توجد نتائج لـ "{query}"</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'المشاريع النشطة', icon: FolderKanban, path: '/projects' },
                  { label: 'إضافة مستفيد', icon: Users, path: '/beneficiaries' },
                  { label: 'سجلات النظام', icon: Activity, path: '/audit' },
                  { label: 'التقارير الذكية', icon: FileText, path: '/reports' },
                ].map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { navigate(item.path); onClose(); }}
                    className="p-6 rounded-3xl bg-black/5 dark:bg-white/5 hover:bg-blue-600 group transition-all text-center"
                  >
                     <item.icon size={24} className="mx-auto mb-3 text-blue-600 group-hover:text-white" />
                     <p className="text-xs font-black group-hover:text-white">{item.label}</p>
                  </button>
                ))}
             </div>
           )}
        </div>
        
        <div className="p-4 border-t border-[var(--border)] bg-black/5 dark:bg-white/5 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
           <span>{results.length} نتائج بحث</span>
           <div className="flex gap-4">
              <span>↑↓ للتنقل</span>
              <span>ENTER للاختيار</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
