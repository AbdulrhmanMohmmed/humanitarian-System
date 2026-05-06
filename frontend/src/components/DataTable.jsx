import { useState, useMemo } from 'react';
import { 
  ChevronDown, ChevronUp, Search, Download, Trash2, 
  Filter, MoreHorizontal, Check, Square, ChevronLeft, ChevronRight,
  Layers, Columns
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function DataTable({ 
  title = "Records", 
  columns, 
  data = [], 
  onDelete, 
  onBulkDelete, 
  actions = [] 
}) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: '', dir: 'asc' });
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [groupBy, setGroupBy] = useState('');

  // ☕ Instant Filtering & Sorting
  const filteredData = useMemo(() => {
    let result = [...data];
    if (search) {
      result = result.filter(row => 
        Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (sort.key) {
      result.sort((a, b) => {
        const va = a[sort.key];
        const vb = b[sort.key];
        if (va < vb) return sort.dir === 'asc' ? -1 : 1;
        if (va > vb) return sort.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, search, sort]);

  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(selected.length === paginatedData.length ? [] : paginatedData.map(r => r.id));
  };

  const exportCSV = () => {
    const headers = columns.map(c => c.label).join(',');
    const rows = filteredData.map(row => columns.map(c => row[c.key]).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}_${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="card-elite overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 flex flex-col h-full max-h-[800px]">
      {/* Table Toolbar */}
      <div className="p-6 border-b border-[var(--border)] bg-black/5 dark:bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
         <div className="flex items-center gap-4">
            <div className="relative group">
               <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" size={16} />
               <input 
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="بحث سريع..."
                className="h-10 w-64 bg-white dark:bg-slate-800 border border-[var(--border)] rounded-xl pr-10 pl-4 outline-none focus:ring-2 focus:ring-blue-600/20 font-bold text-xs"
               />
            </div>
            {selected.length > 0 && (
              <motion.button 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                onClick={() => onBulkDelete?.(selected)}
                className="h-10 px-4 bg-rose-500 text-white rounded-xl text-xs font-black flex items-center gap-2"
              >
                <Trash2 size={14} /> حذف {selected.length}
              </motion.button>
            )}
         </div>

         <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="h-10 px-4 bg-white dark:bg-slate-800 border border-[var(--border)] rounded-xl text-xs font-black flex items-center gap-2 hover:bg-black/5">
               <Download size={14} /> تصدير
            </button>
            <div className="h-10 w-px bg-[var(--border)]" />
            <button className="p-2.5 bg-white dark:bg-slate-800 border border-[var(--border)] rounded-xl text-slate-400 hover:text-blue-600"><Columns size={16} /></button>
            <button className="p-2.5 bg-white dark:bg-slate-800 border border-[var(--border)] rounded-xl text-slate-400 hover:text-blue-600"><Layers size={16} /></button>
         </div>
      </div>

      {/* Table Container (Caffeine Performance ☕) */}
      <div className="flex-1 overflow-auto relative custom-scrollbar scroll-smooth">
        <table className="w-full text-right border-collapse min-w-[1000px]">
          <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-900 border-b-2 border-[var(--border)]">
            <tr>
              <th className="p-5 w-12">
                 <button onClick={toggleAll} className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-all", selected.length > 0 ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 text-transparent")}>
                    <Check size={12} strokeWidth={4} />
                 </button>
              </th>
              {columns.map(col => (
                <th 
                  key={col.key} 
                  className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-black/5 transition-all group"
                  onClick={() => setSort({ key: col.key, dir: sort.key === col.key && sort.dir === 'asc' ? 'desc' : 'asc' })}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sort.key === col.key ? (
                      sort.dir === 'asc' ? <ChevronUp size={12} className="text-blue-600" /> : <ChevronDown size={12} className="text-blue-600" />
                    ) : <ChevronDown size={12} className="opacity-0 group-hover:opacity-100 text-slate-300" />}
                  </div>
                </th>
              ))}
              <th className="p-5 w-20 text-[10px] font-black text-slate-400 uppercase tracking-widest">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            <AnimatePresence mode="popLayout">
              {paginatedData.map((row, rIdx) => (
                <motion.tr 
                  key={row.id || rIdx}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className={cn(
                    "group transition-all hover:bg-blue-600/[0.02]",
                    selected.includes(row.id) ? "bg-blue-600/5" : ""
                  )}
                >
                  <td className="p-5">
                     <button onClick={() => toggleSelect(row.id)} className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-all", selected.includes(row.id) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 text-transparent")}>
                        <Check size={12} strokeWidth={4} />
                     </button>
                  </td>
                  {columns.map(col => (
                    <td key={col.key} className="p-5 text-sm font-bold text-[var(--text-primary)]">
                       {col.render ? col.render(row[col.key], row) : (row[col.key] || '-')}
                    </td>
                  ))}
                  <td className="p-5">
                     <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {actions.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => action.onClick?.(row)}
                            className={cn("p-2 rounded-lg transition-all", action.className || "text-slate-500 hover:bg-black/5")}
                            title={action.label}
                          >
                            {action.icon ? <action.icon size={16} /> : action.label}
                          </button>
                        ))}
                        <button onClick={() => onDelete?.(row.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                        <button className="p-2 text-slate-400 hover:bg-black/5 rounded-lg transition-all"><MoreHorizontal size={16} /></button>
                     </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {paginatedData.length === 0 && (
          <div className="py-20 text-center">
             <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Search size={32} />
             </div>
             <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">لا توجد سجلات مطابقة للبحث</p>
          </div>
        )}
      </div>

      {/* Table Footer / Pagination */}
      <div className="p-6 border-t border-[var(--border)] bg-black/5 dark:bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
         <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-500 uppercase">عرض</span>
            <select 
              value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 border border-[var(--border)] rounded-lg text-[10px] font-black px-2 py-1 outline-none"
            >
               {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
               إظهار {((page - 1) * pageSize) + 1} إلى {Math.min(page * pageSize, filteredData.length)} من أصل {filteredData.length} سجل
            </span>
         </div>

         <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2.5 bg-white dark:bg-slate-800 border border-[var(--border)] rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
               <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1">
               {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)).map((p, idx, arr) => (
                 <div key={p} className="flex items-center gap-1">
                   {idx > 0 && arr[idx-1] !== p - 1 && <span className="text-slate-400">...</span>}
                   <button 
                    onClick={() => setPage(p)}
                    className={cn(
                      "w-10 h-10 rounded-xl text-xs font-black transition-all",
                      page === p ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white dark:bg-slate-800 text-slate-500 hover:bg-black/5"
                    )}
                   >
                     {p}
                   </button>
                 </div>
               ))}
            </div>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2.5 bg-white dark:bg-slate-800 border border-[var(--border)] rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
               <ChevronRight size={18} />
            </button>
         </div>
      </div>
    </div>
  );
}
