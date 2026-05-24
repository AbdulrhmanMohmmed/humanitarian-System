import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, Download, Star, Filter, 
  Search, Grid, List, CheckCircle2, 
  FileJson, FileSpreadsheet, ClipboardCheck, Users 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

const TEMPLATES = [
  { id: 1, name: 'استمارة PDM المتكاملة', category: 'Monitoring', sector: 'MPCA', installs: '1.2k', rating: 4.8, icon: FileSpreadsheet },
  { id: 2, name: 'أداة تقييم الاحتياجات WASH', category: 'Assessment', sector: 'WASH', installs: '850', rating: 4.9, icon: ClipboardCheck },
  { id: 3, name: 'نظام تتبع الحماية (Case Mgt)', category: 'Protection', sector: 'Protection', installs: '2.1k', rating: 4.7, icon: Users },
  { id: 4, name: 'استبيان خط الأساس الغذائي', category: 'Assessment', sector: 'FSL', installs: '540', rating: 4.6, icon: Star },
];

export default function TemplateMarketplace() {
  const toast = useToast();
  const [marketTemplates, setMarketTemplates] = useState(null);

  useEffect(() => {
    api.get('/reports/templates').then(r => {
      const items = Array.isArray(r.data) ? r.data : (r.data.items || []);
      setMarketTemplates(items);
    }).catch(() => {});
  }, []);
  const [activeCategory, setActiveCategory] = useState('All');

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <ShoppingBag size={14} />
            Humanitarian Operations Marketplace
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">سوق النماذج والأدوات</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">مكتبة جاهزة من الأدوات القياسية المعتمدة من قبل المانحين والكتل الإنسانية.</p>
        </div>
        
        <div className="relative group">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
           <input placeholder="ابحث عن نموذج (Baseline, PDM...)" className="h-12 w-80 bg-white dark:bg-slate-900 border border-[var(--border)] rounded-2xl pl-12 pr-6 outline-none focus:ring-4 focus:ring-blue-500/10 font-bold transition-all shadow-sm" />
        </div>
      </header>

      {/* Categories */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
         {['All', 'Monitoring', 'Assessment', 'Protection', 'Health', 'Education', 'WASH'].map(cat => (
           <button 
             key={cat} 
             onClick={() => setActiveCategory(cat)}
             className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeCategory === cat ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "bg-white dark:bg-slate-900 text-slate-500 border border-[var(--border)] hover:border-indigo-600/30")}
           >
             {cat}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         {TEMPLATES.map((item, idx) => (
           <motion.div 
             key={item.id}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: idx * 0.05 }}
             className="card-elite p-8 flex flex-col group relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 -rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                 <item.icon size={120} />
              </div>

              <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                 <item.icon size={28} />
              </div>
              
              <div className="mb-8 relative z-10">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{item.sector}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                 </div>
                 <h3 className="text-xl font-black text-[var(--text-primary)] leading-tight">{item.name}</h3>
              </div>

              <div className="mt-auto space-y-6 relative z-10">
                 <div className="flex items-center justify-between text-[10px] font-black opacity-60">
                    <div className="flex items-center gap-1"><Star size={12} className="text-amber-500 fill-amber-500" /> {item.rating}</div>
                    <div className="flex items-center gap-1"><Download size={12} /> {item.installs} تثبيت</div>
                 </div>
                 
                 <button onClick={() => { toast.show('تم تثبيت النموذج بنجاح'); }} className="w-full h-12 bg-black/5 dark:bg-white/5 group-hover:bg-indigo-600 group-hover:text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                    تثبيت النموذج <Download size={16} />
                 </button>
              </div>
           </motion.div>
         ))}

         {/* Marketplace Banner */}
         <div className="lg:col-span-4 p-12 bg-gradient-to-r from-indigo-600 to-blue-700 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden mt-10">
            <div className="absolute top-0 right-0 p-12 opacity-10"><ShoppingBag size={200} /></div>
            <div className="relative z-10 max-w-2xl text-center md:text-right">
               <h2 className="text-4xl font-black mb-4">هل لديك نموذج ناجح؟</h2>
               <p className="text-lg font-medium opacity-80 leading-relaxed mb-8">شارك خبراتك مع المجتمع الإنساني وارفع نماذجك المخصصة على السوق ليتمكن الآخرون من الاستفادة منها.</p>
               <button onClick={() => { toast.show('سيتم فتح نافذة رفع النماذج', 'info'); }} className="h-14 px-10 bg-white text-indigo-600 rounded-2xl font-black text-sm shadow-xl shadow-black/20 hover:scale-105 transition-all">ابدأ برفع نموذجك الآن</button>
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-4">
               {[
                  { label: 'نماذج معتمدة', val: '500+' },
                  { label: 'منظمات نشطة', val: '120+' }
               ].map((s, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] text-center border border-white/10">
                     <div className="text-3xl font-black mb-1">{s.val}</div>
                     <div className="text-[10px] font-black uppercase opacity-60 tracking-widest">{s.label}</div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
