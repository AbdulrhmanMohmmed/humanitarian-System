import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileStack, FileText, BarChart3, PieChart, 
  Settings, Download, Plus, Trash2, 
  CheckCircle2, AlertTriangle, Wand2, RotateCcw,
  Layout, ShieldCheck, Banknote, Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';

const COMPONENT_TYPES = [
  { id: 'iptt', name: 'جداول المؤشرات (IPTT)', icon: BarChart3, desc: 'بيانات الإنجاز الفعلي مقابل المستهدف لكل قطاع.' },
  { id: 'finance', name: 'التقرير المالي (VfM)', icon: Banknote, desc: 'تحليل الإنفاق الاقتصادي والكفاءة المالية.' },
  { id: 'narrative', name: 'السرد النوعي (Narrative)', icon: FileText, desc: 'وصف الإنجازات، التحديات والدروس المستفادة.' },
  { id: 'risk', name: 'مصفوفة المخاطر', icon: AlertTriangle, desc: 'تحديثات رادار المخاطر والإجراءات التكيفية.' },
  { id: 'beneficiaries', name: 'خارطة المستفيدين (SADD)', icon: Users, desc: 'توزيع المستفيدين حسب النوع والعمر والإعاقة.' },
];

export default function ReportFactory() {
  const [reportsList, setReportsList] = useState(null);

  useEffect(() => {
    api.get('/reports/').then(r => {
      const items = Array.isArray(r.data) ? r.data : (r.data.items || []);
      setReportsList(items);
    }).catch(() => {});
  }, []);
  const [selectedComponents, setSelectedComponents] = useState(['iptt', 'narrative']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [format, setFormat] = useState('PDF');
  const [reportName, setReportName] = useState('التقرير الدوري الشامل - الربع الأول 2026');

  const toggleComponent = (id) => {
    setSelectedComponents(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert('تم توليد التقرير بنجاح! جاري تحميل ملف ' + format);
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <FileStack size={14} />
            The Master Report Factory (Enterprise Edition)
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">مصنع التقارير الموحد</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">تجميع المخرجات من كافة أقسام النظام في تقرير واحد متكامل واحترافي للمانحين.</p>
        </div>
        
        <div className="flex gap-4">
           <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-[var(--border)]">
              {['PDF', 'Excel', 'Word'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setFormat(f)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    format === f ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "hover:bg-black/5 text-slate-400"
                  )}
                >
                  {f}
                </button>
              ))}
           </div>
           <button onClick={handleGenerate} disabled={isGenerating} className="h-12 px-8 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50">
              {isGenerating ? <RotateCcw size={18} className="animate-spin" /> : <Wand2 size={18} />}
              توليد التقرير النهائي
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-1 space-y-6">
            <div className="card-elite p-8 space-y-8">
               <h3 className="font-black text-sm flex items-center gap-3 uppercase tracking-widest text-slate-400">
                  إعدادات التجميع
               </h3>
               
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">عنوان التقرير</label>
                     <input 
                        type="text" value={reportName} onChange={e => setReportName(e.target.value)}
                        className="w-full h-12 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-xl px-4 font-black text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                     />
                  </div>
               </div>

               <div className="space-y-3">
                  <h4 className="text-[10px] font-black opacity-40 uppercase tracking-widest">اختر المكونات المطلوبة</h4>
                  <div className="space-y-2">
                     {COMPONENT_TYPES.map(comp => (
                        <button
                          key={comp.id}
                          onClick={() => toggleComponent(comp.id)}
                          className={cn(
                            "w-full p-4 rounded-2xl border transition-all flex items-start gap-4 text-right",
                            selectedComponents.includes(comp.id) 
                              ? "bg-indigo-600/5 border-indigo-600/30 text-indigo-600" 
                              : "bg-white dark:bg-slate-900 border-[var(--border)] text-slate-500 hover:border-slate-300"
                          )}
                        >
                           <div className={cn("p-2 rounded-xl shrink-0", selectedComponents.includes(comp.id) ? "bg-indigo-600 text-white" : "bg-black/5")}>
                              <comp.icon size={18} />
                           </div>
                           <div>
                              <div className="text-xs font-black mb-1">{comp.name}</div>
                              <div className="text-[9px] font-medium opacity-60 leading-tight">{comp.desc}</div>
                           </div>
                           {selectedComponents.includes(comp.id) && <CheckCircle2 size={16} className="mr-auto" />}
                        </button>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         <div className="lg:col-span-2 space-y-6">
            <div className="card-elite p-10 min-h-[700px] relative bg-white dark:bg-slate-900">
               <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl">HI</div>
                     <div>
                        <h2 className="text-xl font-black">{reportName}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">تاريخ الإنشاء: {new Date().toLocaleDateString('ar')}</p>
                     </div>
                  </div>
                  <div className="p-3 bg-emerald-600/10 text-emerald-600 rounded-xl border border-emerald-600/20">
                     <ShieldCheck size={24} />
                  </div>
               </div>

               <div className="space-y-12">
                  {selectedComponents.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-40 opacity-20">
                       <Layout size={80} strokeWidth={1} />
                       <p className="font-black mt-6">قم باختيار المكونات لبناء هيكل التقرير</p>
                    </div>
                  )}
                  {selectedComponents.map((id, idx) => {
                    const comp = COMPONENT_TYPES.find(c => c.id === id);
                    return (
                      <motion.div 
                        key={id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6 border-b border-[var(--border)] pb-12 last:border-none"
                      >
                         <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black flex items-center gap-3">
                               <span className="w-6 h-6 bg-indigo-600 text-white rounded flex items-center justify-center text-[10px]">{idx + 1}</span>
                               {comp.name}
                            </h3>
                            <button onClick={() => toggleComponent(id)} className="p-2 hover:bg-rose-600/10 text-slate-400 hover:text-rose-600 rounded-lg transition-all"><Trash2 size={16} /></button>
                         </div>
                         <div className="p-10 bg-black/5 dark:bg-white/5 rounded-[2rem] border border-dashed border-[var(--border)] flex items-center justify-center">
                            <div className="text-center opacity-40">
                               <comp.icon size={40} className="mx-auto mb-4" />
                               <p className="text-[10px] font-black uppercase tracking-widest">Section Placeholder: {comp.id.toUpperCase()}_CONTENT</p>
                            </div>
                         </div>
                      </motion.div>
                    );
                  })}
               </div>

               <div className="absolute bottom-10 left-10 right-10 flex items-center justify-between pt-10 border-t border-[var(--border)] opacity-30">
                  <div className="text-[10px] font-black uppercase">Enterprise Humanitarian Intelligence OS</div>
                  <div className="text-[10px] font-black">Page 1 / 14</div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
