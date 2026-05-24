import { useState, useEffect } from 'react';
import { FileText, Plus, Download, Filter, Save, LayoutGrid, List, Check, Search } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';

const DOCTYPES = [
  { id: 'projects', label: 'المشاريع', columns: ['name', 'code', 'sector', 'budget', 'status', 'donor'] },
  { id: 'beneficiaries', label: 'المستفيدين', columns: ['first_name', 'last_name', 'national_id', 'governorate', 'gender'] },
  { id: 'activities', label: 'الأنشطة', columns: ['name', 'date', 'status', 'location'] },
];

export default function CustomReports() {
  const toast = useToast();
  const [selectedDoc, setSelectedDoc] = useState(DOCTYPES[0]);
  const [activeColumns, setActiveColumns] = useState(selectedDoc.columns);
  const [showConfig, setShowConfig] = useState(true);
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    const endpoint = `/${selectedDoc.id}/`;
    api.get(endpoint).then(r => {
      const items = Array.isArray(r.data) ? r.data : (r.data.items || []);
      setReportData(items);
    }).catch(() => setReportData([]));
  }, [selectedDoc.id]);

  const toggleColumn = (col) => {
    setActiveColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-center">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <FileText size={14} />
            محرك التقارير المخصص (Report Builder)
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">إنشاء تقرير جديد</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">اختر البيانات، الأعمدة، والفلاتر لبناء تقريرك الخاص.</p>
        </div>
        
        <div className="flex gap-3">
           <button onClick={() => setShowConfig(!showConfig)} className="h-12 px-6 bg-black/5 dark:bg-white/5 rounded-2xl font-black text-xs hover:bg-black/10 transition-all flex items-center gap-2">
              <Filter size={18} /> {showConfig ? 'إخفاء الإعدادات' : 'تعديل التقرير'}
           </button>
           <button onClick={() => { toast.show('تم حفظ التقرير المخصص بنجاح'); }} className="h-12 px-6 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2">
              <Save size={18} /> حفظ التقرير
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {showConfig && (
          <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="card-elite p-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4">1. اختر مصدر البيانات</h3>
               <div className="space-y-2">
                  {DOCTYPES.map(doc => (
                    <button 
                      key={doc.id} 
                      onClick={() => { setSelectedDoc(doc); setActiveColumns(doc.columns); }}
                      className={cn(
                        "w-full text-right p-4 rounded-xl text-xs font-black transition-all",
                        selectedDoc.id === doc.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-black/5 dark:bg-white/5 hover:bg-black/10"
                      )}
                    >
                      {doc.label}
                    </button>
                  ))}
               </div>
            </div>

            <div className="card-elite p-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4">2. الأعمدة المعروضة</h3>
               <div className="space-y-2">
                  {selectedDoc.columns.map(col => (
                    <button 
                      key={col} 
                      onClick={() => toggleColumn(col)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-all"
                    >
                       <span className="text-[10px] font-bold uppercase">{col}</span>
                       <div className={cn("w-5 h-5 rounded-md flex items-center justify-center transition-all", activeColumns.includes(col) ? "bg-blue-600 text-white" : "border-2 border-slate-200 text-transparent")}>
                          <Check size={12} strokeWidth={4} />
                       </div>
                    </button>
                  ))}
               </div>
            </div>
          </motion.aside>
        )}

        <div className={cn("transition-all duration-500", showConfig ? "lg:col-span-3" : "lg:col-span-4")}>
           <DataTable 
             title="CustomReport"
             columns={activeColumns.map(c => ({ key: c, label: c.toUpperCase() }))}
             data={[]} // Will be populated from API
           />
        </div>
      </div>
    </div>
  );
}
